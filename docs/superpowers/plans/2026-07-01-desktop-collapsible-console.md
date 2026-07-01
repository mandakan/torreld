# Desktop Collapsible Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop (>=860px) timer console a collapsible non-modal dock that defaults open, instead of a permanently pinned panel.

**Architecture:** Reuse the existing `setExpanded()` state machine and `aria-expanded` on `#console`. Task 1 adds JS: a `console-collapsed` body-class toggle, a boot default keyed to the desktop media query (which also removes the panel's boot-time `inert`), and a breakpoint-change listener. Task 2 adds CSS that, on desktop, shows a chevron grip and switches between the full panel (expanded) and the slim compact bar (collapsed) with a matching `--console-h` reservation, plus a chevron glyph in the shell and a docs update.

**Tech Stack:** Vanilla ES5-level JS, CSS, Python concatenation build (`build.py`). No dependencies, no bundler.

## Global Constraints

- Single self-contained artifact; must open from `file://` offline. No external network at runtime; any icon is inline SVG; system fonts only.
- Vanilla JS, ~ES5 level (no `const`/arrow/template-literal reliance in framework files - match existing `var`/`function` style in `timer.js`).
- No `localStorage` / `sessionStorage` / query-param persistence for this feature - collapse state is ephemeral, resets to the per-viewport default on reload.
- Author-trusted content only; no user input on the render path.
- Writing/comment style: ASCII punctuation only (single hyphen `-`, straight quotes), no LLM-slop phrases.
- Mobile behavior (modal sheet + scrim, compact-bar default) must remain unchanged.
- Desktop breakpoint is exactly `min-width: 860px` (matches existing media queries).

---

### Task 1: Console collapse state in timer.js

**Files:**
- Modify: `src/framework/timer.js` - `setExpanded()` (~lines 203-225) and `init()` (~lines 416-497)

**Interfaces:**
- Consumes: existing `setExpanded(expand)`, `consoleEl`, module-scope in `init()`.
- Produces: a `document.body` class `console-collapsed` present exactly when the console is collapsed (`aria-expanded="false"`); Task 2's CSS reads this class and `#console[aria-expanded]`.

- [ ] **Step 1: Toggle the `console-collapsed` body class in `setExpanded`**

In `src/framework/timer.js`, find the end of `setExpanded` (the `if(v){...} else {...}` block, ~lines 218-224). Immediately after that block's closing brace and before the function's closing `}`, add:

```js
    /* Desktop reserves body padding for the dock; the collapsed slim bar is
       shorter than the open panel. This class drives the desktop-only
       --console-h override (no effect at mobile widths). */
    document.body.classList.toggle("console-collapsed", !v);
```

- [ ] **Step 2: Add the boot default + breakpoint listener in `init`**

In `src/framework/timer.js`, find the end of `init()` - the line `showReady();` (~line 496). Immediately BEFORE `showReady();`, add:

```js
    /* Desktop is a non-modal dock that starts open, so its controls are live
       from load (this also clears the panel's boot-time `inert`). Mobile keeps
       the compact-bar default. Re-apply the per-side default whenever the
       viewport crosses the desktop breakpoint. */
    var desktopMQ = window.matchMedia("(min-width:860px)");
    function applyConsoleDefault(mq){ setExpanded(mq.matches); }
    applyConsoleDefault(desktopMQ);
    if(desktopMQ.addEventListener){
      desktopMQ.addEventListener("change", applyConsoleDefault);
    } else if(desktopMQ.addListener){
      desktopMQ.addListener(applyConsoleDefault);
    }
```

Note: `applyConsoleDefault` receives the `MediaQueryList` on the initial call and a `MediaQueryListEvent` on change; both expose `.matches`, so `setExpanded(mq.matches)` is correct in both cases.

- [ ] **Step 3: Build**

Run: `make build`
Expected: exits 0.

- [ ] **Step 4: Verify state wiring in a browser (behavioral check)**

Serve and load the built file (a static server is fine; `file://` is blocked in the sandbox browser):
`python3 -m http.server 8891 --directory dist` then open `http://localhost:8891/index.html`.

At desktop width (>=860px), evaluate in the page console:
```js
({
  expanded: document.getElementById('console').getAttribute('aria-expanded'),
  collapsedClass: document.body.classList.contains('console-collapsed'),
  panelInert: document.querySelector('.console-panel').hasAttribute('inert')
})
```
Expected at boot on desktop: `{ expanded: "true", collapsedClass: false, panelInert: false }`.
After clicking the grip once (collapse): `{ expanded: "false", collapsedClass: true, panelInert: true }`.

At mobile width (<860px) on boot: `expanded` is `"false"` and `panelInert` is `true` (unchanged from today).

- [ ] **Step 5: Run the build test suite (regression)**

Run: `python3 -m pytest tests/test_build.py -q`
Expected: all pass (no build-logic change).

- [ ] **Step 6: Commit**

```bash
git add src/framework/timer.js
git commit -m "Add desktop console collapse state + open-by-default boot"
```

---

### Task 2: Desktop dock CSS, chevron, and docs

**Files:**
- Modify: `src/framework/shell.html` - add a chevron SVG inside `#consoleGrip` (~lines 45-52)
- Modify: `src/framework/styles.css` - base grip-chevron hidden (~near line 650); desktop media query dock rules (~lines 955-985)
- Modify: `docs/ARCHITECTURE.md:124` - desktop console UX bullet

**Interfaces:**
- Consumes: `body.console-collapsed` and `#console[aria-expanded]` from Task 1; tokens `--wrap-max`, `--gutter`, `--muted`, `--text`, `--console-h`.
- Produces: no JS API. Desktop-only presentation.

- [ ] **Step 1: Add the chevron glyph to the grip in `shell.html`**

Find (~lines 45-52):
```html
  <button class="console-grip"
          id="consoleGrip"
          type="button"
          aria-controls="consolePanel"
          aria-expanded="false"
          aria-label="Expand timer">
    <span class="grip-bar" aria-hidden="true"></span>
  </button>
```
Replace the inner `<span ...></span>` line so the button contains both the mobile handle and a desktop chevron:
```html
    <span class="grip-bar" aria-hidden="true"></span>
    <svg class="grip-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
```
(The path points down; CSS rotates it 180deg when collapsed.)

- [ ] **Step 2: Hide the chevron by default (mobile) in `styles.css`**

Find the `.grip-bar{ ... }` rule (~lines 650-656). Immediately after it, add:
```css
.grip-chevron{display:none}   /* desktop-only affordance; shown in the >=860px query */
```

- [ ] **Step 3: Replace the desktop hide-rules with state-aware dock rules**

In `src/framework/styles.css`, inside `@media(min-width:860px){ ... }` (the `=== Desktop layout ===` block), find:
```css
  .console{max-height:none;display:block}
  .console-grip,.console-bar{display:none !important}
  .scrim{display:none !important}

  .console-panel{
    max-height:none !important;
    opacity:1 !important;
    overflow:visible;
    transition:none;
  }
```
Replace it with:
```css
  .console{max-height:none;display:block}
  .scrim{display:none !important}   /* non-modal dock: never dim on desktop */

  /* Collapsed dock reserves only the slim-bar height. */
  body.console-collapsed{ --console-h: 68px; }

  /* Grip becomes a slim full-width strip with a chevron affordance. */
  .console-grip{
    display:flex;align-items:center;justify-content:center;
    height:20px;min-height:20px;
  }
  .console-grip .grip-bar{display:none}
  .console-grip .grip-chevron{
    display:block;color:var(--muted);
    transition:transform .18s ease,color .15s;
  }
  .console-grip:hover .grip-chevron,
  .console-grip:focus-visible .grip-chevron{color:var(--text)}
  .console[aria-expanded="false"] .grip-chevron{transform:rotate(180deg)}

  /* Expanded shows the panel; collapsed shows the compact bar. */
  .console[aria-expanded="true"]  .console-panel{
    max-height:none;opacity:1;overflow:visible;transition:none;
  }
  .console[aria-expanded="false"] .console-panel{display:none}
  .console[aria-expanded="true"]  .console-bar{display:none}
  .console[aria-expanded="false"] .console-bar{
    display:grid;max-width:var(--wrap-max);margin:0 auto;
    padding:6px var(--gutter) 10px;
  }
```
Note: the existing desktop `.console-panel .wrap{...}` grid rule that follows stays as-is - it still styles the expanded panel.

- [ ] **Step 4: Update the desktop bullet in `docs/ARCHITECTURE.md:124`**

Replace line 124:
```
- **Desktop (≥ 860 px):** grip, bar, and scrim are hidden; the panel is always visible and laid out as a single horizontal row (mode + label / big readout + status / fields + actions).
```
with:
```
- **Desktop (≥ 860 px):** a collapsible non-modal dock, open by default. A chevron grip toggles between the full panel (single horizontal row: mode + label / big readout + status / fields + actions) and the slim compact bar; the scrim stays hidden so page content is never dimmed. `--console-h` drops to the slim-bar height via `body.console-collapsed` when collapsed. The dock opens at boot (which also clears the panel's `inert`), and resizing across the breakpoint resets to that side's default.
```

- [ ] **Step 5: Build**

Run: `make build`
Expected: exits 0.

- [ ] **Step 6: Run the build test suite**

Run: `python3 -m pytest tests/test_build.py -q`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/framework/shell.html src/framework/styles.css docs/ARCHITECTURE.md
git commit -m "Add desktop collapsible dock CSS + chevron grip"
```

- [ ] **Step 8: Report the slim-bar height for tuning**

The controller will verify the dock in-browser at 1280/860/390 and confirm (or tune) the collapsed `--console-h: 68px` against the real rendered slim-bar height, that the colophon clears the console in both states, and that no first-paint overlap occurs. Report the measured collapsed `.console` height so the controller can finalize the value.

---

## Self-Review

- **Spec coverage:** non-modal dock + no desktop scrim (Task 2 Step 3), default expanded at boot (Task 1 Step 2), collapse to slim bar (Task 2 Step 3), reservation override keyed to `console-collapsed` (Task 1 Step 1 + Task 2 Step 3), matchMedia reset on breakpoint cross (Task 1 Step 2), inert cleared at boot (Task 1 Step 2, via `setExpanded(true)`), chevron affordance (Task 2 Steps 1-3), mobile unchanged (scrim rule + no boot call at mobile width), ephemeral persistence (no storage/param added), docs (Task 2 Step 4). Covered.
- **Placeholder scan:** none - all code/markup/commands literal. The one tunable value (`--console-h: 68px`) has a concrete starting value and an explicit controller verification step.
- **Type consistency:** `console-collapsed` class name identical in Task 1 (JS toggle) and Task 2 (CSS override); `grip-chevron` class identical in shell.html and both CSS rules; `applyConsoleDefault` used consistently.
