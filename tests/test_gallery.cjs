const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8')
    .match(/<script>([\s\S]*?)<\/script>/)[1];

// Minimal DOM adapter for testing discovery and rendering without dependencies.
class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.textContent = ''; }
    append(...children) { this.children.push(...children); }
    replaceChildren(fragment) { this.children = fragment.children; }
    addEventListener() {}
}
class ListingParser {
    parseFromString(html) {
        return {
            querySelector: () => ({ textContent: html.match(/<h1>(.*?)<\/h1>/)?.[1] || '' }),
            querySelectorAll: () => [...html.matchAll(/href="([^"]*)"/g)]
                .map(match => ({ getAttribute: () => match[1] }))
        };
    }
}
async function run(fetcher) {
    const list = new Element('ul'), status = new Element('p');
    const context = vm.createContext({ URL, AbortSignal, DOMParser: ListingParser,
        location: new URL('https://panorama.egelberg.se/'), fetch: fetcher,
        document: { getElementById: id => id === 'panoramas' ? list : status,
            createElement: tag => new Element(tag), createDocumentFragment: () => new Element('fragment') }
    });
    vm.runInContext(source.replace(/loadPanoramas\(\);\s*$/, 'globalThis.finished = loadPanoramas();'), context);
    await context.finished;
    return { cards: list.children.map(item => ({ url: item.children[0].href,
        image: item.children[0].children.find(child => child.tag === 'img')?.src,
        path: decodeURIComponent(new URL(item.children[0].href).pathname.slice(1)),
        title: item.children[0].children.find(child => child.className === 'caption').children.find(child => child.className === 'title').textContent,
        location: item.children[0].children.find(child => child.className === 'caption').children.find(child => child.className === 'location')?.textContent
    })), status: status.textContent };
}
const listing = hrefs => '<h1>Index of /</h1>' + hrefs.map(href => `<a href="${href}">file</a>`).join('');
function fixture(pages) {
    return async (url, options) => {
        assert.equal(options.cache, 'no-store');
        const body = pages[new URL(url).pathname];
        return { ok: body !== undefined, url: String(url), text: async () => body || '' };
    };
}
(async () => {
    assert.ok(!source.includes('setInterval'));
    const result = await run(fixture({
        '/_panorama-list/': listing(['index.html', 'panorama.html', 'panorama.jpg', '2008/',
            '?C=N;O=D', '/', 'https://example.com/evil.html', '../escape.html', '%ZZ.html', 'missing.html']),
        '/_panorama-list/2008/': listing(['index.html', 's%c3%a4len%20%26%23%25.html', 's%c3%a4len%20%26%23%25.jpg', 'broken/'])
    }));
    assert.equal(result.cards.length, 4);
    assert.equal(result.cards.find(c => c.path === 'panorama.html').image, 'https://panorama.egelberg.se/panorama.jpg');
    assert.ok(result.cards.find(c => c.path === '2008/index.html'));
    const swedish = result.cards.find(c => c.path === '2008/sälen &#%.html');
    assert.equal(swedish.url, 'https://panorama.egelberg.se/2008/s%C3%A4len%20%26%23%25.html');
    assert.equal(swedish.image, 'https://panorama.egelberg.se/2008/s%C3%A4len%20%26%23%25.jpg');
    assert.equal(result.cards.find(c => c.path === 'missing.html').image, undefined);
    assert.match(result.status, /Some folders/);
    assert.match((await run(fixture({}))).status, /Unable to load/);
    assert.match((await run(fixture({'/_panorama-list/': '<h1>Wrong page</h1>'}))).status, /Unable to load/);
    const longTitle = 'en-mycket-lång_titel-med-många-ord-och-mIxED-case';
    const captions = await run(fixture({
        '/_panorama-list/': listing(['2019/', '2009/', 'root_Title-mIxED.HTML', longTitle + '.html', '𐐨land.html']),
        '/_panorama-list/2019/': listing(['%C3%A5re/']),
        '/_panorama-list/2019/%C3%A5re/': listing(['vid-liften/']),
        '/_panorama-list/2019/%C3%A5re/vid-liften/': listing(['platt-fall.html']),
        '/_panorama-list/2009/': listing(['lund/']),
        '/_panorama-list/2009/lund/': listing(['lundag%C3%A5rd/']),
        '/_panorama-list/2009/lund/lundag%C3%A5rd/': listing(['uppe-vid-backen.html'])
    }));
    assert.equal(captions.cards.length, 5);
    const are = captions.cards.find(c => c.path.endsWith('platt-fall.html'));
    assert.equal(are.location, '2019 · Åre · Vid liften');
    assert.equal(are.title, 'Platt fall');
    const lund = captions.cards.find(c => c.path.endsWith('uppe-vid-backen.html'));
    assert.equal(lund.location, '2009 · Lund · Lundagård');
    assert.equal(lund.title, 'Uppe vid backen');
    const root = captions.cards.find(c => c.path === 'root_Title-mIxED.HTML');
    assert.equal(root.location, undefined);
    assert.equal(root.title, 'Root Title mIxED');
    assert.equal(captions.cards.find(c => c.path === longTitle + '.html').title,
        'En mycket lång titel med många ord och mIxED case');
    assert.equal(captions.cards.find(c => c.path === '𐐨land.html').title, '𐐀land');
    console.log('Fixture tests PASS: two-line captions, nested/root paths, mixed case, long titles, Unicode, recursion, nested index, UTF-8/reserved characters, JPG priority, text fallback, URL boundaries, malformed URLs and loading errors.');
    if (process.argv.includes('--live')) {
        const live = await run(fetch);
        const expected = Number(process.env.PANORAMA_EXPECTED_COUNT || 0);
        if (expected) assert.equal(live.cards.length, expected);
        assert.equal(live.status, live.cards.length + ' panoramas');
        assert.equal(new Set(live.cards.map(c => c.path)).size, live.cards.length);
        for (const card of live.cards) {
            assert.equal(card.image, card.url.replace(/\.html$/i, ".jpg"), card.path);
            for (const address of [card.url, new URL(card.image, 'https://panorama.egelberg.se/').href]) {
                const response = await fetch(address, { method: 'HEAD' });
                assert.equal(response.status, 200, address);
            }
        }
        console.log('Live tests PASS: ' + live.cards.length + ' unique panoramas and same-basename JPEGs; every HTML and image URL HTTP 200.');
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
