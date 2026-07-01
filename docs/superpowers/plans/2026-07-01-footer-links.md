# Footer Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two discreet chrome links - "Source" (GitHub) and "Buy me a coffee" - to the bottom of the app.

**Architecture:** A static `<footer class="colophon">` added to the shell markup after `</main>`, styled to match the existing quiet footer prose. Pure HTML + CSS; no JS, renderer, or pack-data changes. Inline SVG icons keep the single-file offline guarantee.

**Tech Stack:** Vanilla HTML/CSS, Python concatenation build (`build.py`), no dependencies.

## Global Constraints

- Single self-contained artifact; must open from `file://` offline. No external network at runtime - icons must be inline SVG, no web fonts, no CDN.
- Vanilla only, ~ES5. No bundler/minifier.
- Author-trusted content via `innerHTML` - but this change is static shell markup, no user input.
- Writing style: ASCII punctuation only, single hyphen `-` for dashes, no slop phrases, straight quotes.
- Icons use `currentColor`; links `target="_blank" rel="noopener noreferrer"`.
- Exact URLs: GitHub `https://github.com/mandakan/torreld`, coffee `https://www.buymeacoffee.com/thias`.

---

### Task 1: Add the footer colophon (markup + styles + docs)

**Files:**
- Modify: `src/framework/shell.html` (insert static `<footer>` after `</main>`, before the `<!-- TIMER CONSOLE -->` comment)
- Modify: `src/framework/styles.css` (append `.colophon` styles at end of the References/footer block, e.g. after the `.footer{...}` rule ~line 578)
- Modify: `docs/ARCHITECTURE.md:18` (add colophon to the page section order)

**Interfaces:**
- Consumes: existing design tokens `--mono`, `--muted2`, `--text`, `--amber`, `--line`, `--wrap-max`, `--gutter`.
- Produces: no JS API. New CSS class `.colophon` / `.colophon-link` and static markup only.

- [ ] **Step 1: Insert the colophon markup in `src/framework/shell.html`**

Find:
```html
<header class="hero" id="hero"></header>
<main class="wrap" id="app"></main>

<!--
  TIMER CONSOLE
```

Replace with (insert the `<footer>` between `</main>` and the comment):
```html
<header class="hero" id="hero"></header>
<main class="wrap" id="app"></main>

<footer class="colophon">
  <a class="colophon-link" href="https://github.com/mandakan/torreld" target="_blank" rel="noopener noreferrer">
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
    <span>Source</span>
  </a>
  <a class="colophon-link coffee" href="https://www.buymeacoffee.com/thias" target="_blank" rel="noopener noreferrer">
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
    <span>Buy me a coffee</span>
  </a>
</footer>

<!--
  TIMER CONSOLE
```

- [ ] **Step 2: Append the styles to `src/framework/styles.css`**

Immediately after the existing `.footer{ ... }` rule (ends ~line 578), add:
```css
.colophon{
  max-width:var(--wrap-max);
  margin:0 auto;
  padding:20px var(--gutter) 32px;
  border-top:1px solid var(--line);
  display:flex;
  flex-wrap:wrap;
  align-items:center;
  justify-content:center;
  gap:20px;
}
.colophon-link{
  display:inline-flex;
  align-items:center;
  gap:7px;
  font-family:var(--mono);
  font-size:11px;
  letter-spacing:.1em;
  text-transform:uppercase;
  color:var(--muted2);
  border:0;
  padding:8px 4px;
  transition:color .15s;
}
.colophon-link svg{flex:0 0 auto}
.colophon-link:hover{color:var(--text);border:0}
.colophon-link.coffee:hover{color:var(--amber)}
.colophon-link:focus-visible{outline:2px solid var(--amber);outline-offset:2px}
```

Note: the global `a` rule adds a bottom border; `.colophon-link{border:0}` and the `:hover{border:0}` override cancel it so the links read as plain chrome.

- [ ] **Step 3: Update `docs/ARCHITECTURE.md:18`**

Find:
```
Page section order: top bar (brand → pack switcher → section nav) → hero → diagnosis → program → drills → evidence → references → footer → fixed timer console.
```
Replace the tail with:
```
... → evidence → references → footer → colophon (source + support links) → fixed timer console.
```
(Keep the leading part of the sentence unchanged; only append `colophon (source + support links)` between `footer` and `fixed timer console`.)

- [ ] **Step 4: Build**

Run: `make build`
Expected: exits 0, regenerates `dist/index.html`.

- [ ] **Step 5: Verify the build output contains the colophon and both URLs**

Run: `grep -c 'class="colophon"' dist/index.html && grep -c 'github.com/mandakan/torreld' dist/index.html && grep -c 'buymeacoffee.com/thias' dist/index.html`
Expected: each prints at least `1`.

Run: `grep -c 'INJECT:' dist/index.html`
Expected: `0` (no unresolved tokens).

- [ ] **Step 6: Run the build test suite (regression)**

Run: `python3 -m pytest tests/test_build.py -q` (or `make test` if defined)
Expected: all pass - the change touches no build logic.

- [ ] **Step 7: Visual check from `file://`**

Open `dist/index.html` in a browser (no server). Confirm: both links sit centered at the bottom under the pack footer prose, quiet/muted, above the timer console; hover warms coffee to amber and source to light text; both open in a new tab. Switch packs via the rail - the colophon stays put.

- [ ] **Step 8: Commit**

```bash
git add src/framework/shell.html src/framework/styles.css docs/ARCHITECTURE.md
git commit -m "Add discreet source + buy-me-a-coffee links to app footer"
```

---

## Self-Review

- **Spec coverage:** footer-only placement (Task 1 step 1), both exact URLs (step 1), inline SVG offline-safe icons (step 1), discreet muted styling + hover + focus (step 2), accessibility via text labels + focus-visible (steps 1-2), docs updated (step 3), no renderer/switcher/pack edits (none present in Files). Covered.
- **Placeholder scan:** none - all markup, CSS, and commands are literal.
- **Type consistency:** class names `.colophon` / `.colophon-link` / `.coffee` used identically in markup (step 1) and styles (step 2).
