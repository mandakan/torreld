# CLAUDE.md

Project context for Claude Code. Read this before editing.

## What this is

**TORRELD** — a data-driven template for building dry-fire training "protocols": a single, self-contained HTML page with a built-in shot-timer (par + circuit modes), a scrollable infographic, and a graded reference list. One file produces one training program; you make a new program by editing data, not code.

The current program is a grip-first dry-fire protocol for dynamic pistol shooting (IPSC Production Optics), but the template is content-agnostic.

Entry file: `torreld-template.html` (rename to `index.html` for static hosting / GitHub Pages).

Live deployment: **https://torreld.urdr.dev/** (see "Deployment" below).

## Hard constraints (do not break)

- **Single file, zero dependencies, zero build step.** All HTML, CSS and JS live inline in `torreld-template.html`. It must open correctly from `file://` with no server.
- **No external network at runtime.** No CDNs, no web fonts — system font stacks only. It has to work offline.
- **No `localStorage` / `sessionStorage` / IndexedDB** in the committed file. It is previewed in a sandbox that forbids browser storage. Persistence is a roadmap item (see below) and, when added, must degrade gracefully when storage is unavailable.
- **Vanilla JS only** (roughly ES5-level, no framework, no transpile). Keep it framework-free unless we make a deliberate, documented decision to add a build.
- **Author-trusted content, rendered via `innerHTML`.** The renderer injects `PROGRAM` strings as HTML, so copy may contain tags like `<em>` and HTML entities. **Never** feed untrusted/user input into `PROGRAM` or into the render path — that would be an XSS hole. If runtime user input is ever needed, switch that path to `textContent`/DOM nodes.

## Architecture

Inside the single `<script>` there are three parts, in order:

1. **`PROGRAM` data object** — *the only thing you edit to make a new program.* Holds every piece of content (brand, nav, hero, diagnosis, program, drills, evidence, references, footer).
2. **Renderer (IIFE)** — builds the top bar, hero and all `<main>` sections from `PROGRAM` and writes them into `#topbar`, `#hero`, `#app`.
3. **Timer engine** — par/circuit shot timer using the Web Audio API. Wires every `.arm button` rendered from the drills.

The timer **console markup is static HTML** in `<body>` (`#console`), not rendered from data — it's shared UI (the "engine"), not content. Leave it in the DOM.

Page section order: top bar → hero → diagnosis → program → drills → evidence → references → footer → fixed timer console.

## Data model (`PROGRAM`)

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

Strings may contain HTML and entities. Section ids referenced by `nav` are hard-coded in the renderer (`diagnosis`, `program`, `drills`, `evidence`, `references`); adding a brand-new *section type* means adding a render function, not just data.

## Timer engine contract

- Two modes:
  - **par** — random delay (`dmin`–`dmax` s) → start beep → countdown to `par` → par beep. One rep.
  - **circuit** — same, then a `rest` countdown, looped `reps` times.
- Arming a drill = clicking `.arm button`; its `data-` attributes (`data-mode`, `data-par`, `data-dmin`, `data-dmax`, `data-reps`, `data-rest`, `data-label`) populate the console. These attributes are emitted by the renderer from `drills.items[].timer` + `label`; keep them in sync if you touch either side.
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

## Quality floor (maintain)

- Responsive to mobile (existing breakpoints ~820/760/640/440 px).
- `prefers-reduced-motion` respected (kills the pulse/flash). Keep new motion behind it.
- Real `<button>`s, visible `:focus-visible` outlines, `aria-pressed` on the mode toggle. Don't regress keyboard access.

## Verify changes

No build, no test runner. To check:

- Open `torreld-template.html` in a browser; arm a drill, run par and circuit, confirm beeps and the readout color states.
- Syntax-check the inline JS without a browser:
  ```sh
  python3 - <<'PY'
  import re; s=open('torreld-template.html',encoding='utf-8').read()
  open('/tmp/check.js','w').write(re.search(r'<script>(.*)</script>', s, re.S).group(1))
  PY
  node --check /tmp/check.js
  ```

## Deployment

Canonical host is a **Cloudflare Worker serving static assets** (not Cloudflare Pages — Pages is fix-only now; Cloudflare steers new projects to Workers). Config lives in `wrangler.jsonc`: an assets-only Worker (no server code) pointing at `dist/`, with `torreld.urdr.dev` declared as a custom domain. The `urdr.dev` zone is in the `admin@hedvigholding.se` Cloudflare account.

Deploy (after editing the template):

```sh
make deploy        # copies torreld-template.html -> dist/index.html, then `wrangler deploy`
```

- `dist/` is a generated artifact (gitignored); `make build` (re)creates it from `torreld-template.html`. Never hand-edit `dist/index.html`.
- A fresh `wrangler login` is needed if the OAuth token has expired (deploy fails with "Not logged in" even though `wrangler whoami` still prints a cached identity).
- This preserves the single-file / zero-build / offline constraints: the deployed file is byte-identical to the source, served as one static asset.

## Roadmap / good next tasks

- **v2 persistence & logging** (self-host only): record reps and PR par-times per drill. Use `localStorage` *guarded* by feature-detection so the committed file still runs in the no-storage preview. Add a clear/reset control.
- **Program switcher**: hold multiple `PROGRAM`s and pick one (keep all inline to preserve offline/single-file).
- **i18n**: the original copy was Swedish; an EN/SV toggle is plausible since content is already centralized in `PROGRAM`.
- **Print / export** of a program as a one-pager.

### Gotcha for any "split into files" idea
Moving `PROGRAM` to an external `.json` and `fetch()`-ing it **breaks `file://` offline use** (CORS). If we ever split, either keep data inline, inline-build at release time, or accept a server requirement — and document the trade-off here.

## Conventions

- Edit `PROGRAM` for content; touch the renderer/engine only for new capabilities.
- Keep comments short and factual. The dividing comment banners in `<script>` mark the "edit here" boundary — preserve them.
- Don't introduce a framework, bundler, or runtime dependency without updating this file and the "Hard constraints" section first.
