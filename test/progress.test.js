const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const SRC = fs.readFileSync(
  path.join(__dirname, "..", "src", "framework", "progress.js"), "utf8");

/* Build a fresh module instance with an injected window + localStorage.
   Re-evaluating SRC per call gives each test an isolated in-memory store. */
function load(opts){
  opts = opts || {};
  const backing = opts.backing || {};
  const localStorage = opts.noStorage ? {
    setItem(){ throw new Error("denied"); },
    getItem(){ throw new Error("denied"); },
    removeItem(){ throw new Error("denied"); }
  } : {
    setItem(k, v){ backing[k] = String(v); },
    getItem(k){ return k in backing ? backing[k] : null; },
    removeItem(k){ delete backing[k]; }
  };
  const window = { TORRELD: { packs: [] }, localStorage };
  const fn = new Function("window", SRC + "\nreturn window.TORRELD.progress;");
  return { progress: fn(window), backing };
}

test("made-it increments streak without tightening before target", () => {
  const { progress } = load();
  const key = "p::Drill";
  let r = progress.recordMadeIt(key, "1.20");
  assert.strictEqual(r.streak, 1);
  assert.strictEqual(r.tightened, false);
  r = progress.recordMadeIt(key, "1.20");
  assert.strictEqual(r.streak, 2);
  assert.strictEqual(progress.getPar(key, "1.20"), 1.2);
});

test("three clean reps tighten par by 0.1 and reset streak", () => {
  const { progress } = load();
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  const r = progress.recordMadeIt(key, "1.20");
  assert.strictEqual(r.tightened, true);
  assert.strictEqual(r.par, 1.1);
  assert.strictEqual(r.streak, 0);
  assert.strictEqual(progress.getStreak(key), 0);
});

test("par stays free of float drift across tightenings", () => {
  const { progress } = load();
  const key = "p::Drill";
  for (let i = 0; i < 6; i++) progress.recordMadeIt(key, "1.20");
  assert.strictEqual(progress.getPar(key, "1.20"), 1.0);
});

test("too tight resets the streak and holds par", () => {
  const { progress } = load();
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  const r = progress.recordTooTight(key, "1.20");
  assert.strictEqual(r.streak, 0);
  assert.strictEqual(r.par, 1.2);
});

test("par holds at the floor", () => {
  const { progress } = load();
  const key = "p::Drill";
  progress.setPar(key, 0.65);
  progress.recordMadeIt(key, "1.20", 0.6);
  progress.recordMadeIt(key, "1.20", 0.6);
  let r = progress.recordMadeIt(key, "1.20", 0.6);
  assert.strictEqual(r.par, 0.6);
  assert.strictEqual(r.atFloor, true);
  progress.recordMadeIt(key, "1.20", 0.6);
  progress.recordMadeIt(key, "1.20", 0.6);
  r = progress.recordMadeIt(key, "1.20", 0.6);
  assert.strictEqual(r.par, 0.6);
  assert.strictEqual(r.tightened, false);
});

test("manual setPar overrides and resets streak", () => {
  const { progress } = load();
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.setPar(key, 0.95);
  assert.strictEqual(progress.getPar(key, "1.20"), 0.95);
  assert.strictEqual(progress.getStreak(key), 0);
});

test("getPar returns the fallback when a drill is untouched", () => {
  const { progress } = load();
  assert.strictEqual(progress.getPar("p::New", "2.20"), 2.2);
});

test("state persists across reloads when storage works", () => {
  const backing = {};
  let { progress } = load({ backing });
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  ({ progress } = load({ backing }));
  assert.strictEqual(progress.getPar(key, "1.20"), 1.1);
});

test("reset clears one drill; resetAll clears everything", () => {
  const { progress } = load();
  progress.setPar("p::A", 1.0);
  progress.setPar("p::B", 2.0);
  progress.reset("p::A");
  assert.strictEqual(progress.getPar("p::A", "1.50"), 1.5);
  assert.strictEqual(progress.getPar("p::B", "2.50"), 2.0);
  progress.resetAll();
  assert.strictEqual(progress.getPar("p::B", "2.50"), 2.5);
});

test("degrades to session-only when storage is unavailable", () => {
  const { progress } = load({ noStorage: true });
  const key = "p::Drill";
  progress.recordMadeIt(key, "1.20");
  progress.recordMadeIt(key, "1.20");
  const r = progress.recordMadeIt(key, "1.20");
  assert.strictEqual(r.par, 1.1);
  const reload = load({ noStorage: true }).progress;
  assert.strictEqual(reload.getPar(key, "1.20"), 1.2);
});
