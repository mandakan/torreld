/* Stage planning dry-fire - IPSC Production Optics / dynamic pistol.
 *
 * Pack contract:
 *   id            - stable identifier used in ?pack=<id> URLs
 *   name          - short label shown in the switcher chip
 *   documentTitle - full title applied to <title> when this pack is active
 *   data          - PROGRAM object (brand, nav, hero, diagnosis, program,
 *                   drills, evidence, references, footer)
 *
 * Strings may contain HTML and entities - content is author-trusted and
 * rendered via innerHTML. Never feed runtime user input into these.
 */
registerPack({
  id: "stage-planning",
  name: "Stage planning",
  documentTitle: "TORRELD - Stage planning dry-fire",
  data: {
    brand: { pre: "TORR", post: "ELD" },
    nav: [
      { id: "diagnosis",  label: "Diagnosis" },
      { id: "program",    label: "Program" },
      { id: "drills",     label: "Drills" },
      { id: "evidence",   label: "Evidence" },
      { id: "references", label: "References" }
    ],
    hero: {
      eyebrow: "Dry-fire protocol &middot; dynamic pistol shooting",
      title: ["Stage", "in chunks."],
      lede: "Squad walk-throughs run 2-5 minutes and the bay is contested by 5-12 shooters - L1 club through L3 national - so half the time you plan from inside the lane and the other half from outside. A plan that survives the buzzer is a small set of <strong>named, anchored chunks</strong> - positions, target order, reload spots, entry and exit cues - you can encode fast, hold in working memory, and patch under change. This program drills the encoding system itself.",
      readout: { num: "10.00", label: "par &middot; seconds per chunk" }
    },
    diagnosis: {
      lane: "CASE",
      title: "The diagnosis behind the program",
      intro: "Stages fall apart on the line because the plan was <em>encoded as a continuous impression</em> instead of a chunked, indexed structure, and free-form impressions collapse first under the buzzer. The walk-through window is too short to plan from scratch on match day; the encoding system has to be automatic <em>before</em> you walk into the bay.",
      chain: [
        { root: true, tag: "Root",      title: "Encoding",  body: "Stage taken in as a continuous experience, no chunking scheme. Without a repeatable structure - entry, anchored engagement, reload spot, exit, per position - the plan can't be held under pressure." },
        {              tag: "Symptom",   title: "Recall",    body: "Engagement order forgotten at the start position, reload spot missed, wrong foot at entry, targets that 'weren't there in walk-through.' ~80% a consequence of poor encoding." },
        {              tag: "Secondary", title: "Re-plan",   body: "Can't patch the plan when the stage looks different on the line - crowding obscured something, you read a wall wrong, a position won't fit your draw side. Improves once encoding is automatic and one chunk can be swapped without losing the rest." }
      ],
      notes: {
        can:  { title: "&#10003; What dry fire gives",   body: "The encoding system itself: chunking a stage into named positions, building entry / engagement / reload / exit per position, running eye-only walk-throughs when the bay is crowded, rehearsing the plan in real time with PETTLEP imagery, re-encoding on the fly under change. Works with a printed WSB, a sketched diagram, or your memory of past stages - no bay required." },
        cant: { title: "&#10007; What it doesn't",        body: "Match-day perception. The specific stage of the specific match still has to be walked. The payoff is that when the encoding system is automatic, your limited walk-through time is spent <em>perceiving</em> the stage instead of fighting for a plan." }
      }
    },
    program: {
      lane: "5 SESSIONS",
      title: "The week",
      sessions: [
        { n: "Session 01", primary: true,  focus: "Encoding + vision",     items: ["Chunk-and-anchor", "Eye walk-through"] },
        { n: "Session 02", primary: true,  focus: "Encoding + throughput", items: ["Chunk-and-anchor", "Position-snapshot recall"] },
        { n: "Session 03", primary: true,  focus: "Encoding + imagery",    items: ["Chunk-and-anchor", "PETTLEP rehearsal"] },
        { n: "Session 04", primary: false, focus: "Planning-only mode",    items: ["Eye walk-through", "PETTLEP rehearsal"] },
        { n: "Session 05", primary: false, focus: "Pressure",              items: ["Chunk-and-anchor", "Re-plan under change"] }
      ],
      note: "10-15 min/session. Quality over volume - a chunk you can't verbalize cleanly doesn't count, reset and run it again. <b>Spend ~70% of the time on Chunk-and-anchor</b>: it attacks the root fault, the rest follows. Keep a stack of printed stage diagrams or WSBs from past matches and <em>rotate which stage you encode each rep</em> - identical reps lose the contextual-interference benefit."
    },
    drills: {
      lane: "ARM",
      title: "The drills",
      intro: "Each card arms the timer at the bottom with a starting setup. These drills work with a printed stage diagram, a sketch, or your memory of a past stage - no bay required. The par times are <em>starting values</em> for an intermediate Production Optics shooter; adjust them and log your own.",
      items: [
        {
          primary: true, span: true,
          chips: [{ cls: "prim", label: "Primary" }, { cls: "cyc", label: "Circuit" }, { cls: "", label: "Encoding &middot; vision" }],
          title: "Chunk-and-anchor",
          why: "A plan only survives the buzzer when the stage has already been split into named, anchored chunks - entry, ordered engagement, reload spot, exit - before you reach the line. Drill the encoding rep itself until one chunk comes out clean on the beep, on any stage, every time.",
          steps: [
            "Pick a stage diagram (printed WSB, a stage you have video of, or sketched from memory). Decide position order before the beep.",
            "On the beep, encode <em>one</em> position out loud as four slots: ENTRY (foot or eye cue you'll see arriving), ENGAGEMENT (target order with one named visual anchor per target - <em>'T1 head-box, T2 right of T1, T3 partial behind no-shoot'</em>), RELOAD (where in the sequence the mag changes - <em>'reload after T2 on the transition,'</em> <em>'top off on entry while eyes find T1,'</em> or explicit <em>'no reload here'</em>), EXIT (foot or eye cue that triggers the move to the next position).",
            "Speak it as one continuous sentence per position - the verbalization <em>is</em> the encoding. If you hesitate or skip an anchor, the rep doesn't count.",
            "Cues are stage features (port edge, wall corner, target anchor) - never body parts.",
            "Slow and explicit first, then trim the verbalization while keeping the structure. Rotate positions and stages across the circuit."
          ],
          timer: { mode: "circuit", par: "10", dmin: "2", dmax: "4", reps: "8", rest: "5" },
          label: "Chunk-and-anchor"
        },
        {
          chips: [{ cls: "cyc", label: "Circuit" }, { cls: "", label: "Vision &middot; crowded walk-through" }],
          title: "Eye walk-through",
          why: "Half the squad walk-throughs in a hot match don't let you into the bay - your spot is taken, the lane is full. The most efficient planning mode in that case is eyes-only: fix your gaze through every aim point in plan order from the start position or just outside. The walk-through itself becomes a multi-target quiet-eye exercise.",
          steps: [
            "Stand at the start position or anywhere outside the bay with the targets in view. Build the plan in mind first.",
            "On the beep, lock the eye for ~1&nbsp;s on each aim point in target-engagement order - one position per rep. If the position has a reload, the gaze lands on the magwell at that moment in the sequence before continuing to the next target.",
            "Eye lands on the entry or exit cue (port edge, foot mark, wall corner) <em>before</em> moving to the next array's first aim point.",
            "End on the exit cue of the position. If the gaze slid past any anchor instead of landing deliberately, the rep doesn't count."
          ],
          timer: { mode: "circuit", par: "6", dmin: "1.5", dmax: "3.5", reps: "8", rest: "4" },
          label: "Eye walk-through"
        },
        {
          chips: [{ cls: "cyc", label: "Circuit" }, { cls: "", label: "Imagery &middot; integration" }],
          title: "PETTLEP rehearsal",
          why: "Mental rehearsal at real stage pace runs the motor program without rounds. The meta-analytic effect is small-to-moderate but additive - and once the squad moves on from the bay, imagery is the only way to keep putting reps on the integrated plan. Per-position scope keeps the imagery vivid; chain them in real time later.",
          steps: [
            "Stand as you'd enter the position - gun mounted or holstered as it actually starts, eyes on the entry cue.",
            "On the beep, run the position in real time, eyes closed: <em>see</em> the dot land on each target in order, <em>hear</em> the splits, <em>feel</em> the foot move on exit.",
            "End on the exit-cue moment. If you skipped a target, lost the order, or slipped into slow-motion, the rep doesn't count - PETTLEP imagery is real-time, full-sensory, gun-in-hand.",
            "Rotate position and stage across the circuit."
          ],
          timer: { mode: "circuit", par: "8", dmin: "1.5", dmax: "3.5", reps: "8", rest: "4" },
          label: "PETTLEP rehearsal"
        },
        {
          chips: [{ cls: "par", label: "Par" }, { cls: "", label: "Encoding throughput" }],
          title: "Position-snapshot recall",
          why: "Most walk-through time is spent waiting - you glance at a position through the gap between two squad-mates, then have to plan it later from memory. Trains the encoding throughput: how fast a 5-second look becomes a chunked, verbalizable plan.",
          steps: [
            "Pre-rep: look at one position on a stage diagram for 5&nbsp;seconds, then turn the diagram face-down. Don't pre-verbalize.",
            "On the beep, verbalize the entry cue, the ordered engagement with one named anchor per target, the reload spot (or explicit <em>'no reload'</em>), and the exit cue.",
            "If you hesitate or miss an anchor, the rep doesn't count - check yourself against the diagram and reset.",
            "Vary the stage and position each rep - identical look-ups lose the contextual-interference benefit."
          ],
          timer: { mode: "par", par: "8", dmin: "1.5", dmax: "3.5", reps: "1", rest: "0" },
          label: "Position-snapshot recall"
        },
        {
          chips: [{ cls: "cyc", label: "Circuit" }, { cls: "", label: "Pressure &middot; adaptation" }],
          title: "Re-plan under change",
          why: "Real walk-throughs surface things you missed - a no-shoot you read as hard cover, a target behind a wall corner you misread, a position that won't fit your strong-side draw from the start. The encoding system has to re-fire on one chunk <em>without losing the rest</em>. Train the swap.",
          steps: [
            "Hold a built plan in memory (use a stage you encoded earlier in the session).",
            "Speak (or read from a pre-written prompt) a forced change: <em>'T3 is now a hard no-shoot,'</em> <em>'P2 is from the right of the port, not the left,'</em> <em>'Engage T4 from P3, not P2,'</em> <em>'Reload after T2 instead of on the transition.'</em>",
            "On the beep, re-anchor the eye on the changed cue and verbalize the affected position chunk(s) with the change baked in.",
            "If the patch breaks any unchanged chunk - engagement order, anchor, exit cue - the rep doesn't count. Reset."
          ],
          timer: { mode: "circuit", par: "10", dmin: "2", dmax: "4", reps: "8", rest: "5" },
          label: "Re-plan under change"
        }
      ]
    },
    evidence: {
      lane: "WHY IT WORKS",
      title: "The science, mapped to the drills",
      intro: "Stage planning sits at the seam of perception, memory and motor control - almost none of it has been studied directly in dynamic pistol. The mapping below draws on the cleanest adjacent literature, with the honest limits at the end.",
      items: [
        { map: "Chunk-and-anchor &middot; Position-snapshot recall", h: "Experts encode in named chunks", body: "Working memory holds roughly seven independent items at a time; the way experts hold complex configurations (Chase &amp; Simon showed it for chess positions) is to bind elements into <em>chunks</em> they then index by name. A stage encoded as 4-6 named positions - each with an entry, an ordered engagement and an exit - fits the working-memory ceiling. Encoded as one continuous impression, it doesn't." },
        { map: "Eye walk-through &middot; vision-first planning",   h: "Pre-action gaze organises the plan",     body: "In aiming tasks, elite performers show a longer pre-action fixation on the target (the 'quiet eye'), which appears to organise the motor plan and reduce variability. The walk-through is the multi-target version - pre-anchoring the gaze on every cue you'll need turns the plan into vision. Eyes-only mode is the version that survives a crowded bay." },
        { map: "PETTLEP rehearsal &middot; real-time imagery",       h: "Mental practice counts as practice",     body: "PETTLEP-style imagery (Physical, Environment, Task, Timing, Learning, Emotion, Perspective) produces a measurable post-acquisition gain in meta-analysis (SMD around 0.4). Run in the start position at real stage pace, it's the only way to keep adding reps on the integrated plan once the squad moves on from the bay." },
        { map: "Chunk-and-anchor &middot; random delay, varied stages", h: "Variable practice transfers better",  body: "Random start delay and rotating which stage you encode each rep degrades practice-day performance but improves retention and transfer to the unpredictable match (contextual-interference effect). Drilling the same stage ten times in a row teaches you that stage; rotating teaches you the encoding skill." },
        { map: "Match-day cueing &middot; don't think mechanics on the buzzer", h: "Encode in dry fire, trust on the buzzer", body: "When skilled performers re-direct attention to the mechanics of an autonomous skill under pressure - consciously deriving step-by-step what should be running automatically - performance breaks down (re-investment, an explanation for a large fraction of choking). The encoding is built in dry fire so the start-of-stage cue can <em>trigger</em> the plan rather than derive it on the line." }
      ],
      caveat: "<b>Honest limit.</b> Chunking and working-memory work is mostly from chess and pattern-recognition; quiet-eye and PETTLEP results are from biathlon, basketball and other aiming sports; re-investment evidence is from lab and golf. Stage planning as a specific motor-cognitive task in dynamic pistol has near-zero direct study. Treat the science as direction, not proof - let your own match results settle which encoding scheme fits your head."
    },
    references: {
      lane: "SOURCES",
      title: "Research",
      tiers: [
        {
          tier: "Elite practitioners",
          items: [
            { src: "Practical Shooting Training Group", grade: "World champ / GM", body: "Stoeger, Hwansik Kim and Joel Park. Stage planning is a recurring class topic and runs through Stoeger's published books (Practical Pistol, Skills &amp; Drills). Much of the deep work is paywalled; the free class videos are the value.", links: [{ label: "practicalshootingtraininggroup.com", url: "https://www.practicalshootingtraininggroup.com" }] },
            { src: "Steve Anderson",                     grade: "USPSA GM",         body: "Refinement and Repetition includes stage-memorization drills mirrored here, and the podcast That Shooting Show returns to stage planning and visualization repeatedly.", links: [{ label: "andersonshooting.com", url: "https://www.andersonshooting.com/product-page/refinement-and-repetition" }] },
            { src: "Hwansik Kim",                        grade: "Top GM",           body: "Analytical breakdowns of stage planning - chunking the stage by position, anchoring the eye, programming the entry and exit. Channel videos free; deeper work inside PSTG classes.", links: [] },
            { src: "Joel Park",                          grade: "Top GM",           body: "Practical Shooting Made Easy spends substantial space on planning and visualization frameworks for IPSC/USPSA stages. Book, no single link.", links: [] }
          ]
        },
        {
          tier: "Coaching reference",
          items: [
            { src: "Brian Enos - forum + Practical Shooting", grade: "Community + book", body: "Practical Shooting: Beyond Fundamentals is the foundational text on visualization and being 'in the moment' on stage; the forum carries decades of practitioner discussion on planning under squad and walk-through constraints.", links: [{ label: "brianenos.com", url: "https://www.brianenos.com/" }] },
            { src: "Lanny Bassham - With Winning in Mind",      grade: "Olympic champion",  body: "Mental management from an Olympic gold-medal shooter; the lineage behind the 'visualize the plan, then trust the program' mindset taught across practical-shooting coaching. Book, no single link.", links: [] }
          ]
        },
        {
          tier: "Science (peer-reviewed)",
          items: [
            { src: "Chase &amp; Simon (1973) - Perception in chess",                 grade: "Foundational paper", body: "The original demonstration that expert memory for complex configurations is organised as <em>chunks</em>, recalled by name and far exceeding the working-memory limit on independent items. Direct grounding for the chunk-then-index structure of the primary drill.", links: [{ label: "doi.org", url: "https://doi.org/10.1016/0010-0285(73)90004-2" }] },
            { src: "Vickers (1996) - Visual control when aiming at a far target", grade: "Foundational paper", body: "Elite performers show a longer pre-action fixation on the target (the 'quiet eye'), which appears to organise the motor plan and reduce variability. Grounding for the eye walk-through.", links: [{ label: "pubmed.ncbi.nlm.nih.gov", url: "https://pubmed.ncbi.nlm.nih.gov/8934848/" }] },
            { src: "Mental practice - meta-analysis",                              grade: "Meta-analysis",      body: "Mental rehearsal yields a measurable post-acquisition gain (SMD around 0.4). PETTLEP framing (Holmes &amp; Collins 2001) pushes for full-sensory, real-time, in-position imagery - what the PETTLEP rehearsal drill operationalises.", links: [{ label: "ncbi.nlm.nih.gov/pmc", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4714441/" }] },
            { src: "Masters (1992) - Knowledge, knerves and know-how",             grade: "Foundational paper", body: "Re-direction of attention to the mechanics of an autonomous skill under pressure breaks performance down (re-investment). The argument for building the encoding in dry fire and trusting it on the buzzer rather than deriving the plan on the start signal.", links: [{ label: "doi.org", url: "https://doi.org/10.1111/j.2044-8295.1992.tb02446.x" }] },
            { src: "Contextual interference - meta-analysis",                      grade: "Meta-analysis",      body: "Random / varied practice improves retention and transfer versus blocked repetition; effect is clearer in the lab than in complex applied tasks. Grounds the random delay and the rule to rotate stages each rep.", links: [{ label: "frontiersin.org (2024)", url: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1377122/full" }] },
            { src: "Schmidt &amp; Lee - Motor Learning and Performance",            grade: "Textbook",           body: "Standard reference for the practice-schedule, specificity, feedback and imagery principles above. Book, no single link.", links: [] }
          ]
        }
      ]
    },
    footer: "TORRELD &middot; data-driven training template &middot; drop a new pack file in <code>src/packs/</code> to build a new protocol &middot; par times are starting values, log your own &middot; standalone HTML, works offline."
  }
});
