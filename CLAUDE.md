# CLAUDE.md

Project context for Claude Code. Read this before editing.

## What this is

**TORRELD** — a data-driven template for building dry-fire training "protocols": a single, self-contained HTML page with a built-in shot-timer (par + circuit modes), a scrollable infographic, and a graded reference list. You add a new training program by dropping a single pack file in `src/packs/`; the framework renders it.

The current program is a grip-first dry-fire protocol for dynamic pistol shooting (IPSC Production Optics), but the template is content-agnostic — any "drills + evidence + references" curriculum fits the data model.

Source layout:

```
src/
  framework/
    shell.html       HTML skeleton + <!-- INJECT:* --> tokens
    styles.css       Mobile-first styles, design tokens at :root
    timer.js         Shot-timer engine (par + circuit, Web Audio)
    renderer.js      Builds the page from a pack's data object
    switcher.js      Pack registry + ?pack=<id> URL persistence + boot
  packs/
    grip-first.js    One file per training program
    <future>.js
build.py             Inlines src/ into dist/index.html
Makefile             `make build` runs build.py
dist/index.html      Generated artifact (gitignored), single self-contained file
```

`dist/index.html` is the deployment artifact. Open it from `file://` and it works with no server.

Live deployment: **https://torreld.urdr.dev/** (see "Deployment" below).

## Hard constraints (do not break)

- **Single self-contained artifact, zero runtime dependencies.** Sources live in `src/`, but the build inlines everything into one `dist/index.html`. The deployed file must open correctly from `file://` with no server, no CDN, no fetch.
- **No external network at runtime.** No CDNs, no web fonts — system font stacks only. It has to work offline.
- **No `localStorage` / `sessionStorage` / IndexedDB** in the committed source. The deployed file is previewed in a sandbox that forbids browser storage. Persistence is a roadmap item and, when added, must degrade gracefully when storage is unavailable. Pack selection persists via the `?pack=<id>` query param via `history.replaceState` — never via storage.
- **Vanilla JS only** (roughly ES5-level, no framework, no transpile). The build step (Python file concatenation) is the only tooling; no bundler, no minifier, no TypeScript. Keep it that way unless we make a deliberate, documented decision.
- **Author-trusted content, rendered via `innerHTML`.** The renderer injects pack data as HTML, so copy may contain tags like `<em>` and HTML entities. **Never** feed untrusted/user input into pack data or into the render path — that would be an XSS hole. If runtime user input is ever needed, switch that path to `textContent`/DOM nodes.

## Architecture

The deployed `dist/index.html` is assembled from `src/` at build time. Inside the single `<script>` at runtime, the layers are:

1. **Pack registry bootstrap** — `window.TORRELD = { packs: [], activeId: null }` and `registerPack(p)`.
2. **Packs** (`src/packs/*.js`) — each file calls `registerPack({ id, name, documentTitle, data })`. `data` is the PROGRAM object.
3. **Framework** (`src/framework/timer.js`, `renderer.js`, `switcher.js` in that load order) — attach `TORRELD.timer`, `TORRELD.render`, `TORRELD.setActivePack`, `TORRELD.boot`.
4. **Boot** — `TORRELD.boot()` reads `?pack=<id>` (falling back to the first registered pack), renders it, draws the switcher chips (hidden when only one pack), and wires the timer.

The timer **console markup is static HTML** in the shell (`#console`), not rendered from pack data — it's shared UI, not content.

Page section order: top bar (brand → pack switcher → section nav) → hero → diagnosis → program → drills → evidence → references → footer → fixed timer console.

## Build pipeline

`build.py` reads `src/framework/shell.html` and substitutes three tokens:

| Token | Replaced with |
|-------|---------------|
| `<!-- INJECT:STYLES -->`    | `src/framework/styles.css` |
| `<!-- INJECT:PACKS -->`     | concatenation of every `src/packs/*.js`, sorted by filename |
| `<!-- INJECT:FRAMEWORK -->` | `timer.js + renderer.js + switcher.js` (in that order) |

The output (`dist/index.html`) is byte-self-contained. The build is deterministic — same sources produce the same artifact.

Pack load order matters for the default-pack fallback (`packs[0]`). Default sort is alphabetical by filename. Prefix with `00-`, `10-`, etc. if you need explicit ordering.

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

Strings may contain HTML and entities. Section ids referenced by `nav` are hard-coded in the renderer (`diagnosis`, `program`, `drills`, `evidence`, `references`); adding a brand-new *section type* means adding a render function in `renderer.js`, not just data.

## Timer engine contract

- Two modes:
  - **par** — random delay (`dmin`–`dmax` s) → start beep → countdown to `par` → par beep. One rep.
  - **circuit** — same, then a `rest` countdown, looped `reps` times.
- Arming a drill calls `TORRELD.timer.arm(spec)` with the timer + label from the drill's data — the renderer wires this; no `data-*` attributes are leaked into the DOM beyond the arm button itself.
- Audio: Web Audio `triangle` tones (start 880 Hz, par 1318 Hz). `AudioContext` is created/resumed on the first **Start** click — a browser gesture requirement, not a bug. The first beep of a session may lag slightly while audio wakes.
- State machine: `idle → waiting → running → (rest →) … → done`. All timeouts/rAF are tracked and cleared in `clearTimers()`; reuse it, don't spawn untracked timers.

## Design system

- Dark "range/tactical". All colors are CSS custom properties in `:root` — derive new colors from tokens, don't hard-code hex in rules.
- **Color semantics (keep meaningful, this is the signature):**
  - amber = default / standby / armed (calm-alert)
  - green (`--go`) = live run countdown
  - red (`--hot`) = par fired (and the honest-limits caveat border)
  - amber-soft = rest
- The large monospace timer readout is the page's signature element. Spend visual boldness there; keep everything else quiet.
- Typography: heavy uppercase system sans for display, monospace for data/labels/timer.
- Mobile-first responsive: base styles target mobile, `min-width` media queries scale up. Breakpoints: 480 / 640 / 720 / 780 / 860 px. Touch targets are ≥ 44 px (`--tap`). Number inputs use 16 px font on mobile to prevent iOS focus-zoom. Safe-area-inset is respected for notch + home-indicator.

## Quality floor (maintain)

- Mobile-first; works at any width from 320 px up.
- `prefers-reduced-motion` respected (kills the pulse/flash and most transitions). Keep new motion behind it.
- Real `<button>`s, visible `:focus-visible` outlines, `aria-pressed` on the mode toggle and pack-switcher chips. Skip link at the top of the page for keyboard users. Don't regress keyboard access.
- Print styles: timer/topbar hidden, page renders as a flat document.

## Verify changes

```sh
make build           # writes dist/index.html
```

Then:

- Open `dist/index.html` in a browser; arm a drill, run par and circuit, confirm beeps and the readout color states. Try `dist/index.html?pack=grip-first` to confirm pack persistence.
- Syntax-check the inline JS without a browser:
  ```sh
  python3 - <<'PY'
  import re; s=open('dist/index.html',encoding='utf-8').read()
  open('/tmp/check.js','w').write(re.search(r'<script>(.*)</script>', s, re.S).group(1))
  PY
  node --check /tmp/check.js
  ```

## Adding a new pack

1. Copy `src/packs/grip-first.js` to `src/packs/<your-pack>.js`.
2. Edit `id`, `name`, `documentTitle`, and the `data` object.
3. `make build` and reload `dist/index.html`. Your pack appears as a chip in the top bar (the switcher shows automatically once two or more packs are registered).

## Deployment

Canonical host is a **Cloudflare Worker serving static assets** (not Cloudflare Pages — Pages is fix-only now; Cloudflare steers new projects to Workers). Config lives in `wrangler.jsonc`: an assets-only Worker (no server code) pointing at `dist/`, with `torreld.urdr.dev` declared as a custom domain. The `urdr.dev` zone is in the `admin@hedvigholding.se` Cloudflare account.

Deploy (after editing sources):

```sh
make deploy        # runs build.py, then `wrangler deploy`
```

- `dist/` is a generated artifact (gitignored); never hand-edit `dist/index.html`.
- A fresh `wrangler login` is needed if the OAuth token has expired (deploy fails with "Not logged in" even though `wrangler whoami` still prints a cached identity).
- This preserves the single-file / offline constraints: the deployed file is one static asset, with no runtime dependencies.

## Roadmap / good next tasks

- **v2 persistence & logging** (self-host only): record reps and PR par-times per drill. Use `localStorage` *guarded* by feature-detection so the committed file still runs in the no-storage preview. Add a clear/reset control.
- **i18n**: the original copy was Swedish; an EN/SV toggle is plausible since content is centralized per pack.
- **Print / export** of a program as a one-pager (print styles already in place).
- **More packs**: any "drills + evidence + references" curriculum fits the model.

### Gotcha for any "split data into JSON" idea
Moving pack data to `.json` and `fetch()`-ing it **breaks `file://` offline use** (CORS). Packs must remain JS files inlined at build time, or accept a server requirement — document the trade-off here if that ever changes.

## Conventions

- New content = new pack file in `src/packs/`. Don't touch the framework unless you need a new capability.
- New framework capability = edit `src/framework/*` files. Each file has a single responsibility (shell / styles / timer / renderer / switcher).
- Keep comments short and factual.
- Don't introduce a framework, bundler, runtime dependency, or storage API without updating this file and the "Hard constraints" section first.
