#!/usr/bin/env python3
"""Generate the panorama list using only Python's standard library."""

import argparse
import json
import os
from pathlib import Path
import tempfile
from urllib.parse import quote


def scan_error(error):
    raise error


def generate(root):
    root = Path(root).absolute()
    if root.is_symlink() or not root.is_dir():
        raise ValueError("The panorama root must be a real directory")

    paths = []
    for directory, directories, files in os.walk(root, followlinks=False, onerror=scan_error):
        directories[:] = [name for name in directories if not (Path(directory) / name).is_symlink()]
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
    generate(parser.parse_args().root)
