# Grip-conditioning pack - design

Date: 2026-07-01
Status: approved design, ready for implementation plan

## Goal

Add a new TORRELD pack, `grip-conditioning`, for people who want to work on
their grip when they do not have a gun to dry-fire with. It is the off-range
companion to `grip-first`. In the same PR, fold one well-sourced finding back
into `grip-first`: the support-hand-dominant pressure distribution, which the
existing pack never states.

This pack was scoped after a fact-checked research pass (see "Research basis").
The research changed the original idea substantially - an early "match equal
left/right grip pressure" drill was cut because the doctrine is not equal
squeeze, and a numeric pressure-matching drill turned out to be poorly
supported.

## Research basis

Findings that drove the design, with their strength:

1. **The elite competition grip is support-hand-dominant, not equal squeeze.**
   Near-unanimous across camps: firing hand light, support hand crushes as hard
   as it can short of pain or shaking. Joel Park (Ben Stoeger Pro Shop):
   "hold the gun with my firing hand with little pressure and crushing the gun
   as hard as I can with my support hand." Scott Jedlinski (Modern Samurai
   Project): the support hand is "almost 100% responsible" for keeping the gun
   steady. The only equal-crush voice is Chris Sajnog, a tactical instructor,
   not IPSC - flagged as the outlier. Confidence: high.

2. **Consistency comes from placement and wrist-lock, not force magnitude.**
   Repeatability is attributed to indexed contact points (placement) and, per
   Hwansik Kim, forearm-driven wrist lock. Kim: "Lots of people work on their
   grip strengths, but I focus on ... exercises that help locking my joints
   (wrists, elbows, and shoulders) because the joints affect the recoil
   management greatly." Crush force is treated as secondary. Confidence: high.

3. **A numeric "hit X% of max" pressure-matching drill is weak.** Force
   reproduction is poor at light force levels and only reliable at higher force.
   That is *why* the doctrine loads the support hand hard and keeps the firing
   hand light, but it also means a drill built on reproducing an exact pressure
   number is not defensible. Confidence: medium-high.

4. **Off-gun grip work is real but small and task-specific.** Hand-strength
   training yields about a 4 kg gain (Hedges g = 0.44); gripper work mostly
   "raises device scores" with little transfer; measured grip force is specific
   to the exact hand configuration. A police study links grip-strength
   magnitude to qualification scores, but it is correlational, in a
   weak-gripped population, and about magnitude, not consistency. Practitioner
   consensus (SSUSA): grip strength "should not be your primary focus."
   Confidence: high.

The honest consequence: off the range you cannot train placement (needs the
gun) or cheaply train force reproduction. What you *can* move is the capacity
floor - support-hand crush endurance and forearm-driven wrist lock - so a good
grip does not fade late in a long stage. That is the pack's entire claim.

## Thesis and honest limit

A consistent grip is built from placement (tactile index) + support-hand crush
+ wrist lock, and almost all of that needs the gun. So this pack does **not**
make a grip consistent. It builds the **capacity floor** that lets the grip
your technique already knows survive a full stage. Consistency itself lives in
`grip-first` plus live fire, and the diagnosis cross-links there. The limit is
stated up front in the Diagnosis section, not buried in a caveat.

## Pack identity

- `id`: `grip-conditioning`
- `name`: `Grip conditioning` (switcher chip)
- `documentTitle`: `TORRELD - Off-range grip conditioning`
- `share`: title "Off-range grip conditioning", tagline about training grip
  when you have no gun to hand, description tying it to the durability claim.

Data shape mirrors `grip-first.js` exactly (brand, nav, hero, diagnosis,
program, drills, evidence, references, footer). No framework changes: per the
repo contract, adding a pack is dropping one JS file in `src/packs/`.

## Sections

### Hero

Eyebrow ties it to dynamic pistol and to grip-first. Title two-word split in
the grip-first style (e.g. "No gun", "needed."). Lede states the durability
claim and the honest limit in one breath. Readout shows a hold time, not a
draw par, to signal this is conditioning (e.g. 12s).

### Diagnosis (leads with the limit)

- `lane`: e.g. "SCOPE"
- `intro`: what builds a consistent grip = placement + support-hand crush +
  wrist lock, most of which needs the gun; therefore this pack raises the
  capacity floor instead. Explicitly: it makes a good grip durable, it does not
  make a grip consistent - that is grip-first + live fire. Cross-link grip-first.
- `chain` (3 rungs, same shape as grip-first):
  - Root: **Support-hand crush endurance** - the support hand does the recoil
    work and is the hand that fails late when the forearm is cooked.
  - **Wrist lock** - forearm-driven joint lock, a capacity distinct from crush
    (Kim). Trained here, felt on the gun.
  - **What needs the gun** - placement, index, the grip pattern itself. Punted
    to grip-first, with a link.
- `notes.can`: support-hand crush endurance, forearm/wrist-lock engagement,
  extensor balance.
- `notes.cant`: placement, index, the actual grip pattern, and recoil control
  under live fire - and that grip strength is secondary to technique, so this
  is a floor, not the main lever.

### Program (the week)

Conditioning cadence, framed as a supplement that runs alongside grip-first,
never a replacement for range or dry-fire time. Same `sessions` array shape.

- 3 short sessions/week, 5-8 min each.
- Leave a rest day between hard crush-endurance sessions (it is strength/
  endurance work and needs recovery); wrist-lock and extensor work is lighter
  and fine most days.
- `note`: progression is by holding longer or adding resistance as it gets
  easy - log your own numbers; the par times are starting values. State plainly
  that this does not replace grip-first or live fire.

### Drills (2 primaries)

Both mirror the grip-first drill object shape: `chips`, `title`, `why`,
`steps`, `read` (with `gate` and `biases`), `timer`, `label`. Per the recent
"reading the result" work, every drill carries a `read` block.

#### Drill 1 - Support-hand crush endurance (circuit, primary)

- `why`: the support hand carries the recoil work; it fails late in a stage
  when the forearm is cooked. Build the endurance so the crush you make fresh is
  still there on the last array. Note the limit: this raises capacity, it does
  not teach placement.
- `steps`:
  1. Crush a rolled towel (or a gripper) in the support hand near-max, short of
     pain or shaking.
  2. Hold the crush to the par beep - the beep marks the end of the hold, not a
     shot.
  3. Rest, then repeat. Bias the work to the support hand; the firing hand is
     not the point.
  4. Stop the moment the crush fades to a limp squeeze - "right place, no force"
     is the failure to avoid, same logic as grip-first's Grip under load.
- Tiered equipment: zero-equipment = rolled towel / hand towel wring; if you
  have it = hand gripper hold or a dead hang from a bar. Put the tiered variant
  in the steps or the `why`, not as a separate card.
- `read.gate`: cannot hold to par even on rep 1 fresh -> the starting hold is
  too long; cut the hold time until rep 1 is clean, then rebuild.
- `read.biases`: (a) crush fades to a squeeze mid-set - that is the stop signal,
  end the set; (b) the firing hand or the arm starts bracing to help - keep the
  work in the support hand and stop when it alone cannot hold.
- `timer`: `mode: "circuit"`, `par: "12"`, `dmin: "1.5"`, `dmax: "3.0"`,
  `reps: "6"`, `rest: "30"`, `floor: "12"`. `floor` equals `par` so adaptive
  tightening is inert (see Timer semantics). Starting values only.

#### Drill 2 - Wrist-lock + forearm set (par, primary)

- `why`: Kim's method - recoil stability comes from locking the wrist via
  forearm engagement, a capacity separate from crush. Train the lock so it is
  available on the gun, and train the extensors that balance it.
- `steps`:
  1. Extend the arms as if presenting, no gun.
  2. Engage the forearm to lock the wrist flat/neutral against a static load -
     press the knuckles into a wall or hold a weighted object at extension.
  3. Hold to the par beep; feel the forearm doing the locking, not the hand
     crushing.
  4. Between holds, open the fingers against a rubber band for a controlled set
     of extensor reps - the antagonist that balances the lock.
- Tiered equipment: zero-equipment = wall press / water-bottle hold + rubber
  band on the fingers; if you have it = resistance band or a light dumbbell.
- `read.gate`: only the hand tightens and the forearm never engages -> regress
  to isolating the wrist lock with no load until you can feel the forearm set,
  then add load.
- `read.biases`: (a) the wrist breaks or flexes under the hold - reduce the load
  and hold the neutral lock; (b) the shoulder or elbow takes over - keep the set
  at the wrist/forearm.
- `timer`: `mode: "par"`, `par: "15"`, `dmin: "1.5"`, `dmax: "3.0"`,
  `floor: "15"`. Par mode forces `reps: 1`, `rest: 0`. `floor` equals `par` so
  adaptive tightening is inert. Run it several times per session.

Grip *strength* work (grippers, max squeeze) is a tiered "if you are below the
floor" note inside Drill 1's copy, not a third drill - the evidence
(g = 0.44, task-specific, "not your primary focus") will not carry a hero.

### Evidence (mapped to the drills, honest)

`items` mapping each claim to its drill, in the grip-first style:

- Support-hand-dominant doctrine (Park, Jedlinski) -> why the pack loads the
  support hand and why the crush-endurance drill trains that hand.
- Kim, joints over grip strength -> the wrist-lock drill.
- Off-gun strength is small and task-specific (hand-strength meta-analysis;
  gripper transfer; configuration-specific force) -> the honest limit; this is a
  conditioning floor, not a consistency source.
- Force reproduction poor at light load, reliable at high load -> why a hard
  support crush is repeatable and a light touch is not, and why there is no
  numeric pressure-matching drill.
- Specificity principle -> placement and index stay with the gun (grip-first).
- `caveat`: transfer evidence is drawn from non-shooting or non-elite
  populations and applies by analogy; treat it as direction, let your own log
  settle it. Same honesty stance as grip-first.

### References (tiers) + CREDITS

Three tiers as in grip-first. New sources this pack introduces (must also be
added to `CREDITS.md` in the same PR per the repo rule):

- Elite practitioners: Ben Stoeger Pro Shop grip-pressure articles (Joel Park,
  parts 1-2); Hwansik Kim joint-locking blog; Modern Samurai Project /
  Jedlinski (support-hand-dominant demo).
- Coaching / practitioner reference: SSUSA "Grip technique for action pistol"
  (strength secondary to technique). Optionally note Chris Sajnog as the
  documented dissent (equal 100/100), framed as the tactical outlier, not
  endorsed.
- Science (peer-reviewed): hand-strength training meta-analysis (g = 0.44);
  gripper-transfer review; grip-force configuration-specificity study;
  force-reproduction / proprioception study (light vs high load); specificity
  of practice; police grip-strength / qualification study (correlational).

Exact URLs live in the research output at
`tasks/wosmtl0x3.output` and will be transcribed into the pack and CREDITS.md
during implementation. Every link in the in-app References list must match
CREDITS.md.

## grip-first edits (same PR)

The support-hand-dominant pressure distribution is the one well-sourced finding
`grip-first` is missing - it nails placement but never states how hard each
hand presses. Add it in two small places, and upgrade the citations.

1. **Diagnosis intro**: one clause defining what a consistent support hand
   means - the support hand carries the crush, the firing hand stays light and
   just runs the trigger.
2. **Grip reference drill**: one actionable line pairing placement with the
   pressure split, at the point where the grip is built - "the support hand
   carries the crush; the firing hand stays light."
3. **References upgrade**: grip-first already cites PSTG and Kim, but via the
   "no-friction grip" clip. Add the more specific primary sources - Park's
   grip-pressure articles and Kim's joint-locking post - and mirror them in
   CREDITS.md.

Keep the edits minimal and in the pack's existing voice. grip-first is shipped
and carefully worded; the edits get the same clean-prose, docs-sync, and
CREDITS care as the new pack.

## Timer semantics (implementation note)

`timer.js` fires a Go beep after a random delay in `[dmin, dmax]`, then a par
beep `par` seconds later; circuit mode repeats with `rest` between reps. `par`
accepts any float, so multi-second holds (12-15s) render fine - the readout
counts down from e.g. `15.00`.

The adaptive-par system (`T.progress`) tightens `par` *downward* toward `floor`
on clean reps, assuming faster is better. Endurance holds progress the other
way (hold longer). To avoid fighting the engine, both hold drills set `floor`
equal to the starting `par`, which leaves no room to tighten and keeps
adaptation inert; the user progresses by editing par up. This is a deliberate,
documented use of the existing field, not a framework change.

## Build, test, verify

- `make build` inlines `src/` into `dist/index.html`. Confirm the new pack is
  picked up (per the contract, build globs `src/packs/`; verify, do not assume).
- Confirm the pack renders: switcher chip present, `?pack=grip-conditioning`
  selects it, both drills arm the timer, hold countdowns display, circuit rest
  advances, `read` blocks render.
- Run the existing `tests/test_build.py` and confirm green.
- Verify the offline / `file://` guarantee still holds (no new network use).
- Re-run the clean-prose pass over all new copy and the grip-first edits.

## Out of scope

- No numeric pressure-matching drill (research does not support it).
- No asymmetry-rehearsal drill (cut by decision; asymmetry stays with
  grip-first, gun in hand).
- No grip-strength "hero" drill; strength is a tiered note only.
- No changes to reloads, non-standard-starts, or stage-planning - the research
  does not meaningfully touch them.
- No persistence/logging work beyond what the existing adaptive-par system
  already provides.

## Open questions / risks

- A two-drill pack is lean. It is defensible given the honest scope, but
  confirm it reads as complete next to the fuller packs; the tiered variants and
  the program week add body.
- Whether to name the dissenting Sajnog source at all, or leave it out to keep
  the References list clean. Lean: a one-line "documented dissent" note, not a
  tier entry.
- Hold-time starting values (12s crush, 15s wrist-lock) are first guesses;
  they are explicitly starting values the user logs over, so precision is not
  critical.
