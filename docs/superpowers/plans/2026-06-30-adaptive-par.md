# Adaptive Par Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each drill's par time progress on its own - tighten 0.1s after three clean runs in a row, hold on "too tight", persist per-device on the live site, and degrade to session-only where storage is blocked.

**Architecture:** A new dependency-free module `progress.js` owns all per-drill state (current par + clean streak) and guarded `localStorage`, exposed as `TORRELD.progress`. The timer console renders a post-run judgment prompt and a persistent par-meta line; `arm()` loads the stored par; manual edits write through. The renderer paints a per-card "now" indicator. No DOM logic lives in the store; no store logic lives in the DOM.

**Tech Stack:** Vanilla ES5-level JS (no framework, no transpile), Python file-concat build (`build.py`), `node --test` for the pure store module only, system fonts + CSS custom properties.

## Global Constraints

Copied verbatim from `CLAUDE.md` hard constraints - every task is bound by these:

- Single self-contained artifact: the build inlines everything into one `dist/index.html` that opens from `file://` with no server, no CDN, no fetch.
- No external network at runtime. System font stacks only.
- `localStorage` is forbidden in committed source **except** via feature-detected, gracefully-degrading guards - the explicit v2-persistence roadmap path. The artifact must still run in the no-storage sandbox preview.
- Vanilla JS only, roughly ES5-level. No bundler, no minifier, no TypeScript. The Python concat is the only build tooling.
- Author-trusted content rendered via `innerHTML`. Never feed runtime user input into the render path. (Adaptive par stores only numbers and fixed drill labels - no user-entered strings reach `innerHTML`.)
- Plain ASCII copy, no slop phrases. Single hyphen `-` for dashes. Allowed entities: `&middot;`, `&rarr;`, `&nbsp;`, symbol entities.

**Rule constants (single source of truth, defined in Task 1):** step `0.1`s, streak target `3`, default floor `0.6`s, storage key `torreld.progress.v1`, drill key `<packId>::<drillLabel>`.

---

### Task 1: Progression store (`progress.js`) - the rule engine

This is the only task with logic worth unit-testing; everything else is DOM wiring verified by hand. Pure state + guarded storage, no DOM.

**Files:**
- Create: `src/framework/progress.js`
- Test: `test/progress.test.js`

**Interfaces:**
- Consumes: `window.TORRELD` (exists from `shell.html`), `window.localStorage` (may throw).
- Produces `TORRELD.progress` with exact signatures:
  - `getPar(key: string, fallback: number|string) -> number` - stored par, else `round2(fallback)`.
  - `getStreak(key: string) -> number`
  - `recordMadeIt(key, defaultPar, floor?) -> { par:number, streak:number, tightened:boolean, atFloor:boolean }`
  - `recordTooTight(key, defaultPar) -> { par:number, streak:number }`
  - `setPar(key, val) -> void` (resets streak)
  - `reset(key) -> void`, `resetAll() -> void`

- [ ] **Step 1: Write the failing tests**

Create `test/progress.test.js`:

```js
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const SRC = fs.readFileSync(
  path.join(__dirname, "..", "src", "framework", "progress.js"), "utf8");

/* Build a fresh module instance with an injected window + localStorage.
   Re-evaluating SRC per call gives each test an isolated in-memory store. */
function load(opts){
  opts = opts || {};
  const backing = opts.backing || {};
  const localStorage = opts.noStorage ? {
    setItem(){ throw new Error("denied"); },
    getItem(){ throw new Error("denied"); },
    removeItem(){ throw new Error("denied"); }
  } : {
    setItem(k, v){ backing[k] = String(v); },
    getItem(k){ return k in backing ? backing[k] : null; },
    removeItem(k){ delete backing[k]; }
  };
  const window = { TORRELD: { packs: [] }, localStorage };
  const fn = new Function("window", SRC + "\nreturn window.TORRELD.progress;");
  return { progress: fn(window), backing };
}

test("made-it increments streak without tightening before target", () => {
  const { progress } = load();
  const key = "p::Drill";
  let r = progress.recordMadeIt(key, "1.20");
  assert.strictEqual(r.streak, 1);
  assert.strictEqual(r.tightened, false);
  r = progress.recordMadeIt(key, "1.20");
  assert.strictEqual(r.streak, 2);
  assert.strictEqual(progress.getPar(key, "1.20"), 1.2);
});

test("three clean reps tighten par by 0.1 and reset streak", () => {
  const { progress } = load();
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  const r = progress.recordMadeIt(key, "1.20");
  assert.strictEqual(r.tightened, true);
  assert.strictEqual(r.par, 1.1);
  assert.strictEqual(r.streak, 0);
  assert.strictEqual(progress.getStreak(key), 0);
});

test("par stays free of float drift across tightenings", () => {
  const { progress } = load();
  const key = "p::Drill";
  for (let i = 0; i < 6; i++) progress.recordMadeIt(key, "1.20");
  assert.strictEqual(progress.getPar(key, "1.20"), 1.0);
});

test("too tight resets the streak and holds par", () => {
  const { progress } = load();
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  const r = progress.recordTooTight(key, "1.20");
  assert.strictEqual(r.streak, 0);
  assert.strictEqual(r.par, 1.2);
});

test("par holds at the floor", () => {
  const { progress } = load();
  const key = "p::Drill";
  progress.setPar(key, 0.65);
  progress.recordMadeIt(key, "1.20", 0.6);
  progress.recordMadeIt(key, "1.20", 0.6);
  let r = progress.recordMadeIt(key, "1.20", 0.6);
  assert.strictEqual(r.par, 0.6);
  assert.strictEqual(r.atFloor, true);
  progress.recordMadeIt(key, "1.20", 0.6);
  progress.recordMadeIt(key, "1.20", 0.6);
  r = progress.recordMadeIt(key, "1.20", 0.6);
  assert.strictEqual(r.par, 0.6);
  assert.strictEqual(r.tightened, false);
});

test("manual setPar overrides and resets streak", () => {
  const { progress } = load();
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.setPar(key, 0.95);
  assert.strictEqual(progress.getPar(key, "1.20"), 0.95);
  assert.strictEqual(progress.getStreak(key), 0);
});

test("getPar returns the fallback when a drill is untouched", () => {
  const { progress } = load();
  assert.strictEqual(progress.getPar("p::New", "2.20"), 2.2);
});

test("state persists across reloads when storage works", () => {
  const backing = {};
  let { progress } = load({ backing });
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  ({ progress } = load({ backing }));
  assert.strictEqual(progress.getPar(key, "1.20"), 1.1);
});

test("reset clears one drill; resetAll clears everything", () => {
  const { progress } = load();
  progress.setPar("p::A", 1.0);
  progress.setPar("p::B", 2.0);
  progress.reset("p::A");
  assert.strictEqual(progress.getPar("p::A", "1.50"), 1.5);
  assert.strictEqual(progress.getPar("p::B", "2.50"), 2.0);
  progress.resetAll();
  assert.strictEqual(progress.getPar("p::B", "2.50"), 2.5);
});

test("degrades to session-only when storage is unavailable", () => {
  const { progress } = load({ noStorage: true });
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  const r = progress.recordMadeIt(key, "1.20");
  assert.strictEqual(r.par, 1.1);
  const reload = load({ noStorage: true }).progress;
  assert.strictEqual(reload.getPar(key, "1.20"), 1.2);
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `node --test test/`
Expected: FAIL - `ENOENT` reading `src/framework/progress.js` (file not created yet).

- [ ] **Step 3: Implement the store**

Create `src/framework/progress.js`:

```js
/* Adaptive-par progression store.
 *
 * Owns per-drill current par + clean streak. Pure state + storage, no DOM.
 * Exposed as TORRELD.progress. Storage is guarded localStorage that degrades
 * to an in-memory object when storage is unavailable (sandbox preview): the
 * committed artifact stays sandbox-legal, adaptation just resets on reload.
 *
 * Store shape (one versioned key):
 *   torreld.progress.v1 -> { "<packId>::<drillLabel>": { par:Number, streak:Number } }
 */
(function(){
  var T = window.TORRELD;

  var STORAGE_KEY   = "torreld.progress.v1";
  var STEP          = 0.1;   /* par drop per tighten, seconds */
  var STREAK_TARGET = 3;     /* clean reps in a row to tighten */
  var DEFAULT_FLOOR = 0.6;   /* floor when a drill declares none */

  var store = {};            /* in-memory mirror; runtime source of truth */

  function round2(x){ return Math.round(x * 100) / 100; }

  /* Feature-detect writable storage with a probe. Returns the store or null. */
  function storage(){
    try {
      var s = window.localStorage;
      var k = "__torreld_probe__";
      s.setItem(k, "1"); s.removeItem(k);
      return s;
    } catch(e){ return null; }
  }

  function load(){
    store = {};
    var s = storage();
    if(!s) return;
    try {
      var raw = s.getItem(STORAGE_KEY);
      if(raw){
        var obj = JSON.parse(raw);
        if(obj && typeof obj === "object") store = obj;
      }
    } catch(e){ store = {}; }
  }

  function persist(){
    var s = storage();
    if(!s) return;
    try { s.setItem(STORAGE_KEY, JSON.stringify(store)); } catch(e){}
  }

  function entry(key, defaultPar){
    if(!store[key]) store[key] = { par: round2(parseFloat(defaultPar)), streak: 0 };
    return store[key];
  }

  function getPar(key, fallback){
    return (store[key] && typeof store[key].par === "number")
      ? store[key].par
      : round2(parseFloat(fallback));
  }

  function getStreak(key){
    return (store[key] && store[key].streak) ? store[key].streak : 0;
  }

  function recordMadeIt(key, defaultPar, floor){
    var e = entry(key, defaultPar);
    var f = (floor != null && !isNaN(parseFloat(floor)))
      ? round2(parseFloat(floor)) : DEFAULT_FLOOR;
    e.streak += 1;
    if(e.streak >= STREAK_TARGET){
      e.streak = 0;
      if(e.par <= f){                 /* already at/below floor - hold */
        persist();
        return { par: e.par, streak: 0, tightened: false, atFloor: true };
      }
      var next = round2(e.par - STEP);
      if(next < f) next = f;
      var tightened = next < e.par;
      e.par = next;
      persist();
      return { par: e.par, streak: 0, tightened: tightened, atFloor: e.par <= f };
    }
    persist();
    return { par: e.par, streak: e.streak, tightened: false, atFloor: false };
  }

  function recordTooTight(key, defaultPar){
    var e = entry(key, defaultPar);
    e.streak = 0;
    persist();
    return { par: e.par, streak: 0 };
  }

  function setPar(key, val){
    var v = round2(parseFloat(val));
    if(isNaN(v)) return;
    store[key] = { par: v, streak: 0 };
    persist();
  }

  function reset(key){
    if(store[key]){ delete store[key]; persist(); }
  }

  function resetAll(){
    store = {};
    persist();
  }

  load();

  T.progress = {
    getPar: getPar,
    getStreak: getStreak,
    recordMadeIt: recordMadeIt,
    recordTooTight: recordTooTight,
    setPar: setPar,
    reset: reset,
    resetAll: resetAll
  };
})();
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test test/`
Expected: PASS - all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/framework/progress.js test/progress.test.js
git commit -m "feat: add adaptive-par progression store with guarded storage"
```

---

### Task 2: Wire `progress.js` into the build

`TORRELD.progress` must exist before `timer.init()` and before `render()`, so `progress.js` loads first in the framework concat.

**Files:**
- Modify: `build.py:22`

**Interfaces:**
- Consumes: nothing. Produces: `progress.js` inlined ahead of `timer.js` in `dist/index.html`.

- [ ] **Step 1: Add progress.js to the load order**

In `build.py`, change line 22 from:

```python
FRAMEWORK_ORDER = ["timer.js", "renderer.js", "switcher.js"]
```

to:

```python
FRAMEWORK_ORDER = ["progress.js", "timer.js", "renderer.js", "switcher.js"]
```

- [ ] **Step 2: Build and verify the module is inlined first**

Run: `make build && grep -c "TORRELD.progress" dist/index.html`
Expected: build prints `built .../dist/index.html`, and grep prints `1` or more (the store is present). Confirm order:

Run: `grep -n "Adaptive-par progression store\|Timer engine" dist/index.html | head`
Expected: the progression-store comment line number is smaller than the timer-engine line number.

- [ ] **Step 3: Commit**

```bash
git add build.py
git commit -m "build: load progress.js ahead of the timer"
```

---

### Task 3: Console DOM - judgment prompt, par-meta, reset controls

Add the markup the timer wiring (Task 6) drives. No behavior yet; elements start hidden.

**Files:**
- Modify: `src/framework/shell.html`

**Interfaces:**
- Produces these element ids consumed by Task 6: `judge`, `judgeMade`, `judgeTight`, `parMeta`, `parMetaText`, `parReset`, `progResetAll`. Produces CSS classes consumed by Task 5: `.judge`, `.judge-q`, `.judge-btns`, `.judge-made`, `.judge-tight`, `.par-meta`, `.par-reset`, `.prog-reset-all`.

- [ ] **Step 1: Add the judgment band at the top of the console panel**

In `src/framework/shell.html`, change:

```html
  <!-- Expanded panel - full controls. Always visible on desktop. -->
  <div class="console-panel" id="consolePanel" inert>
    <div class="wrap">
```

to:

```html
  <!-- Expanded panel - full controls. Always visible on desktop. -->
  <div class="console-panel" id="consolePanel" inert>
    <!-- Adaptive-par prompt - shown only when a run finishes. -->
    <div class="judge" id="judge" hidden>
      <span class="judge-q" id="judgeQ">How did that set go?</span>
      <div class="judge-btns">
        <button class="judge-made" id="judgeMade" type="button">Made it</button>
        <button class="judge-tight" id="judgeTight" type="button">Too tight</button>
      </div>
    </div>
    <div class="wrap">
```

- [ ] **Step 2: Add the par-meta line and reset-all control in the left column**

In the same file, change:

```html
        <div class="armed-label">Drill: <b id="armedLabelFull">- none -</b></div>
      </div>
```

to:

```html
        <div class="armed-label">Drill: <b id="armedLabelFull">- none -</b></div>
        <div class="par-meta" id="parMeta" hidden>
          <span id="parMetaText"></span>
          <button class="par-reset" id="parReset" type="button" hidden>Reset</button>
        </div>
        <button class="prog-reset-all" id="progResetAll" type="button">Reset progression</button>
      </div>
```

- [ ] **Step 3: Build and verify the elements render**

Run: `make build && grep -c 'id="judge"\|id="parMeta"\|id="progResetAll"' dist/index.html`
Expected: `3`.

- [ ] **Step 4: Commit**

```bash
git add src/framework/shell.html
git commit -m "feat: add console DOM for adaptive-par prompt and progress meta"
```

---

### Task 4: Renderer - per-card "now" indicator + floor passthrough

The drill card shows `now 1.10s` once its par has moved off the pack default; the arm button carries the optional floor; the renderer exposes update hooks for the timer.

**Files:**
- Modify: `src/framework/renderer.js`

**Interfaces:**
- Consumes: `TORRELD.progress.getPar` (Task 1), `T.activeId` (set in `render()`).
- Produces on `T`: `updateCardNow(label: string, cur: number, def: number) -> void`, `refreshAllCardNow() -> void`. Produces button dataset key `data-floor` consumed in `wireDrills` -> `arm({ floor })` (Task 6).

- [ ] **Step 1: Add the "now" span and floor data to drill cards**

In `renderDrills`, change:

```js
      var spec = '<span><b>Timer</b> <span class="v">' +
        (t.mode === "circuit" ? "Circuit" : "Par") +
        '</span></span><span><b>Par</b> <span class="v">' + t.par + ' s</span></span>';
```

to:

```js
      var spec = '<span><b>Timer</b> <span class="v">' +
        (t.mode === "circuit" ? "Circuit" : "Par") +
        '</span></span><span><b>Par</b> <span class="v">' + t.par + ' s</span>' +
        '<span class="now" data-label="' + c.label + '" data-default="' + t.par + '" hidden></span></span>';
```

In the same function, change the arm button to carry the floor:

```js
        ' data-rest="' + t.rest + '"' +
        ' data-label="' + c.label + '">Arm timer</button>';
```

to:

```js
        ' data-rest="' + t.rest + '"' +
        ' data-floor="' + (t.floor != null ? t.floor : "") + '"' +
        ' data-label="' + c.label + '">Arm timer</button>';
```

- [ ] **Step 2: Add the paint helpers and expose them**

In `renderer.js`, just above `function render(packId){`, add:

```js
  function nowKey(packId, label){ return packId + "::" + label; }
  function r2(x){ return Math.round(x * 100) / 100; }

  function paintNow(span, packId){
    var label = span.getAttribute("data-label");
    var def = parseFloat(span.getAttribute("data-default"));
    var cur = (T.progress) ? T.progress.getPar(nowKey(packId, label), def) : def;
    if(r2(cur) !== r2(def)){
      span.textContent = "now " + cur.toFixed(2) + "s";
      span.hidden = false;
    } else {
      span.textContent = "";
      span.hidden = true;
    }
  }
  function refreshAllCardNow(){
    var pid = T.activeId;
    Array.prototype.forEach.call(
      document.querySelectorAll(".now"),
      function(s){ paintNow(s, pid); }
    );
  }
  function updateCardNow(label, cur, def){
    var span = document.querySelector('.now[data-label="' + label + '"]');
    if(!span) return;
    if(r2(cur) !== r2(def)){
      span.textContent = "now " + parseFloat(cur).toFixed(2) + "s";
      span.hidden = false;
    } else {
      span.textContent = "";
      span.hidden = true;
    }
  }
```

- [ ] **Step 3: Paint cards after each render, and expose the hooks**

In `render()`, change:

```js
    wireDrills();
  }

  T.render = render;
```

to:

```js
    wireDrills();
    refreshAllCardNow();
  }

  T.render = render;
  T.updateCardNow = updateCardNow;
  T.refreshAllCardNow = refreshAllCardNow;
```

- [ ] **Step 4: Build and verify**

Run: `make build && grep -c 'class="now"\|data-floor=' dist/index.html`
Expected: `2` or more (markup is generated at runtime from the template strings, so this confirms the template literals are inlined).

Run: `node -e "require('child_process')" 2>/dev/null; echo ok` is not applicable - instead open `dist/index.html` in a browser and confirm no console errors and cards render normally (no visible "now" yet).

- [ ] **Step 5: Commit**

```bash
git add src/framework/renderer.js
git commit -m "feat: render per-card adaptive-par now indicator and floor passthrough"
```

---

### Task 5: Styles for the prompt, meta line, and "now" indicator

**Files:**
- Modify: `src/framework/styles.css` (append a new section at end of file)

**Interfaces:**
- Consumes design tokens `--go`, `--amber`, `--amber-soft`, `--muted`, `--text`, `--line`, `--line2`, `--steel2`, `--radius`, `--tap`, `--mono`, `--sans`, `--gutter`. Produces visual styling for Task 3's classes.

- [ ] **Step 1: Append the styles**

At the end of `src/framework/styles.css`, add:

```css
/* ===== Adaptive par - judgment prompt + progression meta ===== */
.judge{
  display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  padding:10px var(--gutter);
  border-bottom:1px solid var(--line);
  background:var(--steel2);
}
.judge[hidden]{ display:none; }
.judge-q{ font:600 14px/1.2 var(--sans); color:var(--text); }
.judge-btns{ display:flex; gap:8px; margin-left:auto; }
.judge-btns button{
  min-height:var(--tap); padding:0 18px;
  border-radius:var(--radius); cursor:pointer;
  font:600 14px var(--sans);
}
.judge-made{ background:var(--go); color:#04140a; border:1px solid var(--go); }
.judge-tight{ background:transparent; color:var(--muted); border:1px solid var(--line2); }

.par-meta{
  display:flex; align-items:center; gap:8px; margin-top:6px;
  font:500 12px var(--mono); color:var(--muted);
}
.par-meta[hidden]{ display:none; }
.par-meta.flash{ animation:parflash .9s ease-out; }
@keyframes parflash{ 0%{ color:var(--amber); } 100%{ color:var(--muted); } }

.par-reset, .prog-reset-all{
  background:none; border:0; padding:2px 4px; cursor:pointer;
  color:var(--amber-soft); font:500 12px var(--sans);
  text-decoration:underline;
}
.par-reset[hidden]{ display:none; }
.prog-reset-all{ margin-top:8px; display:inline-block; }

.now{ margin-left:6px; color:var(--go); font:600 11px var(--mono); }
.now[hidden]{ display:none; }
```

- [ ] **Step 2: Build and eyeball**

Run: `make build`
Then open `dist/index.html`, expand the timer console, and confirm the `Reset progression` link shows under the drill label and is styled (underlined, amber-soft). The judge band stays hidden (no run completed yet).

- [ ] **Step 3: Commit**

```bash
git add src/framework/styles.css
git commit -m "style: adaptive-par prompt, par-meta line, and now indicator"
```

---

### Task 6: Timer wiring - load stored par, prompt on done, write-through

The behavioral core. `arm()` loads stored par; finishing a run shows the prompt and auto-expands; taps drive `TORRELD.progress`; manual par edits write through; reset controls work.

**Files:**
- Modify: `src/framework/timer.js`

**Interfaces:**
- Consumes: `TORRELD.progress.*` (Task 1), `T.updateCardNow` / `T.refreshAllCardNow` (Task 4, called guarded), DOM ids from Task 3. Drill key is `T.activeId + "::" + label`.
- Produces: no new public surface; behavior only.

- [ ] **Step 1: Add module state and DOM refs**

In `timer.js`, in the `/* ----- DOM refs ----- */` block, add the new refs to the `var` list (after `mPar, mCyc;`):

```js
  var judge, judgeMade, judgeTight, parMeta, parMetaText, parReset, progResetAll;
```

In the `/* ----- State ----- */` block, after the `mode`/`state` declarations, add:

```js
  var armedKey = null, armedDefaultPar = 1.5, armedFloor = null, armedLabelText = "";
  function r2(x){ return Math.round(x * 100) / 100; }
```

- [ ] **Step 2: Add the progression helpers**

Just above `/* ----- Arming a drill (called from renderer) ----- */`, add:

```js
  /* ----- Adaptive par UI helpers ----- */
  function drillKey(label){ return (T.activeId || "?") + "::" + label; }

  function showJudge(){ if(judge) judge.hidden = false; }
  function hideJudge(){ if(judge) judge.hidden = true; }

  function updateParMeta(){
    if(!parMeta) return;
    if(!armedKey){ parMeta.hidden = true; return; }
    var cur = T.progress.getPar(armedKey, armedDefaultPar);
    var streak = T.progress.getStreak(armedKey);
    var adapted = r2(cur) !== r2(armedDefaultPar);
    var txt = (adapted
        ? "Par " + cur.toFixed(2) + " (from " + parseFloat(armedDefaultPar).toFixed(2) + ")"
        : "Par " + parseFloat(armedDefaultPar).toFixed(2))
      + " &middot; " + streak + "/3 clean";
    parMetaText.innerHTML = txt;
    parMeta.hidden = false;
    if(parReset) parReset.hidden = !adapted;
  }

  function flashMeta(){
    if(!parMeta) return;
    parMeta.classList.remove("flash");
    void parMeta.offsetWidth;
    parMeta.classList.add("flash");
  }

  function onMadeIt(){
    if(!armedKey){ hideJudge(); return; }
    var res = T.progress.recordMadeIt(armedKey, armedDefaultPar, armedFloor);
    if(res.tightened){
      fPar.value = res.par.toFixed(2);
      if(state === "idle" || state === "done") showReady();
      flashMeta();
      if(T.updateCardNow) T.updateCardNow(armedLabelText, res.par, armedDefaultPar);
    }
    updateParMeta();
    hideJudge();
  }

  function onTooTight(){
    if(!armedKey){ hideJudge(); return; }
    T.progress.recordTooTight(armedKey, armedDefaultPar);
    updateParMeta();
    hideJudge();
  }

  function onParReset(){
    if(!armedKey) return;
    T.progress.reset(armedKey);
    fPar.value = parseFloat(armedDefaultPar).toFixed(2);
    if(state === "idle" || state === "done") showReady();
    if(T.updateCardNow) T.updateCardNow(armedLabelText, armedDefaultPar, armedDefaultPar);
    updateParMeta();
  }

  function onResetAll(){
    T.progress.resetAll();
    if(armedKey){
      fPar.value = parseFloat(armedDefaultPar).toFixed(2);
      if(state === "idle" || state === "done") showReady();
    }
    if(T.refreshAllCardNow) T.refreshAllCardNow();
    updateParMeta();
  }

  function onParEdit(){
    if(!armedKey) return;
    var v = num(fPar, armedDefaultPar);
    T.progress.setPar(armedKey, v);
    if(T.updateCardNow) T.updateCardNow(armedLabelText, v, armedDefaultPar);
    updateParMeta();
  }
```

- [ ] **Step 3: Load the stored par when arming**

In `arm(spec)`, replace:

```js
  function arm(spec){
    setMode(spec.mode);
    fPar.value = parseFloat(spec.par).toFixed(2);
```

with:

```js
  function arm(spec){
    setMode(spec.mode);
    armedLabelText = spec.label;
    armedKey = drillKey(spec.label);
    armedDefaultPar = parseFloat(spec.par);
    armedFloor = (spec.floor != null && spec.floor !== "") ? parseFloat(spec.floor) : null;
    fPar.value = parseFloat(T.progress.getPar(armedKey, spec.par)).toFixed(2);
```

Then at the end of `arm(spec)`, just before the closing `}` (after `setExpanded(true);`), add:

```js
    hideJudge();
    updateParMeta();
```

- [ ] **Step 4: Show the prompt when a run finishes**

In `onPar()`, in the final `else` branch (the `done` transition), change:

```js
    } else {
      state = "done";
      setStatus("Done", false);
      setGo("Start", false);
      if(raf){ cancelAnimationFrame(raf); raf = null; }
    }
```

to:

```js
    } else {
      state = "done";
      setStatus("Done", false);
      setGo("Start", false);
      if(raf){ cancelAnimationFrame(raf); raf = null; }
      if(armedKey){ showJudge(); setExpanded(true); }
    }
```

In `start()`, add `hideJudge();` as the first line of the function body so a fresh run clears any stale prompt:

```js
  function start(){
    hideJudge();
    audio();
```

- [ ] **Step 5: Resolve refs and bind listeners in init()**

In `init()`, after the existing `mPar  = $("mPar");  mCyc = $("mCyc");` line, add:

```js
    judge        = $("judge");
    judgeMade    = $("judgeMade");
    judgeTight   = $("judgeTight");
    parMeta      = $("parMeta");
    parMetaText  = $("parMetaText");
    parReset     = $("parReset");
    progResetAll = $("progResetAll");
```

Still in `init()`, after the `resetBtn.addEventListener("click", stopAll);` line, add:

```js
    if(judgeMade)    judgeMade.addEventListener("click", onMadeIt);
    if(judgeTight)   judgeTight.addEventListener("click", onTooTight);
    if(parReset)     parReset.addEventListener("click", onParReset);
    if(progResetAll) progResetAll.addEventListener("click", onResetAll);
    fPar.addEventListener("change", onParEdit);
```

- [ ] **Step 6: Build and walk the behavior by hand**

Run: `make build`
Open `dist/index.html` from `file://` and verify each:

1. Arm "Move-and-regrip". The par field shows `2.00`; par-meta reads `Par 2.00 &middot; 0/3 clean` (rendered as a middot); no Reset link; no `now` on the card.
2. Run it (Start, let it finish). The judge band appears: `How did that set go?` with `Made it` / `Too tight`. On mobile the sheet auto-expands.
3. Tap `Made it`. Band hides, par-meta reads `1/3 clean`. Repeat two more runs of `Made it`: on the third, par field becomes `1.90`, par-meta flashes and reads `Par 1.90 (from 2.00) &middot; 0/3 clean`, a `Reset` link appears, and the drill card shows `now 1.90s`.
4. Reload (live-site behavior, file:// has storage): par-meta still shows `1.90` after re-arming. (If the browser blocks file:// storage, it resets - that is the documented degrade.)
5. Run and tap `Too tight`: streak returns to `0/3`, par unchanged.
6. Type `1.50` into the par field and blur: par-meta updates to `Par 1.50 (from 2.00) &middot; 0/3 clean`, card shows `now 1.50s`.
7. Tap the per-drill `Reset`: par returns to `2.00`, `now` clears.
8. Tap `Reset progression`: every card's `now` clears and the armed par returns to default.

- [ ] **Step 7: Commit**

```bash
git add src/framework/timer.js
git commit -m "feat: drive adaptive par from the timer - prompt, write-through, resets"
```

---

### Task 7: Document the constraint exception + final verification

**Files:**
- Modify: `CLAUDE.md` (hard-constraints section)

**Interfaces:** none.

- [ ] **Step 1: Note the sanctioned storage use in CLAUDE.md**

In `CLAUDE.md`, in the hard-constraints bullet that begins "**No `localStorage` / `sessionStorage` / IndexedDB**", append this sentence to the end of that bullet (keep the existing text intact):

```
 The adaptive-par feature is the first sanctioned exception: it uses feature-detected `localStorage` (`torreld.progress.v1`) that degrades to in-memory session-only state when storage is unavailable, so the committed file still runs in the no-storage preview. See `docs/superpowers/specs/2026-06-30-adaptive-par-design.md`.
```

- [ ] **Step 2: Full verification pass**

Run: `node --test test/`
Expected: all 10 store tests PASS.

Run: `make build`
Expected: `built .../dist/index.html` with no error.

Run: `git grep -nE "(\xe2\x80\x94|&mdash;|&ndash;| -- )" -- src/framework/progress.js src/framework/styles.css docs/superpowers/specs/2026-06-30-adaptive-par-design.md docs/superpowers/plans/2026-06-30-adaptive-par.md`
Expected: no output (no em-dashes or `--` dashes introduced in new copy).

Re-walk Task 6 Step 6 items 1-8 one final time in the browser to confirm nothing regressed after the docs change rebuild.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: note adaptive-par as the sanctioned guarded-storage exception"
```

---

## Self-Review

**Spec coverage:**
- Behavior model (3-in-a-row -0.1, hold on too-tight, ignore neutral, floor, visible streak) -> Task 1 (rule) + Task 6 (prompt/streak display). Covered.
- Floor field, 0.6 default -> Task 1 `DEFAULT_FLOOR` + Task 4 `data-floor` passthrough + Task 6 `armedFloor`. Covered.
- State + persistence (versioned key, per-drill, par+streak persist, guarded degrade) -> Task 1 + tests. Covered.
- Judgment prompt in console, done-state only, clears on next run -> Task 3 DOM + Task 6 show/hide. Covered.
- Arming uses stored par + adapted marker + per-drill reset -> Task 6 `arm()` + `updateParMeta` + `onParReset`. Covered.
- Manual edits win + reset streak -> Task 6 `onParEdit` + Task 1 `setPar`. Covered.
- Per-card `now` indicator, targeted update not full re-render -> Task 4 `updateCardNow`. Covered.
- Reset-all control -> Task 3 DOM + Task 6 `onResetAll` + Task 1 `resetAll`. Covered.
- Build order (progress before timer) -> Task 2. Covered.
- CLAUDE.md constraint note -> Task 7. Covered.
- Verification incl. storage-disabled degrade + Playwright option -> Task 1 test `degrades to session-only`, Task 6 Step 6, Task 7. Playwright is optional and the manual walk covers the happy path; not separately scripted.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; no "handle edge cases" hand-waves.

**Type consistency:** `recordMadeIt(key, defaultPar, floor)` returns `{par, streak, tightened, atFloor}` - consumed in Task 6 `onMadeIt` using `res.tightened`/`res.par`. `getPar(key, fallback)`/`getStreak(key)` names match between Tasks 1, 4, 6. `updateCardNow(label, cur, def)` / `refreshAllCardNow()` defined in Task 4, called guarded in Task 6. DOM ids in Task 3 match the `$()` lookups in Task 6. Drill key format `<packId>::<label>` consistent across Task 1 tests, Task 4 `nowKey`, Task 6 `drillKey`.
