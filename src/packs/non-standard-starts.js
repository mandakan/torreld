/* Non-standard starts dry-fire - IPSC Production Optics / dynamic pistol.
 *
 * Trains the firing grip through starts that deny a clean loaded-and-holstered
 * draw - a rack folded into the draw, a table pick-up-and-load, an occupied
 * support hand - plus the steel platform that has to hold when the support
 * hand is disrupted. Built as a taper against the HFO Masters 2026 stages
 * (Hacksjobanan, Level III, 30 Jul - 2 Aug 2026) that punish these leaks
 * hardest; the match is the worked example, the skill is the point. Stage
 * facts are from the published HFO Masters 2026 briefings (Shoot'n Score It).
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
  id: "non-standard-starts",
  name: "Non-standard starts",
  documentTitle: "TORRELD - Non-standard starts dry-fire",
  share: {
    title: "Non-standard starts dry-fire",
    tagline: "Grip the start, hold the steel",
    description: "A par-time dry-fire taper for starts that deny a clean draw - a rack on the draw, a table pick-up-and-load, an occupied support hand - plus the steel platform that holds when the support hand is disrupted. Worked against the HFO Masters 2026 stages.",
  },
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
      eyebrow: "Dry-fire overlay &middot; dynamic pistol shooting",
      title: ["Grip", "the start."],
      lede: "Three starts deny the normal loaded-and-holstered draw: a rack folded into the draw, a table pick-up-and-load, a support hand tied to a string. Same root, three starts - <strong>the firing grip has to survive a non-standard start</strong>, then hold a steel array. This is a par-time dry-fire taper, worked against the HFO Masters 2026 stages that punish it hardest.",
      readout: { num: "2.50", label: "par &middot; seconds" }
    },
    diagnosis: {
      lane: "CASE",
      title: "The diagnosis behind the pack",
      intro: "This pack is built for one Production Optics shooter's leak - a support hand that degrades under disruption, and steel that gets missed or chased rather than called - read against the HFO Masters 2026 stages that punish it hardest. Three stages deny the normal draw: Stage 1 folds a rack into it, Stage 9 builds the grip during a table load, Stage 3 ties up the support hand entirely.",
      chain: [
        { root: true, tag: "Root",      title: "Grip through a non-standard start", body: "The support hand doesn't reach its reference when the start denies a clean draw. Everything below rests on this." },
        {              tag: "Symptom",   title: "Fumbled start / weak platform",     body: "Time bled on the load, or a strong-hand-dominant grip that can't hold a steel array. ~80% a consequence of the start." },
        {              tag: "Secondary", title: "Missed / chased steel",             body: "The downstream cost. Improves once the platform is solid; partly trained alongside the root." }
      ],
      notes: {
        can:  { title: "&#10003; What dry fire gives",   body: "The exact start sequences - rack-on-the-draw, table pick-up-and-load, the occupied-hand platform - plus the grip reference under each and the eyes-first steel plan. All present without a live round." },
        cant: { title: "&#10007; What it doesn't",        body: "Real chambering and feed, recoil on steel, calling hits on live poppers, and the seated base under match nerves. Those need live fire and the walkthrough. Spend your rare live time there." }
      }
    },
    program: {
      lane: "3 SESSIONS",
      title: "The match block",
      sessions: [
        { n: "Session 01", primary: true,  focus: "Steel + start", items: ["One-handed steel", "Empty-chamber draw"] },
        { n: "Session 02", primary: true,  focus: "Steel + start", items: ["One-handed steel", "Table start"] },
        { n: "Session 03", primary: true,  focus: "Steel + starts", items: ["One-handed steel", "Empty-chamber draw", "Table start"] }
      ],
      note: "10-15 min/session. Quality over volume - a rep you can't call clean doesn't count. This is a <b>match-specific overlay</b>, not a full program: three drills for the three HFO stages that deny a clean draw. Run these as two or three of your weekly sessions and keep the rest on the <b>Grip-first</b> and <b>Reloads</b> packs - they train the grip, index and reload this leans on. <b>Spend ~70% of the match-block time on One-handed steel</b>: it attacks the root leak; the two starts follow. Par times are starting values, log your own. Match: HFO Masters, 30 Jul - 2 Aug 2026."
    },
    drills: {
      lane: "ARM",
      title: "The drills",
      intro: "Each card arms the timer at the bottom with a starting setup. Use dummy or empty mags - never live rounds in dry fire. The par times are <em>starting values</em> for an intermediate Production Optics shooter; adjust them and log your own. Stage facts are from the published HFO Masters 2026 briefings.",
      items: [
        {
          primary: true, span: true,
          chips: [{ cls: "prim", label: "Primary" }, { cls: "cyc", label: "Circuit" }, { cls: "", label: "Steel &middot; Stage 3" }],
          title: "One-handed steel",
          why: "Stage 3 (A200) sits you on a horse-prop, feet off the ground, opening a wall hatch by pulling a string - the support hand can be tied to the string while you shoot six steel from an unstable seated base. Strip the support hand and the gun fights you: the dot swims and steel gets chased instead of called. Build a repeatable strong-hand-only platform and the hits come without hunting.",
          steps: [
            "Perch on a stool or the edge of a chair, feet off the floor if you can - match the unstable seated base.",
            "Occupy the support hand: hold a cord or strap out in front as if you are holding the hatch string open.",
            "Lock your eyes on one exact point on the first steel <em>before</em> the gun moves.",
            "Build the cleanest one-handed platform you can, break the shot, then drive the gun to the next steel point - eyes lead, the gun follows.",
            "Call every hit. If the dot swam off the point or you chased it, the rep doesn't count."
          ],
          timer: { mode: "circuit", par: "2.5", dmin: "1.5", dmax: "3.0", reps: "8", rest: "4", floor: "1.8" },
          label: "One-handed steel (Stage 3)"
        },
        {
          chips: [{ cls: "par", label: "Par" }, { cls: "", label: "Draw &middot; Stage 1" }],
          title: "Empty-chamber draw",
          why: "Stage 1 (B50) starts chamber-empty, magazine inserted, one foot on the mark - unusual for the division and an easy place to fumble. A rack folded into the draw, with the firing grip already set as the gun comes up, turns it into free time on a simple 6-paper stage.",
          steps: [
            "Start with one foot on the mark, hands relaxed.",
            "Lock your eyes on the first target <em>before</em> the gun moves.",
            "On the beep, draw and rack in one motion - overhand support-hand rack, then send the gun to the eye line.",
            "The firing grip is set as the gun arrives - nothing to re-grip. Break on the par beep.",
            "Dry fire can't chamber a round; rehearse the motion and the grip, not the feed. If the grip shifted during the rack, the rep doesn't count."
          ],
          timer: { mode: "par", par: "1.7", dmin: "1.5", dmax: "3.5", reps: "1", rest: "0", floor: "1.2" },
          label: "Empty-chamber draw (Stage 1)"
        },
        {
          chips: [{ cls: "par", label: "Par" }, { cls: "", label: "Load &middot; Stage 9" }],
          title: "Table start",
          why: "Stage 9 (B4) starts with the gun unloaded on a table, grip inside the table edges, mags on the table, plus a no-shoot and a popper-activated mover that settles visible at rest. The pick-up-load-grip sequence is the fumble; build it so the firing grip is set <em>during</em> the load and there is nothing to re-grip.",
          steps: [
            "Gun unloaded on the table, mags on the table, standing, hands relaxed.",
            "Lock your eyes on the first target <em>before</em> your hands move.",
            "On the beep, acquire the gun, seat a mag and chamber, building the firing grip in one flow.",
            "Present and engage the statics; mind the no-shoot - take only the visible scoring zone past it.",
            "The mover is visible at rest: take it early while it still sits, or track and break on it moving. A swinger will not settle again inside the stage - never plan to wait it out. If you had to re-grip after the load, the rep doesn't count."
          ],
          timer: { mode: "par", par: "3.0", dmin: "1.5", dmax: "3.5", reps: "1", rest: "0", floor: "2.2" },
          label: "Table start (Stage 9)"
        }
      ]
    },
    evidence: {
      lane: "WHY IT WORKS",
      title: "The science, mapped to the drills",
      intro: "Most of this is practitioner consensus. Where the pack leans on motor-learning research, here is the mapping - and the honest limits.",
      items: [
        { map: "Every drill &middot; the exact start", h: "You train what's present",           body: "Motor skill is largely task-specific, and transfer to untrained variations is real but suboptimal. Rehearsing the actual start - rack-on-the-draw, table load, occupied-hand platform - transfers better than drilling a generic draw and hoping it carries to the stage." },
        { map: "One-handed steel &middot; eyes on the point", h: "Vision leads the hand",         body: "In aiming tasks, elite performers fix the eye on an exact target point before the movement starts (the 'quiet eye'), and cueing on the effect - the steel, the dot's path - beats cueing on body parts (external focus of attention). Lock the eye on the point, then build the platform to it." },
        { map: "Random delay &middot; interleaved starts", h: "Variable practice transfers better", body: "Varying the rep - random start delay, interleaving the three starts across sessions - tends to lower practice-day performance but improve retention and transfer to the unpredictable match, versus blocked repetition (the contextual-interference effect)." },
        { map: "Par timer &middot; log",                h: "Measure to learn",                   body: "Feedback on the result drives motor learning. A par time turns a vague rep into a measured one, and a log turns a hunch about progress into data." }
      ],
      caveat: "<b>Honest limit.</b> Two things. The science above is mostly from lab aiming tasks and other sports - direction, not proof for dynamic pistol; let your own timer and target settle it. And one stage detail is still open: the Stage 3 briefing confirms the seated horse-prop start and the string-opened hatch, but not whether the string must be <em>held</em> (forcing one-handed shooting) or latches open. One-handed steel trains the worst case - confirm it at the walkthrough."
    },
    references: {
      lane: "SOURCES",
      title: "Research",
      tiers: [
        {
          tier: "Elite practitioners",
          items: [
            { src: "Practical Shooting Training Group", grade: "World champ / GM",      body: "Stoeger, Hwansik Kim and Joel Park. The PSTG class material covers the non-standard start and the strong-hand platform as vision-and-index problems - eye to the point, gun sent to where the eye already is. Much is paywalled; the free class videos are the value.", links: [{ label: "practicalshootingtraininggroup.com", url: "https://www.practicalshootingtraininggroup.com" }] },
            { src: "Modern Samurai Project",             grade: "Red-dot specialist",    body: "Scott Jedlinski's system for presentation under a dot: the draw delivers the dot to the eye rather than leaving you to hunt for it in the glass - the same demand a compromised or one-handed start makes.", links: [{ label: "modernsamuraiproject.com", url: "https://www.modernsamuraiproject.com/path-to-performance" }] },
            { src: "Steve Anderson",                     grade: "USPSA GM",              body: "<em>Refinement and Repetition</em> is the par-time dry-fire format this framework mirrors - unusual starts and grip-build cycles run through it. <em>That Shooting Show</em> returns to start positions and steel discipline across episodes.", links: [{ label: "andersonshooting.com", url: "https://www.andersonshooting.com/product-page/refinement-and-repetition" }] },
            { src: "Hwansik Kim",                        grade: "Top GM",                body: "Analytical grip and recoil mechanics broken into grip, joints and stance - why a locked platform holds a steel array better than raw crush, and how much less the support hand does than shooters assume.", links: [{ label: "No-friction grip (YouTube)", url: "https://www.youtube.com/watch?v=qYxjwAx2MD4" }] }
          ]
        },
        {
          tier: "Coaching reference",
          items: [
            { src: "Brian Enos - forum + Practical Shooting", grade: "Community + book", body: "Decades of practitioner discussion on start positions, steel discipline and platform under different divisions, plus the foundational book Practical Shooting: Beyond Fundamentals.", links: [{ label: "brianenos.com", url: "https://www.brianenos.com/" }] },
            { src: "Charlie Delta Academy",                   grade: "Explainer",          body: "Plain-language coverage of the grip and support-hand reference points that drive a repeatable platform, and why it degrades when the start denies a clean build.", links: [{ label: "charliedeltaacademy.com - Grip", url: "https://charliedeltaacademy.com/blogs/tips-techniques/fundamentals-part-ii-grip" }] },
            { src: "Lanny Bassham - With Winning in Mind", grade: "Olympic champion", body: "<em>With Winning in Mind</em> from an Olympic gold-medal shooter - the mental-management lineage behind rehearsing the stage plan (the load sequence, the no-shoot, the swinger) before you walk it. Book, no single link.", links: [] }
          ]
        },
        {
          tier: "Science (peer-reviewed)",
          items: [
            { src: "Specificity &amp; variability of practice",   grade: "Review",         body: "Motor skills are largely task-specific; transfer to untrained variations is real but suboptimal. Grounds training the exact match start rather than a generic draw.", links: [{ label: "pubmed.ncbi.nlm.nih.gov", url: "https://pubmed.ncbi.nlm.nih.gov/2094928/" }] },
            { src: "Vickers (1996) - Visual control when aiming at a far target", grade: "Foundational paper", body: "Elite performers show a longer final fixation on the target before initiating movement (the 'quiet eye'), which appears to organise the motor plan and reduce variability. Direct grounding for the eyes-on-the-point steps.", links: [{ label: "pubmed.ncbi.nlm.nih.gov", url: "https://pubmed.ncbi.nlm.nih.gov/8934848/" }] },
            { src: "Wulf (2013) - Attentional focus and motor learning", grade: "15-year review", body: "External focus of attention (cueing on the movement effect - the steel, the dot's path) consistently produces faster learning and better performance than internal focus (cueing on body parts). Replicated across hundreds of studies.", links: [{ label: "doi.org", url: "https://doi.org/10.1080/1750984X.2012.723728" }] },
            { src: "Contextual interference - meta-analysis", grade: "Meta-analysis", body: "Random / varied practice improves retention and transfer versus blocked repetition; effect is clearer in the lab than in complex applied tasks.", links: [{ label: "frontiersin.org (2024)", url: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1377122/full" }] },
            { src: "Schmidt &amp; Lee - Motor Learning and Performance", grade: "Textbook", body: "The standard reference for the principles above (practice schedule, specificity, feedback). Book, no single link.", links: [] }
          ]
        }
      ]
    },
    footer: "TORRELD &middot; data-driven training template &middot; drop a new pack file in <code>src/packs/</code> to build a new protocol &middot; par times are starting values, log your own &middot; standalone HTML, works offline."
  }
});
