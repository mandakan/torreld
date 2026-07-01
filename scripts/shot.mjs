#!/usr/bin/env node
// Headless cross-viewport screenshots of the built app - the "Headless cross-viewport
// check" from docs/BUILD.md. Loads dist/index.html in Chromium at a phone and a desktop
// viewport and writes a PNG for each, so you can eyeball the mobile sheet and the desktop
// strip after a change.
//
// Usage:
//   node scripts/shot.mjs                          # dist/index.html at mobile + desktop
//   node scripts/shot.mjs '?pack=hfo-masters'      # same file, with a query string
//   node scripts/shot.mjs https://torreld.urdr.dev/   # any URL (http/https/file)
//   node scripts/shot.mjs --out /tmp/shots            # choose the output directory
//
// The repo ships no node_modules on purpose, so this locates Playwright wherever it
// already lives - a local install, a global one, or the npx cache the MCP populated.
// It needs the Chromium browser binary; if missing, run:  npx playwright install chromium

import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1280, height: 800, deviceScaleFactor: 1 },
];

// Find Playwright without depending on a committed node_modules.
function loadPlaywright() {
  const req = createRequire(import.meta.url);
  const roots = [];
  try { roots.push(dirname(req.resolve('playwright'))); } catch {}
  try { roots.push(join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright')); } catch {}
  const npx = join(homedir(), '.npm', '_npx');
  if (existsSync(npx)) {
    for (const h of readdirSync(npx)) {
      const p = join(npx, h, 'node_modules', 'playwright');
      if (existsSync(p)) roots.push(p);
    }
  }
  for (const r of roots) {
    const entry = existsSync(join(r, 'index.js')) ? join(r, 'index.js') : r;
    if (existsSync(entry)) return import(pathToFileURL(entry).href);
  }
  console.error('Could not find Playwright. Install it with:  npx playwright install chromium');
  process.exit(1);
}

const localBuild = () => pathToFileURL(join(REPO, 'dist', 'index.html')).href;

function parseArgs(argv) {
  let out = join(REPO, '.playwright-mcp');
  let allPacks = false;
  let target = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') { out = resolve(argv[++i]); continue; }
    if (a === '--all-packs') { allPacks = true; continue; }
    target = a;
  }
  // --all-packs: one target per pack, discovered from the emitted dist/p/<id>/ stubs.
  if (allPacks) {
    const pdir = join(REPO, 'dist', 'p');
    if (!existsSync(pdir)) { console.error('dist/p not found - run `make build` first.'); process.exit(1); }
    const targets = readdirSync(pdir).sort().map((id) => ({ label: id, url: `${localBuild()}?pack=${id}` }));
    if (!targets.length) { console.error('no packs found under dist/p.'); process.exit(1); }
    return { targets, out };
  }
  // Single target: no arg -> local build; bare "?..." -> local build + query; else a full URL or path.
  let url;
  if (!target) url = localBuild();
  else if (target.startsWith('?')) url = localBuild() + target;
  else if (/^https?:|^file:/.test(target)) url = target;
  else url = pathToFileURL(resolve(target)).href;
  return { targets: [{ label: 'torreld', url }], out };
}

const { targets, out } = parseArgs(process.argv.slice(2));
const pw = await loadPlaywright();
const chromium = pw.chromium ?? pw.default?.chromium; // CJS interop: exports may sit on .default

if (targets.some((t) => t.url.includes('/dist/')) && !existsSync(join(REPO, 'dist', 'index.html'))) {
  console.error('dist/index.html not found - run `make build` first.');
  process.exit(1);
}
mkdirSync(out, { recursive: true });

const browser = await chromium.launch(); // headless
let failed = false;
try {
  for (const t of targets) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor,
      });
      await page.goto(t.url, { waitUntil: 'load' });
      const title = await page.title();
      if (!title) { console.error(`  ${t.label}/${vp.name}: empty page title - did it load?`); failed = true; }
      const file = join(out, `${t.label}-${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`  ${(t.label + '/' + vp.name).padEnd(24)} ${vp.width}x${vp.height}  ->  ${file}   "${title}"`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
