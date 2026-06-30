# Design system & quality floor

Visual language and non-negotiable UX standards. Read [`../CLAUDE.md`](../CLAUDE.md) for context.

---

## Design system

### Visual language

Dark "range/tactical". The aesthetic borrows from professional shot timers and analytical-coaching dashboards: matte black surfaces, amber as the alert color, mono type for data, generous breathing room.

### Color tokens

All colors are CSS custom properties in `:root`. **Derive new colors from tokens; never hard-code hex values in rules.**

### Color semantics (keep meaningful - this is the signature)

- **amber** - default / standby / armed state. Calm-alert; the page's accent throughout.
- **green (`--go`)** - live run countdown. Only used while the timer is in the `running` state.
- **red (`--hot`)** - par fired, and the honest-limits caveat border. Reserved for the moment of impact.
- **amber-soft** - rest state in circuit mode.

These four states map 1:1 to readout color classes (`.go`, `.par`, `.rest`, default). Don't dilute the meanings.

### Typography

- Heavy uppercase system sans for display (headlines, section titles).
- Monospace for data, labels, the timer readout, and chips.
- The large monospace timer readout is the page's signature element. **Spend visual boldness there; keep everything else quiet.**

### Brand mark

The mark is a flame with a transparent T cut out of it. The name TORRELD is Swedish for "dry fire" (torr = dry, eld = fire), so the flame is the concept and the T is the initial.

Shape: a single flame path filled with a bottom-to-top linear gradient (`#ff5a12` -> `#ffb02e` -> `#ffe0a0`), masked by a compound shape that knocks out a bold T. The T is seated at the flame's waist so the flame licks off the top of the letter - the cutout shows the background rather than a colored stroke.

The locked SVG source lives in two places:
- The `FAVICON_SVG` constant in `build.py` (single-line, inlined as a `data:` URI into `dist/index.html` and written to `dist/favicon.svg`)
- `src/framework/og-template.svg` (placed at 340% scale in the upper-right corner of the 1200x630 OG card as a decorative accent)

OG card color tokens: void background `#0a0d0e`, amber rule `#ffb02e` (8px horizontal bar at the top), type set in DejaVu Sans / DejaVu Sans Mono for deterministic rasterization across environments.

Do not alter the gradient stops or T cutout geometry without updating both source locations.

### Responsive

Mobile-first. Base styles target mobile; `min-width` media queries scale up.

- Breakpoints: 480 / 640 / 720 / 780 / 860 px
- Touch targets ≥ 44 px (via `--tap` token)
- Number inputs use 16 px font on mobile to prevent iOS focus-zoom
- Safe-area-inset respected for notch + home-indicator (`env(safe-area-inset-*)`)

See [ARCHITECTURE.md → Console UX](ARCHITECTURE.md#console-ux-mobile-sheet-desktop-strip) for the bottom-sheet pattern that drives the mobile experience.

---

## Quality floor (maintain)

These are non-regression standards. A change that breaks one of these should not ship.

- **Mobile-first** - works at any width from 320 px up.
- **Reduced motion** - `prefers-reduced-motion: reduce` cancels all transitions, the pulse/flash, and the sheet slide. Keep any new motion behind this query.
- **Keyboard access**
  - Real `<button>` elements everywhere - never `<div onclick>`.
  - Visible `:focus-visible` outlines on every interactive element.
  - `aria-pressed` on toggles (mode switch, pack switcher chips).
  - Skip-link at the top of the page so keyboard users can jump past the header.
  - ESC dismisses the mobile timer sheet.
  - When the sheet is collapsed, the panel gets `inert` so focus and screen readers skip the hidden controls.
- **Print** - `@media print` hides the timer, topbar, scrim, and skip-link. The page renders as a flat document on white.
- **Offline** - no runtime network. System font stacks only. No CDNs, no web fonts. (Also a hard constraint; see [`../CLAUDE.md`](../CLAUDE.md).)

---

## Claude Design sync

The design system is mirrored to a [claude.ai/design](https://claude.ai/design) project so the tokens and components can be browsed and extended visually. The mirror is a **one-way snapshot**, not a live link: the repo stays the source of truth, and changes made in the Claude Design project do not flow back automatically.

- **Project ID:** `011f583b-8581-4124-a438-8811c9195e21` ("TORRELD Design System")
- **Generator:** [`../scripts/design-sync-gen.py`](../scripts/design-sync-gen.py) - reads the live `src/framework/styles.css` and emits 21 self-contained preview cards. Dev tool only; not part of `make build`.
- **Bundle output:** `~/.claude-tmp/torreld-ds/bundle/` - disposable upload staging, not tracked.

### Resync after a token or component change

The push uses the `DesignSync` tool, so these are steps a Claude session runs, not shell commands you run directly (except the generator):

1. `python3 scripts/design-sync-gen.py` - regenerate the bundle from current styles.
2. `DesignSync finalize_plan` - `writes: ["**/*.html"]`, `deletes: []`, `localDir` = the bundle dir.
3. `DesignSync write_files` - upload all 21 files (uses the plan's `planId`).
4. `DesignSync register_assets` - **the step that's easy to forget.** Uploaded files do not appear as cards until they are registered. We skip the self-check app that would normally compile a `_ds_manifest.json` (it needs a `package.json`; TORRELD has none), so cards are created by this explicit call instead. Without it the pane shows zero cards.

Card groups: Foundations (4), Navigation (2), Hero (2), Content (4), Drills (2), References (1), Timer (3), Controls (3).

### Pulling refinements back

When something refined in the Claude Design project should ship, read it down with `DesignSync get_file` / `list_files` and translate it into `styles.css` (and a pack, if it is content) by hand. Keeping the round-trip one direction at a time - explore in Design, fold the keepers back here, then resync - avoids drift between the two.

---

See also: [ARCHITECTURE.md](ARCHITECTURE.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [`../CLAUDE.md`](../CLAUDE.md)
