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
import re
import shutil
import subprocess
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
SHELL = SRC / "framework" / "shell.html"
STYLES = SRC / "framework" / "styles.css"
FRAMEWORK_ORDER = ["progress.js", "timer.js", "renderer.js", "switcher.js"]
PACK_GLOB = str(SRC / "packs" / "*.js")

SITE_ORIGIN = "https://torreld.urdr.dev"
SITE_TITLE = "TORRELD"
SITE_TAGLINE = "Dry-fire training packs"
SITE_DESCRIPTION = (
    "Par-time-driven dry-fire training packs. Mobile-first, offline, no accounts."
)

FAVICON_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
    '<defs>'
    '<linearGradient id="f" x1="0" y1="1" x2="0" y2="0">'
    '<stop offset="0" stop-color="#ff5a12"/>'
    '<stop offset=".5" stop-color="#ffb02e"/>'
    '<stop offset="1" stop-color="#ffe0a0"/>'
    '</linearGradient>'
    '<mask id="t">'
    '<path d="M50 6 C57 22 64 31 68 47 C72 62 67 82 53 91 C49 94 45 94 41 91 C27 82 22 62 27 47 C31 36 40 40 43 30 C45 40 49 38 49 30 C49 18 47 16 50 6 Z" fill="#fff"/>'
    '<path d="M33 52 H67 V62 H56 V86 H44 V62 H33 Z" fill="#000"/>'
    '</mask>'
    '</defs>'
    '<rect width="100" height="100" fill="url(#f)" mask="url(#t)"/>'
    '</svg>'
)


def escape_xml(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def truncate(s: str, n: int) -> str:
    if len(s) <= n:
        return s
    return s[: max(0, n - 3)].rstrip() + "..."


def _field(text: str, key: str):
    """Value of a single-line `key: "value"` pair, or None."""
    m = re.search(r'\b' + re.escape(key) + r'\s*:\s*"((?:[^"\\]|\\.)*)"', text)
    return m.group(1) if m else None


def _share_block(text: str) -> str:
    """Inner text of the top-level `share: { ... }` object, or ''.

    The regex matches non-greedily to the first `}`, so share field values
    must not contain a literal `}`.
    """
    m = re.search(r'\bshare\s*:\s*\{(.*?)\}', text, re.S)
    return m.group(1) if m else ""


def extract_pack_meta(text: str, stem: str) -> dict:
    name = _field(text, "name") or stem
    block = _share_block(text)
    s_title = _field(block, "title") if block else None
    s_tagline = _field(block, "tagline") if block else None
    s_desc = _field(block, "description") if block else None
    return {
        "id": stem,
        "name": name,
        "title": s_title or name,
        "tagline": s_tagline or "",
        "description": s_desc or SITE_DESCRIPTION,
        "document_title": _field(text, "documentTitle") or (name + " - TORRELD"),
    }


def _title_font_size(title: str) -> int:
    """Pick a title size that fits the ~860px of card width left of the flame.

    The OG template renders the title at x=80 with the flame starting near
    x=980, so a long title at a fixed 96px would overrun the flame. Scale the
    size down by title length (estimating ~0.6*size average glyph advance for
    the bold sans stack) and clamp to a readable band.
    """
    if not title:
        return 96
    return max(40, min(96, int(860 / (0.6 * len(title)))))


def render_og_svg(template: str, title: str, tagline: str) -> str:
    t = truncate(title, 30)
    return (
        template.replace("{{TITLE}}", escape_xml(t))
        .replace("{{TITLESIZE}}", str(_title_font_size(t)))
        .replace("{{TAGLINE}}", escape_xml(truncate(tagline, 48)))
    )


def favicon_data_uri(svg: str) -> str:
    return "data:image/svg+xml," + urllib.parse.quote(svg, safe="")


def render_head(favicon_uri: str, origin: str) -> str:
    img = origin + "/og/default.png"
    desc = escape_xml(SITE_DESCRIPTION)
    return (
        '<link rel="icon" type="image/svg+xml" href="' + favicon_uri + '">\n'
        # apple-touch-icon is a live-site-only asset (site-relative path); it will
        # not load under file://, which is harmless -- the inline data: favicon
        # covers offline use.
        '<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
        '<meta name="description" content="' + desc + '">\n'
        '<meta property="og:type" content="website">\n'
        '<meta property="og:site_name" content="TORRELD">\n'
        '<meta property="og:title" content="TORRELD - dry-fire training">\n'
        '<meta property="og:description" content="' + desc + '">\n'
        '<meta property="og:url" content="' + origin + '/">\n'
        '<meta property="og:image" content="' + img + '">\n'
        '<meta property="og:image:width" content="1200">\n'
        '<meta property="og:image:height" content="630">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        '<meta name="twitter:image" content="' + img + '">'
    )


def render_stub(meta: dict, origin: str) -> str:
    pid = meta["id"]
    # pid_attr is the HTML-attribute-safe form (defense-in-depth: no-op for valid
    # [a-z0-9-] slugs, but guards against a hypothetical id containing " or &).
    pid_attr = escape_xml(pid)
    title = escape_xml(meta["title"])
    desc = escape_xml(meta["description"])
    app_url = origin + "/?pack=" + pid_attr
    stub_url = origin + "/p/" + pid_attr
    img = origin + "/og/" + pid_attr + ".png"
    return (
        '<!doctype html>\n'
        '<html lang="en">\n'
        '<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<title>' + title + ' - TORRELD</title>\n'
        '<meta name="description" content="' + desc + '">\n'
        '<link rel="canonical" href="' + app_url + '">\n'
        '<link rel="icon" type="image/svg+xml" href="/favicon.svg">\n'
        '<link rel="icon" type="image/png" href="/favicon.png">\n'
        '<meta property="og:type" content="website">\n'
        '<meta property="og:site_name" content="TORRELD">\n'
        '<meta property="og:title" content="' + title + '">\n'
        '<meta property="og:description" content="' + desc + '">\n'
        '<meta property="og:url" content="' + stub_url + '">\n'
        '<meta property="og:image" content="' + img + '">\n'
        '<meta property="og:image:width" content="1200">\n'
        '<meta property="og:image:height" content="630">\n'
        '<meta property="og:image:alt" content="' + title + ' - TORRELD dry-fire training">\n'
        '<meta name="twitter:card" content="summary_large_image">\n'
        '<meta name="twitter:title" content="' + title + '">\n'
        '<meta name="twitter:description" content="' + desc + '">\n'
        '<meta name="twitter:image" content="' + img + '">\n'
        # pid is a validated [a-z0-9-] slug (see validate_pack_id), so JS-string
        # interpolation is safe here without HTML escaping.
        '<script>location.replace("/?pack=' + pid + '" + location.hash);</script>\n'
        '</head>\n'
        '<body>\n'
        '<noscript><meta http-equiv="refresh" content="0;url=/?pack=' + pid_attr + '">'
        '<p><a href="/?pack=' + pid_attr + '">Open TORRELD - ' + title + '</a></p></noscript>\n'
        '</body>\n'
        '</html>\n'
    )


_SLUG_RE = re.compile(r'^[a-z0-9][a-z0-9-]*$')


def validate_pack_id(js_id: str, stem: str) -> "str | None":
    """Return an error message if js_id is invalid, or None if it's fine.

    Valid: js_id matches stem AND stem is a [a-z0-9][a-z0-9-]* slug.
    """
    if not _SLUG_RE.match(stem):
        return f"pack id {stem!r} is not a valid slug (must match [a-z0-9][a-z0-9-]*)"
    if js_id != stem:
        return (
            f"pack id mismatch: JS registers {js_id!r} but filename stem is {stem!r} "
            f"(they must match)"
        )
    return None


def rasterize(svg_path, png_path, width: int, height: int, background=None) -> bool:
    """SVG -> PNG via rsvg-convert. Returns False (no-op) if the tool is absent."""
    exe = shutil.which("rsvg-convert")
    if not exe:
        return False
    cmd = [exe, "-w", str(width), "-h", str(height)]
    if background:
        cmd += ["-b", background]
    cmd += ["-o", str(png_path), str(svg_path)]
    subprocess.run(cmd, check=True)
    return True


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
        print("no packs in src/packs/ - at least one is required", file=sys.stderr)
        return 1

    # Validate each pack's JS-registered id against its filename stem.
    for p in pack_files:
        stem = pathlib.Path(p).stem
        text = read(pathlib.Path(p))
        js_id = _field(text, "id")
        err = validate_pack_id(js_id or "", stem)
        if err:
            print(f"::error:: {p}: {err}", file=sys.stderr)
            return 1

    packs = "\n\n".join(read(pathlib.Path(p)) for p in pack_files)

    head = render_head(favicon_data_uri(FAVICON_SVG), SITE_ORIGIN)
    out = (
        shell.replace("<!-- INJECT:HEAD -->", head)
        .replace("<!-- INJECT:STYLES -->", styles)
        .replace("<!-- INJECT:PACKS -->", packs)
        .replace("<!-- INJECT:FRAMEWORK -->", framework)
    )

    DIST.mkdir(exist_ok=True)
    (DIST / "index.html").write_text(out, encoding="utf-8")

    # ---- favicon + OG + per-pack share stubs ----
    og_template = read(SRC / "framework" / "og-template.svg")
    og_dir = DIST / "og"
    og_dir.mkdir(exist_ok=True)

    (DIST / "favicon.svg").write_text(FAVICON_SVG, encoding="utf-8")
    rasterized = rasterize(DIST / "favicon.svg", DIST / "favicon.png", 32, 32)
    rasterize(DIST / "favicon.svg", DIST / "apple-touch-icon.png", 180, 180,
              background="#0a0d0e")

    def emit_og(name: str, title: str, tagline: str):
        svg_path = og_dir / (name + ".svg")
        svg_path.write_text(render_og_svg(og_template, title, tagline),
                            encoding="utf-8")
        rasterize(svg_path, og_dir / (name + ".png"), 1200, 630)

    emit_og("default", SITE_TITLE, SITE_TAGLINE)

    for p in pack_files:
        stem = pathlib.Path(p).stem
        meta = extract_pack_meta(read(pathlib.Path(p)), stem)
        emit_og(stem, meta["title"], meta["tagline"])
        stub_dir = DIST / "p" / stem
        stub_dir.mkdir(parents=True, exist_ok=True)
        (stub_dir / "index.html").write_text(render_stub(meta, SITE_ORIGIN),
                                             encoding="utf-8")

    pack_names = [pathlib.Path(p).stem for p in pack_files]
    print(
        f"built {DIST/'index.html'}  ({len(out):,} bytes, "
        f"{len(pack_files)} pack(s): {', '.join(pack_names)})"
    )
    if not rasterized:
        print("note: rsvg-convert not found - wrote SVGs only, skipped PNGs "
              "(install librsvg2-bin for OG/favicon PNGs)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
