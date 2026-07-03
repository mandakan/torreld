/* Renderer - builds the page from a PROGRAM data object.
 *
 * Author-trusted content rendered via innerHTML so copy can contain <em>,
 * - etc. NEVER pass untrusted/user-supplied strings to render().
 */
(function(){
  var T = window.TORRELD;

  function head(lane, title){
    return '<div class="section-head"><span class="lane">' + lane + '</span><h2>' + title + '</h2></div>';
  }

  /* In-page anchor ids. Drill cards get "drill-<slug(label)>", references
     entries "ref-<slug(src)>", so read blocks can link to both with plain
     anchors (regressTo jumps, per-read source pointers). One slug function
     for both sides so the ids always agree. */
  function slug(s){
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function renderTopbar(P){
    /* Inside a pack the brandmark returns to the landing picker. It is a real
       control (anchor + back-chevron + aria-label), not a bare clickable logo -
       switcher.js intercepts the click. The chevron marks it as tappable so it
       does not lean on the weak logo-as-home convention alone. */
    document.getElementById("brand").innerHTML =
      '<a class="brand-home" href="./" aria-label="All programs">' +
        '<span class="brand-chevron" aria-hidden="true">&#8249;</span>' +
        '<span class="brand-word"><b>' + P.brand.pre + '</b>' + P.brand.post + '</span>' +
      '</a>';

    var navHTML = P.nav.map(function(n){
      return '<a href="#' + n.id + '">' + n.label + '</a>';
    }).join("");
    document.getElementById("topnav").innerHTML = navHTML;
  }

  function renderHero(P){
    document.getElementById("hero").innerHTML =
      '<div class="wrap"><p class="eyebrow">' + P.hero.eyebrow + '</p>' +
      '<h1>' + P.hero.title[0] + '<br><span class="dim">' + P.hero.title[1] + '</span></h1>' +
      '<p class="lede">' + P.hero.lede + '</p>' +
      '<div class="hero-readout"><span class="num">' + P.hero.readout.num +
      '</span><span class="lab">' + P.hero.readout.label + '</span></div></div>';
  }

  function renderDiagnosis(d){
    var chain = "";
    d.chain.forEach(function(node, i){
      chain += '<div class="node' + (node.root ? " root" : "") + '">' +
        '<div class="tag">' + node.tag + '</div>' +
        '<h3>' + node.title + '</h3>' +
        '<p>' + node.body + '</p></div>';
      if(i < d.chain.length - 1) chain += '<div class="arrow">&rarr;</div>';
    });
    return '<section id="diagnosis">' + head(d.lane, d.title) +
      '<p class="intro">' + d.intro + '</p>' +
      '<div class="chain">' + chain + '</div>' +
      '<div class="note">' +
        '<div class="can"><h4 class="can">' + d.notes.can.title + '</h4><p>' + d.notes.can.body + '</p></div>' +
        '<div class="cant"><h4 class="cant">' + d.notes.cant.title + '</h4><p>' + d.notes.cant.body + '</p></div>' +
      '</div></section>';
  }

  function renderProgram(pr){
    var days = pr.sessions.map(function(s){
      var items = s.items.map(function(it){ return '<li>' + it + '</li>'; }).join("");
      return '<div class="day' + (s.primary ? " primary" : "") + '">' +
        '<div class="n">' + s.n + '</div>' +
        '<div class="focus">' + s.focus + '</div>' +
        '<ul>' + items + '</ul></div>';
    }).join("");
    return '<section id="program">' + head(pr.lane, pr.title) +
      '<div class="week">' + days + '</div>' +
      '<p class="weeknote">' + pr.note + '</p></section>';
  }

  /* Optional per-drill corrective block: a collapsed <details> the shooter
     opens between sessions when a result keeps coming out wrong. Structure is
     gate-then-biases - read repeatability first (scatter -> regress), then the
     directional reads that only mean something once the base repeats. Author-
     trusted HTML, same as the rest of the pack copy. */
  function readRow(r, isGate){
    /* regressTo (gate only) renders as a real jump to the target card; the
       fix prose still names the drill so the row reads standalone. ref points
       at the References entry that grounds the row - the external URL lives
       there, never inline in the card. */
    var tail = "";
    if(isGate && r.regressTo){
      tail += '<a class="read-jump" href="#drill-' + slug(r.regressTo) + '">' +
        'Go to ' + r.regressTo + ' &rarr;</a>';
    }
    if(r.ref){
      tail += '<a class="read-src" href="#ref-' + slug(r.ref) + '">Source: ' + r.ref + '</a>';
    }
    return '<div class="read-row' + (isGate ? " gate" : "") + '">' +
      '<div class="sign">' + r.sign + '</div>' +
      '<div class="cause">' + r.cause + '</div>' +
      '<div class="fix">' + r.fix + '</div>' + tail + '</div>';
  }
  function renderRead(read){
    if(!read) return "";
    var rows = "";
    if(read.gate) rows += readRow(read.gate, true);
    (read.biases || []).forEach(function(b){ rows += readRow(b, false); });
    if(!rows) return "";
    return '<details class="read"><summary>Reading the result</summary>' +
      '<div class="read-body">' + rows + '</div></details>';
  }

  function renderDrills(dr){
    var cards = dr.items.map(function(c){
      var chips = c.chips.map(function(ch){
        return '<span class="chip' + (ch.cls ? " " + ch.cls : "") + '">' + ch.label + '</span>';
      }).join("");
      var steps = c.steps.map(function(s){ return '<li>' + s + '</li>'; }).join("");
      var t = c.timer;
      var spec = '<span><b>Timer</b> <span class="v">' +
        (t.mode === "circuit" ? "Circuit" : "Par") +
        '</span></span><span><b>Par</b> <span class="v">' + t.par + ' s</span>' +
        '<span class="now" data-label="' + c.label + '" data-default="' + t.par + '" hidden></span></span>';
      if(t.mode === "circuit"){
        spec += '<span><b>Rest</b> <span class="v">' + t.rest + ' s</span></span>' +
                '<span><b>Reps</b> <span class="v">' + t.reps + '</span></span>';
      }
      var btn = '<button type="button"' +
        ' data-mode="' + t.mode + '"' +
        ' data-par="' + t.par + '"' +
        ' data-dmin="' + t.dmin + '"' +
        ' data-dmax="' + t.dmax + '"' +
        ' data-reps="' + t.reps + '"' +
        ' data-rest="' + t.rest + '"' +
        ' data-floor="' + (t.floor != null ? t.floor : "") + '"' +
        ' data-label="' + c.label + '">Arm timer</button>';
      return '<div class="card' + (c.primary ? " primary" : "") + (c.span ? " span" : "") +
        '" id="drill-' + slug(c.label) + '">' +
        '<div class="card-top">' + chips + '</div>' +
        '<h3>' + c.title + '</h3>' +
        '<p class="why">' + c.why + '</p>' +
        '<ol>' + steps + '</ol>' +
        renderRead(c.read) +
        '<div class="spec">' + spec + '</div>' +
        '<div class="arm">' + btn + '</div></div>';
    }).join("");
    return '<section id="drills">' + head(dr.lane, dr.title) +
      '<p class="intro">' + dr.intro + '</p>' +
      '<div class="drills">' + cards + '</div></section>';
  }

  function renderEvidence(ev){
    var items = ev.items.map(function(e){
      return '<div class="eitem">' +
        '<div class="map">' + e.map + '</div>' +
        '<h3>' + e.h + '</h3>' +
        '<p>' + e.body + '</p></div>';
    }).join("");
    return '<section id="evidence">' + head(ev.lane, ev.title) +
      '<p class="intro">' + ev.intro + '</p>' +
      '<div class="evidence-grid">' + items + '</div>' +
      '<div class="caveat">' + ev.caveat + '</div></section>';
  }

  function renderReferences(rf, footer){
    var tiers = rf.tiers.map(function(tr){
      var items = tr.items.map(function(r){
        var links = r.links.map(function(l){
          return '<a href="' + l.url + '" target="_blank" rel="noopener noreferrer">' + l.label + '</a>';
        }).join("");
        return '<div class="ref" id="ref-' + slug(r.src) + '">' +
          '<div class="rhead"><span class="src">' + r.src + '</span><span class="grade">' + r.grade + '</span></div>' +
          '<p>' + r.body + '</p>' + links + '</div>';
      }).join("");
      return '<div class="tier"><div class="tierhead">' + tr.tier + '</div><div class="refs">' + items + '</div></div>';
    }).join("");
    return '<section id="references">' + head(rf.lane, rf.title) +
      tiers + '<p class="footer">' + footer + '</p></section>';
  }

  function wireDrills(){
    var cards = document.querySelectorAll(".card");
    Array.prototype.forEach.call(
      document.querySelectorAll(".arm button"),
      function(b){
        var card = b.closest(".card");
        b.addEventListener("click", function(){
          /* Mark the armed card so users can see which drill the timer is
             set up for when scrolling through the program. */
          Array.prototype.forEach.call(cards, function(c){
            c.classList.remove("armed");
          });
          if(card) card.classList.add("armed");

          var d = b.dataset;
          T.timer.arm({
            mode: d.mode,
            par: d.par,
            dmin: d.dmin,
            dmax: d.dmax,
            reps: d.reps,
            rest: d.rest,
            floor: d.floor,
            label: d.label
          });
        });
      }
    );
  }

  function nowKey(packId, label){ return packId + "::" + label; }
  function r2(x){ return Math.round(x * 100) / 100; }

  function paintNow(span, packId){
    var label = span.getAttribute("data-label");
    var def = parseFloat(span.getAttribute("data-default"));
    var cur = (T.progress) ? T.progress.getPar(nowKey(packId, label), def) : def;
    if(r2(cur) !== r2(def)){
      span.textContent = "now " + cur.toFixed(2) + "s";
      span.hidden = false;
    } else {
      span.textContent = "";
      span.hidden = true;
    }
  }
  function refreshAllCardNow(){
    var pid = T.activeId;
    Array.prototype.forEach.call(
      document.querySelectorAll(".now"),
      function(s){ paintNow(s, pid); }
    );
  }
  function updateCardNow(label, cur, def){
    var span = document.querySelector('.now[data-label="' + label + '"]');
    if(!span) return;
    if(r2(cur) !== r2(def)){
      span.textContent = "now " + parseFloat(cur).toFixed(2) + "s";
      span.hidden = false;
    } else {
      span.textContent = "";
      span.hidden = true;
    }
  }

  /* Landing pack picker - the home view when no pack is active. Lists every
     registered pack as a card (name + tagline + description) built from the
     pack's share block. Whole card is an <a href="?pack=id"> so it works
     without JS and supports open-in-new-tab; switcher.js intercepts the click
     for in-page navigation. Content is author-trusted, same as render(). */
  function renderLanding(){
    T.activeId = null;
    document.body.classList.add("is-landing");
    document.title = "TORRELD - Dry-fire training packs";

    document.getElementById("brand").innerHTML = "<b>TORR</b>ELD";
    document.getElementById("topnav").innerHTML = "";

    var n = T.packs.length;
    document.getElementById("hero").innerHTML =
      '<div class="wrap"><p class="eyebrow">Dry-fire training</p>' +
      '<h1>Pick a<br><span class="dim">program.</span></h1>' +
      '<p class="lede">Par-time-driven dry-fire packs. Commit to one and run it; ' +
      'each is a self-contained protocol - diagnosis, plan, drills, evidence.</p>' +
      '<div class="hero-count">' + n + ' program' + (n === 1 ? "" : "s") + '</div></div>';

    var cards = T.packs.map(function(p){
      var s = p.share || {};
      return '<a class="pcard" href="?pack=' + p.id + '" data-pack="' + p.id + '">' +
        '<span class="pcard-eyebrow">Program</span>' +
        '<span class="pcard-name">' + p.name +
          '<span class="pcard-arrow" aria-hidden="true">&rarr;</span></span>' +
        (s.tagline ? '<span class="pcard-tagline">' + s.tagline + '</span>' : "") +
        (s.description ? '<span class="pcard-desc">' + s.description + '</span>' : "") +
      '</a>';
    }).join("");
    document.getElementById("app").innerHTML =
      '<section class="landing"><div class="pcards">' + cards + '</div></section>';
  }

  function render(packId){
    var pack = T.packs.find(function(p){ return p.id === packId; });
    if(!pack) return;
    T.activeId = packId;
    document.body.classList.remove("is-landing");

    var P = pack.data;

    if(pack.documentTitle) document.title = pack.documentTitle;
    else document.title = (pack.name || "TORRELD") + " - TORRELD";

    renderTopbar(P);
    renderHero(P);

    var app = document.getElementById("app");
    app.innerHTML =
      renderDiagnosis(P.diagnosis) +
      renderProgram(P.program) +
      renderDrills(P.drills) +
      renderEvidence(P.evidence) +
      renderReferences(P.references, P.footer);

    wireDrills();
    refreshAllCardNow();
  }

  T.render = render;
  T.renderLanding = renderLanding;
  T.updateCardNow = updateCardNow;
  T.refreshAllCardNow = refreshAllCardNow;
})();
