# Panorama Browser 0.2

A responsive static gallery: plain HTML/CSS/JavaScript, a Python manifest
and small cached JPEG thumbnails. No PHP, database, framework, permanent backend,
search, filtering or build step.

## Thumbnails

Headless Chromium opens each original HTML export and runs its own WebGL code:
embedded JPEGs, saved yaw/pitch/vertical FOV, color adjustments and repair/retouch
layers. It waits for every image and rendering, then captures a **640 × 360 JPEG
at quality 78**. The fixed 16:9 viewport determines the aspect ratio; camera
parameters are never changed. Gallery images are shown without cropping.
Clicking opens the original interactive HTML.

This reuses the existing renderer instead of implementing another projection
engine. `render_thumbnail.js` controls Chromium through a private DevTools pipe
using Node's built-in modules. Each browser runs as www-data, not root, with its
sandbox disabled for this unprivileged batch invocation. Upload trusted exports
only. The browser and temporary profile are removed after capture; no persistent
browser service or open debugging port is introduced.

Thumbnail filenames hash the relative path, full source contents and renderer
version/dimensions. Existing images are reused; changed HTML gets a new image URL,
including changes to pixels, camera or adjustments. Previous thumbnails are
retained. Bump the renderer version in generate_manifest.py when changing capture
behavior. Visitors fetch static JPEGs with lazy loading, never full-resolution
panorama HTML until they open a card.

## Automatic updates

The generator scans root and nested HTML files without following symlinks. It
excludes only the gallery's root index.html and generated thumbnails directory.
Paths are sorted, URL components encoded separately, and captions use textContent.
Public JSON exposes only relative paths.

Existing cron runs every minute. A lock prevents overlapping batches. JSON is
published atomically and is not rewritten if unchanged. Newly added or changed
files appear after scanning and rendering, then the browser's next one-minute
refresh. Incomplete/invalid exports remain listed and retry on the next cron run;
errors go to stderr, never to the public page. The browser keeps its previous list
if a request fails.

## Deployment

- Local repository: `/Users/magnus/GitHub/panorama-browser`
- Site: https://panorama.egelberg.se
- SSH: `root@pi-kato`; document root: `/var/www/html/panorama`
- Existing runtimes: Python 3.11 and Node 18.
- Added software: Chromium and system libraries via Debian/Raspberry Pi packages,
  using `apt-get install --no-install-recommends chromium`.
- No Python/npm packages, Pillow or NumPy are required.

Back up files before replacing them. Install generate_manifest.py and
render_thumbnail.js, root-owned with mode 0644, into
`/usr/local/lib/panorama-browser/`, outside the public directory. Run:

```sh
python3 /usr/local/lib/panorama-browser/generate_manifest.py /var/www/html/panorama
```

Verify the manifest and thumbnails before copying index.html into the document
root. Keep `/etc/cron.d/panorama-browser` unchanged (source in deployment/).
Apache already prioritizes index.html: no VirtualHost, certificate or PanoWizard
changes are needed. Never synchronize away originals or deploy Git metadata,
tests or documentation into the public directory.

## Verification

```sh
python3 -m unittest discover -s tests -v
node --check render_thumbnail.js
```

Tests cover recursive discovery, Unicode/URL encoding, symlinks, exclusions,
empty directories, thumbnail caching and content-change regeneration, and failure
handling. Production verification covers all original links and 36 static
thumbnails, original camera rendering, unchanged originals and Apache files,
automatic discovery and desktop/mobile layout.
