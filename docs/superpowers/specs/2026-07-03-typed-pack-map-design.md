# Typed pack map - design

## Problem

The landing picker renders all packs as equal cards with the identical eyebrow
`PROGRAM`, in registration order. The packs are not peers, and each pack's own
copy says so:

| Pack | Self-declared type (hero eyebrow) | Relationship |
|---|---|---|
| grip-first | "Dry-fire protocol" | The root; index/movement/follow-up hang on grip |
| grip-conditioning | "Conditioning supplement - companion to grip-first" | Not standalone; links to grip-first |
| reloads | "Dry-fire protocol" | Standalone skill |
| stage-planning | "Dry-fire protocol" | Standalone, cognitive |
| non-standard-starts | "Dry-fire overlay" | Taper worked against HFO Masters 2026 |

Three frictions:

1. **The lede contradicts the lineup.** The landing says "Commit to one and
   run it; each is a self-contained protocol" - but grip-conditioning is by
   its own copy not self-contained, and non-standard-starts is an overlay.
2. **No pick guidance.** Cards describe the pack, not the user's fault. A
   newcomer has nothing to match themselves against.
3. **The taxonomy is invisible.** Type and relationships exist only inside
   each pack's copy, after the pick has been made.

## Decisions (from brainstorming)

- **Typed map**, not a guided funnel or diagnostic index: cards keep equal
  weight, the picker labels the structure honestly, users self-select.
- **Per-card symptom line** added (not replacing description): one sentence
  describing the user's fault.
- **Grouped by type** on the landing: Protocols, then Overlays, then
  Supplements, each with a mono heading + one-line hint.
- **Static honest copy** for the time-bound overlay - no runtime date logic;
  the match stays named as the worked example.
- **Light in-pack cross-links** where a real relationship exists; no
  `relatesTo` machinery.

## Design

### Pack contract additions

Two new optional top-level fields per pack (siblings of `name`):

- `kind`: `"protocol" | "overlay" | "supplement"`. Drives landing grouping
  and the card eyebrow. Missing or unknown `kind` defaults to `"protocol"`.
- `symptom`: one sentence of "run this if" copy describing the user's fault,
  not the pack. Landing-only; OG cards and share stubs keep using `share`
  untouched.

No `relatesTo` field. Only one companion pair exists today; relationships
stay in copy until a second pair justifies machinery.

### Landing rendering

`renderLanding()` groups packs by kind in fixed order, each group with a mono
heading and a one-line hint that teaches the taxonomy:

```
PROTOCOLS       standalone programs - pick one and run it
  [grip-first] [reloads] [stage-planning]
OVERLAYS        short blocks that ride on your base program
  [non-standard-starts]
SUPPLEMENTS     no gun needed - runs alongside a protocol
  [grip-conditioning]
```

- Within a group: registration order (currently alphabetical by filename,
  which puts grip-first first among protocols - acceptable; no curation
  field until needed).
- A group with no packs renders nothing (no empty heading).
- Card eyebrow: the pack's kind (`PROTOCOL` / `OVERLAY` / `SUPPLEMENT`)
  instead of the flat `PROGRAM`.
- Card gains the symptom line between tagline and description, visually
  distinct (mono `RUN THIS IF` prefix or equivalent treatment; exact styling
  at implementation).
- Hero lede rewritten to match the taxonomy: pick a protocol by your fault;
  overlays and supplements ride alongside. Exact wording at implementation,
  under the repo writing-style rules.

### Symptom lines (drafts; final wording at implementation)

- **grip-first**: "The dot isn't where you expect after you move - or you
  don't know your fault yet." (doubles as the soft start-here signal)
- **reloads**: "Reloads feel like a pause: eyes leave the mag early, the
  seat is a gamble."
- **stage-planning**: "Your plan evaporates at the buzzer, or you rebuild it
  mid-stage."
- **non-standard-starts**: "Unloaded starts, table pick-ups, or an occupied
  support hand wreck your first shots."
- **grip-conditioning**: "Grip is right on the first array and gone by the
  last. No gun needed; pairs with grip-first."

### In-pack cross-links

- **grip-first**: one line in its program section pointing to
  grip-conditioning (`?pack=grip-conditioning`) as the off-range companion.
  The reverse link already exists in grip-conditioning's diagnosis intro.
- **non-standard-starts**: verify it links to grip-first where it claims the
  shared root; add the `?pack=grip-first` link if absent.
- reloads and stage-planning get no cross-links - no real relationship to
  point at; "runs alongside" is said once by the group hints.

## Components / files

- `src/framework/renderer.js` - grouped `renderLanding`, kind eyebrow,
  symptom line, kind default.
- `src/framework/styles.css` - group heading + hint styles, symptom-line
  style.
- `src/packs/*.js` - `kind` + `symptom` on all five packs; the two
  cross-link edits.
- `docs/ARCHITECTURE.md` - pack contract gains the two fields; landing
  section updated.
- `tests/test_build.py` - stays green; no build-pipeline change expected.

## Verification

- `make build` succeeds; `python3 -m pytest tests/` green.
- Playwright at 390px and 1200px:
  - Landing shows three labeled groups in Protocols / Overlays / Supplements
    order, with hints.
  - Every card shows kind eyebrow, tagline, symptom line, description.
  - Card click enters the pack; `?pack=<id>` deep links unaffected.
  - grip-first program section links to grip-conditioning and back.
- Deployed artifact still opens from `file://`; no fetch, no storage change.

## Out of scope

Runtime date logic, curriculum diagram, `relatesTo` machinery, OG card
changes, timer/adaptive-par changes, pack reordering machinery.
