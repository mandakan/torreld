/* Adaptive-par progression store.
 *
 * Owns per-drill current par + clean streak. Pure state + storage, no DOM.
 * Exposed as TORRELD.progress. Storage is guarded localStorage that degrades
 * to an in-memory object when storage is unavailable (sandbox preview): the
 * committed artifact stays sandbox-legal, adaptation just resets on reload.
 *
 * Store shape (one versioned key):
 *   torreld.progress.v1 -> { "<packId>::<drillLabel>": { par:Number, streak:Number } }
 */
(function(){
  var T = window.TORRELD;

  var STORAGE_KEY   = "torreld.progress.v1";
  var STEP          = 0.1;   /* par drop per tighten, seconds */
  var STREAK_TARGET = 3;     /* clean reps in a row to tighten */
  var DEFAULT_FLOOR = 0.6;   /* floor when a drill declares none */

  var store = {};            /* in-memory mirror; runtime source of truth */
  var detected;              /* cached storage detection (undefined = not yet) */

  function round2(x){ return Math.round(x * 100) / 100; }

  /* Feature-detect writable storage with a probe, once. Returns the store or
     null. Availability is stable per session, so the probe runs a single time
     rather than on every persist(). */
  function storage(){
    if(detected !== undefined) return detected;
    try {
      var s = window.localStorage;
      var k = "__torreld_probe__";
      s.setItem(k, "1"); s.removeItem(k);
      detected = s;
    } catch(e){ detected = null; }
    return detected;
  }

  function load(){
    store = {};
    var s = storage();
    if(!s) return;
    try {
      var raw = s.getItem(STORAGE_KEY);
      if(raw){
        var obj = JSON.parse(raw);
        if(obj && typeof obj === "object") store = obj;
      }
    } catch(e){ store = {}; }
  }

  function persist(){
    var s = storage();
    if(!s) return;
    try { s.setItem(STORAGE_KEY, JSON.stringify(store)); } catch(e){}
  }

  function entry(key, defaultPar){
    if(!store[key]) store[key] = { par: round2(parseFloat(defaultPar)), streak: 0 };
    return store[key];
  }

  function getPar(key, fallback){
    return (store[key] && typeof store[key].par === "number")
      ? store[key].par
      : round2(parseFloat(fallback));
  }

  function getStreak(key){
    return (store[key] && store[key].streak) ? store[key].streak : 0;
  }

  function recordMadeIt(key, defaultPar, floor){
    var e = entry(key, defaultPar);
    var f = (floor != null && !isNaN(parseFloat(floor)))
      ? round2(parseFloat(floor)) : DEFAULT_FLOOR;
    e.streak += 1;
    if(e.streak >= STREAK_TARGET){
      e.streak = 0;
      if(e.par <= f){                 /* already at/below floor - hold */
        persist();
        return { par: e.par, streak: 0, tightened: false, atFloor: true };
      }
      var next = round2(e.par - STEP);
      if(next < f) next = f;
      var tightened = next < e.par;
      e.par = next;
      persist();
      return { par: e.par, streak: 0, tightened: tightened, atFloor: e.par <= f };
    }
    persist();
    return { par: e.par, streak: e.streak, tightened: false, atFloor: e.par <= f };
  }

  function recordTooTight(key, defaultPar){
    var e = entry(key, defaultPar);
    e.streak = 0;
    persist();
    return { par: e.par, streak: 0 };
  }

  function setPar(key, val){
    var v = round2(parseFloat(val));
    if(isNaN(v)) return;
    store[key] = { par: v, streak: 0 };
    persist();
  }

  function reset(key){
    if(store[key]){ delete store[key]; persist(); }
  }

  function resetAll(){
    store = {};
    persist();
  }

  load();

  /* Shared with switcher.js (lastPack) so storage is feature-detected once,
     from one place, and both callers degrade identically when it is blocked. */
  T.storage = storage;

  T.progress = {
    getPar: getPar,
    getStreak: getStreak,
    recordMadeIt: recordMadeIt,
    recordTooTight: recordTooTight,
    setPar: setPar,
    reset: reset,
    resetAll: resetAll,
    streakTarget: STREAK_TARGET
  };
})();
