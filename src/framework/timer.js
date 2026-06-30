/* Timer engine - par + circuit modes + sheet UX.
 *
 * Public surface (attached to TORRELD on init):
 *   TORRELD.timer.init()              - wires DOM (called once at boot)
 *   TORRELD.timer.arm(spec)           - armed by a drill button click
 *
 * State machine: idle -> waiting -> running -> (rest ->) ... -> done
 * All pending timeouts/rAF are tracked and cleared together in clearTimers().
 *
 * Mobile UX: the console is a compact bar by default. The grip handle, the
 * compact bar's label area, the scrim, and the ESC key all toggle the
 * expanded sheet. Arming a drill auto-expands the sheet so the user sees
 * the new params; tapping outside collapses it again.
 *
 * Audio: WebAudio. Two profiles toggled at runtime:
 *   - "match"   (default): piercing, sustained, IPSC-range-timer-style buzzer.
 *                          Saw + square fundamental layered with odd-harmonic
 *                          sines, soft-clipped, flat envelope. Loud - mimics
 *                          a CED7000/PACT at a match.
 *   - "quiet" : gentle triangle tones with exponential decay. The original
 *                          low-distraction profile for living-room practice.
 * The preference persists via the `?sound=quiet` URL param (default = match).
 * AudioContext is created/resumed on the first Start click - a browser gesture
 * requirement, not a bug. First beep of a session may lag slightly while
 * audio wakes.
 */
(function(){
  var T = window.TORRELD;

  /* ----- Audio ----- */
  var ac = null;
  var audioMode = "match";   /* "match" | "quiet" */
  var sndMatchBtn = null, sndQuietBtn = null;

  function audio(){
    if(!ac){
      var C = window.AudioContext || window.webkitAudioContext;
      if(C) ac = new C();
    }
    if(ac && ac.state === "suspended") ac.resume();
  }

  /* Quiet profile - single triangle tone, fast attack, exponential decay.
     Low-distraction; appropriate for shared spaces. */
  function quietTone(freq, durMs, gainPeak){
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

  /* Match profile - piercing, sustained buzzer to mimic an IPSC range
     timer at a match. A sawtooth + square fundamental layered with odd-
     harmonic sines gives a square-wave-like timbre with strong energy in
     the 2-5 kHz band where the ear is most sensitive. A WaveShaper applies
     tanh soft-clipping to keep peaks from destroying the device DAC. The
     envelope holds flat for almost the full duration, then snaps off -
     that's what makes a range-timer beep feel like an alarm, not a tone. */
  function matchBeep(freq, durMs){
    if(!ac) return;
    var t = ac.currentTime,
        d = durMs / 1000,
        master = ac.createGain(),
        shaper = ac.createWaveShaper();

    /* tanh-shaped soft clip - rounds peaks instead of digital clipping. */
    var n = 1024, curve = new Float32Array(n);
    for(var i = 0; i < n; i++){
      var x = (i * 2 / n) - 1;
      curve[i] = Math.tanh(x * 2.4);
    }
    shaper.curve = curve;
    shaper.oversample = "2x";

    master.gain.setValueAtTime(0.0001, t);
    master.gain.linearRampToValueAtTime(0.9, t + 0.008);
    master.gain.setValueAtTime(0.9, t + Math.max(0, d - 0.02));
    master.gain.linearRampToValueAtTime(0.0001, t + d);

    master.connect(shaper);
    shaper.connect(ac.destination);

    /* Layered oscillators feed the master gain → shaper → out. */
    var voices = [
      { type: "sawtooth", freq: freq,       gain: 0.40 },
      { type: "square",   freq: freq,       gain: 0.25 },
      { type: "sine",     freq: freq * 3,   gain: 0.18 },
      { type: "sine",     freq: freq * 5,   gain: 0.10 }
    ];
    voices.forEach(function(v){
      var o = ac.createOscillator(),
          g = ac.createGain();
      o.type = v.type;
      o.frequency.value = v.freq;
      g.gain.value = v.gain;
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + d + 0.05);
    });
  }

  var startBeep = function(){
    if(audioMode === "match") matchBeep(2700, 400);
    else                       quietTone(880, 130, 0.55);
  };
  var parBeep = function(){
    if(audioMode === "match") matchBeep(1500, 260);
    else                       quietTone(1318, 200, 0.6);
  };

  function writeSoundUrl(){
    try {
      var u = new URL(window.location.href);
      if(audioMode === "match") u.searchParams.delete("sound");
      else                       u.searchParams.set("sound", audioMode);
      history.replaceState(null, "", u.toString());
    } catch(e) {}
  }
  function readSoundUrl(){
    try {
      var u = new URL(window.location.href);
      var v = u.searchParams.get("sound");
      if(v === "quiet" || v === "match") return v;
    } catch(e) {}
    return "match";
  }
  function setAudioMode(m){
    audioMode = (m === "quiet") ? "quiet" : "match";
    if(sndMatchBtn) sndMatchBtn.setAttribute("aria-pressed", audioMode === "match" ? "true" : "false");
    if(sndQuietBtn) sndQuietBtn.setAttribute("aria-pressed", audioMode === "quiet" ? "true" : "false");
    writeSoundUrl();
  }
  /* Demo the new profile when the user toggles, so they can hear it
     immediately without firing a full rep. Only after a user gesture
     (this click) - which also satisfies the AudioContext requirement. */
  function previewBeep(){
    audio();
    startBeep();
  }

  /* ----- DOM refs (resolved in init) ----- */
  var $ = function(id){ return document.getElementById(id); };
  var consoleEl, scrim, grip, barInfo, bar,
      readout, readoutMini,
      armedLabel, armedLabelFull,
      statusEl, fPar, fDmin, fDmax, fReps, fRest,
      goBtn, goMini, resetBtn,
      mPar, mCyc;
  /* sndMatchBtn / sndQuietBtn are declared above in the Audio section. */

  /* ----- State ----- */
  var mode = "par",
      state = "idle",
      currentRep = 0,
      totalReps = 1,
      runEndTs = 0,
      restEndTs = 0,
      tWait = null, tPar = null, tRest = null, raf = null;

  function num(el, def){ var v = parseFloat(el.value); return isNaN(v) ? def : v; }

  /* ----- Sync helpers (keep bar + panel in lockstep) ----- */
  function setReadoutText(txt){
    readout.textContent = txt;
    if(readoutMini) readoutMini.textContent = txt;
  }
  function setReadoutClass(c){
    readout.className = "readout" + (c ? (" " + c) : "");
    if(readoutMini) readoutMini.className = "bar-readout" + (c ? (" " + c) : "");
  }
  function setStatus(txt, live){
    statusEl.innerHTML = '<span class="dot"></span>' + txt;
    statusEl.classList.toggle("live", !!live);
  }
  function setGo(text, stop){
    goBtn.textContent = text;
    goBtn.classList.toggle("stop", !!stop);
    if(goMini){
      goMini.textContent = text;
      goMini.classList.toggle("stop", !!stop);
      goMini.setAttribute("aria-label", (stop ? "Stop timer" : "Start timer"));
    }
  }
  function setLabel(txt){
    if(armedLabel) armedLabel.textContent = txt;
    if(armedLabelFull) armedLabelFull.textContent = txt;
  }

  /* ----- Sheet expand / collapse ----- */
  function setExpanded(expand){
    var v = !!expand;
    consoleEl.setAttribute("aria-expanded", v ? "true" : "false");
    if(grip){
      grip.setAttribute("aria-expanded", v ? "true" : "false");
      grip.setAttribute("aria-label", v ? "Collapse timer" : "Expand timer");
    }
    if(barInfo){
      barInfo.setAttribute("aria-expanded", v ? "true" : "false");
      barInfo.setAttribute("aria-label", v ? "Collapse timer" : "Expand timer");
    }
    if(scrim){
      scrim.classList.toggle("active", v);
      scrim.setAttribute("aria-hidden", v ? "false" : "true");
    }
    if(v){
      consoleEl.querySelector(".console-panel").removeAttribute("inert");
      document.body.classList.add("console-open");
    } else {
      consoleEl.querySelector(".console-panel").setAttribute("inert", "");
      document.body.classList.remove("console-open");
    }
  }
  function toggleExpanded(){
    setExpanded(consoleEl.getAttribute("aria-expanded") !== "true");
  }

  /* ----- Timer engine ----- */
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
  function showReady(){
    setReadoutClass("");
    setReadoutText(num(fPar, 1.5).toFixed(2));
    setStatus("Ready", false);
    setGo("Start", false);
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
      setReadoutText(Math.max(0, (runEndTs - now)/1000).toFixed(2));
    } else if(state === "rest"){
      setReadoutText(Math.max(0, (restEndTs - now)/1000).toFixed(1));
    }
    raf = requestAnimationFrame(loop);
  }
  function beginRep(){
    state = "waiting";
    setReadoutClass("");
    setReadoutText(num(fPar, 1.5).toFixed(2));
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
    setReadoutText(num(fPar, 1.5).toFixed(2));
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
      setGo("Start", false);
      if(raf){ cancelAnimationFrame(raf); raf = null; }
    }
  }
  function start(){
    audio();
    clearTimers();
    totalReps = (mode === "circuit") ? Math.max(1, Math.round(num(fReps, 1))) : 1;
    currentRep = 1;
    setGo("Stop", true);
    raf = requestAnimationFrame(loop);
    beginRep();
  }
  function startOrStop(){
    if(state === "idle" || state === "done") start(); else stopAll();
  }

  /* ----- Arming a drill (called from renderer) ----- */
  function arm(spec){
    setMode(spec.mode);
    fPar.value = parseFloat(spec.par).toFixed(2);
    fDmin.value = spec.dmin;
    fDmax.value = spec.dmax;
    if(spec.mode === "circuit"){
      fReps.value = spec.reps;
      fRest.value = spec.rest;
    }
    setLabel(spec.label);
    stopAll();
    consoleEl.classList.remove("flash");
    void consoleEl.offsetWidth;
    consoleEl.classList.add("flash");
    setExpanded(true);
  }

  /* ----- Init ----- */
  function init(){
    consoleEl = $("console");
    scrim     = $("scrim");
    grip      = $("consoleGrip");
    barInfo   = $("consoleBarInfo");
    bar       = $("consoleBar");

    readout       = $("readout");
    readoutMini   = $("readoutMini");
    armedLabel    = $("armedLabel");
    armedLabelFull= $("armedLabelFull");
    statusEl      = $("status");

    fPar  = $("fPar");  fDmin = $("fDmin"); fDmax = $("fDmax");
    fReps = $("fReps"); fRest = $("fRest");
    goBtn = $("go");    goMini = $("goMini"); resetBtn = $("reset");
    mPar  = $("mPar");  mCyc = $("mCyc");
    sndMatchBtn = $("sndMatch");
    sndQuietBtn = $("sndQuiet");

    /* Mode toggle */
    mPar.addEventListener("click", function(){ setMode("par"); });
    mCyc.addEventListener("click", function(){ setMode("circuit"); });

    /* Sound profile toggle. Reflect initial state from URL, then on each
       click switch + preview the new beep so the choice is audible. */
    setAudioMode(readSoundUrl());
    if(sndMatchBtn) sndMatchBtn.addEventListener("click", function(){
      var changed = audioMode !== "match";
      setAudioMode("match");
      if(changed) previewBeep();
    });
    if(sndQuietBtn) sndQuietBtn.addEventListener("click", function(){
      var changed = audioMode !== "quiet";
      setAudioMode("quiet");
      if(changed) previewBeep();
    });

    /* Start/Stop - both buttons trigger the same action */
    goBtn.addEventListener("click", startOrStop);
    if(goMini){
      goMini.addEventListener("click", function(e){
        e.stopPropagation();        /* prevent bubbling to bar-info toggle */
        startOrStop();
      });
    }
    resetBtn.addEventListener("click", stopAll);

    /* Live update of the Ready readout when Par is edited */
    fPar.addEventListener("input", function(){
      if(state === "idle" || state === "done") showReady();
    });

    /* Sheet toggles */
    if(grip)    grip.addEventListener("click", toggleExpanded);
    if(barInfo) barInfo.addEventListener("click", toggleExpanded);
    if(scrim)   scrim.addEventListener("click", function(){ setExpanded(false); });

    /* ESC to dismiss the sheet when expanded. */
    document.addEventListener("keydown", function(e){
      if(e.key !== "Escape") return;
      if(consoleEl.getAttribute("aria-expanded") === "true"){
        setExpanded(false);
        if(barInfo) barInfo.focus();
      }
    });

    showReady();
  }

  T.timer = { init: init, arm: arm };
})();
