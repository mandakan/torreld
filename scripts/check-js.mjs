#!/usr/bin/env node
// Syntax-check the JavaScript inlined into dist/index.html. The build concatenates the
// framework and pack sources into <script> blocks; a stray syntax error there would ship
// a blank app, so CI (and deploy) run this after `make build`. Checks every <script> block,
// not just the first. Usage: node scripts/check-js.mjs [dist/index.html]
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const file = process.argv[2] || 'dist/index.html';
const html = readFileSync(file, 'utf8');
const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (!blocks.length) {
  console.error(`no <script> found in ${file}`);
  process.exit(1);
}
blocks.forEach((code, i) => {
  const tmp = join(tmpdir(), `torreld-check-${i}.js`);
  writeFileSync(tmp, code);
  execFileSync(process.execPath, ['--check', tmp], { stdio: 'inherit' }); // throws -> nonzero exit
});
console.log(`check-js: OK - ${blocks.length} <script> block(s)`);
