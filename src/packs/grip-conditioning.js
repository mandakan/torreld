/* Grip conditioning - off-range companion to grip-first.
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
  id: "grip-conditioning",
  name: "Grip conditioning",
  documentTitle: "TORRELD - Off-range grip conditioning",
  share: {
    title: "Off-range grip conditioning",
    tagline: "Grip work for when there's no gun to hand",
    description: "A short conditioning supplement that raises the capacity floor - support-hand crush endurance and a forearm-driven wrist lock - so the grip your technique already knows survives a full stage.",
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
      eyebrow: "Conditioning supplement &middot; companion to grip-first",
      title: ["No gun", "needed."],
      lede: "When you can't dry-fire, you can still condition the hands. This raises the <strong>capacity floor</strong> - support-hand crush endurance and a forearm-driven wrist lock - so a good grip doesn't fade late in a stage.",
      readout: { num: "12", label: "hold &middot; seconds" }
    },
    diagnosis: {
      lane: "SCOPE",
      title: "What this pack can and can't move",
      intro: "A consistent grip is built from three things: placement (tactile index), support-hand crush, and a locked wrist - and almost all of that needs the gun in your hands. This pack can't build that consistency; what it builds is the <em>capacity floor</em> underneath it, so the grip your technique already knows still holds on the last array. Consistency itself is built in <a href=\"?pack=grip-first\">grip-first</a> plus live fire; this is the off-range supplement that keeps a good grip durable.",
      chain: [
        { root: true, tag: "Root",      title: "Support-hand crush endurance", body: "The support hand does the recoil work and is the hand that fails late, when the forearm is cooked. Build the endurance and the crush you make fresh is still there at the end." },
        {              tag: "Capacity",   title: "Wrist lock",                   body: "A forearm-driven joint lock, distinct from crush (Kim). Trained here off the gun, felt on the gun." },
        {              tag: "Needs the gun", title: "Placement + index",         body: "The tactile reference and the grip pattern itself can't be trained without the gun. Punted to <a href=\"?pack=grip-first\">grip-first</a>." }
      ],
      notes: {
        can:  { title: "&#10003; What conditioning gives",  body: "Support-hand crush endurance, forearm and wrist-lock engagement, and extensor balance to hold the lock. A grip that survives fatigue late in a long stage." },
        cant: { title: "&#10007; What it doesn't",           body: "Placement, index and the grip pattern itself need the gun, and recoil control needs live fire. Grip strength sits below technique; a floor matters only once the technique is there. Consistency is <a href=\"?pack=grip-first\">grip-first</a>'s job." }
      }
    },
    program: {
      lane: "3 SESSIONS",
      title: "The week",
      sessions: [
        { n: "Session 01", primary: true,  focus: "Crush + lock",   items: ["Support-hand crush endurance", "Wrist-lock + forearm set"] },
        { n: "Session 02", primary: false, focus: "Wrist + extensor", items: ["Wrist-lock + forearm set"] },
        { n: "Session 03", primary: true,  focus: "Crush + lock",   items: ["Support-hand crush endurance", "Wrist-lock + forearm set"] }
      ],
      note: "5-8 min/session. This runs <b>alongside</b> grip-first, never in place of range or dry-fire time. Leave a rest day between the two hard crush sessions - it's endurance work and needs recovery; the wrist-lock and extensor work is lighter and fine most days. Progress by holding longer or adding resistance as it gets easy, and log your own numbers - the hold times are starting values."
    },
    drills: {
      lane: "ARM",
      title: "The drills",
      intro: "Two drills, both worth the time. Each card arms the timer with a starting setup. The hold times are <em>starting values</em> - adjust them and log your own. On these the par beep marks the <em>end of the hold</em>, not a shot.",
      items: [
        {
          primary: true, span: true,
          chips: [{ cls: "prim", label: "Primary" }, { cls: "cyc", label: "Circuit" }, { cls: "", label: "Grip &middot; endurance" }],
          title: "Support-hand crush endurance",
          why: "The support hand carries the recoil work, and it's the hand that fails late in a stage when the forearm is cooked. Build the endurance so the crush you make on the first array is still there on the last. This raises capacity; placement is built in grip-first, with the gun in hand.",
          steps: [
            "Crush a rolled towel in the support hand near-max, short of pain or shaking. Zero-equipment: wring a hand towel as hard as you can hold. If you have it: a hand gripper held closed, or a dead hang from a bar.",
            "Hold the crush to the par beep - the beep marks the end of the hold, not a shot.",
            "Rest, then repeat. Keep the work in the support hand; the firing hand is not the point.",
            "Stop the moment the crush fades to a limp squeeze - 'right place, no force' is the failure to avoid, same logic as grip-first's Grip under load.",
            "Below the floor? If you can't hold rep 1 to par even fresh, add a little grip <em>strength</em> work first - a set of near-max gripper closes or towel squeezes on off days. Keep it small: the transfer is task-specific and modest, so treat it as a way onto the floor before the endurance work."
          ],
          read: {
            gate: {
              sign: "You can't hold to par even on rep 1, fresh.",
              cause: "The starting hold is longer than your current endurance.",
              fix: "Cut the hold time until rep 1 is clean, then rebuild the length rep by rep over sessions. If rep 1 fresh is a struggle at any length, add the tiered strength work until there's a floor to build on."
            },
            biases: [
              {
                sign: "The crush fades to a soft squeeze partway through the set - the hand is closed but there's almost no force in it.",
                cause: "The forearm is spent; the hold is holding a shape, not a crush.",
                fix: "That's the stop signal - end the set here. More reps in this state only train the limp squeeze you're trying to avoid late in a stage."
              },
              {
                sign: "The firing hand or the arm starts bracing to help the hold.",
                cause: "The support hand alone can't carry the hold, so the body recruits help.",
                fix: "Keep the work in the support hand and end the set when it alone can't hold. Recruiting the other hand hides the exact capacity you're training."
              }
            ]
          },
          timer: { mode: "circuit", par: "12", dmin: "1.5", dmax: "3.0", reps: "6", rest: "30", floor: "12" },
          label: "Support-hand crush endurance"
        },
        {
          primary: true,
          chips: [{ cls: "prim", label: "Primary" }, { cls: "par", label: "Par" }, { cls: "", label: "Wrist &middot; forearm" }],
          title: "Wrist-lock + forearm set",
          why: "Kim's point: recoil stability comes from locking the wrist through forearm engagement, a capacity separate from crush. Train the lock so it's there on the gun, and train the finger extensors that balance it - the antagonist that keeps the lock even.",
          steps: [
            "Extend the arms as if presenting, no gun.",
            "Engage the forearm to lock the wrist flat and neutral against a static load - press the knuckles into a wall, or hold a weighted object at extension. Zero-equipment: a wall press or a full water bottle held at extension. If you have it: a resistance band or a light dumbbell.",
            "Hold to the par beep. Feel the forearm doing the locking, not the hand crushing.",
            "Between holds, open the fingers against a rubber band for a controlled set of extensor reps - the antagonist that balances the lock."
          ],
          read: {
            gate: {
              sign: "Only the hand tightens - the forearm never engages and the wrist isn't locking.",
              cause: "The lock is being driven from the hand instead of the forearm, so there's nothing setting the joint.",
              fix: "Regress to isolating the wrist lock with no load until you can feel the forearm set, then add load back."
            },
            biases: [
              {
                sign: "The wrist breaks or flexes under the hold instead of staying neutral.",
                cause: "The load is past what the forearm can lock against right now.",
                fix: "Reduce the load and hold the neutral lock. The point is a clean set at the joint, not a heavy hold."
              },
              {
                sign: "The shoulder or elbow starts taking over the hold.",
                cause: "The set has drifted up the arm off the wrist and forearm.",
                fix: "Keep the set at the wrist and forearm; back off the load until that's where the work stays."
              }
            ]
          },
          timer: { mode: "par", par: "15", dmin: "1.5", dmax: "3.0", reps: "1", rest: "0", floor: "15" },
          label: "Wrist-lock + forearm set"
        }
      ]
    },
    evidence: {
      lane: "WHY IT WORKS",
      title: "The science, mapped to the drills",
      intro: "This pack sits on practitioner consensus about the competition grip plus a small body of strength and motor-learning research. Here's the mapping - and the honest limits, which are large here.",
      items: [
        { map: "Crush endurance &middot; support hand", h: "The grip is support-hand-dominant", body: "Near-unanimous across camps: the firing hand stays light and just runs the trigger, the support hand crushes near-max, short of pain or shaking. Joel Park frames the split that way; Scott Jedlinski puts nearly all the steadying work on the support hand. So the hand worth conditioning is the support hand." },
        { map: "Wrist-lock + forearm set",              h: "Joints over raw crush",             body: "Hwansik Kim treats recoil management as mostly a joint-locking problem - wrists, elbows, shoulders - and works those over grip strength. That's why the second drill trains a forearm-driven wrist lock as a capacity of its own, separate from crush force." },
        { map: "Both drills &middot; the honest limit",  h: "Off-gun strength is small and specific", body: "Hand-strength training gives about a 4&nbsp;kg gain (Hedges g around 0.44); gripper work mostly raises device scores with little transfer; measured grip force is specific to the exact hand configuration. A police study links grip-strength magnitude to qualification scores, but it's correlational and in a weak-gripped population. This is a conditioning floor, not a source of consistency." },
        { map: "Why no pressure-matching drill",         h: "Force reproduction is poor at light load", body: "Reproducing a force is unreliable at light levels and only dependable at higher force. That's why the doctrine loads the support hand hard and keeps the firing hand light, and why there's no drill here asking you to hit an exact pressure number." },
        { map: "Placement stays with the gun",           h: "Specificity of practice",           body: "Motor skill is largely task-specific. Placement and index are trained with the gun in hand, so they live in grip-first, not here. Conditioning transfers to capacity, not to the grip pattern itself." }
      ],
      caveat: "<b>Honest limit.</b> The transfer evidence is drawn from non-shooting or non-elite populations and applies here by analogy, not by direct measurement in dynamic pistol. A maximal <em>equal</em> left-and-right crush is also taught - Chris Sajnog, from a tactical rather than IPSC background - as documented dissent from the support-hand-dominant view this pack follows. Treat all of it as direction and let your own log settle it.",
    },
    references: {
      lane: "SOURCES",
      title: "Research",
      tiers: [
        {
          tier: "Elite practitioners",
          items: [
            { src: "Practical Shooting Training Group - Joel Park", grade: "GM coach", body: "Grip-pressure articles on the Ben Stoeger Pro Shop blog: the firing hand stays light while the support hand does the crushing. The clearest published statement of the support-hand-dominant split this pack conditions.", links: [{ label: "grip pressure, part 1", url: "https://benstoegerproshop.com/blog/grip-pressure-and-fitting-your-gun-to-your-hands-part-1/" }, { label: "part 2", url: "https://benstoegerproshop.com/blog/grip-pressure-and-fitting-your-gun-to-your-hands-part-2/" }] },
            { src: "Hwansik Kim",                        grade: "Top GM",                body: "Joint-locking method: recoil management is mostly about locking the wrists, elbows and shoulders, which he trains over raw grip strength. The basis for the wrist-lock drill.", links: [{ label: "hkimshooting.com - blog", url: "https://www.hkimshooting.com/blog-1" }] },
            { src: "Modern Samurai Project",             grade: "Red-dot specialist",    body: "Scott Jedlinski teaches that the support hand does nearly all the work of holding the gun steady - the support-hand-dominant grip, corroborated in published AARs.", links: [{ label: "modernsamuraiproject.com", url: "https://www.modernsamuraiproject.com" }, { label: "AAR (offgridweb.com)", url: "https://www.offgridweb.com/preparation/red-dot-pistol-fundamentals-with-modern-samurai-project/" }] }
          ]
        },
        {
          tier: "Coaching reference",
          items: [
            { src: "SSUSA - Grip technique for action pistol", grade: "Explainer", body: "Practitioner consensus that grip strength is secondary to technique and shouldn't be where training goes first - the frame for treating this pack as preparation under the main work.", links: [{ label: "ssusa.org - grip technique", url: "https://www.ssusa.org/content/grip-technique-for-action-pistol/" }] },
            { src: "Chris Sajnog - documented dissent",     grade: "Tactical instructor", body: "Teaches a maximal equal crush, roughly 100/100 in both hands. A former SEAL instructor, not an IPSC competitor - cited only as documented dissent from the support-hand-dominant view this pack follows, not as an endorsed method.", links: [{ label: "chrissajnog.com - grip strength", url: "https://chrissajnog.com/blog/improve-your-grip-strength/dry-weapons-training/" }] }
          ]
        },
        {
          tier: "Science (peer-reviewed)",
          items: [
            { src: "Hand-strength training - meta-analysis", grade: "Meta-analysis", body: "Training raises hand/grip strength by a moderate amount (Hedges g around 0.44, on the order of 4&nbsp;kg). Real but small - grounds the honest limit on off-gun strength work.", links: [{ label: "pmc.ncbi.nlm.nih.gov", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12524766/" }] },
            { src: "Grip-strengthener transfer - review",   grade: "Review",         body: "Device grip work mostly improves scores on the device, with limited transfer beyond it. That's why gripper work here is a floor to start from, with the endurance holds as the real work.", links: [{ label: "marathonhandbook.com", url: "https://marathonhandbook.com/do-grip-strengtheners-work/" }] },
            { src: "Grip-force is configuration-specific",   grade: "Study",           body: "Measured grip force depends on the exact grip configuration (grip type is a main effect). Off-gun strength doesn't automatically become on-gun force.", links: [{ label: "ncbi.nlm.nih.gov/pmc", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10563762/" }] },
            { src: "Force reproduction and proprioception",  grade: "Study",           body: "Reproducing a target force is less accurate at light loads and more reliable at higher force. The evidence behind a hard, repeatable support crush and against any light-touch pressure-matching drill.", links: [{ label: "pubmed.ncbi.nlm.nih.gov", url: "https://pubmed.ncbi.nlm.nih.gov/38170961/" }] },
            { src: "Specificity of practice",                grade: "Review",          body: "Motor skills are largely task-specific; transfer to untrained variations is real but suboptimal. Grounds keeping placement and index with the gun, in grip-first.", links: [{ label: "pubmed.ncbi.nlm.nih.gov", url: "https://pubmed.ncbi.nlm.nih.gov/2094928/" }] },
            { src: "Police grip strength vs qualification",  grade: "Study",           body: "Grip-strength magnitude correlates with shooting-qualification scores in a police sample - correlational, in a weak-gripped population, and about magnitude rather than consistency. Suggestive, not a mandate.", links: [{ label: "forcescience.com (2021)", url: "https://www.forcescience.com/2021/09/new-study-grip-strength-and-shooting-performance/" }] }
          ]
        }
      ]
    },
    footer: "TORRELD &middot; data-driven training template &middot; drop a new pack file in <code>src/packs/</code> to build a new protocol &middot; hold times are starting values, log your own &middot; standalone HTML, works offline."
  }
});
