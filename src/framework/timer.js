/* Timer engine — par + circuit modes.
 *
 * Public surface (attached to TORRELD on init):
 *   TORRELD.timer.init()              — wires DOM (must be called once after first render)
 *   TORRELD.timer.arm(spec)           — armed by a drill button click
 *
 * State machine: idle -> waiting -> running -> (rest ->) ... -> done
 * All pending timeouts/rAF are tracked and cleared together in clearTimers().
 *
 * Audio: WebAudio triangle tones. AudioContext is created/resumed on the first
 * Start click — a browser gesture requirement, not a bug. First beep may lag
 * slightly while audio wakes.
 */
(function(){
  var T = window.TORRELD;

  var ac = null;
  function audio(){
    if(!ac){
      var C = window.AudioContext || window.webkitAudioContext;
      if(C) ac = new C();
    }
    if(ac && ac.state === "suspended") ac.resume();
  }
  function tone(freq, durMs, gainPeak){
    if(!ac) return;
    var t = ac.currentTime,
        o = ac.createOscillator(),
        g = ac.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ac.destination);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gainPeak || 0.5, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durMs/1000);
    o.start(t);
    o.stop(t + durMs/1000 + 0.03);
  }
  var startBeep = function(){ tone(880, 130, 0.55); };
  var parBeep   = function(){ tone(1318, 200, 0.6); };

  var $ = function(id){ return document.getElementById(id); };

  var readout, statusEl, fPar, fDmin, fDmax, fReps, fRest, goBtn, resetBtn,
      mPar, mCyc, armedLabel, consoleEl;

  var mode = "par",
      state = "idle",
      currentRep = 0,
      totalReps = 1,
      runEndTs = 0,
      restEndTs = 0,
      tWait = null, tPar = null, tRest = null, raf = null;

  function num(el, def){ var v = parseFloat(el.value); return isNaN(v) ? def : v; }

  function setMode(m){
    mode = m;
    mPar.setAttribute("aria-pressed", m === "par");
    mCyc.setAttribute("aria-pressed", m === "circuit");
    var c = (m === "circuit");
    fReps.disabled = !c;
    fRest.disabled = !c;
    if(!c){ fReps.value = 1; fRest.value = 0; }
    if(state !== "idle") stopAll();
    showReady();
  }

  function setStatus(txt, live){
    statusEl.innerHTML = '<span class="dot"></span>' + txt;
    statusEl.classList.toggle("live", !!live);
  }
  function setReadoutClass(c){
    readout.className = "readout" + (c ? (" " + c) : "");
  }
  function showReady(){
    setReadoutClass("");
    readout.textContent = num(fPar, 1.5).toFixed(2);
    setStatus("Ready", false);
    goBtn.textContent = "Start";
    goBtn.classList.remove("stop");
  }
  function clearTimers(){
    if(tWait){ clearTimeout(tWait); tWait = null; }
    if(tPar){ clearTimeout(tPar); tPar = null; }
    if(tRest){ clearTimeout(tRest); tRest = null; }
    if(raf){ cancelAnimationFrame(raf); raf = null; }
  }
  function stopAll(){ clearTimers(); state = "idle"; showReady(); }

  function loop(){
    var now = performance.now();
    if(state === "running"){
      readout.textContent = Math.max(0, (runEndTs - now)/1000).toFixed(2);
    } else if(state === "rest"){
      readout.textContent = Math.max(0, (restEndTs - now)/1000).toFixed(1);
    }
    raf = requestAnimationFrame(loop);
  }

  function beginRep(){
    state = "waiting";
    setReadoutClass("");
    readout.textContent = num(fPar, 1.5).toFixed(2);
    setStatus("Stand by &middot; rep " + currentRep + "/" + totalReps, true);
    var dmin = num(fDmin, 1.5), dmax = num(fDmax, 3.5);
    if(dmax < dmin){ var t = dmin; dmin = dmax; dmax = t; }
    tWait = setTimeout(onGo, (dmin + Math.random() * (dmax - dmin)) * 1000);
  }
  function onGo(){
    startBeep();
    state = "running";
    setReadoutClass("go");
    setStatus("Go", true);
    var parMs = num(fPar, 1.5) * 1000;
    runEndTs = performance.now() + parMs;
    tPar = setTimeout(onPar, parMs);
  }
  function onPar(){
    parBeep();
    setReadoutClass("par");
    readout.textContent = num(fPar, 1.5).toFixed(2);
    if(mode === "circuit" && currentRep < totalReps){
      state = "rest";
      setReadoutClass("rest");
      setStatus("Rest", true);
      var restMs = num(fRest, 0) * 1000;
      restEndTs = performance.now() + restMs;
      tRest = setTimeout(function(){ currentRep++; beginRep(); }, restMs);
    } else {
      state = "done";
      setStatus("Done", false);
      goBtn.textContent = "Start";
      goBtn.classList.remove("stop");
      if(raf){ cancelAnimationFrame(raf); raf = null; }
    }
  }
  function start(){
    audio();
    clearTimers();
    totalReps = (mode === "circuit") ? Math.max(1, Math.round(num(fReps, 1))) : 1;
    currentRep = 1;
    goBtn.textContent = "Stop";
    goBtn.classList.add("stop");
    raf = requestAnimationFrame(loop);
    beginRep();
  }

  function arm(spec){
    setMode(spec.mode);
    fPar.value = parseFloat(spec.par).toFixed(2);
    fDmin.value = spec.dmin;
    fDmax.value = spec.dmax;
    if(spec.mode === "circuit"){
      fReps.value = spec.reps;
      fRest.value = spec.rest;
    }
    armedLabel.textContent = spec.label;
    stopAll();
    consoleEl.classList.remove("flash");
    void consoleEl.offsetWidth;
    consoleEl.classList.add("flash");
    consoleEl.scrollIntoView({ block: "end", behavior: "smooth" });
  }

  function init(){
    readout = $("readout"); statusEl = $("status");
    fPar = $("fPar"); fDmin = $("fDmin"); fDmax = $("fDmax");
    fReps = $("fReps"); fRest = $("fRest");
    goBtn = $("go"); resetBtn = $("reset");
    mPar = $("mPar"); mCyc = $("mCyc");
    armedLabel = $("armedLabel"); consoleEl = $("console");

    mPar.addEventListener("click", function(){ setMode("par"); });
    mCyc.addEventListener("click", function(){ setMode("circuit"); });
    goBtn.addEventListener("click", function(){
      if(state === "idle" || state === "done") start(); else stopAll();
    });
    resetBtn.addEventListener("click", stopAll);
    fPar.addEventListener("input", function(){
      if(state === "idle" || state === "done") showReady();
    });

    showReady();
  }

  T.timer = { init: init, arm: arm };
})();
