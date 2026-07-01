# TORRELD pack-differentiation plan

Handoff document for a follow-on agent. Three independent workstreams; can be done in one branch or split across PRs. Source of these recommendations: three parallel Plan sub-agents, briefed against `.claude/skills/new-pack/SKILL.md` and `RESEARCH-LENS.md` and the three existing pack files.

**Scope:** patches to `src/packs/grip-first.js` and `src/packs/reloads.js`. Stage-planning is the differentiated anchor - touch only the practitioner refs as noted.

**Out of scope (deliberately skipped):** framework structure, footer, the "X doesn't count" quality-criterion phrasing, the "Honest limit ... let your own data settle it" caveat shape. Those are house voice; changing them fragments the user experience.

---

## Workstream 1 - Closing-drill differentiation (HIGH priority)

The current closing drills `Grip under fatigue` and `Reload under fatigue` are near-verbatim copies (steps 1 and 3 identical, timer specs almost identical) despite stressing different mechanisms. Replace both with drills that expose the actual underlying mechanism.

### grip-first.js - replace "Grip under fatigue" with "Grip under load"

Mechanism the drill stresses: **physical degradation** (forearm endurance failure + elevated heart rate). Lens anchors: #6 specificity (train the state you'll perform in), #7 deliberate practice (push to binary failure, stop).

- **Title:** `Grip under load`
- **Chips:** `[{ cls: "cyc", label: "Circuit" }, { cls: "", label: "Grip &middot; endurance" }]`
- **Label:** `Grip under load`
- **`why`:** `The support hand fails late in a stage because the forearm is cooked and the heart rate is up &mdash; not because the technique forgot itself. Train the rep in that physiological state so the failure mode shows up here, not on the clock.`
- **`steps`:**
  1. `Before the circuit, raise your heart rate &mdash; 20 burpees, a sprint up the stairs, or 30&nbsp;s of hard isometric squeeze on a towel until the support forearm burns.`
  2. `Lock your eyes on a distant aim point. Run the move-and-regrip rep with the forearm shaking; drive the support hand to the same tactile reference as when fresh.`
  3. `Freeze on arrival and check the grip against the Grip-reference checks &mdash; same thumb placement, same contact, same commitment.`
  4. `If the contact slipped or the thumb wandered, the rep doesn't count. Stop the circuit at the first rep you can't pass cleanly.`
- **`timer`:** `{ mode: "circuit", par: "2.2", dmin: "1.5", dmax: "3.5", reps: "10", rest: "5" }`
  - par 2.2 = slightly slacker than fresh Move-and-regrip (2.0); still edge of ability (#7)
  - dmin 1.5 / dmax 3.5 = 2.0 s spread satisfies contextual interference (#2)
  - reps 10 = mid heuristic band (8-12); fatigue ceiling means quality breaks before volume (#7)
  - rest 5 = long end of 3-5 s band, HR is up so deliberate reset matters more (#7)
- **`program.sessions[4]`:** `{ n: "Session 05", primary: false, focus: "Movement", items: ["Move-and-regrip", "Grip under load"] }`

### reloads.js - replace "Reload under fatigue" with "Reload on a tightening clock"

Mechanism the drill stresses: **coordination / perceptual decay under deadline** (the eye snaps off the magwell early, the carrier index drifts). Lens anchors: #7 edge of ability via par ladder, #4 par beep as bandwidth feedback, #2 random delay across the ladder.

- **Title:** `Reload on a tightening clock`
- **Chips:** `[{ cls: "cyc", label: "Circuit" }, { cls: "", label: "Pressure &middot; coordination" }]`
- **Label:** `Reload on a tightening clock`
- **`why`:** `Late in a stage the reload fails because the eye gets lazy on the magwell and the carrier index drifts &mdash; coordination decay, not muscle burn. Compress the par until the look-in fails the binary check, then back off one step and hold there.`
- **`steps`:**
  1. `Start at par 2.0. Run a clean rep: eyes drive the mag to the magwell, hold on the well until you feel the seat, then release to the aim point.`
  2. `If the rep passes the look-in check, drop the par by 0.1&nbsp;s and run again. Keep tightening until a rep fails &mdash; the eye snapped up early or the index missed.`
  3. `Back the par off by 0.2&nbsp;s and finish the circuit there. Every rep at that par must pass the same binary look-in check.`
  4. `Reset between reps &mdash; eyes off the gun, eyes back to a fresh aim point, then re-arm.`
- **`timer`:** `{ mode: "circuit", par: "2.0", dmin: "1.5", dmax: "3.5", reps: "8", rest: "5" }`
  - par 2.0 = same intermediate starting point as Reload + 1; user ratchets down (#5, #7)
  - dmin 1.5 / dmax 3.5 = 2.0 s spread, matches the other par drills, contextual interference (#2) survives the ladder
  - reps 8 = low end of 8-12; ladder burns attention faster than flat circuit, cap volume (#7)
  - rest 5 = long end of 3-5 s; ladder needs clean perceptual reset between reps (#4)
- **`program.sessions[4]`:** `{ n: "Session 05", primary: false, focus: "Pressure", items: ["Reload + 1", "Reload on a tightening clock"] }`

### Workstream 1 acceptance checks

- Step 1 of grip-first's new drill and step 1 of reloads' new drill share **no verbatim phrasing**; neither uses "Run it late in the session, or after raising your heart rate."
- Each drill has an explicit **vision step** (lens #8): grip-first step 2 starts with "Lock your eyes..."; reloads step 1 has "eyes drive the mag to the magwell, hold on the well until you feel the seat".
- Each drill has a **binary pass/fail** quality criterion (lens #4, #7).
- Timer numbers fall inside the lens heuristic table (reps 8-12, rest 3-5 s, delay spread ≥ 2 s, par at edge of ability).
- `program.sessions[4].items` arrays in both packs reference the new drill titles exactly so the renderer's session→drill lookup resolves.

---

## Workstream 2 - Primary `why` rhetorical-shape variation (LOW priority)

All three primary drills open with "The root fault isn't X - it's Y. Drill the rep itself." Keep one pack, vary the other two.

### Assignment

- **grip-first → keep existing shape A** (negate-the-obvious, name-the-real-mechanism). Grip really is the canonical "everyone blames X, it's actually Y" diagnosis; the negation earns its keep.
- **reloads → shape B** (observer-to-mechanism reframe: "what you see vs what's actually happening"). Reloads have the strongest perceptual-vs-mechanical mismatch (looks like slow hands, actually a gaze problem).
- **stage-planning → shape C** (conditional / until-then). The plan only survives if the encoding is automatic before the bay - name the load-bearing condition cleanly.

### Drafted `why` strings

**`src/packs/grip-first.js` · drill "Move-and-regrip" - UNCHANGED**

```
The root fault isn't building the grip from the holster &mdash; it's re-establishing it under dynamic load. Train the move-and-regrip rep itself; nothing else fixes it.
```

**`src/packs/reloads.js` · drill "Index-and-insert" - REPLACE**

```
On the timer it looks like slow hands; under the dot it's the gaze leaving the magwell before the mag does and a support hand that finds the carrier differently every time. This drill welds the eye to the magwell and the index to a single repeatable carrier reference until the seat lands on its own.
```

**`src/packs/stage-planning.js` · drill "Chunk-and-anchor" - REPLACE**

```
A plan only survives the buzzer when the stage has already been split into named, anchored chunks &mdash; entry, ordered engagement, reload spot, exit &mdash; before you reach the line. Drill the encoding rep itself until one chunk comes out clean on the beep, on any stage, every time.
```

### Workstream 2 acceptance checks

- Three distinct rhetorical shapes across the three primary `why` fields. No two start with "The root fault isn't".
- Each `why` is at most two sentences.
- Each `why` still conveys root + mechanism + drill conviction.
- Cueing stays external (lens #3): dot, magwell, carrier reference, stage features, beep. No body-parts language.
- HTML entities used for em-dash (`&mdash;`).

---

## Workstream 3 - Practitioner reference body differentiation (MEDIUM priority)

Tier 1 and tier 2 reference bodies are near-verbatim across packs for the same source. Each pack should highlight a different specific work or angle from each shared source. **No new URLs.** Reuse existing `links` arrays unchanged.

### grip-first.js - edits

- **PSTG** (`body`): `"Stoeger, Hwansik Kim and Joel Park. Stoeger's <em>Dryfire Reloaded</em> drill set codifies the par-time grip-and-presentation cycle this format mirrors, and the &lsquo;no-friction&rsquo; grip framing recurs across the published class videos. Much is paywalled; the free clips are the value."`
- **Steve Anderson** (`body`): `"<em>Refinement and Repetition</em> is the par-time dry-fire format this framework mirrors &mdash; grip-build and presentation cycles run through it. <em>That Shooting Show</em> returns to grip mechanics and dot-find on presentation across episodes."`
- **Lanny Bassham** (`body`): `"<em>With Winning in Mind</em> from an Olympic gold-medal shooter &mdash; the mental-management lineage behind the match-mode mindset, and the visualization basis the eyes-closed index drill draws on. Book, no single link."`
- **Modern Samurai, Hwansik Kim, Charlie Delta** - already pack-specific, leave unchanged.

### reloads.js - edits

- **PSTG** (`body`): `"Stoeger, Hwansik Kim and Joel Park. Stoeger's PSTG class material covers the reload as a vision-and-index problem &mdash; eye to the magwell, carrier indexed off the support hand &mdash; and Park's reload mechanics are a recurring class theme. Much is paywalled; the free class videos are the value."`
- **Steve Anderson** (`body`): `"<em>Refinement and Repetition</em> is the par-time dry-fire format this framework mirrors &mdash; <em>Reload + 1</em> is one of its named drills, ported directly here. <em>That Shooting Show</em> returns to slide-lock vs in-battery reload technique across episodes."`
- **Charlie Delta Academy** (`body`): `"Plain-language coverage of the grip and support-hand reference points that drive a clean magwell insertion under speed."`
- **Lanny Bassham** (`body`): `"<em>With Winning in Mind</em> from an Olympic gold-medal shooter &mdash; the rehearsal-as-practice lineage underwriting the look-in as a single deliberate-attention moment rather than a hand-speed exercise. Book, no single link."`
- **Modern Samurai, Hwansik Kim, Brian Enos** - already pack-specific, leave unchanged.

### stage-planning.js - UNCHANGED

Already differentiated (specific Stoeger books, Joel Park, Enos *Beyond Fundamentals*, Bassham "visualize then trust"). Leave as the anchor pack.

### Workstream 3 acceptance checks

- For each of {PSTG, Anderson, Modern Samurai, Hwansik, Charlie Delta, Enos, Bassham}, no two packs share a `body` substring of 12+ words.
- No new URLs introduced. Every `links` array byte-identical to the version on `main` for the same source entry.
- Joel Park entry stays only in `stage-planning.js`.
- All em-dashes are `&mdash;`, middle-dots `&middot;`, ampersands `&amp;`.

---

## Build & merge protocol

After every patch:

```sh
make build
python3 -c "import re; s=open('dist/index.html').read(); open('/tmp/check.js','w').write(re.search(r'<script>(.*)</script>', s, re.S).group(1))"
node --check /tmp/check.js
```

Verify the build log still says `3 pack(s): grip-first, reloads, stage-planning`. Open `dist/index.html` and arm each modified drill once to confirm chip/timer rendering is intact.

The three workstreams are independent and can ship as separate PRs or one combined PR. House style: squash-merge with a short title and a body that lists which workstream(s) the PR covers.

## Sub-agent model-selection reminder

Per `CLAUDE.md` (see *Sub-agents: pick the cheapest model that fits*): if you fan this work out across sub-agents, pass `model: 'haiku'` for the mechanical patches (the diffs are small and structural), `model: 'sonnet'` for any re-checking against the lens, and reserve Opus for the synthesis step only. The three Plan sub-agents that drafted this document inherited Opus by accident - don't repeat that mistake on the execution pass.
