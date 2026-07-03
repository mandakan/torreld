# Typed Pack Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The landing picker groups packs by kind (Protocols / Overlays / Supplements) with honest type labels and per-card "run this if" symptom lines, plus two in-pack cross-links.

**Architecture:** Two new optional pack-contract fields (`kind`, `symptom`) rendered only by `renderLanding()` in `src/framework/renderer.js`; grouping is a fixed three-entry table in the renderer, missing/unknown `kind` defaults to `"protocol"`. No build-pipeline change: `build.py` extracts pack meta by field-name regex (`name`, `documentTitle`, `share` block), so the new fields are invisible to it.

**Tech Stack:** Vanilla ES5 JS, hand-written CSS, Python build (`make build`), pytest, Playwright MCP for visual verification.

## Global Constraints

- Single self-contained artifact; no network, no storage changes, works from `file://`.
- Vanilla ES5-level JS only; no new tooling.
- ASCII punctuation only in all copy: `-` for dashes, `...`, straight quotes. Allowed entities: `&middot;`, `&rarr;`, `&nbsp;`, symbol entities.
- No LLM slop phrases; no reflexive "not X but Y"; no rule-of-three cadence.
- Pack copy is author-trusted and rendered via `innerHTML`; strings may contain HTML.
- If a change contradicts docs, update the docs in the same PR.
- Repo has no JS unit-test harness; verification is `make build` + `python3 -m pytest tests/` + `node --check` + Playwright. Do not add a JS test framework.
- Every commit message ends with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Pack metadata - `kind` + `symptom` on all five packs

**Files:**
- Modify: `src/packs/grip-first.js` (~line 16, after `documentTitle`)
- Modify: `src/packs/reloads.js` (~line 16)
- Modify: `src/packs/stage-planning.js` (~line 16)
- Modify: `src/packs/non-standard-starts.js` (~line 24)
- Modify: `src/packs/grip-conditioning.js` (~line 16)

**Interfaces:**
- Produces: each registered pack object gains `kind` (string: `"protocol" | "overlay" | "supplement"`) and `symptom` (string, HTML-safe sentence, capitalized, no "Run this if" prefix - the renderer adds that). Task 2 reads `p.kind` and `p.symptom`.

- [ ] **Step 1: Insert the two fields in each pack**

In each file the `documentTitle:` line is followed by `share: {`. Insert the two new lines between them, exactly:

`src/packs/grip-first.js`:
```js
  documentTitle: "TORRELD - Grip-first dry-fire",
  kind: "protocol",
  symptom: "The dot isn't where you expect after you move - or you don't know your fault yet.",
```

`src/packs/reloads.js`:
```js
  documentTitle: "TORRELD - Reloads dry-fire",
  kind: "protocol",
  symptom: "Reloads feel like a pause - eyes leave the mag early and the seat is a gamble.",
```

`src/packs/stage-planning.js`:
```js
  documentTitle: "TORRELD - Stage planning dry-fire",
  kind: "protocol",
  symptom: "Your plan evaporates at the buzzer, or you rebuild it mid-stage.",
```

`src/packs/non-standard-starts.js`:
```js
  documentTitle: "TORRELD - Non-standard starts dry-fire",
  kind: "overlay",
  symptom: "Unloaded starts, table pick-ups, or an occupied support hand wreck your first shots.",
```

`src/packs/grip-conditioning.js`:
```js
  documentTitle: "TORRELD - Off-range grip conditioning",
  kind: "supplement",
  symptom: "Grip is right on the first array and gone by the last. No gun needed; pairs with grip-first.",
```

- [ ] **Step 2: Update the pack-contract header comment in each file**

Each file's header comment lists the contract. In all five files, after the line

```
 *   documentTitle - full title applied to <title> when this pack is active
```

add:

```
 *   kind          - "protocol" | "overlay" | "supplement"; groups the pack
 *                   on the landing picker (missing defaults to protocol)
 *   symptom       - one "run this if" sentence shown on the landing card;
 *                   describes the user's fault, not the pack
```

(`grip-conditioning.js` and `non-standard-starts.js` have slightly longer header comments; the `documentTitle` contract line is identical in all five.)

- [ ] **Step 3: Verify syntax and build**

Run: `for f in src/packs/*.js; do node --check "$f"; done && make build && python3 -m pytest tests/ -q`
Expected: no syntax errors, build prints `built dist/index.html ... 5 pack(s)`, pytest green.

- [ ] **Step 4: Commit**

```bash
git add src/packs/
git commit -m "Add kind and symptom fields to all five packs"
```

---

### Task 2: Renderer - grouped landing with kind eyebrows and symptom lines

**Files:**
- Modify: `src/framework/renderer.js:248-276` (the `renderLanding` function)

**Interfaces:**
- Consumes: `p.kind`, `p.symptom` from Task 1 (both optional - must render fine when absent).
- Produces: landing DOM with `.pgroup`, `.pgroup-head`, `.pgroup-hint`, `.pcard-symptom` class names that Task 3 styles. Card markup otherwise unchanged (`.pcard` is still `<a href="?pack=<id>" data-pack="<id>">` - `switcher.js` binds clicks by `.pcard`, do not rename that class or drop `data-pack`).

- [ ] **Step 1: Replace `renderLanding` with the grouped version**

Replace the entire existing `renderLanding` function (currently lines 248-276, from `function renderLanding(){` through its closing `}`) with:

```js
  var KIND_GROUPS = [
    { kind: "protocol",   head: "Protocols",   hint: "standalone programs - pick one and run it" },
    { kind: "overlay",    head: "Overlays",    hint: "short blocks that ride on your base program" },
    { kind: "supplement", head: "Supplements", hint: "no gun needed - runs alongside a protocol" }
  ];

  function packKind(p){
    var known = KIND_GROUPS.some(function(g){ return g.kind === p.kind; });
    return known ? p.kind : "protocol";
  }

  function renderLanding(){
    T.activeId = null;
    document.body.classList.add("is-landing");
    document.title = "TORRELD - Dry-fire training packs";

    document.getElementById("brand").innerHTML = "<b>TORR</b>ELD";
    document.getElementById("topnav").innerHTML = "";

    var n = T.packs.length;
    document.getElementById("hero").innerHTML =
      '<div class="wrap"><p class="eyebrow">Dry-fire training</p>' +
      '<h1>Pick a<br><span class="dim">program.</span></h1>' +
      '<p class="lede">Par-time-driven dry-fire packs. Pick the protocol that matches ' +
      'your fault and run it; overlays and supplements ride alongside. Each pack is a ' +
      'full case - diagnosis, plan, drills, evidence.</p>' +
      '<div class="hero-count">' + n + ' program' + (n === 1 ? "" : "s") + '</div></div>';

    var groups = KIND_GROUPS.map(function(g){
      var packs = T.packs.filter(function(p){ return packKind(p) === g.kind; });
      if(!packs.length) return "";
      var cards = packs.map(function(p){
        var s = p.share || {};
        return '<a class="pcard" href="?pack=' + p.id + '" data-pack="' + p.id + '">' +
          '<span class="pcard-eyebrow">' + g.kind + '</span>' +
          '<span class="pcard-name">' + p.name +
            '<span class="pcard-arrow" aria-hidden="true">&rarr;</span></span>' +
          (s.tagline ? '<span class="pcard-tagline">' + s.tagline + '</span>' : "") +
          (p.symptom ? '<span class="pcard-symptom"><b>Run this if</b>' + p.symptom + '</span>' : "") +
          (s.description ? '<span class="pcard-desc">' + s.description + '</span>' : "") +
        '</a>';
      }).join("");
      return '<div class="pgroup">' +
        '<h2 class="pgroup-head">' + g.head +
          '<span class="pgroup-hint">' + g.hint + '</span></h2>' +
        '<div class="pcards">' + cards + '</div></div>';
    }).join("");

    document.getElementById("app").innerHTML =
      '<section class="landing">' + groups + '</section>';
  }
```

Notes for the implementer:
- The eyebrow now shows the kind (`protocol` etc.); CSS uppercases it. The old flat `Program` string is gone.
- The `<b>Run this if</b>` label is a block element (Task 3 CSS); no colon, no space before the symptom text.
- The hero lede rewrite is part of this step (the old lede claimed every pack is self-contained, which grip-conditioning's own copy contradicts).

- [ ] **Step 2: Verify syntax and build**

Run: `node --check src/framework/renderer.js && make build && python3 -m pytest tests/ -q`
Expected: clean check, build succeeds, pytest green.

- [ ] **Step 3: Spot-check the artifact**

Run: `grep -c "pgroup-head" dist/index.html && grep -c "pcard-symptom" dist/index.html`
Expected: `pgroup-head` appears (>= 1), `pcard-symptom` appears (>= 1) - both from the inlined renderer source. (The landing DOM is built at runtime, so only the source strings are greppable.)

- [ ] **Step 4: Commit**

```bash
git add src/framework/renderer.js
git commit -m "Group landing picker by pack kind with symptom lines"
```

---

### Task 3: CSS - group headings and symptom-line style

**Files:**
- Modify: `src/framework/styles.css` (landing section, after `.landing{padding:36px 0 64px}` at ~line 225, and after `.pcard-tagline` block at ~line 279)

**Interfaces:**
- Consumes: `.pgroup`, `.pgroup-head`, `.pgroup-hint`, `.pcard-symptom` markup from Task 2. Design tokens already defined at `:root`: `--mono`, `--muted`, `--amber`, `--amber-soft`, `--text`.

- [ ] **Step 1: Add group heading styles**

Immediately after the `.landing{padding:36px 0 64px}` rule, insert:

```css
.pgroup{margin-bottom:36px}
.pgroup:last-child{margin-bottom:0}
.pgroup-head{
  display:flex;
  align-items:baseline;
  flex-wrap:wrap;
  gap:6px 14px;
  margin:0 0 14px;
  font-family:var(--mono);
  font-size:12px;
  font-weight:700;
  letter-spacing:.24em;
  text-transform:uppercase;
  color:var(--amber-soft);
}
.pgroup-hint{
  font-size:11px;
  font-weight:400;
  letter-spacing:.06em;
  text-transform:none;
  color:var(--muted);
}
```

- [ ] **Step 2: Add the symptom-line style**

Immediately after the `.pcard-tagline{...}` rule, insert:

```css
.pcard-symptom{
  padding:8px 12px;
  border-left:2px solid var(--amber);
  background:rgba(255,255,255,.03);
  color:var(--text);
  font-size:13px;
  line-height:1.5;
}
.pcard-symptom b{
  display:block;
  margin-bottom:2px;
  font-family:var(--mono);
  font-size:10px;
  font-weight:700;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:var(--amber-soft);
}
```

- [ ] **Step 3: Verify build**

Run: `make build && python3 -m pytest tests/ -q`
Expected: build succeeds, pytest green.

- [ ] **Step 4: Commit**

```bash
git add src/framework/styles.css
git commit -m "Style landing kind groups and symptom lines"
```

---

### Task 4: In-pack cross-links

**Files:**
- Modify: `src/packs/grip-first.js:61` (the `program.note` string)
- Modify: `src/packs/non-standard-starts.js:48` (the `diagnosis.intro` string)

**Interfaces:**
- Consumes: nothing from other tasks. Links use the existing `?pack=<id>` deep-link mechanism.

- [ ] **Step 1: grip-first program note gains the companion pointer**

In `src/packs/grip-first.js`, the program `note` currently ends with:

```
it attacks the root fault, the rest follows."
```

Change the full note value to (appending one sentence):

```js
      note: "10-15 min/session. Quality over volume - a bad rep doesn't count. <b>Spend ~70% of the time on Move-and-regrip</b>: it attacks the root fault, the rest follows. On days with no gun to hand, <a href=\"?pack=grip-conditioning\">off-range grip conditioning</a> is the companion that keeps the hands working."
```

(A link to grip-conditioning already exists deeper in a drill's fix block at ~line 242; leave it - this adds the program-level pointer.)

- [ ] **Step 2: non-standard-starts diagnosis intro links its root to grip-first**

In `src/packs/non-standard-starts.js`, the diagnosis `intro` currently ends with:

```
Stage 3 ties up the support hand entirely.
```

Append one sentence so the value ends:

```
Stage 3 ties up the support hand entirely. The base grip build this overlay rides on is <a href=\"?pack=grip-first\">grip-first</a>."
```

- [ ] **Step 3: Verify syntax and build**

Run: `node --check src/packs/grip-first.js && node --check src/packs/non-standard-starts.js && make build && python3 -m pytest tests/ -q`
Expected: clean, green.

- [ ] **Step 4: Commit**

```bash
git add src/packs/grip-first.js src/packs/non-standard-starts.js
git commit -m "Cross-link grip-first and non-standard-starts to their companions"
```

---

### Task 5: Documentation - ARCHITECTURE.md pack contract and landing section

**Files:**
- Modify: `docs/ARCHITECTURE.md:12` (registerPack contract line), `docs/ARCHITECTURE.md:22` (landing picker paragraph), `docs/ARCHITECTURE.md:~64` (data-model field list)

**Interfaces:**
- Consumes: field semantics from Tasks 1-2. No code.

- [ ] **Step 1: Update the registerPack contract line (line 12)**

Current text says packs call `registerPack({ id, name, documentTitle, share?, data })`. Update the signature to `registerPack({ id, name, documentTitle, kind?, symptom?, share?, data })` and append to that bullet:

```
`kind` ("protocol" | "overlay" | "supplement", default protocol) groups the pack on the landing picker; `symptom` is the one-sentence "run this if" line on its landing card.
```

- [ ] **Step 2: Update the landing picker paragraph (line 22)**

The paragraph beginning "There is no in-topbar pack switcher." describes "a masthead plus one card per registered pack". Extend that sentence so it reads:

```
a masthead plus one card per registered pack, grouped by `kind` in fixed order - Protocols, Overlays, Supplements - each group with a mono heading and a one-line hint; empty groups render nothing, and a missing or unknown `kind` falls back to protocol
```

(keep the rest of the paragraph - the `<a href="?pack=<id>">` interception and brand-home description - unchanged).

- [ ] **Step 3: Update the data-model field list (~line 64)**

After the `name:` line in the pack field listing, add two lines matching the file's existing comment style:

```
kind?:         string   // "protocol" | "overlay" | "supplement"; landing group (default protocol)
symptom?:      string   // one "run this if" sentence on the landing card; the user's fault, not the pack
```

- [ ] **Step 4: Commit**

```bash
git add docs/ARCHITECTURE.md
git commit -m "Document kind and symptom pack fields and grouped landing"
```

---

### Task 6: Playwright verification

**Files:** none (verification only; fix-forward if a check fails).

- [ ] **Step 1: Build and open the artifact**

Run `make build`, then open `dist/index.html` via Playwright with a `file://` URL, no storage assumptions (fresh context).

- [ ] **Step 2: Landing checks at 390px and 1200px**

- Three group headings visible, in order: PROTOCOLS, OVERLAYS, SUPPLEMENTS, each with its hint text.
- Protocols group holds Grip-first, Reloads, Stage planning; Overlays holds Non-standard starts; Supplements holds Grip conditioning.
- Every card shows: kind eyebrow, name + arrow, tagline, RUN THIS IF block with the symptom sentence, description.
- Hero lede is the new copy; program count still shows "5 programs".
- No horizontal overflow at 390px.

- [ ] **Step 3: Navigation checks**

- Click the Grip-first card: enters the pack, URL gains `?pack=grip-first`, console visible.
- Grip-first program section shows the off-range grip conditioning link; clicking it lands in grip-conditioning.
- Non-standard starts diagnosis intro links to grip-first.
- Direct load of `dist/index.html?pack=reloads` goes straight into Reloads (deep links unaffected).
- Brandmark returns to the landing.

- [ ] **Step 4: Final gates**

Run: `python3 -m pytest tests/ -q` and `git status` (clean tree, all work committed).
Expected: green, clean.
