#!/usr/bin/env python3
"""Create the deployable, minified site without obscuring the editable source."""

from pathlib import Path
import shutil

import csscompressor
import rjsmin


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "dist"
TARGET = ROOT / ".publish"


def minify_file(path: Path) -> None:
    source = path.read_text(encoding="utf-8")
    if path.suffix == ".css":
        output = csscompressor.compress(source)
    else:
        output = rjsmin.jsmin(source)
    path.write_text(output, encoding="utf-8")


def main() -> None:
    if TARGET.exists():
        shutil.rmtree(TARGET)
    shutil.copytree(SOURCE, TARGET)

    for suffix in ("*.css", "*.js"):
        for path in TARGET.rglob(suffix):
            minify_file(path)

    source_bytes = sum(path.stat().st_size for path in SOURCE.rglob("*") if path.is_file())
    target_bytes = sum(path.stat().st_size for path in TARGET.rglob("*") if path.is_file())
    saved = source_bytes - target_bytes
    print(f"Prepared {TARGET} ({saved:,} bytes removed by minification).")


if __name__ == "__main__":
    main()
