# Corrective "reading the result" blocks

Date: 2026-07-01
Status: approved, in implementation

## Problem

A drill card tells you *how to perform* the rep (`steps`) and *what result to
expect* (buried in the last step). It does not tell you what a wrong result
*means* or what to do about it. A shooter whose dot lands bottom-left on every
eyes-closed-index rep, or whose dot scatters everywhere, has no in-app path from
"my result is wrong" to "here is the likely cause and the correction".

## Goal

Add a compact, research-grounded corrective layer to each drill: read the miss,
name the likely cause, give one external-focus correction. Small enough to
absorb on a phone, honest with the pack's own anti-over-coaching stance.

## Decisions (from brainstorming)

- **Between-session diagnostic, not per-rep.** The layer is consulted when a
  pattern *persists* across a session, not after every rep. This respects the
  research lens: #4 (the par beep is the in-session bandwidth feedback; don't
  self-critique every rep) and #9 (over-coaching breaks skill under pressure).
- **Focused block per drill, collapsible.** A short block, collapsed by default
  so the card stays clean. Not a full troubleshooting matrix.
- **Gate + biases (structured).** The data shape encodes the pedagogy:
  consistency first, then direction.
- **Grounded to the same citation bar as the rest of the pack.** Every
  cause/fix traces to a tier-1/2 practitioner source or the motor-learning lens.
  Weakly-grounded direction claims are softened; ungrounded ones are dropped.

## Content model

New optional `read` field on a drill item:

```js
read: {
  gate:   { sign, cause, fix, regressTo? },   // consistency check, rendered first
  biases: [ { sign, cause, fix }, ... ]        // 1-3 directional reads
}
```

- **`gate`** answers "are my results even repeatable?" `sign` is the scatter
  tell, `cause` is "no repeatable base", `fix` is the regression instruction.
  `regressTo` optionally names a more-foundational drill by its `label` (machine-
  readable pointer for a future in-page jump; the MVP render just relies on the
  `fix` prose, which bolds the drill name).
- **`biases`** are the consistent-but-wrong reads: `sign` -> `cause` -> `fix`.
- `read` is **optional**. A drill with no readable failure mode omits it and
  renders exactly as before.

### Constraints carried from the pack's rules

- **`fix` is external-focus (lens #3)** - cue on the dot / target / tactile
  reference, never muscle effort. Same rule as `steps`.
- **Read modality matches the skill.** Grip/tactile drills read by *feel*
  (scatter, thumb drift, palm gap); vision/index drills read by *dot position*;
  a stage-planning drill reads by *plan outcome*. Do not invent dot-direction
  tells for a grip drill - the "support hand -> dot high-left" mapping is a myth
  (heeling throws high-right and is a recoil flinch, absent in a dry-fire
  freeze). Dot-high is a trajectory error, not a grip tell.
- **Consistency before bias.** The gate always renders first; you cannot read a
  directional bias off an unrepeatable base.
- **Regression graph.** Each pack has exactly one base drill the chain bottoms
  out at; its gate has no `regressTo` and its fix is "slow down". Every other
  drill's gate names a more-foundational drill.

## Render

- `renderRead(c.read)` in `renderer.js`, guarded by `if(!read)`. Emits a native
  `<details class="read"><summary>Reading the result</summary>...</details>` -
  zero JS, works from `file://`, collapsed by default. Inserted between `steps`
  and the timer `spec`.
- The gate row is boxed with an amber-soft left edge (visibly the prerequisite);
  bias rows are a plain sign / cause / fix list. Styling reuses existing tokens
  in `styles.css`; no new color semantics, no `build.py` change.

## Scope of this PR

All four packs plus the pattern:

- **grip-first** (prototype), **reloads**, **non-standard-starts**,
  **stage-planning** each get grounded `read` blocks. `stage-planning` reads by
  plan outcome, exercising the model's flex.
- **Framework:** `renderer.js` + `styles.css`.
- **Sources:** new sources leaned on get credited in the pack `references` and
  `CREDITS.md` (grip-first adds Griffith Shooting Solutions for the dot
  diagnostics; other packs as their research requires).
- **`new-pack` skill:** Phase 3 gains a "Reading the result" sub-section and the
  common-mistakes list gains the read-specific traps; `docs/ARCHITECTURE.md`
  documents the `read` field.

## Non-goals

- In-page jump from `regressTo` to the target card (future; `regressTo` is
  stored now to make it a data change later, not a re-model).
- Persistence / logging of which reads a shooter hit.
- Per-rep live diagnostics - deliberately excluded (lens #4/#9).
