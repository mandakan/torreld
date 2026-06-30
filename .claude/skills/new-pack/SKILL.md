---
name: new-pack
description: Use when the user wants to author a new TORRELD dry-fire training pack. Walks through framing the scenario (root fault, not symptom), researching sources by tier, designing a primary-heavy drill set with par timers, assembling the pack JS file, and shipping it. Project-scoped to this repo.
---

# Authoring a TORRELD pack

A pack is a self-contained training protocol — a diagnosis, a five-session week, four to six drills, an evidence section, a tiered reference list. The framework renders any pack that satisfies the data contract. **Adding a pack is a content change, not a code change.** This skill is the playbook for the content.

Read [`CLAUDE.md`](../../../CLAUDE.md), [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md#data-model-pack-data-field) (data model), and skim an existing pack (`src/packs/grip-first.js`, `src/packs/reloads.js`) before starting — they show the voice and density to match.

---

## Phase 1 — Frame the scenario

**Goal:** Reduce the user's request to one named root fault and one constrained scope. Everything downstream rests on this.

A good frame answers four questions. Write each one in one sentence before touching code.

1. **Who is this for?** Division, discipline, skill level. The same drill is different for a Production Optics intermediate than for a USPSA Open GM.
2. **What is the symptom?** What the user feels and reports — *"my reloads are slow"*, *"the dot isn't there on presentation"*. This is **not** the root fault; it's how the fault surfaces.
3. **What is the root fault?** The one mechanical or perceptual cause that drives the symptom. Most shooting symptoms have a small set of plausible roots — pick the one the literature and your own analysis converge on. If you can't pick one, the pack isn't ready.
4. **What's in scope for dry fire — and what isn't?** Be explicit about both. The honest "what dry fire can't" is a load-bearing part of the diagnosis section; it tells the user where to spend rare live-fire time.

The diagnosis section then renders as a three-node chain: **Root → Symptom → Secondary**, plus a paired "can / can't" note.

### How to find the root fault

- **Start from elite practitioner consensus.** When PSTG, Modern Samurai, Steve Anderson and Hwansik Kim agree on a root cause, that's strong evidence. Where they disagree, pick the framing that's most actionable in dry fire and say why.
- **Watch for symptom-as-root traps.** "Slow reloads" feels like a hand-speed problem; the literature is unanimous it's a vision-and-index problem. "Dot not on presentation" feels like a draw problem; the consensus is the grip ate it.
- **Constrain ruthlessly.** One pack, one root. If you find yourself wanting to teach two roots, that's two packs.

### When to ask the user before going further

If the framing has real branches the user has to pick (e.g. *"Production Optics or Production iron sights?"*, *"slide-lock reloads only, or in-battery too?"*), ask **before** you start writing. Asking later wastes a draft.

---

## Phase 2 — Research

**Goal:** Three tiers of citations that ground the program. Sources go in the `references.tiers` array.

Use exactly three tiers in this order — they map to how a shooter actually checks claims:

### Tier 1 — Elite practitioners

People who win at the highest level and teach. Their authority is results, not credentials.

- **PSTG (Practical Shooting Training Group)** — Stoeger, Hwansik Kim, Joel Park. Default starting point for IPSC/USPSA-adjacent material.
- **Modern Samurai Project** — Scott Jedlinski. Default for red-dot pistol.
- **Steve Anderson** — *Refinement and Repetition* is the par-time dry-fire format this whole framework mirrors.
- **Hwansik Kim** — analytical mechanics, often on YouTube.

Cite the **homepage** of the practitioner's site, not deep links to individual courses or videos that may rotate. If you cite a specific YouTube video, verify the URL resolves *now* — don't trust memory.

### Tier 2 — Coaching reference

Named coaches and academies that explain technique in plain language. Useful when the elite practitioners' content is paywalled or terse.

- **Charlie Delta Academy** — explainer-style blog posts.
- **Brian Enos forums + book** — decades of practitioner discussion, plus *Practical Shooting: Beyond Fundamentals* as the foundational reference.
- **Lanny Bassham** — *With Winning in Mind*, mental management.

### Tier 3 — Peer-reviewed science

Motor-learning research. **Be honest about the gap** between lab studies and dynamic pistol — the caveat field exists for exactly this. Two principles transfer cleanly to almost every shooting pack:

- **Contextual interference** (variable practice > blocked practice for retention/transfer). The reason drills use a random start delay.
- **Specificity of practice** (motor skills are task-specific). The reason dry fire trains some things and not others — and the reason national precision disciplines don't transfer.

For new packs, look for one or two principles that fit the specific scenario:

- **Reloads / draw indexing** → Fitts' law (aiming-time scales with target-size and distance).
- **Vision-led skills** (presentation, target transitions, reload look-in) → eye-hand coordination, quiet-eye literature.
- **High-pressure / match-mode** → mental practice meta-analyses, attentional focus research.

### Verification

Spot-check at least one or two source URLs with `WebFetch` before committing — practitioner sites move and YouTube videos disappear. If a URL won't verify (bot-blocked, etc.) and you're confident from history that it works (the homepage already cited in `grip-first.js`, for example), keep it; otherwise drop the link and keep only the prose citation.

**Optional deeper research:** for unfamiliar disciplines or a science section that needs more than the standard principles, invoke `/deep-research` with a focused question — *"What does the motor-learning literature say about reload-speed training in dynamic pistol?"* — and harvest the verified findings into the `evidence` and `references` sections.

---

## Phase 3 — Assemble the drills

**Goal:** Four to six drills, **one** of which is primary and gets ~70% of session time. The primary attacks the root fault head-on.

### Composition

- **1 primary** (`primary: true, span: true`, both `prim` and `cyc` chips). Full-width card. The "Circuit" mode reps it ~8–12× with rest, building the motor pattern.
- **2–4 supporting drills**, each isolating one piece of the chain or one related skill. Mostly `par` mode, one rep.
- **1 fatigue / pressure drill** at the end of the week as a `circuit`. Trains the skill in a degraded state.

### Per-drill design

Each drill card has five required fields. Pattern them like the existing packs:

| Field | What it does |
|---|---|
| `chips`  | One or two type tags (`prim`, `par`, `cyc`) plus one short category label. Three chips max. |
| `title`  | Two to four words, evocative. *"Move-and-regrip"*, *"Index-and-insert"*. The drill name shows up everywhere. |
| `why`    | Two sentences. The mechanism: what fault this drill trains, why it works. **Not** the steps. |
| `steps`  | Three to five imperative bullets. Quality criteria explicit (*"if it isn't perfect, the rep doesn't count"*). |
| `timer`  | `{ mode, par, dmin, dmax, reps, rest }`. Par times are **starting values** for an intermediate competitor — state that in the intro. |

### Picking par times

- Start from a published GM-level number and add 30–50% to land at an intermediate target. *Reload + 1 at slide lock:* top GM ≈ 1.4–1.6 s, advanced ≈ 1.7–2.0, intermediate ≈ 2.0–2.5. Start the par at 2.0.
- The user adjusts and logs their own — say so in the intro, don't agonize.
- Random delays: 1.5–3.5 s for par mode, 1.5–3.0 s for circuit (shorter for tempo). Match the existing packs.

### The five-session week

- Three primary-focused sessions (the root drill plus a supporting one).
- One stage-context session (movement, transitions, position work).
- One pressure / fatigue session.
- 10–15 min/session. Quality over volume — that line goes in the program note verbatim.

---

## Phase 4 — Write the evidence section

Three or four items. Each item is a triple: `map` (the drill or feature this grounds), `h` (the principle in one line), `body` (two-to-three sentences of mechanism).

End with a `caveat` field that's red-bordered in render — call out where the science is thinner than the program implies. Don't oversell. *"Treat the science as direction, not proof — let your own timer and target data settle it."* is the house tone.

---

## Phase 5 — Assemble the pack file

1. Copy `src/packs/grip-first.js` → `src/packs/<your-pack>.js`. Don't start from a blank file — the data shape is non-trivial and the existing file documents it.
2. Edit `id` (kebab, stable, used in `?pack=<id>` URLs), `name` (short label for the chip), `documentTitle` (used as `<title>`).
3. Fill in the eight sections of `data` — `brand`, `nav`, `hero`, `diagnosis`, `program`, `drills`, `evidence`, `references`, `footer`. Schema in [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md#data-model-pack-data-field).
4. **HTML entities, not literal characters.** The render path is `innerHTML`. Use `&mdash;` not `—`, `&middot;` not `·`, `&rarr;` not `→`. Existing packs are the reference; match them.
5. **Author-trusted only.** Never wire runtime user input into pack data — it would be an XSS hole. If you ever need user-supplied strings in a drill name, switch that path to `textContent` in `renderer.js`.
6. Leave the `footer` line as in the existing packs unless the pack genuinely needs a different one.

---

## Phase 6 — Build, verify, ship

```sh
make build                               # writes dist/index.html
python3 -c "import re,sys; s=open('dist/index.html').read(); \
  open('/tmp/check.js','w').write(re.search(r'<script>(.*)</script>', s, re.S).group(1))"
node --check /tmp/check.js               # JS syntax sanity
```

Then open `dist/index.html`:
- The new pack chip appears in the top bar (the switcher only renders with ≥ 2 packs).
- `?pack=<your-id>` selects it; `?pack=` defaults to the first pack by filename.
- Arm one drill from each mode (par + circuit). Run a full cycle on mobile (≤ 480 px) and desktop widths to confirm the console behaves.
- Resize to 390 px wide; the console should collapse to the ~80 px bar.

Full build/deploy detail in [`docs/BUILD.md`](../../../docs/BUILD.md). Branching, commits, PRs in [`docs/CONTRIBUTING.md`](../../../docs/CONTRIBUTING.md).

---

## Common mistakes

- **Treating the symptom as the root.** "My reloads are slow" → drilling hand speed. The eye-and-index angle is what the literature actually supports.
- **Two primaries.** If two drills both get 35% of practice time, the program has no centre of gravity. Pick one.
- **Soft quality criteria.** "Try to be smooth" doesn't tell the user when a rep doesn't count. Be specific — *"if the grip slipped, the rep doesn't count"*.
- **Citing what you haven't verified.** Don't paste URLs from memory. `WebFetch` or drop the link.
- **Hard-coded characters in HTML strings.** Em-dash, middle-dot, arrow — use the entity form, match the existing packs.
- **Symptom-grade par times.** Picking a GM time as the starting par teaches the user to fail. Start at an intermediate target; let them ratchet down.
- **A `caveat` that hedges nothing.** If the section reads as if the science settles the question, the user will trust it too far. The caveat is load-bearing.

---

## Worked example: the Reloads pack

`src/packs/reloads.js` (committed in the same branch as this skill) followed this playbook end-to-end:

- **Frame:** IPSC Production Optics intermediate. Symptom: slow reloads. Root: vision (eyes break the magwell early) + carrier index (no repeatable support-hand reference). Out of scope: recoil-fatigued reloads, slide closing under load — those need live fire.
- **Research:** Tier 1 reused PSTG / Anderson / Modern Samurai / Hwansik from grip-first (already verified, durable links). Tier 2 added Brian Enos as a community reference; kept Charlie Delta and Bassham. Tier 3 added Fitts (1954) — the magwell is a small target and a Fittsian aiming task — alongside contextual-interference and specificity from the standard set.
- **Drills:** One primary (*Index-and-insert*, circuit, ~70% of time), three par-mode supporting drills (*Eyes-on-the-mag*, *Reload + 1*, *Position-to-position reload*), one fatigue drill (*Reload under fatigue*, circuit).
- **Par times:** *Reload + 1* started at 2.0 s — intermediate target, ~30% above a GM number. User adjusts and logs.
- **Caveat:** Fitts and eye-leads-hand are robust in simple aiming tasks; neither is measured specifically in pistol reloads at IPSC speeds. Said so.

Read that file alongside this skill — it's the worked answer to every section above.
