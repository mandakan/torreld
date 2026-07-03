# Read-block links and fix sharpening

Date: 2026-07-03
Status: approved, in implementation
Builds on: 2026-07-01-corrective-read-blocks-design.md

## Problem

The "reading the result" blocks shipped compact by design, but four gaps show
up in use:

1. Some fixes are abstract ("drive the gun all the way up") - they name a goal,
   not an action you can check.
2. A gate fix that says "regress to Grip reference" is a dead end - the shooter
   scrolls and hunts for the card by hand.
3. Some failures genuinely live in another pack (grip capacity gone under
   fatigue -> the grip-conditioning pack) and there is no path there.
4. A shooter who wants the source behind a specific read has only the
   pack-level References list, with no pointer from the read to the entry.

## Decisions

The original pedagogy holds: the block stays collapsed, short, and
between-session. The new affordances are links and precision, not more prose
to read mid-session.

### 1. Fix-sharpening copy rule (data only)

Every read row is reviewed as a sign/cause/fix unit:

- `fix` names a concrete external-focus action and ends in something
  checkable - a felt contact, a dot position, or a count ("9 of 10 blind").
- A terse fix ("stop the circuit and go to X") is fine **only if** `cause`
  states the mechanism plainly enough that the order explains itself. The
  shooter must always be able to see *why*, never just be told what to do.
  If the why is not legible, `cause` is the field that grows, not `fix`.
- Length stays at 1-3 sentences per field. Rows that already pass stay
  untouched.

### 2. `ref` field: read row -> References entry

Optional `ref` on a gate or bias row, holding the exact `src` string of an
existing references entry:

```js
{ sign: "...", cause: "...", fix: "...", ref: "Griffith Shooting Solutions" }
```

Renders as a small tail link jumping to that entry in the in-page References
section, where the external URL already lives. One citation home: no external
links inside drill cards, no new CREDITS.md surface. Only rows grounded in one
nameable source get it; motor-learning-lens rows do not.

### 3. `regressTo` becomes a working jump

- Each drill card gets `id="drill-<slug>"`; each references entry gets
  `id="ref-<slug>"`. One shared slug function in `renderer.js` derives slugs
  from the drill `label` / reference `src`.
- A gate with `regressTo` renders a plain anchor after its rows:
  `<a class="read-jump" href="#drill-<slug>">Go to <name></a>`. Browser-native
  scroll, works from `file://`, no JS wiring.
- Arrival highlight is CSS-only via `.card:target` - a one-shot fade animation
  reusing the amber token. Persistent amber stays reserved for `.armed` (PR
  #26 rule); the `:target` flash decays to nothing.
- `scroll-margin-top` on cards and reference entries so the sticky topbar does
  not cover the landing point.
- The jump does **not** arm the target drill's timer - the card's own Arm
  button is one tap away, and auto-arming mid-session would surprise.

### 4. Cross-pack pointers stay prose

Where a fix truly lives in another program, the fix text carries a plain
`<a href="?pack=<id>">` anchor - the same mechanism the grip-conditioning
diagnosis copy already uses. No new data field. Used sparingly: one or two
places across all packs (the clear case is Grip under load's "capacity is
gone" read pointing at grip-conditioning).

## Scope

- **Framework:** `renderer.js` (slug fn, ids, jump/ref links), `styles.css`
  (`.read-jump`, `.read-src`, `:target` flash, scroll margins).
- **Data:** all five packs' `read` blocks get the copy pass; `ref` where
  grounded; the 1-2 cross-pack anchors.
- **Docs:** `docs/ARCHITECTURE.md` (`read` field shape), the `new-pack` skill
  ("Reading the result" section gains the checkable-fix rule, the
  cause-carries-the-why rule, `ref`, and the cross-pack-anchor guidance).
- **No changes** to `build.py`, `timer.js`, `switcher.js`, or the data shape
  of existing fields.

## Non-goals

- Auto-arming the regression drill's timer on jump.
- Inline external links inside drill cards.
- Per-rep live diagnostics (unchanged from the original spec).
- A generic cross-pack linking habit - pointers only where the fix lives
  elsewhere.
