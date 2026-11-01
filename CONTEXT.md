# Context

- 2026-11-02: Use Magnus's clone in `/Users/magnus/GitHub/panorama-browser`.
  Version 0.2 uses plain HTML/CSS/JavaScript and a Python manifest generator with
  cached JPEG thumbnails. No PHP. Commit and push are authorized.
- 2026-11-01: Target is `root@pi-kato`, `/var/www/html/panorama`,
  `https://panorama.egelberg.se`. Existing Python 3.11 and cron are available.
  Apache already prioritizes index.html. Preserve panoramas, PanoWizard, all
  VirtualHosts and certificates. There were 36 original panorama HTML files.
- 2026-11-01: Tennis uses static Apache files in `/var/www/html/vitel`, deployed
  using scp; its API is separately proxied to port 3004. Reuse only static upload
  conventions. Panorama's JSON generator runs every minute through cron; the
  browser also refreshes its list every minute. Skip symlinks and exclude only
  the gallery's root index.html, not nested panorama index.html files.
- 2026-11-02: Deployed index.html and generated panoramas.json; generator is in
  `/usr/local/lib/panorama-browser/`, schedule in `/etc/cron.d/panorama-browser`.
  Backups: `/root/backups/panorama-static-20261101-235857/`. All 36 links return
  HTTPS 200 with original file sizes. Real cron discovered a temporary Swedish
  test filename in 28 seconds; test file was removed. Desktop/mobile browser QA
  passed, including an original nested Swedish panorama. Existing Apache files,
  certificates, panorama hashes and installed package versions are unchanged.
- 2026-11-02: Version 0.2 uses transient headless Chromium to render the original
  HTML/WebGL, including saved camera values, color adjustments and pole overlays.
  Capture is 640x360, JPEG quality 78, fixed 16:9, without camera changes or crop.
  Chromium and required system libraries were installed after explaining why;
  Node 18 and Python 3.11 already existed. No npm/Python packages are used.
  Renderer runs as www-data through a private debugging pipe, with no permanent
  service. Source-content hashes cache thumbnails and invalidate changed exports.
  Existing cron is retained with a lock against overlapping batches. Backup:
  `/root/backups/panorama-thumbnails-20261102-002128/`.
- 2026-11-02: All 36 original HTML links and all 36 thumbnails verified HTTPS 200.
  Each JPEG is 640x360, 24–97 kB (1.69 MB total). Desktop and 390px mobile views
  verified with no horizontal scrolling; gallery embeds only JPEGs, no panorama
  HTML. Original panorama and Apache configuration hashes are unchanged. Existing
  sites retain their prior responses; cosmic-unicorn's root still returns 404.
- 2026-11-02: Temporary new/changed exports verified discovery, JPEG creation and
  new cache URLs; test sources removed. Cron has a restricted PATH, so runuser
  and Node are invoked using `/usr/sbin/runuser` and `/usr/local/bin/node`.
  The corrected generator was verified with a minimal cron-equivalent environment.
