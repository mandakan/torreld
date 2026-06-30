# Adaptive par - design

Status: approved, pre-implementation
Date: 2026-06-30
Scope: one feature, one implementation plan

## Problem

Par times in TORRELD are hardcoded starting values. The user has to guess when
and by how much to tighten them. The "Measure to learn" evidence card promises
progression the app does not actually deliver. We want the par to progress on
its own as the user demonstrates consistency, with no backend, no accounts, and
no complexity that makes the behavior hard to predict.

## What this is not

- Not performance logging, PR history, or charts.
- Not a multi-week plan engine.
- Not gamification (streaks-as-badges, points).
- Not per-rep scoring. The app cannot sense rep quality; the user supplies it.

## Behavior model

Each drill carries two pieces of state: a current par and a clean streak.

- A timer **run** is one Start-to-final-par-beep cycle. In par mode that is one
  rep; in circuit mode it is the whole circuit (8 or 10 reps). One run = one
  judgment.
- When a run reaches the `done` state, the console shows `How did that set go?`
  with two buttons: `Made it` and `Too tight`.
- `Made it` -> streak + 1. At **3 clean in a row**, current par drops **0.1s**
  and the streak resets to 0. The change shows in the par-meta line (the new
  par with `(from <default>)`) plus a brief `.flash` highlight - there is no
  separate confirmation toast.
- `Too tight` -> streak resets to 0, par holds (never raises - hold only).
- **Ignore** (start another run, or just leave it) is neutral: nothing changes.
- Each drill has a **floor**. At the floor, par simply holds (no further drop);
  the par-meta line keeps showing the floored value.
- The streak is always visible as `n / 3 clean` so the next drop is never a
  surprise.

The "one bad rep spoils the set" ethos from the program copy is preserved: if
any rep in a circuit was ugly, the set was not clean, so the user taps
`Too tight` (or ignores), not `Made it`.

### Floor

Floor is read from an optional `floor` field on a drill's `timer` spec. When
absent, it falls back to a global minimum (`0.6s`). Packs may set per-drill
floors but are not required to. Only the par adapts; rest and rep count in
circuit mode are untouched.

## State and persistence

- A single versioned key, `torreld.progress.v1`, holds a map:
  `{ "<packId>::<drillLabel>": { par: number, streak: number } }`.
- The drill key is `pack.id + "::" + drill.label`. `label` is already the stable
  identifier `arm(spec)` receives.
- All storage access is wrapped in `try/catch` with feature detection. If
  `localStorage` is unavailable (the sandbox preview forbids it), the module
  falls back to an in-memory object: adaptation works for the session and resets
  on reload. The committed artifact stays sandbox-legal.
- Both `par` and `streak` persist, so a half-built streak survives a reload on
  the live self-hosted site.
- Persistence is per-device and invisible (no export/portability in this
  version). URL-encoded portable state is a possible later addition, explicitly
  out of scope here.

## UI surfaces

- **Judgment prompt** renders in the timer console, only in the `done` state,
  and clears on the next run. Two buttons plus the `n / 3 clean` counter.
- **Arming uses stored par.** `arm(spec)` looks up the drill's stored par and
  loads that into the par field instead of the pack's starting value. A small
  marker appears when the live par differs from the pack default, alongside a
  per-drill `Reset to <default>`.
- **Manual edits win.** If the user types a par into the field by hand, that
  value becomes the stored current par for the drill and resets the streak. The
  feature never overrides a deliberate user choice.
- **Drill cards** show a subtle `now 1.10` indicator when a drill's par has
  moved off its starting value, so progress is visible without arming. Updated
  by a targeted DOM update on tighten/reset, not a full card re-render.
- **Reset all progression** - one control in the console sheet wipes the store
  back to pack defaults.

## Code structure

- **New module `src/framework/progress.js`** owns the store and the rule. Pure
  state plus storage, no DOM. Surface attached as `TORRELD.progress`:
  - `getPar(key, fallback)` - stored par or the fallback (pack default).
  - `getStreak(key)` - current clean count.
  - `recordMadeIt(key, floor)` - increments streak; at 3 applies the 0.1s drop
    (respecting floor) and resets streak; returns the outcome (new par, whether
    it tightened, whether at floor) so the caller can update the par field and
    meta line.
  - `recordTooTight(key)` - resets streak.
  - `setPar(key, val)` - manual write-through; resets streak.
  - `reset(key)` / `resetAll()` - restore defaults.
- **`timer.js` hooks:**
  - `arm()` reads stored par via `getPar` and loads it.
  - The `done` transition renders the judgment prompt and calls into
    `TORRELD.progress` on tap.
  - The `fPar` manual-edit handler calls `setPar`.
- **`build.py`** adds `progress.js` to the inject order *before* `timer.js` so
  `TORRELD.progress` exists when `timer.init()` runs.
- **`styles.css`** gains styles for the prompt, the streak counter, and the card
  `now` indicator, using existing `:root` design tokens.
- **`renderer.js`** gains the per-card `now` indicator hook (a data attribute it
  can target for the DOM update).

No new dependencies, no runtime network, still one inlined `dist/index.html`,
still vanilla ES5-level JS.

## Constraint impact

This feature uses `localStorage`, which the hard-constraints section of
`CLAUDE.md` forbids in committed source. The use here is the explicitly
sanctioned, feature-guarded roadmap path ("v2 persistence, feature-detected"):
storage is optional and the artifact degrades to session-only when it is
absent. `CLAUDE.md` gets a one-line update in the same PR noting that adaptive
par uses guarded storage, per the documented escape hatch.

## Verification

No automated test harness exists (the build is Python concatenation). Verify by
building and walking the rule:

1. `make build`, open `dist/index.html` from `file://`.
2. Three `Made it` taps drop par by 0.1, updating the par field and meta line.
3. Reload - the adapted par and any partial streak persist (live-site path).
4. `Too tight` holds par and resets the streak.
5. A manual par edit sticks and resets the streak.
6. Par stops dropping at the floor and holds.
7. `Reset to default` and `Reset all` restore starting values.
8. With storage disabled, adaptation works for the session and resets on reload
   (sandbox-legal degrade).

A Playwright smoke pass can automate the happy path (steps 2-4).
