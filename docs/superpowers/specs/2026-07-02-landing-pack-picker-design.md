# Landing pack picker - design

## Problem

Pack selection is a horizontal-scrolling pill rail in the topbar. It does not
scale as packs grow (5 today, more coming):

- **Desktop bug.** On desktop `.packs{justify-self:start}` makes the grid item
  size to its content instead of staying inside its `minmax(0,1fr)` track, so
  the `overflow-x:auto` scroll container never engages and the rail spills into
  the section-nav column. `RELOADS` / `STAGE PLANNING` print on top of
  `DIAGNOSIS` / `DRILLS`.
- **Mobile.** The rail scrolls but gives no hint of how many packs exist or
  where the list ends.

The scrolling-pill pattern is the wrong shape for a growing set of programs.

## Usage model

Primary use is **model A**: a user commits to one program and trains it for
weeks. Switching packs is rare. A newcomer, or someone browsing for
inspiration, benefits from a light onboarding surface that shows each pack's
purpose.

## Solution

Replace the pill rail with a **landing pack picker** - a dedicated home view
that lists every pack as a card (name + tagline + one-line description). The
committed user rarely sees it; the newcomer lands on it.

### Behavior (entry / exit flows)

| Entry | Result |
|---|---|
| `?pack=<valid id>` in URL | Straight into that pack (deep links, share stubs, bookmarks - unchanged) |
| Bare URL, a remembered pack exists | Straight into the remembered pack |
| Bare URL, no memory (first visit / cleared / storage blocked) | Landing picker |
| Brandmark tapped inside a pack | Back to landing picker |
| Card tapped on landing | Enter that pack; write `?pack=id` + remember it |

Entering a pack does two things: `history.replaceState` the `?pack=id` (so
reload and share stay put - already the behavior) and save the id to
feature-detected `localStorage`.

**Accepted edge:** a cold reload while sitting on the landing, when a pack is
remembered, re-enters that pack - because bare-URL + memory is defined to mean
"resume." Escape is one tap on the brandmark. Not special-cased.

### Persistence

New key `torreld.lastPack.v1` -> pack id string. Reuses the same
feature-detected storage probe the adaptive-par feature established in
`progress.js`. `progress.js` exposes its cached probe as `T.storage()` (returns
the storage object or `null`); `switcher.js` reads/writes `lastPack` through it,
so there is one storage-detection path, not two. When storage is blocked (the
no-storage preview sandbox), `T.storage()` returns `null`, `lastPack` is never
read or written, and every bare visit shows the landing - a clean degradation.

This is the **second sanctioned exception** to the no-storage constraint, after
adaptive-par. Both are feature-detected and degrade to session-only behavior.

### Landing view

Reuses the existing page regions, no new scaffold. A `body.is-landing` class
drives the differences:

- **Hero** (`#hero`): compact masthead - `TORR`**`ELD`** wordmark, a one-line
  purpose ("Dry-fire training packs"), a quiet count ("5 programs"). No
  hero-readout.
- **Main** (`#app`): responsive card grid. Mobile-first single column, two
  columns from ~640px up. Existing design tokens (steel fill, hairline borders,
  amber accents, mono eyebrows) so it reads as the same product.
- **Topbar**: brandmark plain (already home, no chevron); section nav empty.
- **Timer console**: hidden (nothing to time). `body` bottom padding reset to 0
  since the console no longer reserves space.

Card anatomy (whole card is the control), one per registered pack in
registration order:

```
+------------------------------------+
| PROGRAM                            |   mono eyebrow
| Grip conditioning              ->  |   pack.name, display face + arrow
| No gun needed                      |   share.tagline
| Raise the capacity floor so a      |   share.description, 1-2 lines
| good grip doesn't fade late.       |
+------------------------------------+
```

Content maps from each pack's existing `share` block (`tagline`,
`description`) plus `name`. No new pack data required. Cards are real
`<button>`s (or `<a href="?pack=id">`) - keyboard focusable, amber focus ring,
hover lift. Using `<a href>` gives right-click-open and middle-click for free
and degrades without JS; the click handler calls `setActivePack` and prevents
default. Prefer `<a href="?pack=id">`.

### Topbar / brandmark

The `.packs` pill rail is removed entirely - markup, CSS (`.packs*` + the
`--fade-l/--fade-r` mask machinery), and the `renderSwitcher` chip logic. That
deletes the colliding element, so the desktop overlap is fixed by construction.

The brandmark becomes the return control:

- Inside a pack: `< TORRELD` - a small back-chevron before the wordmark,
  `aria-label="All programs"`, pointer cursor, hover color shift, focus ring.
  Implemented as a `<button>` or `<a href="./">` wrapper so it is a real
  control, not a bare clickable logo.
- On the landing: plain `TORRELD`, not a link (we are already home).

Rationale: logo-as-home is a known but weak convention, weakest when the logo
is unmarked. Marking it (chevron + aria-label + control affordances) satisfies
best practice while keeping the single-click return. Switching is rare, so it
does not warrant dedicated nav chrome; and below 860px the section nav is
hidden, so a nav item would need its own mobile fallback. The brandmark is
always visible at every width.

## Components / files

- `src/framework/shell.html` - drop the `.packs` div; brand becomes a control
  wrapper.
- `src/framework/styles.css` - remove `.packs` rules + fade machinery; add
  `.landing` grid/card styles, `body.is-landing` overrides, brand-as-home
  states (chevron shown only when a class marks in-pack).
- `src/framework/progress.js` - expose `T.storage()` (the cached probe).
- `src/framework/switcher.js` - three-way boot decision, `lastPack`
  read/write, brand-home click handler, `renderLanding` dispatch. Remove
  `renderSwitcher` + fade helpers.
- `src/framework/renderer.js` - `renderLanding()` (masthead + card grid),
  toggle `body.is-landing`, show/hide console and brand chevron on
  enter/leave.
- `docs/ARCHITECTURE.md` - document the landing view, boot decision, and
  `lastPack` storage.
- `CLAUDE.md` - storage-constraint bullet gains `lastPack` as the second
  sanctioned localStorage use.
- `tests/test_build.py` - keep green; assert the build still inlines cleanly.

## Verification

- `make build` succeeds; `python3 -m pytest tests/` green.
- Playwright at 1200px and 390px:
  - Bare load with no storage -> landing renders, cards laid out, console
    hidden, no topbar overlap.
  - Click a card -> enters pack, `?pack=id` in URL, console visible, brand
    shows chevron.
  - Click brand -> returns to landing.
  - Reload after entering (storage available) -> resumes the pack.
  - `?pack=reloads` deep link -> straight into Reloads.
- Confirm the deployed artifact still opens from `file://` (no fetch added).

## Out of scope

Framework-only change. No pack-content edits. No change to the timer, adaptive
par, OG cards, or per-pack share stubs (those redirect to `?pack=id`, which
still deep-links straight in).
