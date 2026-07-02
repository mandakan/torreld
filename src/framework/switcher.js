/* Pack switcher - boot, view routing, and lightweight persistence.
 *
 * Views:
 *   - Landing picker (no active pack): the home view. See renderer.renderLanding.
 *   - Pack view (?pack=<id> active).
 *
 * Boot decision:
 *   1. ?pack=<valid id> in the URL  -> that pack (deep links, share stubs).
 *   2. bare URL + a remembered pack -> resume that pack.
 *   3. otherwise                    -> landing picker.
 *
 * Persistence with no server and no storage guarantee:
 *   - Active pack rides the URL via ?pack=<id> + history.replaceState.
 *   - The last-entered pack is mirrored to feature-detected localStorage
 *     (torreld.lastPack.v1) through the shared T.storage() probe, so a bare
 *     cold visit can resume it. When storage is blocked (sandbox preview) the
 *     mirror is skipped and every bare visit shows the landing.
 */
(function(){
  var T = window.TORRELD;

  var LAST_KEY = "torreld.lastPack.v1";

  function isPack(id){
    return !!id && T.packs.some(function(x){ return x.id === id; });
  }

  function urlPack(){
    try {
      var u = new URL(window.location.href);
      var p = u.searchParams.get("pack");
      return isPack(p) ? p : null;
    } catch(e){ return null; }
  }

  function readLast(){
    var s = T.storage && T.storage();
    if(!s) return null;
    try { return s.getItem(LAST_KEY); } catch(e){ return null; }
  }

  function writeLast(id){
    var s = T.storage && T.storage();
    if(!s) return;
    try { s.setItem(LAST_KEY, id); } catch(e){}
  }

  /* Write ?pack=<id> onto the URL. Passing null strips it (landing view). */
  function writeUrl(id){
    try {
      var u = new URL(window.location.href);
      if(id) u.searchParams.set("pack", id);
      else u.searchParams.delete("pack");
      history.replaceState(null, "", u.toString());
    } catch(e){}
  }

  function setActivePack(id){
    if(!isPack(id)) return;
    writeUrl(id);
    writeLast(id);
    T.render(id);
  }

  function showLanding(){
    writeUrl(null);
    T.renderLanding();
  }

  /* One delegated listener on the topbar handles both directions of pack
     navigation: the brand-home control (-> landing) and, though it never
     appears in the topbar anymore, keeps a single wiring point. */
  function bindTopbar(){
    var bar = document.querySelector(".topbar");
    if(!bar || bar._navBound) return;
    bar._navBound = true;
    bar.addEventListener("click", function(ev){
      var home = ev.target.closest && ev.target.closest(".brand-home");
      if(home){ ev.preventDefault(); showLanding(); }
    });
  }

  /* Landing cards are <a href="?pack=id">; intercept for in-page nav while
     leaving open-in-new-tab (modified clicks) to the browser. */
  function bindLanding(){
    var app = document.getElementById("app");
    if(!app || app._pickBound) return;
    app._pickBound = true;
    app.addEventListener("click", function(ev){
      var card = ev.target.closest && ev.target.closest(".pcard");
      if(!card) return;
      if(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      setActivePack(card.getAttribute("data-pack"));
    });
  }

  function boot(){
    if(!T.packs.length){
      document.getElementById("app").innerHTML =
        '<section><p class="intro">No exercise packs registered.</p></section>';
      return;
    }
    bindTopbar();
    bindLanding();

    var id = urlPack() || readLast();
    if(isPack(id)) setActivePack(id);
    else showLanding();

    T.timer.init();
  }

  T.setActivePack = setActivePack;
  T.showLanding = showLanding;
  T.boot = boot;
})();
