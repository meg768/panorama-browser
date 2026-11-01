// Render the exported HTML itself: camera, shaders, color and repair layers stay intact.
const { spawn } = require('node:child_process');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

async function render(source) {
    const profile = mkdtempSync(join(tmpdir(), 'panorama-chromium-'));
    const chrome = spawn('chromium', [
        '--headless', '--no-sandbox', '--disable-dev-shm-usage',
        '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
        '--disable-background-networking', '--no-first-run', '--no-default-browser-check',
        `--user-data-dir=${profile}`, '--remote-debugging-pipe', 'about:blank'
    ], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
    let sequence = 0, buffer = '', errors = '';
    const pending = new Map();
    chrome.stderr.on('data', data => { errors = (errors + data).slice(-2000); });
    chrome.stdio[4].on('data', data => {
        buffer += data.toString();
        let end;
        while ((end = buffer.indexOf('\0')) !== -1) {
            const message = JSON.parse(buffer.slice(0, end));
            buffer = buffer.slice(end + 1);
            const waiter = pending.get(message.id);
            if (waiter) {
                pending.delete(message.id);
                message.error ? waiter.reject(new Error(JSON.stringify(message.error))) : waiter.resolve(message.result);
            }
        }
    });
    const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve, reject });
        chrome.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
    });
    chrome.on('error', error => { for (const waiter of pending.values()) waiter.reject(error); });
    chrome.on('exit', () => { for (const waiter of pending.values()) waiter.reject(new Error(errors || 'Chromium exited')); });
    const timeout = setTimeout(() => chrome.kill('SIGKILL'), 60000);
    try {
        const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
        const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
        const page = (method, params) => call(method, params, sessionId);
        await page('Page.enable');
        await page('Emulation.setDeviceMetricsOverride', { width: 640, height: 360, deviceScaleFactor: 1, mobile: false });
        // Count image loads, including legacy exports and optional repair overlays.
        await page('Page.addScriptToEvaluateOnNewDocument', { source: `
            window.__panoPending = 0; window.__panoLoaded = 0; window.__panoFailed = false;
            const OriginalImage = window.Image;
            window.Image = class extends OriginalImage {
                constructor(...args) { super(...args); window.__panoPending++;
                    this.addEventListener('load', () => { window.__panoPending--; window.__panoLoaded++; }, {once:true});
                    this.addEventListener('error', () => { window.__panoFailed = true; }, {once:true});
                }
            };` });
        await page('Page.navigate', { url: pathToFileURL(source).href });
        for (;;) {
            const { result, exceptionDetails } = await page('Runtime.evaluate', { expression: `
                document.readyState === 'complete' && !!document.querySelector('canvas') &&
                window.__panoLoaded > 0 && window.__panoPending === 0 && !window.__panoFailed &&
                (typeof panoramaLoaded === 'undefined' || panoramaLoaded)` });
            if (exceptionDetails) throw new Error('Panorama readiness check failed');
            if (result.value) break;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const verification = await page('Runtime.evaluate', { expression: `
            draw(); gl.finish();
            JSON.stringify({yaw:y, pitch:p, fov:f, width:canvas.width, height:canvas.height})` });
        const view = JSON.parse(verification.result.value);
        if (![view.yaw, view.pitch, view.fov].every(Number.isFinite) || view.width !== 640 || view.height !== 360)
            throw new Error('Invalid saved camera or viewport');
        const shot = await page('Page.captureScreenshot', { format: 'jpeg', quality: 78, fromSurface: true });
        return Buffer.from(shot.data, 'base64');
    } finally {
        clearTimeout(timeout);
        chrome.kill('SIGTERM');
        await new Promise(resolve => chrome.exitCode !== null ? resolve() : chrome.once('exit', resolve));
        rmSync(profile, { recursive: true, force: true });
    }
}

render(process.argv[2]).then(image => process.stdout.write(image)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
