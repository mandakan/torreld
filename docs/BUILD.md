# Build · Verify · Deploy

How the artifact is produced, sanity-checked, and shipped. Read [`../CLAUDE.md`](../CLAUDE.md) for context.

---

## Build (local)

```sh
make build           # writes dist/index.html
```

`make build` runs `build.py`, which inlines `src/framework/styles.css`, `src/packs/*.js`, and `src/framework/{timer,renderer,switcher}.js` into the `<!-- INJECT:* -->` tokens in `src/framework/shell.html`. See [ARCHITECTURE.md → Build pipeline](ARCHITECTURE.md#build-pipeline) for the token table.

The output is byte-self-contained - same sources → same bytes. `dist/` is gitignored; never hand-edit `dist/index.html`.

In addition to `dist/index.html`, the build also emits:

- `dist/favicon.svg` and `dist/favicon.png` / `dist/apple-touch-icon.png`
- `dist/og/default.{svg,png}` and `dist/og/<id>.{svg,png}` per pack
- `dist/p/<id>/index.html` per-pack share stubs (carry static OG meta and redirect to `/?pack=<id>`)

SVG->PNG rasterization uses `rsvg-convert` (from `librsvg`). When the tool is absent the build skips PNGs and prints a one-line warning. PNGs are only required for the live site - social crawlers fetch them by absolute URL. `file://` offline use does not need them.

Install locally:
- Linux: `sudo apt-get install -y librsvg2-bin`
- macOS: `brew install librsvg`

---

## Verify (local)

**Build tests** (unit + integration, no browser needed):

```sh
python3 -m unittest discover -s tests -t .
```

**Functional check** - open `dist/index.html` in a browser:
- Arm a drill; the sheet should auto-expand on mobile and the card should glow.
- Run a par and a circuit; confirm beeps and the readout color transitions (amber standby → green Go → red Par → amber-soft Rest).
- Resize to 390 px wide; the console should collapse to a ~80 px compact bar.
- Try `dist/index.html?pack=<id>` to confirm pack persistence.

**JS syntax check** (no browser needed; same check runs in CI):

```sh
python3 - <<'PY'
import re; s=open('dist/index.html',encoding='utf-8').read()
open('/tmp/check.js','w').write(re.search(r'<script>(.*)</script>', s, re.S).group(1))
PY
node --check /tmp/check.js
```

**Headless cross-viewport check** - `scripts/shot.mjs` drives Playwright at a phone (390x844) and a desktop (1280x800) viewport and writes a PNG for each, so you can eyeball the mobile sheet and the desktop strip after a change:

```sh
make build                          # shot.mjs loads dist/index.html
node scripts/shot.mjs               # -> .playwright-mcp/torreld-{mobile,desktop}.png
node scripts/shot.mjs '?pack=hfo-masters'   # same file with a query string
node scripts/shot.mjs https://torreld.urdr.dev/  # or any URL; --out <dir> to redirect
```

The repo ships no `node_modules`, so the script locates Playwright from a local, global, or npx-cached install and needs the Chromium binary once: `npx playwright install chromium`. Output lands in `.playwright-mcp/` (gitignored).

On a headless host the Playwright MCP browser tools work too, once pointed at bundled Chromium: set `PLAYWRIGHT_MCP_BROWSER=chromium` and `PLAYWRIGHT_MCP_HEADLESS=true` (e.g. in `~/.claude/settings.json` `env`), then `npx @playwright/mcp@latest install-browser chrome-for-testing`. The MCP blocks `file://` by default, so serve `dist/` over `http://localhost` for it (the standalone `shot.mjs` above has no such limit).

---

## CI (pull requests)

`.github/workflows/ci.yml` runs on every PR. It never deploys - it just gates merges.

- **`verify` job** (fast, no browser): build tests, `make build`, `scripts/verify-dist.sh`, `scripts/check-js.mjs`. These are the same checks deploy runs pre-ship, so a green PR means a green deploy.
- **`screenshots` job**: builds, installs Playwright + Chromium (cached), runs `node scripts/shot.mjs --all-packs`, uploads the PNGs as a `torreld-screenshots` artifact, and posts a sticky PR comment showing them inline (one `<details>` block per pack).

`scripts/verify-dist.sh` and `scripts/check-js.mjs` are shared with `deploy.yml`, so the two workflows can't drift. `verify-dist.sh` discovers pack IDs from `dist/p/*` - a new pack is checked automatically, no hardcoded list.

### How the inline previews are hosted

GitHub renders an inlined image only from a URL its image proxy can fetch anonymously. This repo is public, so the images are committed to the orphan **`ci-previews`** branch and embedded via `https://raw.githubusercontent.com/<owner>/<repo>/ci-previews/pr-<n>/<file>.png`. No external host, no secrets.

- `scripts/previews.sh publish <pr> <dir>` pushes a PR's PNGs to `pr-<n>/` on that branch (overwritten each run, so it holds at most one set per PR). Uses a throwaway worktree and the run's own token; retries on push races.
- Previews are kept after the PR closes, so a merged PR keeps its inline screenshots. Nothing deletes them automatically; run `scripts/previews.sh remove <pr>` by hand if the branch ever needs trimming.
- The `torreld-screenshots` artifact stays as a download fallback (no branch/JS needed to grab it).

`ci-previews` is machine-managed - never branch off it or merge it. If the repo goes private again, the inline images stop rendering (the proxy can't fetch a private raw URL) and you'd fall back to the artifact.

---

## Deploy

### Automated (default)

Every push to `main` triggers `.github/workflows/deploy.yml`:

1. Checkout
2. `actions/setup-python@v5` (Python 3.x)
3. `sudo apt-get install -y librsvg2-bin` (SVG rasterizer; needed for OG and favicon PNGs)
4. `python3 -m unittest discover -s tests -t .` (build unit + integration tests)
5. `make build`
6. `scripts/verify-dist.sh` - no unresolved `<!-- INJECT:* -->` tokens; `favicon.png`, `og/default.png`, and every pack's PNG and stub exist
7. `scripts/check-js.mjs` - syntax-check the inline JS
8. `cloudflare/wrangler-action@v3` with **`wranglerVersion: '4'`** (pinned - wrangler 3 doesn't support assets-only Workers and will fail with `Missing entry-point`)

**Required repo secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. The token needs:

- Account → Workers Scripts → Edit
- Zone → Workers Routes → Edit (for the `urdr.dev` zone, to keep the `torreld.urdr.dev` custom domain binding)
- Account → Account Settings → Read

**Concurrency:** group `deploy`, `cancel-in-progress: true` - if a newer commit lands mid-deploy, the older deploy is canceled and the newer one takes its place. The Cloudflare upload is atomic per call, so canceling mid-flight is safe.

**Failure handling:** a failed deploy leaves the previous version live. Check the Actions tab → "Deploy to Cloudflare" workflow for logs. The environment URL surfaces as `https://torreld.urdr.dev/`.

### Manual fallback (rare)

When CI is broken or you need to ship from a laptop:

```sh
CLOUDFLARE_API_TOKEN=...  CLOUDFLARE_ACCOUNT_ID=...  make deploy
```

`make deploy` builds and then runs `wrangler deploy`. Use wrangler >= 4 (`npx wrangler@latest deploy` is a safe substitute if no `wrangler` is on PATH). If you're authenticated via OAuth instead of an API token, a fresh `wrangler login` may be needed when the cached token expires.

A manual deploy from a machine without `rsvg-convert` ships stubs whose `og:image` points at a PNG that was never generated (social unfurls will 404 on the image); install `librsvg2-bin` (Linux: `sudo apt-get install -y librsvg2-bin`, macOS: `brew install librsvg`) before a manual deploy, or rely on CI which installs it automatically.

---

## Host details

The deploy target is a **Cloudflare Worker serving static assets** (not Cloudflare Pages - Pages is fix-only now; Cloudflare steers new projects to Workers). `wrangler.jsonc` declares an assets-only Worker (no server code) pointing at `dist/`, with `torreld.urdr.dev` as a custom domain.

The `urdr.dev` zone lives in the `admin@hedvigholding.se` Cloudflare account.

---

See also: [ARCHITECTURE.md](ARCHITECTURE.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [`../CLAUDE.md`](../CLAUDE.md)
