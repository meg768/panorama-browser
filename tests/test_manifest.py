import json
from pathlib import Path
import tempfile
import unittest

from generate_manifest import generate


class ManifestTests(unittest.TestCase):
    def test_discovery_encoding_and_symlink_exclusion(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "gallery"
            root.mkdir()
            (root / "nested").mkdir()
            paths = ["z.html", "a.html", "nested/index.html", 'nested/sälen & "utsikt"#%.html',
                     "nested/<script>.html", "UPPER.HTML"]
            for path in paths + ["index.html", "ignore.txt"]:
                (root / path).write_text("fixture", encoding="utf-8")
            outside = Path(temporary) / "outside.html"
            outside.write_text("outside", encoding="utf-8")
            (root / "linked.html").symlink_to(outside)
            (root / "internal.html").symlink_to(root / "a.html")
            (root / "linked-directory").symlink_to(root / "nested", target_is_directory=True)
            (root / "nested/loop").symlink_to(root, target_is_directory=True)

            generate(root)
            manifest = root / "panoramas.json"
            entries = json.loads(manifest.read_text(encoding="utf-8"))
            self.assertEqual([entry["path"] for entry in entries], sorted(paths))
            special = next(entry for entry in entries if "sälen" in entry["path"])
            self.assertEqual(special["url"], './nested/s%C3%A4len%20%26%20%22utsikt%22%23%25.html')
            self.assertNotIn(str(root), manifest.read_text(encoding="utf-8"))
            self.assertEqual(manifest.stat().st_mode & 0o777, 0o644)
            before = manifest.stat().st_mtime_ns
            generate(root)
            self.assertEqual(manifest.stat().st_mtime_ns, before)

            (root / "new.html").write_text("new", encoding="utf-8")
            (root / "a.html").unlink()
            generate(root)
            updated = json.loads(manifest.read_text(encoding="utf-8"))
            self.assertIn("new.html", [entry["path"] for entry in updated])
            self.assertNotIn("a.html", [entry["path"] for entry in updated])

    def test_empty_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            generate(temporary)
            self.assertEqual(json.loads((Path(temporary) / "panoramas.json").read_text()), [])


if __name__ == "__main__":
    unittest.main()
