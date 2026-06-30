# CLAUDE.md

Routing entry for TORRELD. Start here, then jump to the focused doc that fits the change. **If you change something the docs claim, update the docs in the same PR.**

---

## Vision

TORRELD is a **dry-fire training pack runner** built on three convictions:

- **Range time is rare; dry fire is cheap.** A well-structured, par-time-driven dry-fire session beats sporadic live fire for most skills (grip, index, presentation, movement).
- **Programs are content.** A "pack" is a self-contained training protocol — diagnosis, weekly plan, drills, evidence, sources. The framework renders any pack. Adding a new program = dropping one JS file in `src/packs/`. No framework changes needed.
- **Mobile-first because that's where reps happen.** Users have a phone propped up on a magazine in the living room — not a desktop. Every UI decision serves that scenario first.

No backend, no accounts, no tracking. A single self-contained HTML file that opens from `file://` and works offline.

The current program is grip-first dry-fire for IPSC Production Optics, but the data model is content-agnostic — any "drills + evidence + references" curriculum fits.

Live: **https://torreld.urdr.dev/**

---

## TL;DR routing

| You want to… | Touch | Doc |
|---|---|---|
| Add a new training program | Copy `src/packs/grip-first.js` → `src/packs/<your-pack>.js`, edit `id` / `name` / `data` | [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) |
| Tweak text/data in an existing pack | `src/packs/<pack>.js` | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the data shape |
| Change visuals / layout | `src/framework/styles.css` | [docs/DESIGN.md](docs/DESIGN.md) |
| Add a framework capability | `src/framework/{shell.html, renderer.js, timer.js, switcher.js}` | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Build, verify, deploy | `make build`, etc. | [docs/BUILD.md](docs/BUILD.md) |
| Open a PR, ship to prod | Merge to `main` → auto-deploys | [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) |

---

## Hard constraints (do not break)

These guardrails are non-negotiable. If a change requires breaking one, update this section in the same PR with the rationale.

- **Single self-contained artifact, zero runtime dependencies.** Sources live in `src/`, but the build inlines everything into one `dist/index.html`. The deployed file must open correctly from `file://` with no server, no CDN, no fetch.
- **No external network at runtime.** No CDNs, no web fonts — system font stacks only. It has to work offline.
- **No `localStorage` / `sessionStorage` / IndexedDB** in the committed source. The deployed file is previewed in a sandbox that forbids browser storage. Persistence is a roadmap item and, when added, must degrade gracefully when storage is unavailable. Preferences that need to survive a reload (pack selection, audio profile) persist via query params + `history.replaceState` — `?pack=<id>`, `?sound=quiet` — never via storage.
- **Vanilla JS only** (roughly ES5-level, no framework, no transpile). The build step (Python file concatenation) is the only tooling; no bundler, no minifier, no TypeScript.
- **Author-trusted content, rendered via `innerHTML`.** The renderer injects pack data as HTML, so copy may contain tags like `<em>` and HTML entities. **Never** feed untrusted/user input into pack data or into the render path — that would be an XSS hole. If runtime user input is ever needed, switch that path to `textContent`/DOM nodes.

---

## Sub-agents: pick the cheapest model that fits

When you delegate work via `Agent`, `Workflow`, or any other fan-out, **specify `model:` explicitly** &mdash; don't let sub-agents inherit the parent's model. Token cost in a fan-out multiplies by the number of agents, so the tier choice is the largest single lever. Default down, not up.

| Tier | Use for |
|---|---|
| `haiku` | Mechanical lookups, single-file extracts, simple summarisation, syntax checks |
| `sonnet` | Routine planning, code reading, multi-file research, structured drafts |
| `opus` | The one synthesiser-of-record stage; hardest design or judgement |
| `fable` | Long-form prose where Fable's voice fits |

Reserve Opus for the synthesis or hardest-judgement step, not the fan-out workers. If you're unsure, start with `sonnet` and only escalate when a sub-agent visibly underperforms. This rule applies to *any* sub-agent spawn in this repo, including the `new-pack` skill's research phases and code-review fan-outs.

---

## Repository layout

```
src/
  framework/
    shell.html       HTML skeleton with <!-- INJECT:* --> tokens
    styles.css       Mobile-first styles, design tokens at :root
    timer.js         Shot-timer engine (par + circuit, Web Audio) + sheet UX
    renderer.js      Builds page sections from a pack's data
    switcher.js      Pack registry, ?pack=<id> URL persistence, boot
  packs/
    grip-first.js    One file per training program; calls registerPack()
build.py             Inlines src/ into dist/index.html (deterministic)
Makefile             `make build` runs build.py; `make deploy` runs wrangler
wrangler.jsonc       Cloudflare assets-only Worker config (torreld.urdr.dev)
.github/workflows/
  deploy.yml         Push-to-main → build → wrangler deploy
CLAUDE.md            This file (orientation + routing)
docs/
  ARCHITECTURE.md    Boot, build pipeline, data model, timer, console UX
  BUILD.md           make build, verify recipes, automated + manual deploy
  CONTRIBUTING.md    Branches, commits, PRs, adding a pack, auto-deploy
  DESIGN.md          Design system, color semantics, quality floor
dist/index.html      Generated artifact (gitignored)
```

---

## Roadmap

- **v2 persistence & logging** (self-host only): record reps and PR par-times per drill. Use `localStorage` *guarded* by feature-detection so the committed file still runs in the no-storage preview.
- **i18n**: the original copy was Swedish; an EN/SV toggle is plausible since content is centralized per pack.
- **Print / export** of a program as a one-pager (print styles already in place).
- **More packs**: any "drills + evidence + references" curriculum fits the model.

### Gotcha for any "split data into JSON" idea
Moving pack data to `.json` and `fetch()`-ing it **breaks `file://` offline use** (CORS). Packs must remain JS files inlined at build time, or accept a server requirement — document the trade-off here if that ever changes.
