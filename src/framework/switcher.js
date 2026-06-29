/* Pack switcher — UI + URL persistence.
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

  function renderSwitcher(){
    var el = document.getElementById("packSwitcher");
    if(!el) return;
    // Hidden by CSS via :empty when only one pack — but populate anyway for ARIA.
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
