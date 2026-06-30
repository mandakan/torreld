#!/usr/bin/env python3
"""Generate the Claude Design preview bundle from TORRELD's real framework styles.

Dev tool, NOT part of the build. The shipped artifact is still dist/index.html;
this only produces preview cards for the claude.ai/design design-system project.

Each output file is a self-contained preview HTML doc:
  line 1  -> <!-- @dsCard ... --> marker (documentation only - see note below)
  rest    -> full doc with the real styles.css inlined + a preview harness

The real styles.css is read from the repo so the cards never drift from source.

NOTE on @dsCard markers: they only become cards when a self-check app compiles
them into _ds_manifest.json. We skip that app (TORRELD has no package.json), so
cards are created by an explicit DesignSync register_assets call instead. See
docs/DESIGN.md -> "Claude Design sync" for the full procedure.

Output goes to scratch (~/.claude-tmp); it is disposable upload staging.
"""
import os, pathlib

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = pathlib.Path(os.path.expanduser("~/.claude-tmp/torreld-ds/bundle"))
CSS = (REPO / "src/framework/styles.css").read_text()

OUT.mkdir(parents=True, exist_ok=True)

# Preview harness: real tokens + component CSS, plus framing for an isolated card.
HARNESS_CSS = """
  /* --- preview harness (not part of the design system) --- */
  html,body{min-height:100%}
  body{padding:28px 22px 32px !important;overflow:auto !important}
  .ds-stage{max-width:var(--wrap-max);margin:0 auto}
  .ds-h{font-family:var(--mono);font-size:11px;letter-spacing:.24em;
        text-transform:uppercase;color:var(--muted);margin:0 0 18px}
  .ds-row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}
  .ds-note{font-family:var(--mono);font-size:11px;color:var(--muted2);
           letter-spacing:.04em;margin:10px 0 0;line-height:1.7}
  /* swatches */
  .sw{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  .sw .chipc{border:1px solid var(--line);border-radius:6px;overflow:hidden;background:var(--steel)}
  .sw .chipc .fill{height:64px}
  .sw .chipc .meta{padding:9px 11px;font-family:var(--mono);font-size:11px;line-height:1.5}
  .sw .chipc .meta .nm{color:var(--text);letter-spacing:.06em}
  .sw .chipc .meta .hx{color:var(--muted)}
  /* type specimens */
  .spec-type > * + *{margin-top:22px}
  /* console preview: pin the fixed console inside the card */
  .ds-console-host{position:relative;min-height:160px;border:1px dashed var(--line2);
                   border-radius:8px;overflow:hidden;background:var(--void)}
  .ds-console-host .console{position:absolute}
  .ds-static{position:static !important}
"""

def card(path, group, name, subtitle, body, w=900, h=None, title=None, host_console=False):
    marker = f'<!-- @dsCard group="{group}" name="{name}" subtitle="{subtitle}" w="{w}"'
    marker += f' h="{h}"' if h else ""
    marker += " -->"
    (OUT / path).parent.mkdir(parents=True, exist_ok=True)
    doc = f"""{marker}
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="dark">
<title>{title or name} - TORRELD</title>
<style>
{CSS}
{HARNESS_CSS}
</style>
</head>
<body>
<div class="ds-stage">
{body}
</div>
</body>
</html>
"""
    (OUT / path).write_text(doc)

# ----------------------------------------------------------------------------
# FOUNDATIONS
# ----------------------------------------------------------------------------

PALETTE = [
    ("--void",   "#0a0d0e", "page background"),
    ("--steel",  "#12171a", "card surface"),
    ("--steel2", "#1a2125", "raised gradient top"),
    ("--raise",  "#212a2e", "raised surface"),
    ("--line",   "#283034", "hairline border"),
    ("--line2",  "#3a4549", "stronger border"),
    ("--text",   "#dce3e5", "body text"),
    ("--muted",  "#8a9599", "secondary text"),
    ("--muted2", "#5d676b", "tertiary / dim"),
    ("--amber",  "#ffb02e", "accent / standby / armed"),
    ("--amber-soft", "#caa15a", "rest state"),
    ("--hot",    "#ff3b30", "par fired / limits"),
    ("--go",     "#43d27a", "live countdown"),
]
sw = "".join(
    f'<div class="chipc"><div class="fill" style="background:{hx}"></div>'
    f'<div class="meta"><div class="nm">{nm}</div><div class="hx">{hx} &middot; {use}</div></div></div>'
    for nm, hx, use in PALETTE
)
card("foundations/colors.html", "Foundations", "Color palette",
     "13 surface, line, text and signal tokens",
     f'<p class="ds-h">Color tokens (:root)</p><div class="sw">{sw}</div>'
     '<p class="ds-note">Derive new colors from these tokens. Never hard-code hex in rules.</p>',
     w=900, h=520)

SIGNALS = [
    ("--amber", "#ffb02e", "STANDBY / ARMED", "Default accent. Calm-alert; used throughout."),
    ("--go",    "#43d27a", "LIVE RUN",        "Only while the timer countdown is running."),
    ("--hot",   "#ff3b30", "PAR FIRED",       "The moment of impact, and the honest-limits caveat."),
    ("--amber-soft", "#caa15a", "REST",        "Rest interval in circuit mode."),
]
sig = "".join(
    f'<div class="node" style="border-left:3px solid {hx}">'
    f'<div class="tag" style="color:{hx}">{state}</div>'
    f'<div class="readout {cls}" style="font-size:46px;margin:6px 0 8px">1.50</div>'
    f'<p style="margin:0;font-size:13px;color:var(--muted)">{desc}</p></div>'
    for (var, hx, state, desc), cls in zip(SIGNALS, ["", "go", "par", "rest"])
)
card("foundations/color-semantics.html", "Foundations", "State color semantics",
     "amber / go / hot / amber-soft map 1:1 to readout states",
     '<p class="ds-h">Signal semantics (the signature - do not dilute)</p>'
     f'<div class="ds-row" style="gap:14px">{sig}</div>'
     '<p class="ds-note">These four states map 1:1 to readout classes: default, .go, .par, .rest.</p>',
     w=900, h=320)

card("foundations/typography.html", "Foundations", "Type scale",
     "Heavy uppercase sans display + mono data",
     '<p class="ds-h">Typography</p><div class="spec-type">'
     '<p class="eyebrow">Eyebrow / kicker label</p>'
     '<h1 style="font-size:clamp(48px,9vw,96px);text-transform:uppercase;letter-spacing:-.01em">'
     'Display<span class="dim"> head</span></h1>'
     '<h2 style="font-size:clamp(24px,4.5vw,40px);text-transform:uppercase">Section heading</h2>'
     '<h3 style="font-size:20px;text-transform:uppercase">Card heading</h3>'
     '<p class="lede" style="margin:0">Lede paragraph - the one place body text gets a little '
     'bigger. <strong>Strong</strong> lifts to full text color.</p>'
     '<p style="max-width:620px;color:var(--muted);margin:0">Body copy in muted gray for '
     'supporting text, set in the system sans stack at 16px / 1.55.</p>'
     '<div class="readout" style="font-size:clamp(54px,12vw,80px)">1.50</div>'
     '<p class="ds-note" style="margin:0">The large mono readout is the signature element. '
     'Spend visual boldness there; keep everything else quiet.</p>'
     '</div>',
     w=900, h=620)

SP = [("--gutter","16/24px","page gutter"),("--tap","44px","min touch target"),
      ("--radius","6px","card radius"),("--radius-sm","4px","control radius"),
      ("--wrap-max","1080px","content max width"),("--console-h","92/124px","timer console height")]
spr = "".join(
    f'<div class="node" style="padding:14px"><div class="tag">{var}</div>'
    f'<div style="font-family:var(--mono);font-size:18px;color:var(--amber);margin:6px 0 2px">{val}</div>'
    f'<p style="margin:0;font-size:12px;color:var(--muted)">{use}</p></div>'
    for var, val, use in SP
)
card("foundations/spacing-radius.html", "Foundations", "Spacing, radius & layout",
     "gutter, tap target, radius, wrap-max tokens",
     '<p class="ds-h">Layout tokens</p>'
     f'<div class="sw" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">{spr}</div>'
     '<p class="ds-note">Touch targets are >= 44px via --tap. Number inputs use 16px on mobile '
     'to prevent iOS focus-zoom. Safe-area insets respected for notch + home indicator.</p>',
     w=900, h=320)

# ----------------------------------------------------------------------------
# NAVIGATION
# ----------------------------------------------------------------------------

card("navigation/topbar.html", "Navigation", "Top bar",
     "Brandmark + pack switcher + section nav",
     '<p class="ds-h">Sticky top bar</p>'
     '<div class="topbar" style="position:static"><div class="wrap" style="grid-template-columns:auto minmax(0,1fr) auto;gap:22px">'
     '<div class="brandmark"><b>TORR</b>ELD</div>'
     '<div class="packs">'
     '<button aria-pressed="true">Grip-first</button>'
     '<button>Reloads</button>'
     '<button>Stage plan</button></div>'
     '<nav class="topnav"><a>Diagnosis</a><a>Program</a><a>Drills</a><a>Refs</a></nav>'
     '</div></div>',
     w=900, h=160)

card("navigation/pack-switcher.html", "Navigation", "Pack switcher chips",
     "Pill toggles, aria-pressed selected state",
     '<p class="ds-h">Pack chips (role=tablist)</p>'
     '<div class="packs" style="overflow:visible">'
     '<button aria-pressed="true">Selected</button>'
     '<button>Default</button>'
     '<button>Another</button></div>'
     '<p class="ds-note">Selected chip fills amber with dark text. Horizontal scroll-snap '
     'on overflow; scrollbar hidden.</p>',
     w=620, h=140)

# ----------------------------------------------------------------------------
# HERO
# ----------------------------------------------------------------------------

card("hero/hero.html", "Hero", "Hero block",
     "Eyebrow + display title + lede + readout badge",
     '<header class="hero" style="border-radius:8px"><div class="wrap">'
     '<p class="eyebrow">IPSC Production Optics</p>'
     '<h1>Grip<br><span class="dim">first</span></h1>'
     '<p class="lede">A par-time-driven dry-fire protocol. <strong>Range time is rare; '
     'dry fire is cheap.</strong></p>'
     '<div class="hero-readout"><span class="num">1.50</span>'
     '<span class="lab">Par seconds</span></div>'
     '</div></header>',
     w=900, h=460)

card("hero/readout-badge.html", "Hero", "Readout badge",
     "Inline number + label, amber glow",
     '<p class="ds-h">Hero readout badge</p>'
     '<div class="hero-readout"><span class="num">1.50</span>'
     '<span class="lab">Par seconds</span></div>',
     w=480, h=180)

# ----------------------------------------------------------------------------
# CONTENT
# ----------------------------------------------------------------------------

card("content/section-head.html", "Content", "Section head",
     "Lane tag + uppercase heading",
     '<p class="ds-h">Section head</p>'
     '<div class="section-head"><span class="lane">Phase 01</span><h2>Diagnosis</h2></div>'
     '<p class="intro">Intro paragraph sits below at a comfortable reading measure in muted text.</p>',
     w=900, h=200)

card("content/diagnosis-chain.html", "Content", "Diagnosis chain",
     "Cause nodes + arrows, root highlighted, can/cant notes",
     '<p class="ds-h">Diagnosis chain</p>'
     '<div class="chain">'
     '<div class="node"><div class="tag">Symptom</div><h3>Slow first shot</h3>'
     '<p>Draw-to-first-shot par drifts long.</p></div>'
     '<div class="arrow">&rarr;</div>'
     '<div class="node"><div class="tag">Mechanism</div><h3>Late grip</h3>'
     '<p>Support hand arrives after the gun is up.</p></div>'
     '<div class="arrow">&rarr;</div>'
     '<div class="node root"><div class="tag">Root fault</div><h3>Index</h3>'
     '<p>Grip is not built on the draw.</p></div>'
     '</div>'
     '<div class="note">'
     '<div class="can"><h4 class="can">Dry fire can fix</h4><p>Grip build, index, presentation timing.</p></div>'
     '<div class="cant"><h4 class="cant">Dry fire cannot fix</h4><p>Recoil tracking under live fire.</p></div>'
     '</div>',
     w=900, h=420)

card("content/program-week.html", "Content", "Program week",
     "Day cards, primary day highlighted",
     '<p class="ds-h">Weekly program grid</p>'
     '<div class="week" style="grid-template-columns:repeat(5,1fr)">'
     '<div class="day primary"><div class="n">Mon</div><div class="focus">Grip build</div>'
     '<ul><li>Draw to wall</li><li>Index check</li></ul></div>'
     '<div class="day"><div class="n">Tue</div><div class="focus">Presentation</div>'
     '<ul><li>Par ladder</li></ul></div>'
     '<div class="day"><div class="n">Wed</div><div class="focus">Rest</div>'
     '<ul><li>Mobility</li></ul></div>'
     '<div class="day"><div class="n">Thu</div><div class="focus">Transitions</div>'
     '<ul><li>Two-target</li></ul></div>'
     '<div class="day"><div class="n">Fri</div><div class="focus">Test</div>'
     '<ul><li>Bench par</li></ul></div>'
     '</div>'
     '<p class="weeknote">Primary day in <b>amber</b>. Keep volume honest - quality reps beat junk reps.</p>',
     w=900, h=320)

card("content/evidence.html", "Content", "Evidence items + caveat",
     "Claim-to-mechanism cards and a hot-bordered caveat",
     '<p class="ds-h">Evidence grid</p>'
     '<div class="evidence-grid">'
     '<div class="eitem"><div class="map">Maps to: grip drill</div><h3>Grip pressure</h3>'
     '<p>Consistent crush grip reduces shot-to-shot variance.</p></div>'
     '<div class="eitem"><div class="map">Maps to: index drill</div><h3>Visual index</h3>'
     '<p>Eyes lead the gun to the target before the press.</p></div>'
     '</div>'
     '<div class="caveat"><b>Honest limits:</b> dry fire trains timing and mechanics, '
     'not recoil management. Verify on the range.</div>',
     w=900, h=340)

# ----------------------------------------------------------------------------
# DRILLS
# ----------------------------------------------------------------------------

card("drills/drill-card.html", "Drills", "Drill card",
     "Chips + why + steps + spec row + arm button",
     '<p class="ds-h">Drill card (primary + armed variants)</p>'
     '<div class="drills" style="grid-template-columns:1fr 1fr">'
     # primary
     '<div class="card primary"><div class="card-top">'
     '<span class="chip prim">Primary</span><span class="chip par">Par</span></div>'
     '<h3>Draw to first shot</h3>'
     '<p class="why">Build the grip on the draw so the first shot breaks clean at index.</p>'
     '<ol><li>Holstered, hands relaxed.</li><li>On the beep, draw and press.</li>'
     '<li>Reset before par.</li></ol>'
     '<div class="spec"><span><b>Timer</b> <span class="v">Par</span></span>'
     '<span><b>Par</b> <span class="v">1.50 s</span></span></div>'
     '<div class="arm"><button type="button">Arm timer</button></div></div>'
     # armed circuit
     '<div class="card armed"><div class="card-top">'
     '<span class="chip">Drill</span><span class="chip cyc">Circuit</span></div>'
     '<h3>Reload under par</h3>'
     '<p class="why">Repeatable reload reps with rest between rounds.</p>'
     '<ol><li>Start at low ready.</li><li>Fire, reload, fire.</li></ol>'
     '<div class="spec"><span><b>Timer</b> <span class="v">Circuit</span></span>'
     '<span><b>Par</b> <span class="v">2.20 s</span></span>'
     '<span><b>Rest</b> <span class="v">8 s</span></span>'
     '<span><b>Reps</b> <span class="v">5</span></span></div>'
     '<div class="arm"><button type="button">Arm timer</button></div></div>'
     '</div>',
     w=900, h=560)

card("drills/chips.html", "Drills", "Chips",
     "Single accent: neutral default, amber primary",
     '<p class="ds-h">Chips</p>'
     '<div class="card-top" style="margin:0">'
     '<span class="chip">Default</span>'
     '<span class="chip prim">Primary</span>'
     '<span class="chip par">Par</span>'
     '<span class="chip cyc">Circuit</span></div>'
     '<p class="ds-note">One chip treatment. The .par and .cyc classes still flow '
     'from pack data but render as the neutral chip - the label carries the meaning, '
     'color stays a single accent.</p>',
     w=520, h=160)

# ----------------------------------------------------------------------------
# REFERENCES
# ----------------------------------------------------------------------------

card("references/reference-card.html", "References", "Reference card",
     "Source + grade badge + links, under a tier head",
     '<p class="ds-h">Reference tier</p>'
     '<div class="tier"><div class="tierhead">Tier 1 - Peer-reviewed</div>'
     '<div class="refs" style="grid-template-columns:1fr 1fr">'
     '<div class="ref"><div class="rhead"><span class="src">Schmidt &amp; Lee</span>'
     '<span class="grade">Textbook</span></div>'
     '<p>Motor learning and performance - spacing and contextual interference.</p>'
     '<a>Publisher</a><a>Summary</a></div>'
     '<div class="ref"><div class="rhead"><span class="src">Practical guide</span>'
     '<span class="grade">Practitioner</span></div>'
     '<p>Field-tested dry-fire structure from a competitive shooter.</p>'
     '<a>Link</a></div>'
     '</div></div>',
     w=900, h=300)

# ----------------------------------------------------------------------------
# TIMER
# ----------------------------------------------------------------------------

card("timer/readout-states.html", "Timer", "Readout states",
     "The signature readout in all four signal states",
     '<p class="ds-h">Timer readout - state colors</p>'
     '<div class="ds-row" style="gap:30px;align-items:flex-end">'
     '<div><div class="readout" style="font-size:64px">1.50</div>'
     '<div class="status"><span class="dot"></span>Ready</div></div>'
     '<div><div class="readout go" style="font-size:64px">0.82</div>'
     '<div class="status live"><span class="dot"></span>Running</div></div>'
     '<div><div class="readout par" style="font-size:64px">0.00</div>'
     '<div class="status">Par</div></div>'
     '<div><div class="readout rest" style="font-size:64px">8.0</div>'
     '<div class="status">Rest</div></div>'
     '</div>',
     w=900, h=240)

card("timer/console-desktop.html", "Timer", "Timer console - desktop",
     "Horizontal strip: mode/sound, readout, fields, actions",
     '<p class="ds-h">Timer console (desktop strip, >= 860px)</p>'
     '<div class="ds-console-host" style="min-height:150px">'
     '<aside class="console ds-static" aria-expanded="true" style="position:static">'
     '<div class="console-panel" style="max-height:none;opacity:1;overflow:visible"><div class="wrap">'
     '<div class="c-left">'
     '<div class="ctl"><span class="ctl-label">Timer</span>'
     '<div class="modeswitch"><button aria-pressed="true">Par</button><button>Circuit</button></div></div>'
     '<div class="ctl"><span class="ctl-label">Sound</span>'
     '<div class="modeswitch"><button aria-pressed="true">Match</button><button>Quiet</button></div></div>'
     '<div class="armed-label">Drill: <b>Draw to first shot</b></div></div>'
     '<div class="c-center"><div class="readout">1.50</div>'
     '<div class="status"><span class="dot"></span>Ready</div></div>'
     '<div class="c-right"><div class="fields">'
     '<div class="field"><label>Par (s)</label><input value="1.50"></div>'
     '<div class="field"><label>Delay min</label><input value="1.5"></div>'
     '<div class="field"><label>Delay max</label><input value="3.5"></div></div>'
     '<div class="actions"><button class="btn-go">Start</button>'
     '<button class="btn-ghost">Reset</button></div></div>'
     '</div></div></aside></div>',
     w=980, h=320)

card("timer/console-mobile.html", "Timer", "Timer console - mobile",
     "Compact bar (collapsed) and expanded bottom sheet",
     '<p class="ds-h">Timer console (mobile)</p>'
     '<div class="ds-row" style="gap:22px;align-items:flex-start">'
     # collapsed compact bar
     '<div style="flex:0 0 300px">'
     '<p class="ds-note" style="margin:0 0 8px">Collapsed bar</p>'
     '<div class="ds-console-host" style="min-height:auto">'
     '<aside class="console" style="position:static">'
     '<button class="console-grip"><span class="grip-bar"></span></button>'
     '<div class="console-bar">'
     '<button class="bar-info"><span class="bar-pill">Drill</span>'
     '<span class="bar-label">Draw to first shot</span></button>'
     '<div class="bar-readout">1.50</div>'
     '<button class="bar-go">Start</button></div>'
     '</aside></div></div>'
     # expanded sheet
     '<div style="flex:0 0 320px">'
     '<p class="ds-note" style="margin:0 0 8px">Expanded sheet</p>'
     '<div class="ds-console-host" style="min-height:auto">'
     '<aside class="console" aria-expanded="true" style="position:static">'
     '<button class="console-grip"><span class="grip-bar"></span></button>'
     '<div class="console-panel" style="max-height:none;opacity:1;overflow:visible"><div class="wrap">'
     '<div class="ctl"><span class="ctl-label">Timer</span>'
     '<div class="modeswitch"><button aria-pressed="true">Par</button><button>Circuit</button></div></div>'
     '<div class="c-center"><div class="readout" style="font-size:64px">1.50</div>'
     '<div class="status"><span class="dot"></span>Ready</div></div>'
     '<div class="fields"><div class="field"><label>Par (s)</label><input value="1.50"></div>'
     '<div class="field"><label>Delay min</label><input value="1.5"></div></div>'
     '<div class="actions"><button class="btn-go">Start</button>'
     '<button class="btn-ghost">Reset</button></div>'
     '</div></div></aside></div></div>'
     '</div>',
     w=720, h=560)

# ----------------------------------------------------------------------------
# CONTROLS
# ----------------------------------------------------------------------------

card("controls/buttons.html", "Controls", "Buttons",
     "Primary go, stop, ghost, arm, compact go",
     '<p class="ds-h">Buttons</p>'
     '<div class="ds-row" style="align-items:center;gap:16px">'
     '<button class="btn-go" style="min-width:120px">Start</button>'
     '<button class="btn-go stop" style="min-width:120px">Stop</button>'
     '<button class="btn-ghost">Reset</button>'
     '<button class="bar-go">Start</button>'
     '<button class="bar-go stop">Stop</button>'
     '</div>'
     '<div class="arm" style="max-width:280px"><button type="button">Arm timer</button></div>'
     '<p class="ds-note">Go fills amber; stop fills hot red. Ghost is outlined and quiet. '
     'Arm button is a full-width outlined action on drill cards.</p>',
     w=820, h=260)

card("controls/mode-switch.html", "Controls", "Mode switch",
     "Segmented toggle, aria-pressed selection",
     '<p class="ds-h">Segmented switch</p>'
     '<div class="ds-row" style="gap:20px">'
     '<div class="ctl"><span class="ctl-label">Timer</span>'
     '<div class="modeswitch"><button aria-pressed="true">Par</button><button>Circuit</button></div></div>'
     '<div class="ctl"><span class="ctl-label">Sound</span>'
     '<div class="modeswitch"><button aria-pressed="true">Match</button><button>Quiet</button></div></div>'
     '</div>',
     w=620, h=180)

card("controls/inputs.html", "Controls", "Number inputs",
     "Labeled mono fields, 16px to block iOS zoom",
     '<p class="ds-h">Number fields</p>'
     '<div class="fields" style="grid-template-columns:repeat(3,minmax(0,1fr));max-width:420px">'
     '<div class="field"><label>Par (s)</label><input value="1.50"></div>'
     '<div class="field"><label>Delay min</label><input value="1.5"></div>'
     '<div class="field"><label>Reps</label><input value="5" disabled></div>'
     '</div>'
     '<p class="ds-note">Disabled fields drop to 35% opacity. Spinners removed; centered mono text.</p>',
     w=620, h=220)

files = sorted(str(p.relative_to(OUT)) for p in OUT.rglob("*.html"))
print(f"Wrote {len(files)} cards to {OUT}:")
for f in files:
    print("  " + f)
