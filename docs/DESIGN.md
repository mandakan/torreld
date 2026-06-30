# Design system & quality floor

Visual language and non-negotiable UX standards. Read [`../CLAUDE.md`](../CLAUDE.md) for context.

---

## Design system

### Visual language

Dark "range/tactical". The aesthetic borrows from professional shot timers and analytical-coaching dashboards: matte black surfaces, amber as the alert color, mono type for data, generous breathing room.

### Color tokens

All colors are CSS custom properties in `:root`. **Derive new colors from tokens; never hard-code hex values in rules.**

### Color semantics (keep meaningful — this is the signature)

- **amber** — default / standby / armed state. Calm-alert; the page's accent throughout.
- **green (`--go`)** — live run countdown. Only used while the timer is in the `running` state.
- **red (`--hot`)** — par fired, and the honest-limits caveat border. Reserved for the moment of impact.
- **amber-soft** — rest state in circuit mode.

These four states map 1:1 to readout color classes (`.go`, `.par`, `.rest`, default). Don't dilute the meanings.

### Typography

- Heavy uppercase system sans for display (headlines, section titles).
- Monospace for data, labels, the timer readout, and chips.
- The large monospace timer readout is the page's signature element. **Spend visual boldness there; keep everything else quiet.**

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

- **Mobile-first** — works at any width from 320 px up.
- **Reduced motion** — `prefers-reduced-motion: reduce` cancels all transitions, the pulse/flash, and the sheet slide. Keep any new motion behind this query.
- **Keyboard access**
  - Real `<button>` elements everywhere — never `<div onclick>`.
  - Visible `:focus-visible` outlines on every interactive element.
  - `aria-pressed` on toggles (mode switch, pack switcher chips).
  - Skip-link at the top of the page so keyboard users can jump past the header.
  - ESC dismisses the mobile timer sheet.
  - When the sheet is collapsed, the panel gets `inert` so focus and screen readers skip the hidden controls.
- **Print** — `@media print` hides the timer, topbar, scrim, and skip-link. The page renders as a flat document on white.
- **Offline** — no runtime network. System font stacks only. No CDNs, no web fonts. (Also a hard constraint; see [`../CLAUDE.md`](../CLAUDE.md).)

---

See also: [ARCHITECTURE.md](ARCHITECTURE.md) · [CONTRIBUTING.md](CONTRIBUTING.md) · [`../CLAUDE.md`](../CLAUDE.md)
