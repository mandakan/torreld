---
name: new-pack
description: Use when the user wants to author a new TORRELD dry-fire training pack. Walks through framing the scenario down to one root fault, gathering motor-learning research as a standing lens for judging shooting-specific sources and picking rep/rest/spacing numbers, researching practitioner sources by tier, designing a primary-heavy drill set with par timers, assembling the pack JS file, and shipping it. Project-scoped to this repo.
---

# Authoring a TORRELD pack

A pack is a self-contained training protocol - a diagnosis, a five-session week, four to six drills, an evidence section, a tiered reference list. The framework renders any pack that satisfies the data contract. **Adding a pack is a content change, not a code change.** This skill is the playbook for the content.

Read [`CLAUDE.md`](../../../CLAUDE.md), [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md#data-model-pack-data-field) (data model), and skim an existing pack (`src/packs/grip-first.js`, `src/packs/reloads.js`) before starting - they show the voice and density to match.

---

## The lens - read this before anything else

Dynamic pistol shooting has almost no peer-reviewed research of its own. The **general motor-learning literature** does - and the dry-fire rep is exactly the kind of discrete, vision-led aiming task that literature studies. Use it as a **standing lens** with two jobs:

1. **Judge shooting sources.** When a respected practitioner says *"do 500 reps a day"* or *"talk yourself through every step on the start beep,"* the lens tells you which advice is supported by motor-learning research and which contradicts it.
2. **Pick numbers and language.** When choosing rep counts, rest intervals, random-delay ranges, cueing language, and session spacing, the lens gives you defensible defaults even when shooting-specific evidence is silent.

The full reference with citations lives in [`RESEARCH-LENS.md`](RESEARCH-LENS.md) - **read it once at the start of authoring a pack**, then refer back during the research and drill-design phases. The ten principles in brief:

| # | Principle | What it gives you |
|---|---|---|
| 1 | Distributed practice beats massed | 4-6 short sessions/week, not one long one |
| 2 | Variable / random practice beats blocked (contextual interference) | Random start delay; interleave drills |
| 3 | External focus of attention beats internal | Cue on the target / dot / mag, not body parts |
| 4 | Bandwidth / faded feedback beats constant KR | The par beep IS feedback; don't self-critique every rep |
| 5 | Self-controlled practice improves retention | Par times are starting values; user adjusts and logs |
| 6 | Specificity of practice (with limits on transfer) | Train with match-relevant cues; admit what dry fire can't do |
| 7 | Stages of learning + deliberate practice | Slow-and-perfect first, then under par; edge of ability |
| 8 | Quiet eye - vision leads the hand | Every drill has a pre-action vision step |
| 9 | Re-investment breaks autonomous skill under pressure | Build autonomy in dry fire; don't over-coach on stage |
| 10 | Mental rehearsal counts as real practice | Imagery between reps; eyes-closed isolation drills |

And the numeric heuristics derived from those principles (full table in [`RESEARCH-LENS.md`](RESEARCH-LENS.md#numeric-heuristics-derived-from-the-lens)):

- **Sessions/week:** 4-6 - distributed > massed
- **Session length:** 10-15 min - deliberate-practice attention span
- **Reps per circuit:** 8-12 - quality > volume past diminishing returns
- **Random start delay:** 1.5-3.5 s range (≥ 2 s spread) - contextual interference
- **Rest between circuit reps:** 3-5 s - long enough to reset deliberately
- **Cueing language:** external / outcome-focused
- **Quality criterion:** explicit pass/fail per rep

A pack that picks different numbers should say why.

---

## Copyright and attribution - read before writing a word

The pack content ships under **CC BY-SA 4.0** on a public, donation-supported repo (code is MIT). That license is honest only if the content is genuinely yours. Non-negotiable:

- **Write original expression.** The *techniques* you research are methods - not copyrightable, free to reuse. Their *wording, diagrams, tables, and images* are not. Every diagnosis line, drill `why`, `steps` bullet, and `evidence` body must be your own words, not a source's sentences reshuffled. If a drill is "ported" from a named product (e.g. Anderson's *Reload + 1*), re-express the method and credit it - never copy the description.
- **No third-party media.** Packs are text + CSS only. Never embed a source's image, diagram, or table. Keep it that way.
- **Credit every source twice.** It goes in the pack's `references` tiers (Phase 2) **and** in [`CREDITS.md`](../../../CREDITS.md). Facts (stage briefings, match details) are free to state but still get a source line. Names of books/programs/matches are used to credit only - no logos, no implied endorsement.
- **Cite, don't reproduce.** Link the source; don't quote its body. Wanting a verbatim quote is the signal to paraphrase.

If you can't write a pack without leaning on a source's exact words, stop - that's a content problem, not a formatting one. See [`CLAUDE.md` Licensing and attribution](../../../CLAUDE.md).

---

## Phase 1 - Frame the scenario

**Goal:** Reduce the user's request to one named root fault and one constrained scope. Everything downstream rests on this.

Answer four questions in one sentence each, in order:

1. **Who is this for?** Division, discipline, skill level. The same drill is different for a Production Optics intermediate than for a USPSA Open GM.
2. **What is the symptom?** What the user feels and reports. **Not** the root.
3. **What is the root fault?** The one mechanical or perceptual cause that drives the symptom.
4. **What's in scope for dry fire - and what isn't?** Be explicit about both. The honest "what dry fire can't" is a load-bearing part of the diagnosis section; it tells the user where to spend rare live-fire time.

The diagnosis section renders as a three-node chain: **Root → Symptom → Secondary**, plus a paired "can / can't" note.

### How to find the root fault

- **Start from elite practitioner consensus.** When PSTG, Modern Samurai, Anderson and Hwansik converge on a root, that's strong evidence.
- **Cross-check with the lens.** A "root" framed as conscious mechanics ("crush at 60% pressure with the support hand") triggers lens principle #3 (internal focus) and #9 (re-investment) - those are usually symptoms or cueing artefacts, not true roots. A root framed as a perceptual / vision / index cause ("eyes break the magwell early") aligns with #8 (quiet eye) and is usually the more durable framing.
- **Watch for symptom-as-root traps.** "Slow reloads" feels like a hand-speed problem; the literature is unanimous it's a vision-and-index problem. "Dot not on presentation" feels like a draw problem; the consensus is the grip ate it.
- **Constrain ruthlessly.** One pack, one root. If you find yourself wanting to teach two roots, that's two packs.

### When to ask the user before going further

If the framing has real branches the user has to pick (e.g. *"Production Optics or Production iron sights?"*, *"slide-lock reloads only, or in-battery too?"*), ask **before** drafting. Asking later wastes a draft.

---

## Phase 2 - Research

**Goal:** Three tiers of citations that ground the program. Sources go in the `references.tiers` array.

Use exactly three tiers in this order - they map to how a shooter actually checks claims:

### Tier 1 - Elite practitioners

People who win at the highest level and teach. Authority is results, not credentials.

- **PSTG (Practical Shooting Training Group)** - Stoeger, Hwansik Kim, Joel Park. Default starting point for IPSC/USPSA-adjacent material.
- **Modern Samurai Project** - Scott Jedlinski. Default for red-dot pistol.
- **Steve Anderson** - *Refinement and Repetition* is the par-time dry-fire format this whole framework mirrors.
- **Hwansik Kim** - analytical mechanics, often on YouTube.

Cite the **homepage** of the practitioner's site, not deep links to individual courses or videos that may rotate. If you cite a specific YouTube video, verify the URL resolves *now* - don't trust memory.

### Tier 2 - Coaching reference

Named coaches and academies that explain technique in plain language.

- **Charlie Delta Academy** - explainer-style blog posts.
- **Brian Enos forums + book** - decades of practitioner discussion + *Practical Shooting: Beyond Fundamentals.*
- **Lanny Bassham** - *With Winning in Mind,* mental management.

### Tier 3 - Peer-reviewed science (lens-anchored)

This tier is **where the lens does most of its work.** Pick the two or three principles from [`RESEARCH-LENS.md`](RESEARCH-LENS.md) that most directly apply to this pack's drills, and cite them. The defaults that apply to almost every pack:

- **Contextual interference** (lens #2) - why drills use random delay.
- **Specificity of practice** (lens #6) - grounds the dry-vs-live split.
- **External focus** (lens #3) - when the pack cues on outcomes, not body parts.

Add scenario-specific principles as appropriate:

- Reloads / draw indexing → **Fitts' law** (target-size and distance) - already cited in the reloads pack.
- Any vision-led skill (presentation, transitions, reload look-in) → **quiet eye** (lens #8).
- Any pack about match performance under pressure → **re-investment** (lens #9).
- Any pack with mental-rehearsal drills → **mental practice meta-analysis** (lens #10).

### Judging shooting-source advice with the lens

Before quoting a practitioner, check the advice against the **red-flag list** in [`RESEARCH-LENS.md`](RESEARCH-LENS.md#red-flags-when-reading-shooting-sources). Common patterns to flag:

- *"Do N hundred reps a day"* - violates distributed practice (#1) and ignores diminishing returns (#7).
- *"Think about your wrist / grip pressure / trigger finger on every shot"* - internal focus (#3); risks re-investment under pressure (#9).
- *"After every rep, ask yourself how it felt"* - constant KR (#4); the par beep already provides bandwidth feedback.
- *"Do exactly this drill 100 times in a row"* - blocked repetition (#2).

When a respected practitioner says something the lens flags, you have three honest options:

1. **Don't cite that specific claim.** Cite the practitioner for what they're right about; quietly drop the contradicted bit.
2. **Cite it and contradict it.** In the evidence section, name the disagreement and let the lens citation argue against it. Tone: *"X recommends doing 500 reps daily; the motor-learning literature on distributed practice and diminishing returns suggests less, more often."*
3. **Run the timer and the target.** If neither is conclusive in your context, say so. The caveat field exists for this.

### Verification

Spot-check source URLs with `WebFetch` before committing - practitioner sites move; YouTube videos disappear. For peer-reviewed citations, **prefer DOI links** (`https://doi.org/<DOI>`) - they're permanent, even when the publisher redirects.

**Optional deeper research:** for unfamiliar disciplines or a science section that needs more than the lens's standard set, invoke `/deep-research` with a focused question and harvest the verified findings into the `evidence` and `references` sections.

---

## Phase 3 - Assemble the drills

**Goal:** Four to six drills, **one** of which is primary and gets ~70% of session time. The primary attacks the root fault head-on.

### Composition

- **1 primary** (`primary: true, span: true`, both `prim` and `cyc` chips). Full-width card. The **circuit** mode reps it 8-12× with rest, building the motor pattern.
- **2-4 supporting drills**, each isolating one piece of the chain. Mostly **par** mode, one rep.
- **1 fatigue / pressure drill** at the end of the week as a **circuit**. Trains the skill in a degraded state.

### Per-drill design

Each drill card has five required fields:

| Field | What it does | Lens check |
|---|---|---|
| `chips`  | One or two type tags (`prim`, `par`, `cyc`) + one short category label. Three chips max. | - |
| `title`  | Two to four words, evocative. *"Move-and-regrip"*, *"Index-and-insert"*. | - |
| `why`    | Two sentences. The mechanism: what fault, why it works. **Not** the steps. | If your *why* is internal-focused, re-cast it externally (#3). |
| `steps`  | Three to five imperative bullets. Quality criteria explicit. | Steps use **external-focus language** (#3); include a **vision step** (#8); the quality criterion is binary pass/fail (#4, #7). |
| `read`   | Optional corrective block: `gate` (consistency check) + 1-3 `biases`. Read the miss, name the cause, give one fix. Optional `ref` on a gate/bias row cites a `references` entry by exact `src`; a gate's `regressTo` renders as a jump link to that drill's card. | Every `fix` is external-focus (#3), names a concrete action, and ends in something checkable; read the *right modality* for the skill; consistency before bias. See "Reading the result" below. |
| `timer`  | `{ mode, par, dmin, dmax, reps, rest }`. | Numbers come from the heuristic table above; deviations should be explainable. |

### Picking par times

- Start from a published GM-level number and add 30-50% to land at an intermediate target. *Reload + 1 at slide lock:* GM ≈ 1.4-1.6 s → intermediate ≈ 2.0-2.5; start the par at 2.0.
- Park the par at the **edge** of capability, not in the comfort zone - that's the deliberate-practice (#7) point.
- Random delays: 1.5-3.5 s for par mode, 1.5-3.0 s for circuit. **Range ≥ 2 s** preserves contextual interference (#2).
- Reps per circuit: 8-12. **Hard ceiling ~30** per skill per session - past that, you're paying fatigue for negligible learning (#7).
- Rest between circuit reps: 3-5 s. Enough to reset deliberately.
- Par times are **starting values** - say so in the intro (#5).

### Drill-step language: external focus is the default

When you draft drill steps, run them past lens #3. **External / outcome-focused** cueing is the default; internal cueing is occasionally permitted only for a specific mechanic in the cognitive stage of learning.

| Internal (avoid as default) | External (prefer) |
|---|---|
| "Rotate your wrist forward 15 degrees" | "Drive the dot above the target" |
| "Crush at 60% support-hand pressure" | "Send the gun to the target" |
| "Isolate the trigger finger" | "Break the shot on the par beep" |
| "Cant the gun" | "Index the dot in the upper third of the glass" |

A drill that reads as a body-parts checklist will teach the shooter to do exactly that under pressure - and re-investment (#9) will then break the skill on stage.

### Every drill needs a vision step

By lens #8 (quiet eye), the rep starts with the eyes, not with the hands. *"Lock your eyes on a small exact aim point before the gun comes up,"* *"keep your eye on the magwell until you feel the seat,"* *"fix your eyes on an exact point on the target, then close them."* If you can't write a vision step for a drill, double-check that it actually trains something.

### Reading the result - the corrective layer

The `steps` tell the shooter how to run the rep and what result to expect. The `read` block tells them what a *wrong* result means and what to do about it. It renders as a collapsed `<details>` on the card - a **between-session** tool, opened when a pattern persists, not a per-rep checklist. That framing is load-bearing: a per-rep "read your miss and fix it" habit is exactly the constant-KR (#4) and re-investment (#9) trap the lens warns against. Say "between sessions" in the drills intro or leave it implicit in the collapsed, diagnostic tone - never invite the shooter to consult it mid-string.

Shape is **gate then biases**:

```js
read: {
  gate:   { sign, cause, fix, regressTo, ref },   // is the rep even repeatable? rendered first
  biases: [ { sign, cause, fix, ref } ]            // 1-3 directional reads, only valid once it repeats
}
```

Rules, all enforced by the shape or the lens:

- **Consistency before bias.** The `gate` is the repeatability check - the tell that the result *scatters* (a different miss every rep). You cannot read a directional bias off an unrepeatable base, so the gate always comes first and its fix is almost always "regress".
- **Regression graph, one base per pack.** Each gate's `regressTo` names a more-foundational drill by its `label`. Exactly one drill is the **base** the chain bottoms out at - its gate has no `regressTo` and its fix is "slow down / halve the speed". Draw the chain before writing: every non-base drill must point at something closer to the root. (Grip-first: presentation -> eyes-closed index -> grip reference. Reloads: the clock/movement drills -> Reload + 1 -> Index-and-insert -> Eyes-on-the-mag.)
- **Read the right modality.** The observable tell depends on the skill. Grip/tactile drills read by **feel** (scatter, thumb drift, a gap under the palm); vision/index drills read by **dot position**; a stage-planning drill reads by **plan outcome** (the plan came out different, fell apart under the beep). Match the tell to what the shooter can actually see or feel.
- **Do not invent dot-direction for a grip drill.** The intuitive "support hand overpowering -> dot high-left" mapping is a myth. Heeling throws *high-right* for a right-hander and is a recoil flinch that does not occur in a dry-fire freeze. Dot-*high* is a trajectory error (muzzle overshoots, head drops), not a grip tell. When you do assert a direction, keep it to what a source supports - "off to the support side" beats a false-precise "left" if the direction is only inferred.
- **`fix` is external-focus (#3), same as `steps`, and ends in something checkable.** Cue on the dot, the target, the tactile reference, the mag path - never muscle effort. Every fix names a concrete external-focus action and closes on something the shooter can check: a felt contact, a dot position, a plan outcome, or a count ("9 of 10 blind"). A `read` block full of "squeeze harder / rotate your wrist" teaches the body-parts fiddling that breaks under pressure, and a fix that only names a goal ("drive the gun all the way up") leaves the shooter guessing when it's done.
- **A terse fix earns its brevity from `cause`.** "Stop the circuit and go to X" is fine only when `cause` states the mechanism plainly enough that the order explains itself - the shooter must always see *why*, never just receive a command. If the why isn't legible in `cause`, that's the field to grow, not `fix`.
- **`ref` cites exactly one nameable source.** An optional `ref: "<src>"` on a gate or bias row holds the exact `src` string of an existing `references` entry, character-for-character - it resolves to a jump link at that entry. Add it only to rows genuinely grounded in that one source; never on a motor-learning-lens row, and never a raw external URL in drill data - the References section stays the one citation home.
- **`regressTo` renders as a working jump, not just a name.** The renderer turns a gate's `regressTo` into a "Go to `<drill>`" link that scrolls to that drill's card. Still name the drill in the fix prose - the shooter reads why before they follow the link.
- **Cross-pack pointers live in fix prose, not a new field.** When the real fix is a drill in a different pack (grip capacity gone under fatigue -> grip-conditioning), the fix text carries a plain `<a href="?pack=<id>">` anchor - the same mechanism the diagnosis copy already uses. Use it sparingly: one or two across the whole pack collection, not a habit.
- **Same citation bar as everything else.** Every `cause`/`fix` traces to a tier-1/2 source or the lens. Research the reads the way you research the drills - and apply the confidence discipline: soften weakly-grounded direction claims, and drop any read you cannot ground rather than shipping a plausible guess. If a read introduces a source the pack doesn't already cite, add it to `references` and [`CREDITS.md`](../../../CREDITS.md).
- **Optional.** A drill with no readable failure mode omits `read` entirely rather than forcing one.

### The five-session week

- **Three primary-focused** sessions (the root drill plus a supporting one).
- **One stage-context** session (movement, transitions, position work).
- **One pressure / fatigue** session.
- **10-15 min/session.** Quality over volume - that line goes in the program note verbatim.

Five sessions of 10-15 min hits the distributed-practice (#1) and deliberate-practice (#7) sweet spot. Don't compress to two long sessions.

---

## Phase 4 - Write the evidence section

Three or four items. Each item is a triple: `map` (the drill or feature this grounds), `h` (the principle in one line), `body` (two-to-three sentences of mechanism).

**The evidence section's spine is the lens.** For most packs, the right pattern is:

1. **One scenario-specific principle** - Fitts for reloads, eye-leads-hand for vision drills, etc.
2. **Variable practice / contextual interference** (#2) - justifies random delay and varied positions.
3. **Specificity** (#6) - justifies the dry-vs-live split.
4. **Measure to learn** - par timer as bandwidth feedback (#4); log to make progress data.

End with a `caveat` field that's red-bordered in render. Call out where the science is thinner than the program implies. Lens citations are mostly from lab tasks or other sports - say so. **Don't oversell.** *"Treat the science as direction, not proof - let your own timer and target data settle it."* is the house tone.

If you've used the lens to **contradict** a practitioner-source claim, the evidence section is where you say so plainly - see Phase 2, option 2.

---

## Phase 5 - Assemble the pack file

1. Copy `src/packs/grip-first.js` → `src/packs/<your-pack>.js`. Don't start from a blank file - the data shape is non-trivial and the existing file documents it.
2. Edit `id` (kebab, stable, used in `?pack=<id>` URLs), `name` (short label for the chip), `documentTitle` (used as `<title>`). **Name for the skill, not the occasion.** The `id`, filename, `name`, `documentTitle`, `share.title` and hero eyebrow all describe the *skill or fault trained* in generic terms - `non-standard-starts`, `reloads`, `stage-planning` - never a specific match, person, or event. A match-prep taper is fine; the match belongs in the body copy as the worked example (diagnosis, drills, evidence, `references`, `CREDITS.md`), not in the title. Keep `id` identical to the filename stem - the build derives the slug and share-stub path from the filename and matches it against `id:` at runtime.
3. Fill in the eight sections of `data` - `brand`, `nav`, `hero`, `diagnosis`, `program`, `drills`, `evidence`, `references`, `footer`. Schema in [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md#data-model-pack-data-field).
4. **ASCII dashes; entities only for non-dash symbols.** The render path is `innerHTML`, so a literal ` - ` displays fine. Use a single hyphen `-` for dashes (never `&mdash;`, `&ndash;`, double hyphen, or a raw em-dash), `...` for an ellipsis, and straight quotes (not `&lsquo;`/`&rsquo;`). Keep `&middot;` for the chip/readout separator and `&rarr;` where an arrow is the meaning. See the Writing style rule in [`CLAUDE.md`](../../../CLAUDE.md). Existing packs are the reference; match them.
5. **Author-trusted only.** Never wire runtime user input into pack data - it would be an XSS hole. If you ever need user-supplied strings in a drill name, switch that path to `textContent` in `renderer.js`.
6. Leave the `footer` line as in the existing packs unless the pack genuinely needs a different one.
7. **Update [`CREDITS.md`](../../../CREDITS.md)** in the same change - add any new practitioner, paper, or match-data source the pack introduces. The consolidated CREDITS list and the pack's in-app `references` must agree.

---

## Phase 6 - Build, verify, ship

```sh
make build                               # writes dist/index.html
python3 -c "import re,sys; s=open('dist/index.html').read(); \
  open('/tmp/check.js','w').write(re.search(r'<script>(.*)</script>', s, re.S).group(1))"
node --check /tmp/check.js               # JS syntax sanity
```

Then open `dist/index.html`:

- The new pack chip appears in the top bar (the switcher renders with ≥ 2 packs).
- `?pack=<your-id>` selects it; `?pack=` defaults to the first pack by filename.
- Arm one drill from each mode (par + circuit). Run a full cycle on mobile (≤ 480 px) and desktop widths to confirm the console behaves.
- Resize to 390 px wide; the console should collapse to the ~80 px bar.

Full build/deploy detail in [`docs/BUILD.md`](../../../docs/BUILD.md). Branching, commits, PRs in [`docs/CONTRIBUTING.md`](../../../docs/CONTRIBUTING.md).

---

## Common mistakes

- **Treating the symptom as the root.** "My reloads are slow" → drilling hand speed. The lens (#8) supports the eye-and-index framing.
- **Two primaries.** No centre of gravity. Pick one.
- **Internal-focus cueing.** "Rotate your wrist" instead of "drive the dot" - slower learning (#3) and likely to break under pressure (#9). The default is external; flag every internal step you write and check it's justified.
- **No vision step.** Lens #8 says the eyes lead - a drill missing the vision cue is missing the cue that elite-performer research keeps surfacing.
- **High-volume mindless prescriptions.** "100 reps a day" violates #1 and #7. Quality, distributed, at the edge.
- **Constant-feedback steps.** "After every rep, score yourself" - overrides the bandwidth feedback the par beep already provides (#4).
- **Soft quality criteria.** "Try to be smooth" doesn't tell the user when a rep doesn't count. Make it binary.
- **Citing what you haven't verified.** Don't paste URLs from memory. `WebFetch` or drop the link. Prefer DOI links for peer-reviewed work.
- **Dash entities or fancy typography in strings.** Use a single ASCII hyphen for dashes, `...` for ellipsis, straight quotes - never `&mdash;`/`&ndash;` or a raw em-dash. Keep `&middot;` and `&rarr;` only for those symbols. Match the existing packs.
- **Symptom-grade par times.** A GM time as the starting par teaches the user to fail. Start at intermediate; let them ratchet down (#5, #7).
- **A `caveat` that hedges nothing.** If the section reads as if the science settles the question, the user will trust it too far. The lens is mostly from lab tasks and other sports - say so.
- **Quoting practitioner advice the lens flags without contradicting it.** If a tier-1 source says "do 500 reps a day," either don't cite that claim or cite it and call it out.
- **An abstract `read` fix with no checkable end-state.** "Drive the gun all the way up" names a goal, not a stopping point - end on a felt contact, a dot position, a plan outcome, or a count.
- **A bare-command fix whose `cause` doesn't carry the why.** "Stop and go to X" only works when `cause` states the mechanism plainly enough that the order explains itself. If the shooter can't see why, grow `cause` - don't leave `fix` as an unexplained order.
- **A `ref` string that doesn't exactly match a `references` entry.** It has to resolve character-for-character to that entry's `src`, or the jump link breaks.
- **Copying a source's words or embedding its images.** Techniques are free to reuse; their expression is not. Paraphrase every line into your own voice, keep packs text-and-CSS only, and add the source to [`CREDITS.md`](../../../CREDITS.md). See the Copyright and attribution section above.

---

## Worked example: the Reloads pack

`src/packs/reloads.js` (committed in the same branch as this skill) followed this playbook end-to-end:

- **Frame.** IPSC Production Optics intermediate. Symptom: slow reloads. Root: vision (eyes break the magwell early - lens #8) + carrier index (no repeatable support-hand reference). Out of scope: recoil-fatigued reloads, slide closing under load - those need live fire (lens #6, specificity).
- **Research.** Tier 1 reused PSTG / Anderson / Modern Samurai / Hwansik from grip-first (already verified, durable links). Tier 2 added Brian Enos as a community reference; kept Charlie Delta and Bassham. Tier 3 added Fitts (1954) - the magwell is a small target - alongside contextual interference (#2) and specificity (#6) from the lens's default set.
- **Drills.** One primary (*Index-and-insert,* circuit, ~70% of time, 8 reps/circuit - lens #2, #7), three par-mode supporting drills (*Eyes-on-the-mag* explicitly trains lens #8; *Reload + 1* tests the whole sequence under bandwidth feedback - lens #4; *Position-to-position reload* applies lens #6, specificity), one fatigue circuit (*Reload under fatigue*).
- **Cueing.** All step language is external - *"send the mag to the well,"* *"drive the eye onto the magwell,"* *"break the shot on the par beep"* - never body-parts cues. Every drill opens with a vision step (#8).
- **Par times.** *Reload + 1* started at 2.0 s - intermediate target, ~30% above a GM number, edge-of-ability (#5, #7).
- **Caveat.** Fitts and eye-leads-hand hold up in simple aiming tasks; neither is measured specifically in pistol reloads at IPSC speeds. Said so.

Read that file alongside this skill - it's the worked answer to every section above.
