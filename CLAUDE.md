# CLAUDE.md

Routing entry for TORRELD. Start here, then jump to the focused doc that fits the change. **If you change something the docs claim, update the docs in the same PR.**

---

## Vision

TORRELD is a **dry-fire training pack runner** built on three convictions:

- **Range time is rare; dry fire is cheap.** A well-structured, par-time-driven dry-fire session beats sporadic live fire for most skills (grip, index, presentation, movement).
- **Programs are content.** A "pack" is a self-contained training protocol - diagnosis, weekly plan, drills, evidence, sources. The framework renders any pack. Adding a new program = dropping one JS file in `src/packs/`. No framework changes needed.
- **Mobile-first because that's where reps happen.** Users have a phone propped up on a magazine in the living room - not a desktop. Every UI decision serves that scenario first.

No backend, no accounts, no tracking. A single self-contained HTML file that opens from `file://` and works offline.

The current program is grip-first dry-fire for IPSC Production Optics, but the data model is content-agnostic - any "drills + evidence + references" curriculum fits.

Live: **https://torreld.urdr.dev/**

---

## TL;DR routing

| You want to... | Touch | Doc |
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

- **Single self-contained artifact, zero runtime dependencies.** Sources live in `src/`, but the build inlines everything into one `dist/index.html`. The deployed file must open correctly from `file://` with no server, no CDN, no fetch. The offline/`file://` guarantee covers `index.html` and its inlined `data:`-URI favicon. The OG card PNGs under `dist/og/` are live-site-only assets fetched by social crawlers; they are referenced by absolute URL and are not needed for offline use.
- **No external network at runtime.** No CDNs, no web fonts - system font stacks only. It has to work offline.
- **No `localStorage` / `sessionStorage` / IndexedDB** in the committed source. The deployed file is previewed in a sandbox that forbids browser storage. Persistence is a roadmap item and, when added, must degrade gracefully when storage is unavailable. Preferences that need to survive a reload (pack selection, audio profile) persist via query params + `history.replaceState` - `?pack=<id>`, `?sound=quiet` - never via storage. The adaptive-par feature is the first sanctioned exception: it uses feature-detected `localStorage` (`torreld.progress.v1`) that degrades to in-memory session-only state when storage is unavailable, so the committed file still runs in the no-storage preview. See `docs/superpowers/specs/2026-06-30-adaptive-par-design.md`.
- **Vanilla JS only** (roughly ES5-level, no framework, no transpile). The build step (Python file concatenation) is the only tooling; no bundler, no minifier, no TypeScript.
- **Author-trusted content, rendered via `innerHTML`.** The renderer injects pack data as HTML, so copy may contain tags like `<em>` and HTML entities. **Never** feed untrusted/user input into pack data or into the render path - that would be an XSS hole. If runtime user input is ever needed, switch that path to `textContent`/DOM nodes.

---

## Writing style (pack copy and these docs)

Plain ASCII, no LLM slop. Applies to all rendered pack copy and to the docs in this repo.

- **ASCII punctuation only.** Use a single hyphen `-` for dashes. No double hyphen `--`, no em-dash character, no `&mdash;` or `&ndash;` entity. Use `...` for an ellipsis and straight quotes `'` `"` - no `&lsquo;`/`&rsquo;` curly-quote entities. The render path is `innerHTML`, so a literal ` - ` displays fine; there is never a reason to reach for a dash entity.
- **No slop phrases or LLM tells.** Avoid delve, leverage, seamless, robust, harness, unlock, paradigm, synergy and the rest. Delete the word rather than swap in another vague intensifier.
- **No reflexive "not X but Y", and no rule-of-three cadence.** State the claim directly. Real lists (names, ordered steps, the diagnosis chain) are fine; antithesis and tricolons used for rhythm read as machine-written. Vary sentence shape.
- **Allowed entities:** `&middot;` (chip and readout separator), `&rarr;` (where an arrow is the meaning), `&nbsp;` (number-and-unit glue), and the symbol entities like `&#10003;`. These are structural, not prose dashes.

---

## Licensing and attribution (content)

The repo is dual-licensed: **code MIT** ([LICENSE](LICENSE)), **pack content CC BY-SA 4.0** ([LICENSE-CONTENT.md](LICENSE-CONTENT.md)). When you write or edit any pack, this is non-negotiable:

- **Original expression only.** Techniques and drills are methods - not copyrightable, free to reuse. Their *wording, diagrams, tables, and images* are not. Write every drill, diagnosis, and evidence line in your own words. Never paste a source's sentences, and never embed a third-party image - packs are text/CSS only, keep it that way.
- **Credit the origin.** Every borrowed technique gets its practitioner/source in the pack's `references` tiers **and** in [CREDITS.md](CREDITS.md). Facts (stage briefings, match details) are free to state but still get a source line. Book/program/match names are used to credit only - no logos, no implied endorsement (nominative use).
- **Cite, don't reproduce.** Link a source; don't quote its body text. Feeling the need for a verbatim quote is the signal to paraphrase instead.
- **Keep CREDITS.md in sync in the same PR.** When a pack adds a source, update [CREDITS.md](CREDITS.md); the in-app References list and CREDITS.md must agree.

CC BY-SA covers TORRELD's own expression - it does not relicense anyone else's work. When monetized (donations), the bar for clean, original content is higher, not lower.

---

## Sub-agents: pick the cheapest model that fits

When you delegate work via `Agent`, `Workflow`, or any other fan-out, **specify `model:` explicitly** - don't let sub-agents inherit the parent's model. Token cost in a fan-out multiplies by the number of agents, so the tier choice is the largest single lever. Default down, not up.

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
    og-template.svg  1200x630 OG card template (tokens filled per pack at build)
    timer.js         Shot-timer engine (par + circuit, Web Audio) + sheet UX
    renderer.js      Builds page sections from a pack's data
    switcher.js      Pack registry, ?pack=<id> URL persistence, boot
  packs/
    grip-first.js    One file per training program; calls registerPack()
scripts/
  design-sync-gen.py Dev tool: emit Claude Design preview cards from styles.css (see docs/DESIGN.md)
tests/
  test_build.py      Unit + integration tests for build.py
build.py             Inlines src/ into dist/index.html and emits favicon/OG/stubs (deterministic)
Makefile             `make build` runs build.py; `make deploy` runs wrangler
wrangler.jsonc       Cloudflare assets-only Worker config (torreld.urdr.dev)
.github/workflows/
  deploy.yml         Push-to-main -> build -> wrangler deploy
CLAUDE.md            This file (orientation + routing)
docs/
  ARCHITECTURE.md    Boot, build pipeline, data model, timer, console UX
  BUILD.md           make build, verify recipes, automated + manual deploy
  CONTRIBUTING.md    Branches, commits, PRs, adding a pack, auto-deploy
  DESIGN.md          Design system, color semantics, quality floor
dist/                Generated artifacts (gitignored)
  index.html         Single self-contained app (favicon inlined as data: URI)
  favicon.svg        Brand mark SVG
  favicon.png        32x32 rasterized (requires rsvg-convert)
  apple-touch-icon.png  180x180 rasterized (requires rsvg-convert)
  og/                OG card images; SVG always written, PNG when rsvg-convert present
  p/<id>/index.html  Per-pack share stubs; redirect to /?pack=<id>
```

---

## Roadmap

- **v2 persistence & logging** (self-host only): record reps and PR par-times per drill. Use `localStorage` *guarded* by feature-detection so the committed file still runs in the no-storage preview.
- **i18n**: the original copy was Swedish; an EN/SV toggle is plausible since content is centralized per pack.
- **Print / export** of a program as a one-pager (print styles already in place).
- **More packs**: any "drills + evidence + references" curriculum fits the model.

### Gotcha for any "split data into JSON" idea
Moving pack data to `.json` and `fetch()`-ing it **breaks `file://` offline use** (CORS). Packs must remain JS files inlined at build time, or accept a server requirement - document the trade-off here if that ever changes.
