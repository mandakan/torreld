# Collapsible desktop timer console (non-modal dock)

**Date:** 2026-07-01
**Status:** Approved, ready for implementation plan

## Goal

On desktop (>=860px) the timer console is currently pinned permanently open at
~204px. Make it collapsible like mobile, but as a **non-modal dock**: no page
dimming, content stays visible in both states. Default state on desktop is
**expanded (open)**.

Mobile behavior is unchanged (modal bottom sheet with scrim).

## Current behavior (baseline)

- `.console` is `position:fixed` at the bottom. `setExpanded(v)` in `timer.js`
  toggles `aria-expanded` on the console/grip/bar, toggles the scrim, toggles
  `body.console-open`, and adds/removes `inert` on `.console-panel`.
- Desktop CSS force-hides the grip, the compact bar, and the scrim, and pins
  `.console-panel` open regardless of `aria-expanded`.
- Nothing calls `setExpanded(true)` at boot. Because `.console-panel` ships
  with the `inert` attribute, the desktop panel is technically inert (controls
  dead) until the first drill is armed (`arm()` calls `setExpanded(true)`).
  Defaulting the dock open at boot removes `inert` and fixes this.
- `--console-h` drives `body` bottom padding: 92px mobile, 204px desktop
  (204 was just corrected from a stale 124 so the footer colophon clears the
  dock).

## Design

### Behavior

- Desktop collapsible dock with a slim grip strip (chevron) at the top of the
  console. Clicking it toggles expand/collapse.
- **Expanded (default):** full panel, ~204px, today's layout. Chevron points
  down (collapse affordance).
- **Collapsed:** the existing compact bar (`.console-bar`: grip + armed-drill
  label + mini readout + Start), slimmed for desktop (~64px). Chevron points
  up (expand affordance).
- No scrim / no dimming on desktop in either state. Content stays visible.
- Mobile unchanged: modal sheet + scrim, compact bar default.

### Body reservation

- Keep desktop base `--console-h: 204px` (expanded).
- Add desktop-only override: `@media(min-width:860px){ body.console-collapsed
  { --console-h: 64px } }` (final value tuned to the real slim-bar height
  during verification). Collapsing reclaims the difference; content reflows
  above the slim bar.
- Keyed off an explicit `console-collapsed` class (added only when collapsed),
  NOT off absence-of-`console-open`, so first paint (class absent) reserves the
  full 204px that matches the shown panel - no flash of overlap.

### Logic (`timer.js`)

- In `setExpanded(v)`, add: `document.body.classList.toggle("console-collapsed",
  !v);` (one line; harmless on mobile since the override is desktop-only media).
- At boot (`init`): if `window.matchMedia("(min-width:860px)").matches`, call
  `setExpanded(true)` so the desktop dock starts open, interactive (inert
  removed), and `console-collapsed` absent. Mobile keeps today's collapsed
  default (no boot call).
- Add a `matchMedia("(min-width:860px)")` change listener: on entering desktop,
  `setExpanded(true)`; on entering mobile, `setExpanded(false)`. Keeps a sane
  default per side across resizes. Use `addEventListener("change", ...)` with a
  fallback to `addListener` for older engines (ES5-level target).
- Existing grip click, bar-info click, ESC-to-collapse, and arm-auto-expand
  keep working unchanged.

### CSS (`styles.css`, desktop media query)

- Remove the blanket `.console-grip,.console-bar{display:none !important}` and
  `.scrim{display:none !important}` -> replace with state-aware rules:
  - Scrim stays hidden on desktop (non-modal): keep `.scrim{display:none
    !important}`.
  - Grip visible on desktop as a slim full-width strip with a chevron.
  - `.console[aria-expanded="true"]` -> show `.console-panel`, hide
    `.console-bar`.
  - `.console[aria-expanded="false"]` -> hide `.console-panel`, show
    `.console-bar` (slimmed for desktop; center within `.wrap`, monospace).
- Chevron: rotate based on `aria-expanded` (points down when open, up when
  collapsed). Prefers-reduced-motion already neutralizes transitions.
- Add the `body.console-collapsed { --console-h: ... }` reservation override.

### Markup (`shell.html`)

- Add an inline chevron SVG inside `#consoleGrip` (aria-hidden), shown on
  desktop, hidden on mobile (mobile keeps the `.grip-bar` handle). One small
  addition; no structural change. The compact bar and grip already exist.

### Accessibility

- Grip is already a real `<button>` with `aria-controls="consolePanel"` and
  `aria-expanded` reflecting state; `aria-label` toggles "Expand timer" /
  "Collapse timer". These already work - now they matter on desktop too.
- When collapsed, `.console-panel` is `inert` (existing behavior), so its
  controls are correctly removed from tab order; the slim bar's controls
  (Start) remain reachable.

### Persistence

Ephemeral. Collapse state resets to the per-viewport default on reload. It is
transient view state, not a saved preference, so no query param and no storage
(stays within the offline / no-storage constraints).

## Hard constraints honored

- Single self-contained offline artifact; vanilla ES5-level JS; any icon is
  inline SVG. No storage. Author-trusted content only (no user input on the
  render path).

## Files touched

- `src/framework/timer.js` - `console-collapsed` toggle, boot default by
  viewport, matchMedia listener.
- `src/framework/styles.css` - desktop dock states, slim-bar styling, chevron,
  reservation override.
- `src/framework/shell.html` - inline chevron SVG in the grip.
- `docs/ARCHITECTURE.md` - console UX section (desktop is now collapsible).

## Verification

- `make build`; `pytest tests/test_build.py`.
- Desktop (1280 + 860): dock defaults open and interactive; grip collapses to
  the slim bar with no dimming; colophon and page content clear the console in
  both states; expand/collapse toggles cleanly; arming a drill opens the dock.
- Mobile (390): unchanged - compact bar default, tap opens the modal sheet with
  scrim, ESC/scrim/outside-tap collapse.
- Resize across 860 both directions resets to the correct default.
- No first-paint overlap flash on desktop load.
