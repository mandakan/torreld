/* Grip-first dry-fire - IPSC Production Optics / dynamic pistol.
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
  id: "grip-first",
  name: "Grip-first",
  documentTitle: "TORRELD - Grip-first dry-fire",
  share: {
    title: "Grip-first dry-fire",
    tagline: "The one lever when range time is rare",
    description: "A par-time-driven dry-fire program built around a grip that survives movement - the root that index, movement, and follow-up all hang on.",
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
      eyebrow: "Dry-fire protocol &middot; dynamic pistol shooting",
      title: ["Grip", "first."],
      lede: "Index, movement and follow-up shots all hang on one thing: a <strong>consistent grip that survives movement</strong>. This is a par-time-driven program you run at home, built around the one lever you have when range time is rare.",
      readout: { num: "1.20", label: "par &middot; seconds" }
    },
    diagnosis: {
      lane: "CASE",
      title: "The diagnosis behind the program",
      intro: "The program is built from a concrete fault analysis of a Production Optics competitor: the grip holds from the holster, but the <em>support hand degrades after movement</em>, which in turn makes the dot hard to find on presentation. The conclusion generalizes - the chain looks the same for most shooters.",
      chain: [
        { root: true, tag: "Root",      title: "Grip",                  body: "Inconsistent support hand after movement. Everything below rests on this." },
        {              tag: "Symptom",   title: "Index",                 body: "The dot isn't there on presentation. ~80% a consequence of the grip." },
        {              tag: "Secondary", title: "Movement + follow-up",  body: "Improve once the grip holds. Partly trained alongside the root." }
      ],
      notes: {
        can:  { title: "&#10003; What dry fire gives",   body: "Grip consistency, index, presentation and - most importantly - re-establishing the grip <em>during</em> movement. That's most of the problem." },
        cant: { title: "&#10007; What it doesn't",        body: "Grip strength under recoil, recoil control and follow-up speed need live fire. National precision disciplines transfer almost nothing here. Spend your rare live sessions there." }
      }
    },
    program: {
      lane: "5 SESSIONS",
      title: "The week",
      sessions: [
        { n: "Session 01", primary: true,  focus: "Grip + index",   items: ["Move-and-regrip", "Eyes-closed index"] },
        { n: "Session 02", primary: true,  focus: "Grip + index",   items: ["Move-and-regrip", "Grip reference"] },
        { n: "Session 03", primary: true,  focus: "Grip + index",   items: ["Move-and-regrip", "Eyes-closed index"] },
        { n: "Session 04", primary: false, focus: "Presentation",   items: ["Target-focused presentation"] },
        { n: "Session 05", primary: false, focus: "Movement",       items: ["Move-and-regrip", "Grip under load"] }
      ],
      note: "10-15 min/session. Quality over volume - a bad rep doesn't count. <b>Spend ~70% of the time on Move-and-regrip</b>: it attacks the root fault, the rest follows."
    },
    drills: {
      lane: "ARM",
      title: "The drills",
      intro: "Each card arms the timer at the bottom with a starting setup. The par times are <em>starting values</em> - adjust them and log your own.",
      items: [
        {
          primary: true, span: true,
          chips: [{ cls: "prim", label: "Primary" }, { cls: "cyc", label: "Circuit" }, { cls: "", label: "Grip &middot; movement" }],
          title: "Move-and-regrip",
          why: "Re-establishing the grip under dynamic load is the whole problem; building it from the holster is the easy part. Train the move-and-regrip rep itself; nothing else fixes it.",
          steps: [
            "Set up in one position. Move to the next (a couple of steps is enough).",
            "Eyes find the next aim point as you move; re-establish the support hand as the <em>first</em> thing - grip set and confirmed before the dot settles.",
            "Freeze on arrival, check the grip against the Grip-reference checks. If it isn't perfect, the rep doesn't count.",
            "Slow and perfect first, then speed."
          ],
          timer: { mode: "circuit", par: "2.0", dmin: "1.5", dmax: "3.0", reps: "8", rest: "4", floor: "1.2" },
          label: "Move-and-regrip"
        },
        {
          chips: [{ cls: "par", label: "Par" }, { cls: "", label: "Index" }],
          title: "Eyes-closed index",
          why: "Isolates index from searching. Reveals whether the dot arrives low (presenting below the eyeline) or left/high (the support hand).",
          steps: [
            "Fix your eyes on an exact point on the target, then close them.",
            "Present. Open your eyes.",
            "The dot should sit where you were looking. Note the pattern in the miss."
          ],
          timer: { mode: "par", par: "1.5", dmin: "1.5", dmax: "3.5", reps: "1", rest: "0", floor: "1.0" },
          label: "Eyes-closed index"
        },
        {
          chips: [{ cls: "par", label: "Par" }, { cls: "", label: "Index &middot; presentation" }],
          title: "Target-focused presentation",
          why: "Stop hunting for the dot. Drive the gun up into your line of sight so the dot appears where your eye already is - search the glass and you're late by definition.",
          steps: [
            "Lock your eyes on a small exact aim point <em>before</em> the gun comes up.",
            "Drive the gun up into that line. Bring the dot to the eye - keep your eyes locked on the aim point as the gun arrives.",
            "Break on the par beep.",
            "If the dot isn't on the aim point as the beep fires, the rep doesn't count."
          ],
          timer: { mode: "par", par: "1.2", dmin: "1.5", dmax: "3.5", reps: "1", rest: "0", floor: "0.9" },
          label: "Target-focused presentation"
        },
        {
          chips: [{ cls: "par", label: "Par" }, { cls: "", label: "Grip" }],
          title: "Grip reference",
          why: "Build a grip you can recreate exactly without looking, using tactile reference points (magwell, trigger-guard underside, thumb rest).",
          steps: [
            "Eyes up on a distant aim point - the grip is built by feel, not by looking down at the gun.",
            "Build the grip; the support hand finds the same reference point every time.",
            "Confirm the thumb is in the same place and the support hand has full contact on the same area of the gun.",
            "Repeat until the reference sets blind, every time."
          ],
          timer: { mode: "par", par: "1.5", dmin: "1.5", dmax: "3.5", reps: "1", rest: "0", floor: "1.0" },
          label: "Grip reference"
        },
        {
          chips: [{ cls: "cyc", label: "Circuit" }, { cls: "", label: "Grip &middot; endurance" }],
          title: "Grip under load",
          why: "The support hand fails late in a stage when the forearm is cooked and the heart rate is up. Train the rep in that physiological state so the failure mode shows up at home, where you can fix it.",
          steps: [
            "Before the circuit, raise your heart rate - 20 burpees, a sprint up the stairs, or 30&nbsp;s of hard isometric squeeze on a towel until the support forearm burns.",
            "Lock your eyes on a distant aim point. Run the move-and-regrip rep with the forearm shaking; drive the support hand to the same tactile reference as when fresh.",
            "Freeze on arrival and check the grip against the Grip-reference checks - same thumb placement, same contact, same commitment.",
            "If the contact slipped or the thumb wandered, the rep doesn't count. Stop the circuit at the first rep you can't pass cleanly."
          ],
          timer: { mode: "circuit", par: "2.2", dmin: "1.5", dmax: "3.5", reps: "10", rest: "5", floor: "1.4" },
          label: "Grip under load"
        }
      ]
    },
    evidence: {
      lane: "WHY IT WORKS",
      title: "The science, mapped to the drills",
      intro: "Most shooting advice is practitioner consensus. Where the program leans on motor-learning research, here is the mapping - and the honest limits.",
      items: [
        { map: "Move-and-regrip &middot; random delay", h: "Variable practice transfers better", body: "Varying the rep - random start delay, changing positions - tends to lower practice-day performance but improve retention and transfer to the unpredictable match, versus blocked repetition (the contextual-interference effect)." },
        { map: "Dry vs live split",                     h: "You train what's present",          body: "Motor skill is largely task- and effector-specific. Dry fire trains the draw, grip, index and presentation that are actually present; recoil and follow-up aren't present without a shot, so they need live fire. Precision pistol is a different task and transfers little." },
        { map: "Eyes-closed index &middot; visualisation", h: "Mental rehearsal counts",         body: "Mental practice produces a small-to-moderate measurable gain in meta-analysis (SMD around 0.4). Rehearsing the index and the plan in your head is real practice, not a warm-up ritual." },
        { map: "Target-focused presentation &middot; vision-first", h: "Vision leads the hand",  body: "In aiming tasks, elite performers show a longer pre-action fixation on the target (the 'quiet eye'), and cueing on the movement <em>effect</em> - target, dot, gun trajectory - produces faster learning and better performance than cueing on body parts (external focus of attention). Lock the eye on the aim point first, then send the gun." },
        { map: "Par timer &middot; log",                h: "Measure to learn",                   body: "Feedback on the result drives motor learning. A par time turns a vague rep into a measured one, and a log turns a hunch about progress into data." }
      ],
      caveat: "<b>Honest limit.</b> The variable-practice advantage holds up in the lab but is less consistent in complex, real-world tasks, and almost none of it is measured specifically in dynamic pistol shooting. Treat the science as direction, not proof - let your own timer and target data settle it."
    },
    references: {
      lane: "SOURCES",
      title: "Research",
      tiers: [
        {
          tier: "Elite practitioners",
          items: [
            { src: "Practical Shooting Training Group", grade: "World champ / GM",      body: "Stoeger, Hwansik Kim and Joel Park. Stoeger's <em>Dryfire Reloaded</em> drill set codifies the par-time grip-and-presentation cycle this format mirrors, and the 'no-friction' grip framing recurs across the published class videos. Much is paywalled; the free clips are the value.", links: [{ label: "practicalshootingtraininggroup.com", url: "https://www.practicalshootingtraininggroup.com" }] },
            { src: "Modern Samurai Project",             grade: "Red-dot specialist",    body: "Scott Jedlinski's system for presentation: the draw delivers the dot to the eye rather than leaving you to hunt for it in the glass.", links: [{ label: "modernsamuraiproject.com", url: "https://www.modernsamuraiproject.com/path-to-performance" }] },
            { src: "Steve Anderson",                     grade: "USPSA GM",              body: "<em>Refinement and Repetition</em> is the par-time dry-fire format this framework mirrors - grip-build and presentation cycles run through it. <em>That Shooting Show</em> returns to grip mechanics and dot-find on presentation across episodes.", links: [{ label: "andersonshooting.com", url: "https://www.andersonshooting.com/product-page/refinement-and-repetition" }] },
            { src: "Hwansik Kim",                        grade: "Top GM",                body: "Analytical recoil management broken into grip, joints and stance - why locking often matters more than raw crush.", links: [{ label: "No-friction grip (YouTube)", url: "https://www.youtube.com/watch?v=qYxjwAx2MD4" }] }
          ]
        },
        {
          tier: "Coaching reference",
          items: [
            { src: "Charlie Delta Academy",                   grade: "Explainer",          body: "The grip &rarr; index link, and why tactile reference points produce a repeatable grip.", links: [{ label: "charliedeltaacademy.com - Grip", url: "https://charliedeltaacademy.com/blogs/tips-techniques/fundamentals-part-ii-grip" }] },
            { src: "Lanny Bassham - With Winning in Mind", grade: "Olympic champion", body: "<em>With Winning in Mind</em> from an Olympic gold-medal shooter - the mental-management lineage behind the match-mode mindset, and the visualization basis the eyes-closed index drill draws on. Book, no single link.", links: [] }
          ]
        },
        {
          tier: "Science (peer-reviewed)",
          items: [
            { src: "Contextual interference - meta-analysis", grade: "Meta-analysis", body: "Random / varied practice improves retention and transfer versus blocked repetition; effect is clearer in the lab than in complex applied tasks.", links: [{ label: "frontiersin.org (2024)", url: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1377122/full" }, { label: "nature.com (2024)", url: "https://www.nature.com/articles/s41598-024-65753-3" }] },
            { src: "Specificity &amp; variability of practice",   grade: "Review",         body: "Motor skills are largely task-specific; transfer to untrained variations is real but suboptimal. Grounds the dry-vs-live split.", links: [{ label: "pubmed.ncbi.nlm.nih.gov", url: "https://pubmed.ncbi.nlm.nih.gov/2094928/" }] },
            { src: "Vickers (1996) - Visual control when aiming at a far target", grade: "Foundational paper", body: "Elite performers show a longer final fixation on the target before initiating movement (the 'quiet eye'), which appears to organise the motor plan and reduce variability. Direct grounding for the vision-first drill steps.", links: [{ label: "pubmed.ncbi.nlm.nih.gov", url: "https://pubmed.ncbi.nlm.nih.gov/8934848/" }] },
            { src: "Wulf (2013) - Attentional focus and motor learning", grade: "15-year review", body: "External focus of attention (cueing on the movement effect - target, dot trajectory) consistently produces faster learning and better performance than internal focus (cueing on body parts). Replicated across hundreds of studies.", links: [{ label: "doi.org", url: "https://doi.org/10.1080/1750984X.2012.723728" }] },
            { src: "Mental practice - meta-analysis",       grade: "Meta-analysis",  body: "Mental rehearsal yields a measurable post-acquisition gain (SMD around 0.4).", links: [{ label: "ncbi.nlm.nih.gov/pmc", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4714441/" }] },
            { src: "Schmidt &amp; Lee - Motor Learning and Performance", grade: "Textbook", body: "The standard reference for the principles above (practice schedule, specificity, feedback). Book, no single link.", links: [] }
          ]
        }
      ]
    },
    footer: "TORRELD &middot; data-driven training template &middot; drop a new pack file in <code>src/packs/</code> to build a new protocol &middot; par times are starting values, log your own &middot; standalone HTML, works offline."
  }
});
