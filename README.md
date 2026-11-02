# Panorama Browser

A static HTML/CSS/JavaScript gallery using Apache's existing directory listings.
Refresh the browser after SFTP uploads. No build, backend application, database,
scheduler, generated file list or server-side image renderer is required.

## Files and thumbnails

The browser discovers `.html` files recursively and excludes only the gallery's
own root `index.html`. Nested `index.html` panoramas remain eligible. Clicking a
card opens the original HTML at its unchanged URL.

A JPEG with the same basename in the same directory is the thumbnail:

```text
2008/sälen/backen/panorama.html
2008/sälen/backen/panorama.jpg
```

Cards show parent directories on a muted location line and the filename as a
stronger title. Hyphens and underscores become spaces, .html is removed, and
only the first character of each segment is capitalized. Root files omit the
location line. Without a JPEG, the caption remains without an image. If an image fails
to load, the image is removed while the link remains usable. PanoWizard's
optional Generate thumbnail publishes a matching 640 × 360 JPEG. Existing photos
are displayed in the original responsive card layout, without cropping.

## Apache and deployment

- Clone: `/Users/magnus/GitHub/panorama-browser`
- Server: `root@pi-kato`
- Document root: `/var/www/html/panorama`
- Gallery: https://panorama.egelberg.se

Keep `deployment/panorama-listing.conf` inside the existing panorama HTTPS
VirtualHost. It provides `/_panorama-list/`, scoped `DirectoryIndex disabled`
and `Cache-Control: no-store`. Existing `Options Indexes` and UTF-8 autoindex
settings are used. The homepage still serves `index.html`; original panorama
URLs, subdirectories, certificates and HTTP-to-HTTPS redirects remain unchanged.
Reserve `/_panorama-list/` as a virtual namespace rather than an upload directory.

Deploy only `index.html`, uploading to a temporary name and renaming into place.
Keep originals and companion JPEGs intact. Do not deploy Git metadata, tests,
documentation or backup archives to the public directory. Run
`apache2ctl configtest` before any future Apache reload.

## Discovery safeguards

Uses browser-native `fetch`, `DOMParser` and `URL`. Link attributes determine
paths; each filename is decoded once and individual components are URL-encoded.
Captions use `textContent`. Swedish characters, reserved URL characters and
case-sensitive directories such as `Lissabon` and `lissabon` are preserved.

Only immediate children on the same origin are accepted. Parent, query and
fragment links, malformed encodings and separators in decoded names are ignored.
Responses must have the expected URL and an Apache directory-listing heading.
Four requests run concurrently, with 15 seconds per request, at most 1,000
directories and 32 levels. Failures or limits produce a partial-result message;
a root failure produces a loading error. There is no polling timer. Listings
bypass browser caching; companion JPEGs retain normal HTTP image caching.

Directory listings expose public filenames. Keep private files outside the
public tree. Apache currently permits FollowSymLinks; client-side discovery
cannot identify physical symlinks. Upload real files and directories. Traversal
limits bound loops. The gallery depends on standard Apache autoindex HTML.

## Verification

Node is used only for optional developer tests, not by the deployed gallery:

```sh
node tests/test_gallery.cjs
PANORAMA_EXPECTED_COUNT=37 node tests/test_gallery.cjs --live
```

Fixture tests cover recursion, nested index files, UTF-8 and reserved characters,
URL boundaries, malformed encodings, matching JPGs, absent images and load errors.
Live verification checks unique entries, same-basename image URLs and HTTP 200
for every original HTML and thumbnail. Browser checks confirm actual decoding.
The expected count is a verification snapshot, not a runtime gallery setting.

## Migration and rollback

On 2026-11-02, 36 former cached thumbnails were copied byte-for-byte alongside
their HTML files, with exclusive creation and no overwrite. The independently
published `2026/badrummet.html` and its JPEG were preserved, making 37 panoramas.
No original HTML was modified and no image was regenerated.

Before cleanup, the full site, old scripts, disabled scheduler file and panorama
Apache configuration were archived on pi-kato at:
`/root/backups/panorama-final-cleanup-20261102-180020/before-cleanup.tar`.
The same directory contains the original HTML hashes, pre-migration inventory,
image-copy records and checksums, original package list and removal log.
The two removed browser packages were also saved there as exact-version DEBs.
All earlier backups remain outside the public directory.

Rollback can restore the archived files with their original paths; the archived
scheduler is disabled. Reinstall the saved browser packages only if restoring
the old renderer. Copy records distinguish the 36 added JPEGs from pre-existing
files. Keep those JPEGs unless an exact reversal is required, and never remove
subsequent uploads. A repository snapshot was also taken before local cleanup.
