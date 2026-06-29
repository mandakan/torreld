#!/usr/bin/env python3
"""TORRELD build — inline every source file into a single dist/index.html.

Reads src/framework/shell.html and substitutes:
  <!-- INJECT:STYLES    -->  -> src/framework/styles.css
  <!-- INJECT:PACKS     -->  -> concatenated src/packs/*.js, sorted by filename
  <!-- INJECT:FRAMEWORK -->  -> src/framework/{timer,renderer,switcher}.js (in load order)

The output is byte-self-contained and runs from file:// with no server.
"""

from __future__ import annotations
import glob
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
SHELL = SRC / "framework" / "shell.html"
STYLES = SRC / "framework" / "styles.css"
FRAMEWORK_ORDER = ["timer.js", "renderer.js", "switcher.js"]
PACK_GLOB = str(SRC / "packs" / "*.js")


def read(p: pathlib.Path) -> str:
    return p.read_text(encoding="utf-8")


def main() -> int:
    if not SHELL.exists():
        print(f"missing {SHELL}", file=sys.stderr)
        return 1

    shell = read(SHELL)
    styles = read(STYLES)
    framework = "\n\n".join(
        read(SRC / "framework" / name) for name in FRAMEWORK_ORDER
    )

    pack_files = sorted(glob.glob(PACK_GLOB))
    if not pack_files:
        print("no packs in src/packs/ — at least one is required", file=sys.stderr)
        return 1
    packs = "\n\n".join(read(pathlib.Path(p)) for p in pack_files)

    out = (
        shell
        .replace("<!-- INJECT:STYLES -->", styles)
        .replace("<!-- INJECT:PACKS -->", packs)
        .replace("<!-- INJECT:FRAMEWORK -->", framework)
    )

    DIST.mkdir(exist_ok=True)
    target = DIST / "index.html"
    target.write_text(out, encoding="utf-8")
    pack_names = [pathlib.Path(p).stem for p in pack_files]
    print(f"built {target}  ({len(out):,} bytes, {len(pack_files)} pack(s): {', '.join(pack_names)})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
