# Context

- 2026-11-02: Magnus explicitly authorized check-in of both projects. This
  checkpoint contains the deployed always-dark, headerless gallery, responsive
  layout, status handling, tests and documentation. Fixture and live tests pass
  for all 37 panorama/companion-JPEG pairs. No server changes in this checkpoint.

- 2026-11-02: Canonical clone: `/Users/magnus/GitHub/panorama-browser`.
  Server `root@pi-kato`, document root `/var/www/html/panorama`, public gallery
  `https://panorama.egelberg.se`. Preserve original panorama HTML/URLs, directory
  structure, PanoWizard, all VirtualHosts and certificates. No Git commit/push
  is implied by development requests.
- 2026-11-02: Architecture is static HTML/CSS/JavaScript. Each browser refresh
  recursively discovers files through Apache `/_panorama-list/?F=0`. HTTPS alias
  uses scoped `DirectoryIndex disabled` and `Cache-Control: no-store`; source is
  deployment/panorama-listing.conf. Normal root index and original URLs remain.
  Exclude only root index.html, retain nested index.html panoramas. No polling.
- 2026-11-02: A same-directory, same-basename `.jpg` supplies the thumbnail;
  otherwise display a text card. PanoWizard optionally publishes these JPEGs.
  Gallery layout remains unchanged. UTF-8/case-sensitive names are supported.
  Only immediate same-origin children are followed; 4 concurrent requests,
  15-second timeouts, 1,000-directory/32-level limits and visible partial errors.
  Apache allows FollowSymLinks; no physical symlinks were found during migration.
- 2026-11-02: Final cleanup authorized. Copied all 36 former cached images to
  companion JPEGs with exclusive creation and identical hashes; no overwrites,
  HTML changes or thumbnail rendering. Also found and preserved the newly
  published 2026/badrummet.html plus JPEG. Current baseline is 37, not 36.
  Browser verified 37 decoded 640x360 images, all using companion URLs, before
  any legacy file deletion. Temporary JS image mapping and old pipeline removed.
- 2026-11-02: Removed old generation/rendering scripts, disabled scheduler file,
  generated file list, lock, 38-image hash cache and Python tests/caches. Kept
  current JavaScript tests and Apache alias deployment snippet. Removed only
  chromium and chromium-common after checking processes, schedulers, application
  references and package reverse dependencies. Shared libraries, Python, Node,
  PM2, other sites and all backups retained; no autoremove or purge.
- 2026-11-02: Rollback point on pi-kato:
  `/root/backups/panorama-final-cleanup-20261102-180020/` contains full pre-change
  site/scripts/scheduler/Apache archive, original HTML/Apache hashes, file
  inventory, copy records and exact browser-package DEBs. Local repository
  snapshot: `/Users/magnus/Documents/Codex/2026-11-02/fok/work/final-cleanup/repository-before-cleanup.tar`.
  Earlier backups remain. Restoring archive restores a disabled scheduler.
- 2026-11-02: Final verification passed after cleanup: 37 original HTML URLs
  and 37 companion JPEGs return HTTPS 200. All original HTML and Apache hashes
  match the rollback point, including the new panorama; its existing JPEG is
  unchanged. Layout HTML/CSS is identical. Browser E2E: nested UTF-8 test upload
  produced entry 38 without image, matching JPG loaded at 640x360 after refresh;
  both test files removed and count returned to 37. No generation was run.
  Old runtime endpoints and temporary files return 404. No Panorama scheduler,
  generator, render process or browser executable remains. Chromium's residual
  package configuration is retained (remove, not purge), along with shared libs.
- 2026-11-02: Human-readable card captions deployed. Parent directories form
  a muted 14px location line joined by ` · `; the HTML basename forms a 16px
  semibold title. Strip .html case-insensitively, replace hyphens/underscores
  with spaces, uppercase only the first Unicode character of each segment and
  preserve the rest. Root panoramas omit location. Captions use textContent;
  no inferred names, metadata, renaming, URL or JPEG-matching changes.
  Existing grid, padding, gaps and thumbnail dimensions retained. Fixture tests
  cover nested/root paths, both requested examples, Swedish/Unicode characters,
  long titles and mixed case. Live/browser checks passed for 37 panoramas and
  37 decoded JPEGs; 390px view has no horizontal overflow. Original panorama,
  JPEG and Apache hashes unchanged. Gallery backup:
  `/root/backups/panorama-captions-20261102-183405/index.html`.
- 2026-11-02: Magnus approved the completed static gallery and captions and
  explicitly requested check-in. Reviewed all pending changes; fixture tests,
  live checks of 37 HTML/JPEG pairs, whitespace and credential-pattern checks
  passed. Checkpoint includes static discovery, companion images, legacy cleanup,
  Apache alias instructions, readable captions, current tests and documentation.
- 2026-11-02: Magnus prefers an always-dark gallery regardless of browser/OS
  light/dark mode and authorized artistic layout changes. Deployed CSS-only
  graphite design: fixed color-scheme dark, subtle dark cards, off-white titles,
  muted location lines, smaller heading, compact count badge and more image
  space. Three desktop columns, two at <=800px, one at <=560px. Preserve full
  16:9 thumbnails and two-line captions; subtle hover lift, visible keyboard
  focus and reduced-motion support. HTML content and JavaScript are unchanged.
  Live checks passed for 37 HTML/JPEG pairs; browser decoded all 37 images and
  showed no horizontal overflow at 750px/390px. Panorama/JPEG/Apache hashes
  unchanged against the start-of-task backup. Backup:
  `/root/backups/panorama-dark-gallery-20261102-202936/index.html`.
  Existing root duplicates are now in the server's skräp/ directory; discovery
  still includes them, with no new directory exclusions. No commit/push made.
- 2026-11-02: Magnus wants a simple public panorama gallery with no app title.
  Removed the entire visible header (Panorama Browser heading, count badge and
  divider); photos now start directly at the page padding. Card captions remain.
  Generic document title is Panoramas. Successful loading hides the count;
  loading, empty-gallery and error/partial-result messages remain visible.
  Tests cover hidden success status and visible empty/error states. Live/browser
  checks passed for all 37 panorama/JPEG pairs; original file and Apache hashes
  unchanged. Backup: `/root/backups/panorama-headerless-20261102-204159/index.html`.
