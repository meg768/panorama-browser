#!/usr/bin/env python3
"""Generate the panorama list using only Python's standard library."""

import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import tempfile
import subprocess
import sys
from urllib.parse import quote


def scan_error(error):
    raise error


def thumbnail(root, relative, renderer):
    source = root / relative
    before = source.stat()
    with source.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    key = hashlib.sha256(('v1-640x360-78\0' + relative + '\0' + digest).encode()).hexdigest()
    directory = root / 'thumbnails'
    if directory.is_symlink():
        raise ValueError('Thumbnail directory must not be a symlink')
    directory.mkdir(exist_ok=True)
    output = directory / (key + '.jpg')
    if output.is_symlink():
        raise ValueError('Thumbnail must not be a symlink')
    if not output.exists():
        # The exported JavaScript executes as www-data, never as cron's root user.
        image = subprocess.run(['/usr/sbin/runuser', '-u', 'www-data', '--', '/usr/local/bin/node', str(renderer), str(source)],
                               capture_output=True, timeout=75, check=True).stdout
        after = source.stat()
        if (before.st_mtime_ns, before.st_size) != (after.st_mtime_ns, after.st_size):
            raise ValueError('Panorama changed during rendering; retry next minute')
        if not image.startswith(b'\xff\xd8'):
            raise ValueError('Renderer did not return a JPEG')
        with tempfile.NamedTemporaryFile(dir=directory, delete=False) as stream:
            stream.write(image)
            temporary = Path(stream.name)
        temporary.chmod(0o644)
        os.replace(temporary, output)
    return './thumbnails/' + output.name


def generate(root, renderer=None):
    root = Path(root).absolute()
    if root.is_symlink() or not root.is_dir():
        raise ValueError("The panorama root must be a real directory")

    paths = []
    for directory, directories, files in os.walk(root, followlinks=False, onerror=scan_error):
        directories[:] = [name for name in directories if not (Path(directory) / name).is_symlink()
                          and not (Path(directory) == root and name == 'thumbnails')]
        for name in files:
            file = Path(directory) / name
            if file.is_symlink() or not file.is_file() or file.suffix.lower() != ".html":
                continue
            relative = file.relative_to(root).as_posix()
            if relative != "index.html":
                paths.append(relative)

    entries = [
        {"path": path, "url": "./" + "/".join(quote(part, safe="") for part in path.split("/"))}
        for path in sorted(paths)
    ]
    if renderer is not None:
        for entry in entries:
            try:
                entry['thumbnail'] = thumbnail(root, entry['path'], renderer)
            except (OSError, ValueError, subprocess.SubprocessError) as error:
                print('Thumbnail failed for ' + entry['path'] + ': ' + str(error), file=sys.stderr)
    content = json.dumps(entries, ensure_ascii=False, indent=2) + "\n"
    output = root / "panoramas.json"
    if output.is_symlink():
        raise ValueError("The manifest must not be a symbolic link")
    if output.exists() and output.read_text(encoding="utf-8") == content:
        return

    # Replace atomically so Apache never serves a partially written JSON file.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=root,
                                         prefix=".panoramas-", suffix=".tmp", delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(content)
        temporary.chmod(0o644)
        os.replace(temporary, output)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default="/var/www/html/panorama")
    arguments = parser.parse_args()
    # Prevent overlapping cron runs while a batch of new panoramas renders.
    with (Path(arguments.root) / '.panorama-browser.lock').open('w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            sys.exit(0)
        generate(arguments.root, Path(__file__).with_name('render_thumbnail.js').absolute())
