# Panorama Browser 0.1

A responsive static list of panorama HTML files. Plain HTML, CSS and JavaScript;
Python's standard library generates the list. No PHP, packages, framework,
database, build step, thumbnails, search or filtering.

## How it works

`generate_manifest.py` recursively scans the panorama directory, including its
root. It skips symbolic links and the gallery's own root `index.html`, while
including panorama files named `index.html` in subdirectories. HTML extensions
are matched case insensitively. Entries are sorted by relative path, and each URL
component is encoded separately. The browser uses `textContent` for filenames.
Only relative paths appear in the public JSON.

The generator replaces `panoramas.json` atomically and leaves it untouched when
the list is unchanged. Cron runs it every minute. An open browser fetches the
manifest every minute without caching, so new files appear within approximately
two minutes without reloading the page. Failed requests keep the previous list
and retry on the next interval.

## Server and deployment

- Site: https://panorama.egelberg.se
- SSH: `root@pi-kato`
- Document root: `/var/www/html/panorama`
- Python: existing `/usr/bin/python3` (3.11).
- Generator: `/usr/local/lib/panorama-browser/generate_manifest.py`
- Schedule: `/etc/cron.d/panorama-browser`

The existing tennis frontend deploys static files with `scp` to its own Apache
document root. This project follows that convention without its build tools or
API. Apache already prioritizes `index.html`; no VirtualHost changes are needed.

Before deploying, back up existing files that would be replaced. Never delete or
synchronize away panorama files. Copy only `index.html` into the public document
root and install the generator outside it. Copy `deployment/panorama-browser.cron`
to `/etc/cron.d/panorama-browser` with owner root and mode 0644. Run the generator
once before publishing `index.html`:

```sh
python3 /usr/local/lib/panorama-browser/generate_manifest.py /var/www/html/panorama
```

Cron automatically reads the schedule; no new service or Apache reload is needed.
Do not deploy the repository, tests or documentation into the public directory.

## Verification

```sh
python3 -m unittest discover -s tests -v
```

Tests cover recursive discovery, root/nested index exclusion rules, Unicode and
special URL characters, symlink files/directories/loops, empty directories, output
permissions, idempotence and added/removed files. After deployment verify all
panorama links, HTTPS, cron discovery of a temporary test file, and checksums of
the original panoramas, Apache configuration and certificates.

Initial deployment verified all 36 original links over HTTPS, including nested
and Swedish paths, and the page at desktop and 390px mobile widths. Real cron
discovered a temporary uploaded panorama in 28 seconds; it was then removed.
Original panorama checksums, Apache files, certificates and installed package
versions were unchanged. Other sites returned the same statuses as before
(cosmic-unicorn's root already returned 404). Apache configtest passed with its
existing global ServerName warning.
