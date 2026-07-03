# Architecture

How TORRELD assembles, boots, and renders. Read [`../CLAUDE.md`](../CLAUDE.md) first for the high-level context.

---

## Boot sequence

`dist/index.html` is assembled from `src/` at build time. Inside the single `<script>` at runtime, the layers initialize in this order:

1. **Pack registry bootstrap** - `window.TORRELD = { packs: [], activeId: null }` and the `registerPack(p)` helper.
2. **Packs** (`src/packs/*.js`) - each file calls `registerPack({ id, name, documentTitle, share?, data })`. The `share` block holds `{ title, tagline, description }`. The build uses it to generate per-pack OG images and share stubs; at runtime the landing picker reads `share.tagline` and `share.description` for each pack card. `data` is the PROGRAM object (see "Data model" below).
3. **Framework** (`src/framework/progress.js`, `timer.js`, `renderer.js`, `switcher.js`, in that load order) - attach `TORRELD.progress`, `TORRELD.storage`, `TORRELD.timer`, `TORRELD.render`, `TORRELD.renderLanding`, `TORRELD.setActivePack`, `TORRELD.showLanding`, and `TORRELD.boot`.
4. **Boot** - `TORRELD.boot()` picks the initial view three ways: a valid `?pack=<id>` in the URL enters that pack; otherwise a remembered pack (`torreld.lastPack.v1`, read through `TORRELD.storage()`) resumes it; otherwise the **landing picker** renders. It then wires the timer.

The timer **console markup is static HTML** in the shell (`#console`), not rendered from pack data - it's shared UI, not content. On the landing view it is hidden via `body.is-landing`.

Page section order (pack view): top bar (brand-home → section nav) → hero → diagnosis → program → drills → evidence → references → footer → colophon (source + support links) → fixed timer console. On the landing view, `#hero` is a masthead and `#app` is the pack-card grid; the section nav and console are empty/hidden.

### Landing picker and pack navigation

There is no in-topbar pack switcher. Pack selection is a **landing view** (`renderer.renderLanding`): a masthead plus one card per registered pack, each an `<a href="?pack=<id>">` that `switcher.js` intercepts for in-page navigation while leaving modified-clicks (open-in-new-tab) to the browser. Inside a pack the **brandmark is the return control** - an `<a class="brand-home">` with a back-chevron and `aria-label="All programs"`; clicking it calls `showLanding()`, which strips `?pack` from the URL and renders the picker.

`switcher.js` mirrors the last-entered pack to feature-detected `localStorage` under `torreld.lastPack.v1`, via the shared `TORRELD.storage()` probe that `progress.js` exposes (one storage-detection path for both features). When storage is blocked (the no-storage preview sandbox) the mirror is skipped and every bare visit shows the landing - a clean degradation. Deep links, bookmarks, and the per-pack share stubs all use `?pack=<id>`, which always enters the pack directly.

---

## Build pipeline

`build.py` reads `src/framework/shell.html` and substitutes four tokens:

| Token | Replaced with |
|-------|---------------|
| `<!-- INJECT:HEAD -->`      | favicon `data:` URI + site-wide meta and OG tags |
| `<!-- INJECT:STYLES -->`    | `src/framework/styles.css` |
| `<!-- INJECT:PACKS -->`     | concatenation of every `src/packs/*.js`, sorted by filename |
| `<!-- INJECT:FRAMEWORK -->` | `progress.js + timer.js + renderer.js + switcher.js` (in that order) |

The output (`dist/index.html`) is byte-self-contained. Same sources → same artifact.

Pack load order matters for the default-pack fallback (`packs[0]`). Default sort is alphabetical by filename. Prefix with `00-`, `10-`, etc. if you need explicit ordering.

### OG images and share stubs

After writing `dist/index.html` the build also emits static assets for social sharing:

1. `extract_pack_meta(text, stem)` reads each pack's `name`, `documentTitle`, and optional `share` block by first-match regex.
2. For each pack (and a site-level default), `render_og_svg` fills `{{TITLE}}` and `{{TAGLINE}}` tokens in `src/framework/og-template.svg` and writes `dist/og/<id>.svg`. If `rsvg-convert` is present, it rasterizes that to `dist/og/<id>.png` (1200x630).
3. `render_stub` writes `dist/p/<id>/index.html` - a static page with canonical, og, and twitter meta pointing at the absolute PNG URL, plus an inline `location.replace()` that redirects browsers to `/?pack=<id>` (preserving the hash) and a `<noscript>` meta-refresh fallback.
4. The same flame SVG used for the favicon (a `linearGradient` masked by the T shape) is embedded in the OG template as the card's accent element.

PNGs are live-site-only assets. They are referenced by absolute URL and are not fetched at runtime or for `file://` use. See [BUILD.md](BUILD.md) for the rasterizer install command and the test runner.

See [BUILD.md](BUILD.md) for how to run the build.

---

## Data model (pack `data` field)

Top-level pack fields registered with `registerPack()`:

```
id:            string   // stable; used in ?pack=<id> URLs and as the stem for OG/stub paths
name:          string   // short label shown on the landing card and brand-home wordmark
documentTitle: string   // applied to <title> when this pack is active
share?:        {        // used at build time (OG/stubs) and at runtime (landing cards)
  title:       string,  // pack headline for the OG card (plain ASCII, one line)
  tagline:     string,  // subtitle line, <= 48 chars; also the landing-card tagline (plain ASCII, one line)
  description: string,  // meta description; also the landing-card description (plain ASCII, one line)
}
data:          object   // PROGRAM object (shape below)
```

The `data` object:

```
brand:       { pre, post }                       // "TORR" + "ELD" in the masthead
nav:         [ { id, label } ]                   // anchors; id must match a section id
hero:        { eyebrow, title:[line1,line2], lede, readout:{num,label} }
diagnosis:   { lane, title, intro,
               chain:[ { root?, tag, title, body } ],   // rendered with arrows between nodes
               notes:{ can:{title,body}, cant:{title,body} } }
program:     { lane, title,
               sessions:[ { n, primary?, focus, items:[...] } ],
               note }
drills:      { lane, title, intro,
               items:[ {
                 primary?, span?,                 // span: full-width card
                 chips:[ { cls, label } ],        // cls: "prim" | "par" | "cyc" | ""
                 title, why, steps:[...],
                 read:{                           // optional: corrective "reading the result" block
                   gate:{ sign, cause, fix, regressTo?, ref? },   // consistency check, rendered first
                   biases:[ { sign, cause, fix, ref? } ]          // 1-3 directional reads
                 },
                 timer:{ mode, par, dmin, dmax, reps, rest },  // mode: "par" | "circuit"
                 label                            // shown in the timer when armed
               } ] }
evidence:    { lane, title, intro,
               items:[ { map, h, body } ],        // map = which drill/feature this grounds
               caveat }                           // honest limits, rendered red-bordered
references:  { lane, title,
               tiers:[ { tier, items:[ { src, grade, body, links:[ {label,url} ] } ] } ] }
footer:      string
```

Strings may contain HTML and entities - content is author-trusted (see the constraint in [`../CLAUDE.md`](../CLAUDE.md)). Section ids referenced by `nav` are hard-coded in the renderer (`diagnosis`, `program`, `drills`, `evidence`, `references`); adding a brand-new *section type* means adding a render function in `renderer.js`, not just data.

**The optional `read` block** is a per-drill corrective diagnostic, rendered by `renderRead()` as a collapsed native `<details>` between the steps and the timer spec (zero JS, works from `file://`). It is a between-session tool: consult it when a result keeps coming out wrong, not after every rep. Shape is gate-then-biases - the `gate` is the consistency check (scatter -> regress to a more-foundational drill named in `regressTo`), rendered first and boxed; the `biases` are the directional reads that only mean something once the rep repeats. Every `fix` is external-focus, and the pack's base drill has a `gate` with no `regressTo` (its fix is "slow down"). Authoring rules live in the `new-pack` skill.

A row's optional `ref` holds the exact `src` string of a references entry; `readRow()` renders it as a tail link, "Source: `<src>`", jumping to that entry in the in-page References section. Only rows grounded in one nameable source get it - no new external links, no new CREDITS.md surface.

`gate.regressTo` renders as a working jump: `readRow()` emits `<a class="read-jump" href="#drill-<slug>">Go to <regressTo> &rarr;</a>` after the gate's rows. `renderDrills()` gives every drill card `id="drill-<slug(label)>"` and `renderReferences()` gives every references entry `id="ref-<slug(src)>"`, both derived from the one shared `slug()` function in `renderer.js` so the two id spaces always agree. Arrival at either target is a CSS-only `:target` flash (see `styles.css`) - no JS wiring, works from `file://`.

Where a fix genuinely lives in another program, the fix string carries a plain `<a href="?pack=<id>">` anchor - no new data field, used sparingly (one or two cross-pack pointers across all packs).

---

## Timer engine contract

Two modes:
- **par** - random delay (`dmin`-`dmax` s) → start beep → countdown to `par` → par beep. One rep.
- **circuit** - same, then a `rest` countdown, looped `reps` times.

Arming a drill calls `TORRELD.timer.arm(spec)` with the timer + label from the drill's data. The renderer wires this; no `data-*` attributes are leaked into the DOM beyond the arm button itself.

**Audio:** Web Audio, two switchable profiles selected by the Sound toggle in the console panel:

- **Match** (default) - a piercing, sustained IPSC-range-timer-style buzzer. Sawtooth + square fundamental layered with odd-harmonic sines through a `WaveShaper` (tanh soft-clip), flat envelope, snap release. Loud - start 2700 Hz · 400 ms; par 1500 Hz · 260 ms.
- **Quiet** - a single `triangle` tone with fast attack and exponential decay. Start 880 Hz · 130 ms; par 1318 Hz · 200 ms. For shared living spaces.

The choice persists via `?sound=quiet` (`?sound=match` is the implicit default and is stripped from the URL on selection). Toggling the switch previews the active profile so the user can pick by ear. `AudioContext` is created/resumed on the first **Start** click or **Sound** toggle - a browser gesture requirement, not a bug. The first beep of a session may lag slightly while audio wakes.

**State machine:** `idle → waiting → running → (rest →) ... → done`. All timeouts/rAF are tracked and cleared in `clearTimers()`; reuse it, don't spawn untracked timers.

---

## Console UX (mobile sheet, desktop strip)

The fixed timer console renders two layouts off the same DOM, switched by a `min-width: 860px` media query:

- **Mobile (default):** a compact ~80 px bar at the bottom (drill label, mini readout, Start/Stop). Tapping the grip handle or the label expands a bottom-sheet panel with the mode toggle, the big readout, fields, and Reset. A scrim dims the page behind the sheet; scrim-tap, ESC, or grip-tap collapses it. Arming a drill auto-expands the sheet so the user can verify the new par. State is driven by `aria-expanded` on `#console`; the panel gets the `inert` attribute when collapsed so focus and screen readers skip it. Body gets `console-open` to lock scroll while the sheet is up.
- **Desktop (≥ 860 px):** a collapsible non-modal dock, open by default. A chevron grip toggles between the full panel (single horizontal row: mode + label / big readout + status / fields + actions) and the slim compact bar; the scrim stays hidden so page content is never dimmed. `--console-h` drops to the slim-bar height via `body.console-collapsed` when collapsed. The dock opens at boot (which also clears the panel's `inert`), and resizing across the breakpoint resets to that side's default.

The bar and panel share state via four pairs of synced elements (`#readout`/`#readoutMini`, `#armedLabel`/`#armedLabelFull`, `#go`/`#goMini`). `timer.js` updates all of them in lockstep via `setReadoutText`, `setReadoutClass`, `setGo`, `setLabel` - never poke one without the other.

The currently armed drill is also marked with `.card.armed` in the renderer's click handler, so users can see which drill the timer is set up for without expanding the sheet.

---

See also: [BUILD.md](BUILD.md) · [DESIGN.md](DESIGN.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [`../CLAUDE.md`](../CLAUDE.md)
