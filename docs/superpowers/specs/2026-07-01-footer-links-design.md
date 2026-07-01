# Footer colophon: source + support links

**Date:** 2026-07-01
**Status:** Approved, ready for implementation plan

## Goal

Add two discreet in-app links to the bottom of the page:

- **Source** -> `https://github.com/mandakan/torreld`
- **Buy me a coffee** -> `https://www.buymeacoffee.com/thias`

They must read as quiet app chrome, not a call-to-action badge, and must not
disrupt the training content above them.

## Placement and structure

A single new static `<footer class="colophon">` element added to
`src/framework/shell.html`, immediately after the closing `</main>` tag and
before the timer `<aside class="console">`.

Rationale:

- These links are app chrome, identical for every pack. They belong in the
  framework markup, not in any pack's `data.footer` string. This means **zero
  edits to the pack files** and keeps MIT-licensed code chrome separate from
  CC-BY-SA pack content.
- Static HTML in the shell survives pack switches with **no renderer or JS
  changes** - the renderer only rewrites `#app`, which the colophon sits
  outside of.
- The existing per-pack `.footer` prose (last element inside `#app`) is left
  untouched. The colophon renders below it.

The repeated per-pack `data.footer` string is **not** deduped here - that is a
separate refactor and out of scope.

## The two links

Both are real `<a>` elements:

- `target="_blank" rel="noopener noreferrer"`
- Inline single-path SVG icon (`currentColor`, ~14px, `aria-hidden="true"`)
  followed by a visible text label, so each link has an accessible name from
  its text.
- **Source:** GitHub mark SVG + label `Source`.
- **Buy me a coffee:** generic coffee-cup SVG + label `Buy me a coffee`. A
  plain coffee-cup glyph is used deliberately instead of Buy Me a Coffee's
  brand logo - it stays on-theme, avoids reproducing a third-party brand mark,
  and reads as more discreet.

Icons are inline SVG so the file stays a single self-contained artifact that
works offline from `file://` (hard constraint: no external network at runtime).

## Visual design (discreet)

Styled in `src/framework/styles.css` to match the existing `.footer` prose so
it does not shout:

- Monospace (`--mono`), color `--muted2`, 11px, letter-spacing `.1em` - the
  same visual weight as the footer line directly above.
- Thin flex row, centered, `gap` between the two links.
- A hairline `border-top: 1px solid var(--line)` separator above the row.
- Icons ~14px, inline with the label text (flex, `align-items:center`, small
  gap).
- Hover: coffee link warms to `--amber`, source link to `--text`.
- Links carry the base `a` styling reset as needed (no underline border that
  the global `a` rule would otherwise add).

## Accessibility

- Real `<a>` elements with visible text labels.
- `:focus-visible` amber outline, reusing the existing focus pattern in the
  stylesheet.
- Minimum 44px tap target via link padding (project `--tap` convention).

## Explicitly out of scope

- No header/topbar icon.
- No dedup of the repeated per-pack `data.footer` string.
- No `localStorage` or persistence.
- No changes to `renderer.js`, `switcher.js`, or any pack file.

## Files touched

- `src/framework/shell.html` - add the static `<footer class="colophon">`.
- `src/framework/styles.css` - add `.colophon` styles.
- `docs/` - update any doc that enumerates shell structure if applicable
  (per CLAUDE.md: update docs the change affects in the same PR).

## Verification

- `make build` produces `dist/index.html` with the colophon present and both
  correct URLs inlined.
- Open `dist/index.html` from `file://`: both links visible at the bottom,
  correctly styled, open in a new tab, work with no network.
- Switch packs: colophon persists unchanged.
