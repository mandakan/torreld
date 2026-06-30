# Contributing

How to make a change to TORRELD and get it shipped. Read [`../CLAUDE.md`](../CLAUDE.md) for context first.

---

## Branching

- Default branch is `main`. Direct pushes are not used — everything goes through a PR.
- Feature branches:
  - `claude/<short-kebab-description>` for agent work
  - `<topic>` for human contributors
- One branch per logical change. If a previous PR has been squash-merged, reset the branch to `origin/main` before starting fresh work on top:
  ```sh
  git fetch origin main
  git reset --hard origin/main
  ```

---

## Commits

- Imperative subject (≤ 72 chars): "Add pack switcher", "Fix wrangler version".
- Body explains **why** and any trade-offs. Don't recap the diff — `git show` already does that.
- Co-author trailer when an agent wrote the commit.

---

## Pull requests

- Title mirrors the commit subject.
- Body: Summary + (optional) Design notes + Verification. No template required; keep it tight.
- Squash-merge into `main`. Keep history linear.
- If the change touches build, deploy, console UX, or the data model, **update the relevant doc in the same PR**. Stale docs are worse than no docs.

---

## Adding a new pack

The whole point of the framework is that adding a training program is a content change, not a code change.

1. Copy `src/packs/grip-first.js` → `src/packs/<your-pack>.js`.
2. Edit `id`, `name`, `documentTitle`, and the `data` object. See [ARCHITECTURE.md → Data model](ARCHITECTURE.md#data-model-pack-data-field) for the shape.
3. `make build` and reload `dist/index.html`. With ≥ 2 packs, the switcher chip row appears in the top bar automatically.
4. Verify per [BUILD.md → Verify](BUILD.md#verify-local).
5. Commit, open a PR, merge → auto-deploys.

**Default-pack ordering:** packs load alphabetically by filename. Prefix with `00-`, `10-`, etc. if you need the default-pack fallback (`packs[0]`) to land on a specific one.

**Drill labels must stay quote-free.** A drill's `label` is the adaptive-par key and flows into a CSS attribute selector (`.now[data-label="..."]`) for the per-card par indicator. A `"` in a label would break that selector. Use plain text - the existing labels (`Move-and-regrip`, `Grip under load`) are the model. Optional per-drill `floor` (string seconds, e.g. `floor: "1.2"`) on a `timer` spec sets the lowest par adaptive tightening can reach; omit it to use the 0.6s default.

---

## Auto-deploy

Every push to `main` triggers `.github/workflows/deploy.yml`, which builds and ships via wrangler. Full pipeline + failure handling are in [BUILD.md → Deploy](BUILD.md#deploy).

In practice:
- Merge a PR → watch the run in the Actions tab → the new artifact is live at `https://torreld.urdr.dev/` ~30 s later.
- A failed deploy leaves the previous version live and surfaces in the Actions tab.

---

## Where to put things

| Change type | Goes in |
|---|---|
| Pack content (text, drills, references) | `src/packs/<pack>.js` |
| Visual design / layout | `src/framework/styles.css` |
| New framework capability | `src/framework/{shell.html, renderer.js, timer.js, switcher.js}` |
| Build behavior | `build.py`, `Makefile` |
| Deploy behavior | `.github/workflows/deploy.yml`, `wrangler.jsonc` |
| Docs | `CLAUDE.md` (orientation), `docs/*.md` (deep dives) |

---

See also: [ARCHITECTURE.md](ARCHITECTURE.md) · [BUILD.md](BUILD.md) · [DESIGN.md](DESIGN.md) · [`../CLAUDE.md`](../CLAUDE.md)
