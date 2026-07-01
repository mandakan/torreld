# TORRELD

A dry-fire training-pack runner. Mobile-first, offline, no backend - a single
self-contained HTML file you prop up on a phone and shoot par-time reps against.

**Live: https://torreld.urdr.dev/**

## What it is

Range time is rare; dry fire is cheap. A well-structured, par-time-driven dry-fire
session builds the skills that live fire mostly just tests - grip, index,
presentation, movement. TORRELD renders a **pack**: a self-contained training
protocol (diagnosis, weekly plan, drills with par timers, evidence, sources).

The framework is content-agnostic - any "drills + evidence + references" curriculum
fits. Adding a program is dropping one JS file in `src/packs/`; no framework changes.
The current packs are grip-first dry fire and match-prep sets for IPSC Production
Optics, but nothing in the data model is specific to shooting.

## How it works

- **One self-contained artifact.** `build.py` inlines everything in `src/` into a
  single `dist/index.html` that opens from `file://` with no server, no CDN, no
  fetch. It works offline.
- **Vanilla JS, system fonts.** No framework, no bundler, no runtime dependencies.
  The only build tooling is Python file concatenation.
- **A shot timer in the page.** Par and circuit modes with Web Audio beeps, plus
  self-adjusting par times that adapt to how you actually shoot.

## Quick start

```sh
make build                                   # inline src/ -> dist/index.html
python3 -m unittest discover -s tests -t .   # build tests
open dist/index.html                         # or just double-click it
```

Optional screenshot check across viewports (needs Chromium once via
`npx playwright install chromium`):

```sh
node scripts/shot.mjs --all-packs            # phone + desktop shots of every pack
```

## Repository layout

```
src/framework/   shell.html, styles.css, timer.js, renderer.js, switcher.js, og-template.svg
src/packs/       one JS file per training program (calls registerPack)
scripts/         build/dev helpers (shot.mjs, verify-dist.sh, check-js.mjs, ...)
tests/           unit + integration tests for build.py
build.py         inlines src/ into dist/index.html (deterministic)
docs/            ARCHITECTURE, BUILD, CONTRIBUTING, DESIGN
```

Start with [CLAUDE.md](CLAUDE.md) for orientation and routing, then the focused doc
under [docs/](docs/) that fits your change.

## Contributing

PRs run build tests, verify the built artifact, and screenshot every pack (see
[docs/BUILD.md](docs/BUILD.md)). Merges to `main` auto-deploy to Cloudflare. See
[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## License

[MIT](LICENSE) (c) 2026 Mathias Axell. The training-pack copy references external
sources by citation; those citations point to their own authors and licenses.
