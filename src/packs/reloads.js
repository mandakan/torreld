/* Reloads dry-fire - IPSC Production Optics / dynamic pistol.
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
  id: "reloads",
  name: "Reloads",
  documentTitle: "TORRELD - Reloads dry-fire",
  share: {
    title: "Reloads dry-fire",
    tagline: "The mag goes where you look",
    description: "A par-time-driven dry-fire program that builds the look-in and carrier index until the seat happens without thought.",
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
      title: ["Reloads", "on the eye."],
      lede: "A fast reload is an <strong>eye-led, indexed motor sequence</strong>. The mag goes where you look; the magwell is a small target. This is a par-time-driven dry-fire program that builds the look-in and the carrier index until the seat happens without thought.",
      readout: { num: "2.00", label: "par &middot; seconds" }
    },
    diagnosis: {
      lane: "CASE",
      title: "The diagnosis behind the program",
      intro: "Slow reloads come from <em>breaking the eye-to-mag-to-target chain</em>: eyes leave the mag too early, the support hand fumbles the index on the carrier, the seat fails or feels uncertain, and the gun stays low while the brain catches up. Fix the vision and the carrier index; the seat and the press-out follow.",
      chain: [
        { root: true, tag: "Root",      title: "Vision + carrier index", body: "Eyes don't drive the mag all the way to the well; the support-hand index from the carrier isn't repeatable. Everything below rests on this." },
        {              tag: "Symptom",   title: "Seat",                   body: "Fumbled or unsure insert. ~80% a consequence of poor index and a wandering eye." },
        {              tag: "Secondary", title: "Press-out + first shot", body: "Gun stays low after the click; the dot wanders. Improves once the seat is committed. Partly trained alongside the root." }
      ],
      notes: {
        can:  { title: "&#10003; What dry fire gives",   body: "The full reload mechanic in isolation: mag release, support-hand path to the carrier, index from the toe of the magazine, the look-in, the firm seat, and the press-out to the next aim point. The whole sequence is present without a single live round." },
        cant: { title: "&#10007; What it doesn't",        body: "Recoil interrupting the reload, the slide closing on a real round under recoil-fatigued grip, and reload performance late in a hard stage. Those need live fire - ideally inside a stage, not just a static drill." }
      }
    },
    program: {
      lane: "5 SESSIONS",
      title: "The week",
      sessions: [
        { n: "Session 01", primary: true,  focus: "Index + look-in", items: ["Index-and-insert", "Eyes-on-the-mag"] },
        { n: "Session 02", primary: true,  focus: "Index + look-in", items: ["Index-and-insert", "Reload + 1"] },
        { n: "Session 03", primary: true,  focus: "Index + look-in", items: ["Index-and-insert", "Eyes-on-the-mag"] },
        { n: "Session 04", primary: false, focus: "Stage context",   items: ["Position-to-position reload"] },
        { n: "Session 05", primary: false, focus: "Pressure",        items: ["Reload + 1", "Reload on a tightening clock"] }
      ],
      note: "10-15 min/session. Quality over volume - a fumbled rep doesn't count, reset and run it again. <b>Spend ~70% of the time on Index-and-insert</b>: it attacks the root fault, the rest follows."
    },
    drills: {
      lane: "ARM",
      title: "The drills",
      intro: "Each card arms the timer at the bottom with a starting setup. Use dummy mags or empty mags - never live rounds in dry fire. The par times are <em>starting values</em> for an intermediate Production Optics shooter; adjust them and log your own.",
      items: [
        {
          primary: true, span: true,
          chips: [{ cls: "prim", label: "Primary" }, { cls: "cyc", label: "Circuit" }, { cls: "", label: "Index &middot; vision" }],
          title: "Index-and-insert",
          why: "Under the dot, the gaze leaves the magwell before the mag does and the support hand finds the carrier differently every time. This drill welds the eye to the magwell and the index to a single repeatable carrier reference until the seat lands on its own.",
          steps: [
            "Start gun up, aimed at a small reference. Drop the mag with the strong-hand thumb as the gun tilts toward the carrier.",
            "Support hand to the carrier - index finger flat against the <em>front</em> of the magazine, thumb finds the body of the mag. Same grip every time.",
            "<em>Eyes onto the magwell</em>. Drive the mag in; commit the seat with a firm push, not a tap.",
            "Press out and re-acquire the aim point. Freeze. If the grip on the mag or the eye path slipped, the rep doesn't count.",
            "Slow and perfect first, then speed."
          ],
          timer: { mode: "circuit", par: "2.0", dmin: "1.5", dmax: "3.0", reps: "8", rest: "4" },
          label: "Index-and-insert"
        },
        {
          chips: [{ cls: "par", label: "Par" }, { cls: "", label: "Vision" }],
          title: "Eyes-on-the-mag",
          why: "Isolates the look-in. Most missed seats come from the eyes snapping back to the target before the mag is committed. Train the eye to stay on the magwell until contact, then release.",
          steps: [
            "Set up at the aim point, gun up.",
            "Run the reload, but consciously hold the eye on the magwell until you feel the seat.",
            "<em>Only then</em> release the eye to the target and press out.",
            "If you caught yourself looking up early, reset - the rep doesn't count."
          ],
          timer: { mode: "par", par: "1.2", dmin: "1.5", dmax: "3.5", reps: "1", rest: "0" },
          label: "Eyes-on-the-mag"
        },
        {
          chips: [{ cls: "par", label: "Par" }, { cls: "", label: "Reload &middot; first shot" }],
          title: "Reload + 1",
          why: "The full sequence under a par: release, index, look in, seat, press out, break the shot. The honest test of whether the in-isolation work has fused.",
          steps: [
            "Gun up on aim point. Start with the trigger pressed (or simulated empty chamber).",
            "On the start beep, run the reload and break a single dry shot on the same aim point.",
            "Break must coincide with the par beep. Early is wasted; late is the real diagnosis."
          ],
          timer: { mode: "par", par: "2.0", dmin: "1.5", dmax: "3.5", reps: "1", rest: "0" },
          label: "Reload + 1"
        },
        {
          chips: [{ cls: "par", label: "Par" }, { cls: "", label: "Movement &middot; stage" }],
          title: "Position-to-position reload",
          why: "Reloads in matches happen <em>during</em> movement between positions. Train the reload that overlaps the leave-and-enter, so no time is paid twice.",
          steps: [
            "Set up in one position. On the beep, break a dry shot, then leave the position.",
            "Reload <em>while moving</em> - the seat should land before the foot does at the new position.",
            "Settle into position, mount the gun, break the dry shot on arrival.",
            "If the seat lands after the foot, you paid for the reload twice. Reset."
          ],
          timer: { mode: "par", par: "3.5", dmin: "1.5", dmax: "3.5", reps: "1", rest: "0" },
          label: "Position-to-position reload"
        },
        {
          chips: [{ cls: "cyc", label: "Circuit" }, { cls: "", label: "Pressure &middot; coordination" }],
          title: "Reload on a tightening clock",
          why: "Late in a stage the reload fails because the eye gets lazy on the magwell and the carrier index drifts - coordination decay under the clock. Compress the par until the look-in fails the binary check, then back off one step and hold there.",
          steps: [
            "Start at par 2.0. Run a clean rep: eyes drive the mag to the magwell, hold on the well until you feel the seat, then release to the aim point.",
            "If the rep passes the look-in check, drop the par by 0.1&nbsp;s and run again. Keep tightening until a rep fails - the eye snapped up early or the index missed.",
            "Back the par off by 0.2&nbsp;s and finish the circuit there. Every rep at that par must pass the same binary look-in check.",
            "Reset between reps - eyes off the gun, eyes back to a fresh aim point, then re-arm."
          ],
          timer: { mode: "circuit", par: "2.0", dmin: "1.5", dmax: "3.5", reps: "8", rest: "5" },
          label: "Reload on a tightening clock"
        }
      ]
    },
    evidence: {
      lane: "WHY IT WORKS",
      title: "The science, mapped to the drills",
      intro: "Most reload advice is practitioner consensus. Where the program leans on motor-learning research, here is the mapping - and the honest limits.",
      items: [
        { map: "Index-and-insert &middot; magwell as target", h: "Fitts' law: small targets cost time", body: "Movement time to a target grows with distance and shrinks with target width. The magwell is a small target; the reload is a Fittsian aiming task. The fix is a more repeatable <em>index</em> that reduces the effective distance from carrier to well." },
        { map: "Eyes-on-the-mag &middot; vision leads",       h: "Eyes precede the hands",            body: "In skilled aiming and interception, the gaze fixes on the target before the hand arrives, and the hand is guided into the fixation. Pulling the eye off the magwell early leaves the hand without a target." },
        { map: "Index-and-insert &middot; random delay",      h: "Variable practice transfers better", body: "Varying the rep - random start delay, position changes - tends to lower practice-day performance but improve retention and transfer to the unpredictable match, versus blocked repetition (the contextual-interference effect)." },
        { map: "Par timer &middot; log",                       h: "Measure to learn",                  body: "Feedback on the result drives motor learning. A par time turns a vague reload rep into a measured one, and a log turns a hunch about progress into data." }
      ],
      caveat: "<b>Honest limit.</b> Fitts' law and the eye-leads-hand finding hold up across simple aiming tasks; neither has been measured specifically in pistol reloads at IPSC speeds. Treat the science as direction, not proof - let your own timer and target data settle it."
    },
    references: {
      lane: "SOURCES",
      title: "Research",
      tiers: [
        {
          tier: "Elite practitioners",
          items: [
            { src: "Practical Shooting Training Group", grade: "World champ / GM",      body: "Stoeger, Hwansik Kim and Joel Park. Stoeger's PSTG class material covers the reload as a vision-and-index problem - eye to the magwell, carrier indexed off the support hand - and Park's reload mechanics are a recurring class theme. Much is paywalled; the free class videos are the value.", links: [{ label: "practicalshootingtraininggroup.com", url: "https://www.practicalshootingtraininggroup.com" }] },
            { src: "Steve Anderson",                     grade: "USPSA GM",              body: "<em>Refinement and Repetition</em> is the par-time dry-fire format this framework mirrors - <em>Reload + 1</em> is one of its named drills, ported directly here. <em>That Shooting Show</em> returns to slide-lock vs in-battery reload technique across episodes.", links: [{ label: "andersonshooting.com", url: "https://www.andersonshooting.com/product-page/refinement-and-repetition" }] },
            { src: "Modern Samurai Project",             grade: "Red-dot specialist",    body: "Scott Jedlinski on vision: the reload, like the draw, finds the mag with the eye first; the hand is sent to where the eye already is.", links: [{ label: "modernsamuraiproject.com", url: "https://www.modernsamuraiproject.com/path-to-performance" }] },
            { src: "Hwansik Kim",                        grade: "Top GM",                body: "Analytical reload mechanics: the carrier index, the look-in, and the firm commit. Channel videos free; the deep work is in PSTG classes.", links: [] }
          ]
        },
        {
          tier: "Coaching reference",
          items: [
            { src: "Charlie Delta Academy",                   grade: "Explainer",          body: "Plain-language coverage of the grip and support-hand reference points that drive a clean magwell insertion under speed.", links: [{ label: "charliedeltaacademy.com", url: "https://charliedeltaacademy.com/blogs/tips-techniques/fundamentals-part-ii-grip" }] },
            { src: "Brian Enos - forum + Practical Shooting", grade: "Community + book", body: "Decades of practitioner discussion on reload technique under different divisions and platforms, plus the foundational book Practical Shooting: Beyond Fundamentals.", links: [{ label: "brianenos.com", url: "https://www.brianenos.com/" }] },
            { src: "Lanny Bassham - With Winning in Mind", grade: "Olympic champion", body: "<em>With Winning in Mind</em> from an Olympic gold-medal shooter - the rehearsal-as-practice lineage underwriting the look-in as a single deliberate-attention moment rather than a hand-speed exercise. Book, no single link.", links: [] }
          ]
        },
        {
          tier: "Science (peer-reviewed)",
          items: [
            { src: "Fitts (1954) - The information capacity of the human motor system", grade: "Foundational paper", body: "The original aiming-time law: movement time scales with log<sub>2</sub>(2A/W). The magwell is small (W); a poor carrier index inflates effective distance (A).", links: [{ label: "pubmed.ncbi.nlm.nih.gov", url: "https://pubmed.ncbi.nlm.nih.gov/13174710/" }] },
            { src: "Contextual interference - meta-analysis", grade: "Meta-analysis", body: "Random / varied practice improves retention and transfer versus blocked repetition; effect is clearer in the lab than in complex applied tasks.", links: [{ label: "frontiersin.org (2024)", url: "https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1377122/full" }] },
            { src: "Specificity &amp; variability of practice",   grade: "Review",         body: "Motor skills are largely task-specific; transfer to untrained variations is real but suboptimal. Grounds the dry-vs-live split for the reload.", links: [{ label: "pubmed.ncbi.nlm.nih.gov", url: "https://pubmed.ncbi.nlm.nih.gov/2094928/" }] },
            { src: "Schmidt &amp; Lee - Motor Learning and Performance", grade: "Textbook", body: "The standard reference for the principles above (practice schedule, specificity, feedback, eye-hand coordination). Book, no single link.", links: [] }
          ]
        }
      ]
    },
    footer: "TORRELD &middot; data-driven training template &middot; drop a new pack file in <code>src/packs/</code> to build a new protocol &middot; par times are starting values, log your own &middot; standalone HTML, works offline."
  }
});
