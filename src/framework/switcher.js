/* Pack switcher - UI + URL persistence.
 *
 * - Hidden when only one pack is registered (clean default).
 * - Active pack persists via ?pack=<id> query param (no storage permissions needed).
 * - Boot picks ?pack=<id>  ->  first registered pack as fallback.
 */
(function(){
  var T = window.TORRELD;

  function getInitialPackId(){
    var fallback = T.packs[0] && T.packs[0].id;
    try {
      var u = new URL(window.location.href);
      var p = u.searchParams.get("pack");
      if(p && T.packs.some(function(x){ return x.id === p; })) return p;
    } catch(e) {}
    return fallback;
  }

  function writeUrl(id){
    try {
      var u = new URL(window.location.href);
      u.searchParams.set("pack", id);
      history.replaceState(null, "", u.toString());
    } catch(e) {}
  }

  // Toggle the edge fades from scroll position: fade the right only while
  // more chips lie ahead, the left only once scrolled past the start. A row
  // that fits (no overflow) reads as at-both-ends, so neither edge fades.
  function updateFades(el){
    var max = el.scrollWidth - el.clientWidth;
    var x = el.scrollLeft;
    el.style.setProperty("--fade-l", x <= 1 ? "0px" : "18px");
    el.style.setProperty("--fade-r", x >= max - 1 ? "0px" : "18px");
  }

  function bindFades(el){
    if(el._fadesBound) return;
    el._fadesBound = true;
    var tick = function(){ updateFades(el); };
    el.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
  }

  function renderSwitcher(){
    var el = document.getElementById("packSwitcher");
    if(!el) return;
    // Hidden by CSS via :empty when only one pack - but populate anyway for ARIA.
    if(T.packs.length <= 1){ el.innerHTML = ""; return; }
    el.innerHTML = T.packs.map(function(p){
      var pressed = (p.id === T.activeId) ? "true" : "false";
      return '<button type="button" role="tab" data-pack="' + p.id +
             '" aria-pressed="' + pressed + '">' + p.name + '</button>';
    }).join("");
    Array.prototype.forEach.call(el.querySelectorAll("button"), function(b){
      b.addEventListener("click", function(){
        var id = b.getAttribute("data-pack");
        if(id === T.activeId) return;
        setActivePack(id);
      });
    });
    bindFades(el);
    updateFades(el);
  }

  function setActivePack(id){
    writeUrl(id);
    T.render(id);
    renderSwitcher();
  }

  function boot(){
    if(!T.packs.length){
      document.getElementById("app").innerHTML =
        '<section><p class="intro">No exercise packs registered.</p></section>';
      return;
    }
    var id = getInitialPackId();
    T.render(id);
    renderSwitcher();
    T.timer.init();
  }

  T.setActivePack = setActivePack;
  T.boot = boot;
})();
