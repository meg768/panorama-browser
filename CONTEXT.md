# Context

- 2026-11-01: Use this existing clone in `/Users/magnus/Documents/GitHub/panorama-browser`.
  Version 0.1 uses plain HTML/CSS/JavaScript and a Python standard-library manifest
  generator. No PHP or package installation. Commit and push are authorized.
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
