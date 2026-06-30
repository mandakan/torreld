# OG images and favicon - design

Status: approved (brainstorming), pending implementation plan.
Date: 2026-06-30.

## Goal

Give TORRELD a proper identity in browser tabs and social/link unfurls:

1. A **favicon** that survives `file://` and offline use.
2. **Per-pack Open Graph previews** so a link to a specific pack (grip-first,
   reloads, stage-planning) unfurls with that pack's title, description, and a
   branded image - not a generic site card.

The favicon is a **flame with a cut-out T**. The name itself is the brief:
TORRELD = Swedish *torr* + *eld* = "dry fire". A flame mark is the etymology,
and the existing amber palette is already ember-colored.

## Constraints this design respects

- **`file://` + offline still works.** The favicon is inlined as a `data:` URI
  in `index.html`, so it needs no network. OG PNGs are referenced by absolute
  `https://` URL but are **only** consumed by crawlers on the live site - they
  are irrelevant to offline/`file://` use, so they do not have to live inside
  the single self-contained artifact. `index.html` itself stays self-contained.
- **Single toolchain.** Generation stays in `build.py` (Python stdlib only). The
  one new external tool is an **SVG rasterizer** (`rsvg-convert`) used only to
  turn generated SVGs into PNGs; `build.py` shells out to it *if present* and
  otherwise warns and skips the PNG step. CI installs it so prod always gets
  PNGs. No bundler, no Node added to the build.
- **Author-trusted content.** Pack `share` copy is author-written, same trust
  model as the rest of pack data. Build XML-escapes it before injecting into
  SVG/HTML regardless, since these are new sinks.
- **Assets-only Worker unchanged.** No `main` script. Cloudflare serves the
  extra files (`favicon.*`, `og/*`, `p/*/index.html`) as static assets, with
  directory-index resolution giving clean `/p/<id>` URLs.

## The favicon mark (locked: "G2")

A vertical-gradient ember (`#ff5a12` -> `#ffb02e` -> `#ffe0a0`, bottom to top)
with a **bold T knocked out as a true transparent cutout** via an SVG `mask`.
The T is seated low: its crossbar sits at the flame's waist and its stem roots
into the ember base, so the flame licks off the top of the letter - the T reads
as *on fire*, not floating. The cutout is genuinely transparent (not filled with
the dark background color) so the mark holds on a light browser tab too.

Canonical source SVG (viewBox `0 0 100 100`):

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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
  <rect width="100" height="100" fill="url(#f)" mask="url(#t)"/>
</svg>
```

This is the single source of the mark. It is reused, unmodified, as the accent
graphic in the OG image template. (It is **not** wired into the topbar brandmark
in this change - that stays the `TORR`/`ELD` wordmark. Reusing the flame there
is a possible follow-up, out of scope here.)

### Favicon outputs

- **Inlined** into `index.html` `<head>` as
  `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<url-encoded>">`
  so it works from `file://` and offline.
- **`dist/favicon.svg`** - the same SVG as a real file, for the live domain and
  the per-pack stubs to `<link>` conventionally.
- **`dist/favicon.png`** (32x32) and **`dist/apple-touch-icon.png`** (180x180) -
  rasterized fallbacks for clients/crawlers that want a bitmap. Rendered on a
  solid `#0a0d0e` (`--void`) tile so the transparent cutout reads on the bitmap.

## Pack data: optional `share` block

Each pack *may* declare a top-level `share` object with **plain single-line
ASCII strings** (no HTML - this is rendered into an SVG and into `<meta>`):

```js
share: {
  title:       "Reloads dry-fire",
  tagline:     "The mag goes where you look",
  description: "A par-time-driven dry-fire program that builds the look-in and carrier index until the seat happens without thought.",
},
```

| Field | Used for | Fallback when `share` (or field) absent |
|---|---|---|
| `title` | OG image headline, `og:title`, `<title>` of the stub | pack `name` |
| `tagline` | OG image sub-line under the title | empty (image shows title only) |
| `description` | `og:description`, `twitter:description`, `<meta name=description>` | a fixed site-default string |

Adding a pack stays "drop one JS file": `share` is optional, packs without it
still get a valid (if generic) image and tags. Authors add it for sharper
unfurls. Field delimiter is `"`; if copy needs a quote, use a straight single
quote, per the repo writing-style rules.

Build extracts these by regex on the single-line `key: "value"` form (the same
shape `name`/`documentTitle` already use). Pack `id` continues to come from the
filename stem - no JS evaluation.

## OG image template (SVG -> PNG, per pack)

`src/framework/og-template.svg` - a 1200x630 card with `{{title}}`,
`{{tagline}}`, and the flame mark, on `--void` with an amber accent rule and the
`TORR`/`ELD` wordmark, matching the site's tokens. Build fills the tokens per
pack.

- Text uses an explicit `font-family: "DejaVu Sans Mono", "DejaVu Sans",
  monospace` / `"DejaVu Sans", sans-serif` stack. DejaVu ships on the CI box, so
  server-side rasterization is deterministic. (Exact match to the live site's
  system-font stack is not required for a static card.)
- Long `title`/`tagline` are not auto-wrapped by the rasterizer; the template
  sizes type conservatively and build truncates over-long strings with an
  ellipsis so text never overflows the card.

Outputs per pack: `dist/og/<id>.svg` (always) and `dist/og/<id>.png`
(1200x630, when a rasterizer is available). Plus `dist/og/default.svg` /
`default.png` for the root, built from a site title + tagline.

## Per-pack share stubs

Build emits `dist/p/<id>/index.html`, giving the clean shareable URL
`https://torreld.urdr.dev/p/<id>` (e.g. `/p/reloads`). Each stub's `<head>`
carries pack-specific metadata; its `<body>` bounces a human into the real app
with the pack selected, while a crawler reads the static tags.

Stub `<head>` contains:

- `<title>` and `<meta name="description">` from the pack's `share`.
- Open Graph: `og:type=website`, `og:site_name=TORRELD`, `og:title`,
  `og:description`, `og:url` = the stub's own absolute URL,
  `og:image` = `https://torreld.urdr.dev/og/<id>.png`,
  `og:image:width=1200`, `og:image:height=630`, `og:image:alt`.
- Twitter: `twitter:card=summary_large_image`, `twitter:title`,
  `twitter:description`, `twitter:image`.
- `<link rel="canonical" href="https://torreld.urdr.dev/?pack=<id>">` so search
  engines consolidate onto the real app URL rather than the stub.
- `<link rel="icon" href="/favicon.svg">` + PNG fallback.

Stub `<body>`:

```html
<script>location.replace("/?pack=<id>" + location.hash);</script>
<noscript><meta http-equiv="refresh" content="0;url=/?pack=<id>">
  <a href="/?pack=<id>">Open TORRELD - <title text></a></noscript>
```

`location.hash` is preserved so a deep link like `/p/reloads#drills` still lands
on the right section. The `?pack=<id>` value is already honored by the boot path
in `switcher.js`.

### Root `index.html`

Gains the site-wide default OG/Twitter tags (title "TORRELD", site description,
`og:image` = `/og/default.png`, `og:url` = site root) and the inlined favicon
link. The root is the canonical entry; the stubs are share-surface satellites.

## Build pipeline changes

`build.py`:

- New constant `SITE_ORIGIN = "https://torreld.urdr.dev"` (single source for the
  absolute URLs in stubs and `og:image`).
- After writing `index.html`: read each pack file, extract `id` (stem),
  `name`, `documentTitle`, and the optional `share` block; XML/HTML-escape all
  extracted copy.
- Generate, into `dist/`: `favicon.svg`, the per-pack and default OG SVGs under
  `og/`, and the stubs under `p/<id>/index.html`. Inject the URL-encoded favicon
  `data:` URI into `index.html` and add the default OG `<meta>` tags (via new
  `<!-- INJECT:HEAD -->` token in `shell.html`, or direct string substitution).
- Rasterize step: for each generated SVG (favicon + every `og/*.svg`), if
  `rsvg-convert` is on `PATH`, write the corresponding PNG at the right
  dimensions; else print one warning and skip. PNG absence does not fail the
  build (offline/`file://` use is unaffected).

`shell.html`: add `<!-- INJECT:HEAD -->` in `<head>` for the favicon link +
default OG tags (keeps `build.py` substitution-based, consistent with the
existing `INJECT:*` tokens).

`Makefile`: `build` continues to produce the full `dist/` (index + assets +
stubs) since the asset generation lives in `build.py`. `deploy` is unchanged
(`build` then `wrangler deploy`); on a box without `rsvg-convert` it deploys
SVGs without PNGs, so real deploys go through CI.

`.github/workflows/deploy.yml`: add a step before build to
`sudo apt-get install -y librsvg2-bin` (provides `rsvg-convert`). Extend the
verify step to assert: no `INJECT:` tokens remain; `dist/og/<id>.png` exists for
every pack and for `default`; `dist/p/<id>/index.html` exists for every pack and
contains the expected absolute `og:image` URL.

## File/output map

```
dist/
  index.html                 site-wide OG tags + inlined favicon
  favicon.svg                flame mark (real file)
  favicon.png                32x32 fallback
  apple-touch-icon.png       180x180
  og/
    default.svg  default.png
    grip-first.svg  grip-first.png
    reloads.svg  reloads.png
    stage-planning.svg  stage-planning.png
  p/
    grip-first/index.html    -> /p/grip-first
    reloads/index.html       -> /p/reloads
    stage-planning/index.html-> /p/stage-planning
```

## Docs to update (same change, per repo rule)

- **CLAUDE.md** - repo layout (build now emits assets + stubs, not just
  `index.html`); a note on the constraints section clarifying that the
  `file://`/offline guarantee covers `index.html` and its inlined favicon, while
  `og/*` PNGs are live-site-only crawler assets.
- **BUILD.md** - the `rsvg-convert` dependency, the generated outputs, the
  graceful-skip behavior locally, the extended CI verify.
- **CONTRIBUTING.md** - the optional `share` block when adding a pack; OG image
  and stub are generated automatically.
- **ARCHITECTURE.md** - the `share` field in the data model; the OG/stub
  generation stage; the stub redirect mechanism.
- **DESIGN.md** - the flame mark (rationale, source SVG, gradient/cutout), the
  favicon outputs, and the OG card layout/tokens.

## Out of scope

- Replacing the topbar brandmark with the flame (possible follow-up).
- Per-pack OG via a Worker that rewrites `<head>` server-side (rejected: breaks
  the assets-only setup).
- Animated/hot-core flame variants.

## Open questions

None blocking. The OG card's exact internal layout (type scale, accent rule
placement) is a design detail to settle during implementation against the live
tokens; the data flow and constraints above are fixed.
```
