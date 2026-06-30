# Architecture

How TORRELD assembles, boots, and renders. Read [`../CLAUDE.md`](../CLAUDE.md) first for the high-level context.

---

## Boot sequence

`dist/index.html` is assembled from `src/` at build time. Inside the single `<script>` at runtime, the layers initialize in this order:

1. **Pack registry bootstrap** — `window.TORRELD = { packs: [], activeId: null }` and the `registerPack(p)` helper.
2. **Packs** (`src/packs/*.js`) — each file calls `registerPack({ id, name, documentTitle, data })`. `data` is the PROGRAM object (see "Data model" below).
3. **Framework** (`src/framework/timer.js`, `renderer.js`, `switcher.js`, in that load order) — attach `TORRELD.timer`, `TORRELD.render`, `TORRELD.setActivePack`, and `TORRELD.boot`.
4. **Boot** — `TORRELD.boot()` reads `?pack=<id>` (falling back to the first registered pack), renders it, draws the switcher chips (hidden when only one pack is registered), and wires the timer.

The timer **console markup is static HTML** in the shell (`#console`), not rendered from pack data — it's shared UI, not content.

Page section order: top bar (brand → pack switcher → section nav) → hero → diagnosis → program → drills → evidence → references → footer → fixed timer console.

---

## Build pipeline

`build.py` reads `src/framework/shell.html` and substitutes three tokens:

| Token | Replaced with |
|-------|---------------|
| `<!-- INJECT:STYLES -->`    | `src/framework/styles.css` |
| `<!-- INJECT:PACKS -->`     | concatenation of every `src/packs/*.js`, sorted by filename |
| `<!-- INJECT:FRAMEWORK -->` | `timer.js + renderer.js + switcher.js` (in that order) |

The output (`dist/index.html`) is byte-self-contained. Same sources → same artifact.

Pack load order matters for the default-pack fallback (`packs[0]`). Default sort is alphabetical by filename. Prefix with `00-`, `10-`, etc. if you need explicit ordering.

See [BUILD.md](BUILD.md) for how to run the build.

---

## Data model (pack `data` field)

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

Strings may contain HTML and entities — content is author-trusted (see the constraint in [`../CLAUDE.md`](../CLAUDE.md)). Section ids referenced by `nav` are hard-coded in the renderer (`diagnosis`, `program`, `drills`, `evidence`, `references`); adding a brand-new *section type* means adding a render function in `renderer.js`, not just data.

---

## Timer engine contract

Two modes:
- **par** — random delay (`dmin`–`dmax` s) → start beep → countdown to `par` → par beep. One rep.
- **circuit** — same, then a `rest` countdown, looped `reps` times.

Arming a drill calls `TORRELD.timer.arm(spec)` with the timer + label from the drill's data. The renderer wires this; no `data-*` attributes are leaked into the DOM beyond the arm button itself.

**Audio:** Web Audio `triangle` tones (start 880 Hz, par 1318 Hz). `AudioContext` is created/resumed on the first **Start** click — a browser gesture requirement, not a bug. The first beep of a session may lag slightly while audio wakes.

**State machine:** `idle → waiting → running → (rest →) … → done`. All timeouts/rAF are tracked and cleared in `clearTimers()`; reuse it, don't spawn untracked timers.

---

## Console UX (mobile sheet, desktop strip)

The fixed timer console renders two layouts off the same DOM, switched by a `min-width: 860px` media query:

- **Mobile (default):** a compact ~80 px bar at the bottom (drill label, mini readout, Start/Stop). Tapping the grip handle or the label expands a bottom-sheet panel with the mode toggle, the big readout, fields, and Reset. A scrim dims the page behind the sheet; scrim-tap, ESC, or grip-tap collapses it. Arming a drill auto-expands the sheet so the user can verify the new par. State is driven by `aria-expanded` on `#console`; the panel gets the `inert` attribute when collapsed so focus and screen readers skip it. Body gets `console-open` to lock scroll while the sheet is up.
- **Desktop (≥ 860 px):** grip, bar, and scrim are hidden; the panel is always visible and laid out as a single horizontal row (mode + label / big readout + status / fields + actions).

The bar and panel share state via four pairs of synced elements (`#readout`/`#readoutMini`, `#armedLabel`/`#armedLabelFull`, `#go`/`#goMini`). `timer.js` updates all of them in lockstep via `setReadoutText`, `setReadoutClass`, `setGo`, `setLabel` — never poke one without the other.

The currently armed drill is also marked with `.card.armed` in the renderer's click handler, so users can see which drill the timer is set up for without expanding the sheet.

---

See also: [BUILD.md](BUILD.md) · [DESIGN.md](DESIGN.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [`../CLAUDE.md`](../CLAUDE.md)
