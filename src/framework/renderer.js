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

  function renderTopbar(P){
    document.getElementById("brand").innerHTML =
      '<b>' + P.brand.pre + '</b>' + P.brand.post;

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

  function renderDrills(dr){
    var cards = dr.items.map(function(c){
      var chips = c.chips.map(function(ch){
        return '<span class="chip' + (ch.cls ? " " + ch.cls : "") + '">' + ch.label + '</span>';
      }).join("");
      var steps = c.steps.map(function(s){ return '<li>' + s + '</li>'; }).join("");
      var t = c.timer;
      var spec = '<span><b>Timer</b> <span class="v">' +
        (t.mode === "circuit" ? "Circuit" : "Par") +
        '</span></span><span><b>Par</b> <span class="v">' + t.par + ' s</span></span>';
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
        ' data-label="' + c.label + '">Arm timer</button>';
      return '<div class="card' + (c.primary ? " primary" : "") + (c.span ? " span" : "") + '">' +
        '<div class="card-top">' + chips + '</div>' +
        '<h3>' + c.title + '</h3>' +
        '<p class="why">' + c.why + '</p>' +
        '<ol>' + steps + '</ol>' +
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
        return '<div class="ref">' +
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
            label: d.label
          });
        });
      }
    );
  }

  function render(packId){
    var pack = T.packs.find(function(p){ return p.id === packId; });
    if(!pack) return;
    T.activeId = packId;

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
  }

  T.render = render;
})();
