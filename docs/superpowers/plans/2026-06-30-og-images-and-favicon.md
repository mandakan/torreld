# OG images and favicon - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a flame-with-cutout-T favicon and per-pack Open Graph link previews, generated at build time into the static `dist/` tree.

**Architecture:** `build.py` (Python stdlib only) gains pure helper functions that extract per-pack share metadata, fill an SVG OG-card template, render per-pack share-stub HTML, and emit the favicon. `main()` wires them to write `favicon.*`, `og/*`, and `p/<id>/index.html` alongside `index.html`. SVG->PNG rasterization shells out to `rsvg-convert` when present and skips gracefully otherwise; CI installs it so production always gets PNGs.

**Tech Stack:** Python 3 stdlib (`re`, `pathlib`, `urllib.parse`, `shutil`, `subprocess`, `unittest`), SVG, `rsvg-convert` (librsvg2-bin, dev/CI only), Cloudflare assets-only Worker.

## Global Constraints

- **`index.html` stays self-contained and works from `file://` offline.** The favicon is inlined as a `data:` URI; no runtime network, no CDN, no fetch. OG PNGs are live-site-only crawler assets referenced by absolute URL and need not be in the offline artifact.
- **Single build toolchain: Python stdlib only.** No bundler, no Node added to the build. The only new external tool is `rsvg-convert`, used solely for SVG->PNG, and `build.py` must degrade gracefully when it is absent (warn once, skip PNGs, still succeed).
- **Vanilla JS only** (~ES5) in any shipped JS, including stub bodies.
- **Author-trusted content rendered via `innerHTML`** in the app, but all extracted pack copy MUST be XML/HTML-escaped before injection into generated SVG/HTML (new sinks).
- **Writing style: plain ASCII.** Single hyphen `-` for dashes, `...` for ellipsis, straight quotes. Applies to generated copy and docs. No em-dash, no `&mdash;`.
- **`SITE_ORIGIN = "https://torreld.urdr.dev"`** is the single source for absolute URLs.
- **Pack `id` == filename stem** (existing convention); never parse it from JS.
- **Favicon mark is locked** ("G2"): exact SVG path data given in Task 4, reused unmodified as the OG accent.

---

## File structure

- `build.py` (modify) - new constants + pure helpers + `main()` wiring.
- `src/framework/og-template.svg` (create) - 1200x630 OG card with `{{TITLE}}` / `{{TAGLINE}}` tokens.
- `src/framework/shell.html` (modify) - add `<!-- INJECT:HEAD -->` token in `<head>`.
- `src/packs/{grip-first,reloads,stage-planning}.js` (modify) - add optional `share` blocks.
- `tests/test_build.py` (create) - unittest suite for the pure helpers + an integration test.
- `.github/workflows/deploy.yml` (modify) - install rasterizer, run tests, extend verify.
- `docs/{CLAUDE.md is at root},BUILD.md,CONTRIBUTING.md,ARCHITECTURE.md,DESIGN.md` + root `CLAUDE.md` (modify) - documentation.

Generated outputs (gitignored, under `dist/`): `favicon.svg`, `favicon.png`, `apple-touch-icon.png`, `og/{default,<id>}.{svg,png}`, `p/<id>/index.html`.

Tests run from the repo root with: `python3 -m unittest discover -s tests -t .`

---

### Task 1: Pack metadata extraction + escaping helpers

**Files:**
- Modify: `build.py` (add constants + functions near the top, after imports)
- Test: `tests/test_build.py` (create)

**Interfaces:**
- Produces:
  - `SITE_ORIGIN: str`, `SITE_TITLE: str`, `SITE_TAGLINE: str`, `SITE_DESCRIPTION: str`
  - `escape_xml(s: str) -> str`
  - `truncate(s: str, n: int) -> str` (ASCII "..." ellipsis)
  - `extract_pack_meta(text: str, stem: str) -> dict` with keys `id, name, title, tagline, description, document_title`

- [ ] **Step 1: Write the failing test**

Create `tests/test_build.py`:

```python
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import build  # noqa: E402


class TestEscaping(unittest.TestCase):
    def test_escape_xml_escapes_all_five(self):
        self.assertEqual(
            build.escape_xml('a & b < c > d " e \' f'),
            'a &amp; b &lt; c &gt; d &quot; e &#39; f',
        )

    def test_truncate_short_string_unchanged(self):
        self.assertEqual(build.truncate("hello", 10), "hello")

    def test_truncate_long_string_gets_ascii_ellipsis(self):
        out = build.truncate("abcdefghij", 8)
        self.assertEqual(out, "abcde...")
        self.assertTrue(out.endswith("..."))


class TestExtractPackMeta(unittest.TestCase):
    def test_uses_share_block_when_present(self):
        text = '''
          name: "Reloads",
          documentTitle: "TORRELD - Reloads dry-fire",
          share: {
            title: "Reloads dry-fire",
            tagline: "The mag goes where you look",
            description: "Builds the look-in until the seat happens without thought.",
          },
        '''
        m = build.extract_pack_meta(text, "reloads")
        self.assertEqual(m["id"], "reloads")
        self.assertEqual(m["title"], "Reloads dry-fire")
        self.assertEqual(m["tagline"], "The mag goes where you look")
        self.assertEqual(
            m["description"],
            "Builds the look-in until the seat happens without thought.",
        )

    def test_falls_back_to_name_and_site_defaults(self):
        text = 'name: "Stage planning",\n documentTitle: "TORRELD - Stage planning dry-fire",'
        m = build.extract_pack_meta(text, "stage-planning")
        self.assertEqual(m["title"], "Stage planning")
        self.assertEqual(m["tagline"], "")
        self.assertEqual(m["description"], build.SITE_DESCRIPTION)
        self.assertEqual(m["document_title"], "TORRELD - Stage planning dry-fire")

    def test_id_is_stem_even_if_no_fields(self):
        m = build.extract_pack_meta("", "whatever")
        self.assertEqual(m["id"], "whatever")
        self.assertEqual(m["name"], "whatever")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest discover -s tests -t .`
Expected: FAIL with `AttributeError: module 'build' has no attribute 'escape_xml'`

- [ ] **Step 3: Write minimal implementation**

In `build.py`, add `import re` and `import urllib.parse` to the imports, and after the existing path constants (`PACK_GLOB = ...`) add:

```python
SITE_ORIGIN = "https://torreld.urdr.dev"
SITE_TITLE = "TORRELD"
SITE_TAGLINE = "Dry-fire training packs"
SITE_DESCRIPTION = (
    "Par-time-driven dry-fire training packs. Mobile-first, offline, no accounts."
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
    """Inner text of the top-level `share: { ... }` object, or ''."""
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest discover -s tests -t .`
Expected: PASS (6 tests OK)

- [ ] **Step 5: Commit**

```bash
git add build.py tests/test_build.py
git commit -m "Add pack metadata extraction + escaping helpers to build"
```

---

### Task 2: OG card SVG template + renderer

**Files:**
- Create: `src/framework/og-template.svg`
- Modify: `build.py` (add `render_og_svg`)
- Test: `tests/test_build.py` (add `TestRenderOgSvg`)

**Interfaces:**
- Consumes: `escape_xml`, `truncate` (Task 1)
- Produces: `render_og_svg(template: str, title: str, tagline: str) -> str`

- [ ] **Step 1: Write the failing test**

Append to `tests/test_build.py` (before the `if __name__` block):

```python
class TestRenderOgSvg(unittest.TestCase):
    TPL = '<svg>{{TITLE}}|{{TAGLINE}}</svg>'

    def test_fills_tokens(self):
        out = build.render_og_svg(self.TPL, "Reloads", "look-in")
        self.assertEqual(out, "<svg>Reloads|look-in</svg>")

    def test_escapes_and_has_no_raw_angle_brackets_in_values(self):
        out = build.render_og_svg(self.TPL, "A & <b>", "")
        self.assertIn("A &amp; &lt;b&gt;", out)

    def test_truncates_long_title(self):
        long = "x" * 80
        out = build.render_og_svg(self.TPL, long, "")
        self.assertNotIn("x" * 80, out)
        self.assertIn("...", out)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest discover -s tests -t .`
Expected: FAIL with `AttributeError: module 'build' has no attribute 'render_og_svg'`

- [ ] **Step 3: Write minimal implementation**

Create `src/framework/og-template.svg` (note the literal `{{TITLE}}` / `{{TAGLINE}}` tokens; DejaVu font stack for deterministic CI rasterization):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="f" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ff5a12"/>
      <stop offset=".5" stop-color="#ffb02e"/>
      <stop offset="1" stop-color="#ffe0a0"/>
    </linearGradient>
    <mask id="t">
      <path d="M50 6 C57 22 64 31 68 47 C72 62 67 82 53 91 C49 94 45 94 41 91 C27 82 22 62 27 47 C31 36 40 40 43 30 C45 40 49 38 49 30 C49 18 47 16 50 6 Z" fill="#fff"/>
      <path d="M33 52 H67 V62 H56 V86 H44 V62 H33 Z" fill="#000"/>
    </mask>
  </defs>
  <rect width="1200" height="630" fill="#0a0d0e"/>
  <rect x="0" y="0" width="1200" height="8" fill="#ffb02e"/>
  <g transform="translate(960 130) scale(3.4)">
    <rect width="100" height="100" fill="url(#f)" mask="url(#t)"/>
  </g>
  <text x="80" y="150" font-family="DejaVu Sans Mono, monospace" font-size="34" letter-spacing="8" font-weight="700"><tspan fill="#ffb02e">TORR</tspan><tspan fill="#dce3e5">ELD</tspan></text>
  <text x="80" y="370" font-family="DejaVu Sans, Helvetica, sans-serif" font-size="96" font-weight="800" fill="#dce3e5">{{TITLE}}</text>
  <text x="80" y="440" font-family="DejaVu Sans, Helvetica, sans-serif" font-size="40" fill="#8a9599">{{TAGLINE}}</text>
  <text x="80" y="560" font-family="DejaVu Sans Mono, monospace" font-size="24" letter-spacing="3" fill="#5d676b">dry-fire training / torreld.urdr.dev</text>
</svg>
```

In `build.py`, add:

```python
def render_og_svg(template: str, title: str, tagline: str) -> str:
    return (
        template.replace("{{TITLE}}", escape_xml(truncate(title, 30)))
        .replace("{{TAGLINE}}", escape_xml(truncate(tagline, 48)))
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest discover -s tests -t .`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add build.py tests/test_build.py src/framework/og-template.svg
git commit -m "Add OG card SVG template and renderer"
```

---

### Task 3: Per-pack share-stub HTML renderer

**Files:**
- Modify: `build.py` (add `render_stub`)
- Test: `tests/test_build.py` (add `TestRenderStub`)

**Interfaces:**
- Consumes: `escape_xml` (Task 1)
- Produces: `render_stub(meta: dict, origin: str) -> str`

- [ ] **Step 1: Write the failing test**

Append to `tests/test_build.py`:

```python
class TestRenderStub(unittest.TestCase):
    META = {
        "id": "reloads",
        "title": "Reloads dry-fire",
        "description": "Look-in and carrier index.",
    }

    def setUp(self):
        self.html = build.render_stub(self.META, "https://torreld.urdr.dev")

    def test_canonical_points_to_app_url(self):
        self.assertIn(
            '<link rel="canonical" href="https://torreld.urdr.dev/?pack=reloads">',
            self.html,
        )

    def test_og_image_is_absolute_png(self):
        self.assertIn(
            '<meta property="og:image" content="https://torreld.urdr.dev/og/reloads.png">',
            self.html,
        )

    def test_og_url_is_stub_url(self):
        self.assertIn(
            '<meta property="og:url" content="https://torreld.urdr.dev/p/reloads">',
            self.html,
        )

    def test_twitter_large_card(self):
        self.assertIn('name="twitter:card" content="summary_large_image"', self.html)

    def test_body_redirects_preserving_hash(self):
        self.assertIn('location.replace("/?pack=reloads" + location.hash)', self.html)

    def test_noscript_fallback_present(self):
        self.assertIn('http-equiv="refresh"', self.html)
        self.assertIn('href="/?pack=reloads"', self.html)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest discover -s tests -t .`
Expected: FAIL with `AttributeError: module 'build' has no attribute 'render_stub'`

- [ ] **Step 3: Write minimal implementation**

In `build.py`, add:

```python
def render_stub(meta: dict, origin: str) -> str:
    pid = meta["id"]
    title = escape_xml(meta["title"])
    desc = escape_xml(meta["description"])
    app_url = origin + "/?pack=" + pid
    stub_url = origin + "/p/" + pid
    img = origin + "/og/" + pid + ".png"
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
        '<script>location.replace("/?pack=' + pid + '" + location.hash);</script>\n'
        '</head>\n'
        '<body>\n'
        '<noscript><meta http-equiv="refresh" content="0;url=/?pack=' + pid + '">'
        '<p><a href="/?pack=' + pid + '">Open TORRELD - ' + title + '</a></p></noscript>\n'
        '</body>\n'
        '</html>\n'
    )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest discover -s tests -t .`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add build.py tests/test_build.py
git commit -m "Add per-pack share-stub HTML renderer"
```

---

### Task 4: Favicon SVG, data URI, and head-injection block

**Files:**
- Modify: `build.py` (add `FAVICON_SVG`, `favicon_data_uri`, `render_head`)
- Modify: `src/framework/shell.html` (add `<!-- INJECT:HEAD -->`)
- Test: `tests/test_build.py` (add `TestFaviconAndHead`)

**Interfaces:**
- Consumes: `escape_xml`, `SITE_*` (Task 1)
- Produces: `FAVICON_SVG: str`, `favicon_data_uri(svg: str) -> str`, `render_head(favicon_uri: str, origin: str) -> str`

- [ ] **Step 1: Write the failing test**

Append to `tests/test_build.py`:

```python
class TestFaviconAndHead(unittest.TestCase):
    def test_favicon_svg_is_single_line_and_has_mask(self):
        self.assertNotIn("\n", build.FAVICON_SVG)
        self.assertIn("<mask", build.FAVICON_SVG)
        self.assertIn("linearGradient", build.FAVICON_SVG)

    def test_data_uri_prefix_and_encoding(self):
        uri = build.favicon_data_uri("<svg><rect/></svg>")
        self.assertTrue(uri.startswith("data:image/svg+xml,"))
        self.assertNotIn("<", uri)  # angle brackets must be percent-encoded
        self.assertIn("%3C", uri)

    def test_render_head_has_icon_and_default_og(self):
        head = build.render_head("data:image/svg+xml,FAKE", "https://torreld.urdr.dev")
        self.assertIn('rel="icon" type="image/svg+xml" href="data:image/svg+xml,FAKE"', head)
        self.assertIn('<meta property="og:image" content="https://torreld.urdr.dev/og/default.png">', head)
        self.assertIn('name="twitter:card" content="summary_large_image"', head)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest discover -s tests -t .`
Expected: FAIL with `AttributeError: module 'build' has no attribute 'FAVICON_SVG'`

- [ ] **Step 3: Write minimal implementation**

In `build.py`, add (the SVG is one line on purpose so the data URI stays compact):

```python
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


def favicon_data_uri(svg: str) -> str:
    return "data:image/svg+xml," + urllib.parse.quote(svg, safe="")


def render_head(favicon_uri: str, origin: str) -> str:
    img = origin + "/og/default.png"
    desc = escape_xml(SITE_DESCRIPTION)
    return (
        '<link rel="icon" type="image/svg+xml" href="' + favicon_uri + '">\n'
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
```

In `src/framework/shell.html`, add the token on its own line immediately after `<title>TORRELD</title>` (line 8):

```html
<title>TORRELD</title>
<!-- INJECT:HEAD -->
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest discover -s tests -t .`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add build.py tests/test_build.py src/framework/shell.html
git commit -m "Add favicon SVG, data URI, and head-injection block"
```

---

### Task 5: Graceful SVG->PNG rasterization helper

**Files:**
- Modify: `build.py` (add `import shutil`, `import subprocess`, `rasterize`)
- Test: `tests/test_build.py` (add `TestRasterize`)

**Interfaces:**
- Produces: `rasterize(svg_path, png_path, width: int, height: int, background=None) -> bool`
  - Returns `True` if a PNG was written, `False` if `rsvg-convert` is unavailable.

- [ ] **Step 1: Write the failing test**

Append to `tests/test_build.py` (top of file already imports `unittest`; add `from unittest import mock`):

```python
class TestRasterize(unittest.TestCase):
    def test_returns_false_and_skips_when_tool_missing(self):
        from unittest import mock
        with mock.patch("build.shutil.which", return_value=None):
            with mock.patch("build.subprocess.run") as run:
                ok = build.rasterize("a.svg", "a.png", 32, 32)
        self.assertFalse(ok)
        run.assert_not_called()

    def test_invokes_rsvg_convert_when_present(self):
        from unittest import mock
        with mock.patch("build.shutil.which", return_value="/usr/bin/rsvg-convert"):
            with mock.patch("build.subprocess.run") as run:
                ok = build.rasterize("a.svg", "a.png", 64, 48, background="#0a0d0e")
        self.assertTrue(ok)
        args = run.call_args[0][0]
        self.assertIn("/usr/bin/rsvg-convert", args)
        self.assertIn("-w", args)
        self.assertIn("64", args)
        self.assertIn("-b", args)
        self.assertIn("#0a0d0e", args)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest discover -s tests -t .`
Expected: FAIL with `AttributeError: module 'build' has no attribute 'rasterize'`

- [ ] **Step 3: Write minimal implementation**

In `build.py`, add `import shutil` and `import subprocess` to the imports, then:

```python
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest discover -s tests -t .`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add build.py tests/test_build.py
git commit -m "Add graceful SVG->PNG rasterization helper"
```

---

### Task 6: Wire main() to emit favicon, OG, and stubs

**Files:**
- Modify: `build.py` (`main()` + read `og-template.svg`, substitute `INJECT:HEAD`, write assets)
- Test: `tests/test_build.py` (add `TestBuildIntegration`)

**Interfaces:**
- Consumes: all helpers from Tasks 1-5.
- Produces: a `dist/` tree with `favicon.svg`, `favicon.png`?, `apple-touch-icon.png`?, `og/{default,<id>}.svg(+.png?)`, `p/<id>/index.html`, and an `index.html` whose `<head>` carries the favicon + default OG tags. (PNGs present only when `rsvg-convert` is installed.)

- [ ] **Step 1: Write the failing integration test**

Append to `tests/test_build.py`:

```python
class TestBuildIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import subprocess as sp
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cls.dist = os.path.join(root, "dist")
        sp.run([sys.executable, "build.py"], cwd=root, check=True)

    def _read(self, *parts):
        with open(os.path.join(self.dist, *parts), encoding="utf-8") as fh:
            return fh.read()

    def test_index_has_inline_favicon_and_no_inject_tokens(self):
        html = self._read("index.html")
        self.assertIn('rel="icon" type="image/svg+xml" href="data:image/svg+xml,', html)
        self.assertNotIn("INJECT:", html)

    def test_favicon_svg_written(self):
        self.assertTrue(os.path.exists(os.path.join(self.dist, "favicon.svg")))

    def test_per_pack_stub_and_og_svg_exist(self):
        for pid in ("grip-first", "reloads", "stage-planning"):
            self.assertTrue(os.path.exists(os.path.join(self.dist, "p", pid, "index.html")), pid)
            self.assertTrue(os.path.exists(os.path.join(self.dist, "og", pid + ".svg")), pid)

    def test_stub_has_absolute_og_image(self):
        html = self._read("p", "reloads", "index.html")
        self.assertIn(
            '<meta property="og:image" content="https://torreld.urdr.dev/og/reloads.png">',
            html,
        )

    def test_default_og_svg_exists(self):
        self.assertTrue(os.path.exists(os.path.join(self.dist, "og", "default.svg")))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest discover -s tests -t .`
Expected: FAIL (stubs/og not written yet; `index.html` still contains the literal `<!-- INJECT:HEAD -->`)

- [ ] **Step 3: Rewrite `main()`**

Replace the body of `main()` in `build.py` with the following (keeps the existing read of shell/styles/framework/packs, adds head injection and asset emission):

```python
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
```

- [ ] **Step 4: Run tests + a manual build to verify**

Run: `python3 -m unittest discover -s tests -t .`
Expected: PASS

Run: `make build && ls dist dist/og dist/p`
Expected: `index.html favicon.svg favicon.png? og/ p/`; `og/` lists `default.svg grip-first.svg reloads.svg stage-planning.svg` (+ `.png` if rasterizer installed); `p/` lists the three pack dirs.

Run: `grep -c INJECT: dist/index.html`
Expected: `0`

- [ ] **Step 5: Commit**

```bash
git add build.py tests/test_build.py
git commit -m "Emit favicon, OG images, and per-pack share stubs at build time"
```

---

### Task 7: CI - install rasterizer, run tests, extend verify

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: the `make build` output tree (Task 6).

- [ ] **Step 1: Add the rasterizer install step**

In `.github/workflows/deploy.yml`, after the `Set up Python` step and before `Build dist/index.html`, insert:

```yaml
      - name: Install SVG rasterizer
        run: sudo apt-get update && sudo apt-get install -y librsvg2-bin

      - name: Run build tests
        run: python3 -m unittest discover -s tests -t .
```

- [ ] **Step 2: Extend the verify step**

Replace the `Verify no unresolved inject tokens` step's `run:` block with:

```yaml
      - name: Verify build outputs
        run: |
          if grep -n 'INJECT:' dist/index.html; then
            echo "::error::dist/index.html contains unresolved <!-- INJECT:* --> tokens"
            exit 1
          fi
          test -f dist/favicon.png || { echo "::error::missing dist/favicon.png"; exit 1; }
          test -f dist/og/default.png || { echo "::error::missing dist/og/default.png"; exit 1; }
          for pid in grip-first reloads stage-planning; do
            test -f "dist/og/$pid.png" || { echo "::error::missing dist/og/$pid.png"; exit 1; }
            test -f "dist/p/$pid/index.html" || { echo "::error::missing stub for $pid"; exit 1; }
            grep -q "https://torreld.urdr.dev/og/$pid.png" "dist/p/$pid/index.html" \
              || { echo "::error::stub $pid missing absolute og:image"; exit 1; }
          done
```

- [ ] **Step 3: Validate the workflow YAML locally**

Run: `python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/deploy.yml')); print('yaml ok')"`
Expected: `yaml ok`
(If `yaml` is unavailable, run instead: `python3 -c "print(open('.github/workflows/deploy.yml').read())" >/dev/null && echo readable`.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "CI: install rasterizer, run build tests, verify OG/stub outputs"
```

---

### Task 8: Add `share` blocks to the three packs

**Files:**
- Modify: `src/packs/grip-first.js`, `src/packs/reloads.js`, `src/packs/stage-planning.js`
- Test: `tests/test_build.py` (add `TestPackShareCopy`)

**Interfaces:**
- Consumes: `extract_pack_meta` (Task 1).

- [ ] **Step 1: Write the failing test**

Append to `tests/test_build.py`:

```python
class TestPackShareCopy(unittest.TestCase):
    def _meta(self, stem):
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        with open(os.path.join(root, "src", "packs", stem + ".js"), encoding="utf-8") as fh:
            return build.extract_pack_meta(fh.read(), stem)

    def test_each_pack_has_nonempty_share_tagline_and_specific_description(self):
        for stem in ("grip-first", "reloads", "stage-planning"):
            m = self._meta(stem)
            self.assertTrue(m["tagline"], stem)
            self.assertNotEqual(m["description"], build.SITE_DESCRIPTION, stem)
            self.assertLessEqual(len(m["tagline"]), 48, stem)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest discover -s tests -t . -k TestPackShareCopy`
Expected: FAIL (taglines empty / descriptions fall back to site default)

- [ ] **Step 3: Add a `share` block to each pack**

In `src/packs/grip-first.js`, immediately after the `documentTitle: "...",` line (line 16), add:

```js
  share: {
    title: "Grip-first dry-fire",
    tagline: "The one lever when range time is rare",
    description: "A par-time-driven dry-fire program built around a grip that survives movement - the root that index, movement, and follow-up all hang on.",
  },
```

In `src/packs/reloads.js`, after its `documentTitle: "...",` line, add:

```js
  share: {
    title: "Reloads dry-fire",
    tagline: "The mag goes where you look",
    description: "A par-time-driven dry-fire program that builds the look-in and carrier index until the seat happens without thought.",
  },
```

In `src/packs/stage-planning.js`, after its `documentTitle: "...",` line, add:

```js
  share: {
    title: "Stage-planning dry-fire",
    tagline: "Named, anchored chunks that survive the buzzer",
    description: "Drills the encoding system itself - positions, target order, reload spots, entry and exit cues you can hold in working memory and patch under change.",
  },
```

- [ ] **Step 4: Run tests + rebuild to verify**

Run: `python3 -m unittest discover -s tests -t .`
Expected: PASS

Run: `make build && grep -o 'og:title" content="[^"]*"' dist/p/reloads/index.html`
Expected: `og:title" content="Reloads dry-fire"`

- [ ] **Step 5: Commit**

```bash
git add src/packs/grip-first.js src/packs/reloads.js src/packs/stage-planning.js tests/test_build.py
git commit -m "Add share copy to grip-first, reloads, stage-planning packs"
```

---

### Task 9: Documentation

**Files:**
- Modify: `CLAUDE.md`, `docs/BUILD.md`, `docs/CONTRIBUTING.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`

**Interfaces:** none (docs only).

- [ ] **Step 1: Update root `CLAUDE.md`**

In the "Repository layout" tree, under `src/framework/`, add a line for `og-template.svg`:

```
    og-template.svg  1200x630 OG card template (tokens filled per pack at build)
```

and under the top-level files add `tests/test_build.py` and note that `dist/` now also holds `favicon.*`, `og/*`, and `p/<id>/index.html`. In the "Hard constraints" section, append to the `file://` bullet:

> The offline/`file://` guarantee covers `index.html` and its inlined `data:`-URI favicon. The OG card PNGs under `dist/og/` are live-site-only assets fetched by social crawlers; they are referenced by absolute URL and are not needed for offline use.

- [ ] **Step 2: Update `docs/BUILD.md`**

Document: `build.py` now also emits `favicon.*`, `og/{default,<id>}.{svg,png}`, and `p/<id>/index.html`; SVG->PNG uses `rsvg-convert` and is skipped with a warning when absent (PNGs are not required for `file://` use); install locally with `sudo apt-get install -y librsvg2-bin` (or `brew install librsvg`); run the build tests with `python3 -m unittest discover -s tests -t .`; CI installs the rasterizer and verifies every pack's PNG and stub exist.

- [ ] **Step 3: Update `docs/CONTRIBUTING.md`**

In the "adding a pack" section, note the optional `share` block (plain single-line ASCII `title` / `tagline` / `description`); when present the build generates a tailored OG image and share stub at `/p/<id>`, otherwise it falls back to the pack `name`. Keep field values one line, delimited by `"`, using a straight single quote if copy needs a quote.

- [ ] **Step 4: Update `docs/ARCHITECTURE.md`**

Add the `share` field to the pack data-model description, and a short "OG and share stubs" subsection describing the build stage: per-pack `extract_pack_meta` -> `og/<id>.svg` (filled `og-template.svg`) -> PNG, plus `p/<id>/index.html` stubs that carry static per-pack meta and `location.replace()` into `/?pack=<id>` for humans.

- [ ] **Step 5: Update `docs/DESIGN.md`**

Add a "Brand mark" subsection: the flame-with-cutout-T (rationale: torr+eld = dry+fire), the locked source SVG (gradient `#ff5a12`->`#ffb02e`->`#ffe0a0`, bold T as a transparent mask cutout seated at the flame's waist), and how it is reused as the OG card accent. Note the OG card tokens (void `#0a0d0e`, amber rule `#ffb02e`, DejaVu type for deterministic rasterization).

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md docs/BUILD.md docs/CONTRIBUTING.md docs/ARCHITECTURE.md docs/DESIGN.md
git commit -m "Document favicon, OG images, share stubs, and the share block"
```

---

## Self-review

**Spec coverage:**
- Favicon inline data URI + svg/png/apple-touch -> Tasks 4, 6. ✓
- Locked G2 mark with exact paths -> Tasks 2, 4 (identical path data). ✓
- Optional `share` block + fallbacks -> Tasks 1, 8. ✓
- OG SVG template -> PNG, default + per pack -> Tasks 2, 6. ✓
- Per-pack `/p/<id>` stubs with canonical/og/twitter + redirect + noscript -> Tasks 3, 6. ✓
- Root default OG tags -> Tasks 4, 6. ✓
- Python-only build, graceful rasterizer skip -> Task 5, 6. ✓
- CI installs librsvg, runs tests, extends verify -> Task 7. ✓
- Docs in same change -> Task 9. ✓
- `SITE_ORIGIN` single source, id == stem -> Task 1. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every test step shows real assertions. ✓

**Type consistency:** `extract_pack_meta` returns keys `id, name, title, tagline, description, document_title`; consumers use `meta["id"|"title"|"tagline"|"description"]` (Tasks 2, 3, 6) - consistent. `rasterize(...)->bool` used for the warning flag in Task 6. `render_head(favicon_uri, origin)` / `favicon_data_uri(svg)` / `render_og_svg(template, title, tagline)` / `render_stub(meta, origin)` signatures match call sites in `main()`. ✓
```
