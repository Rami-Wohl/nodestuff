// Experiment 6 — parsing and compiling are real work, and V8 is lazy about it.
//
// Generates a script containing N small functions and measures, separately:
//   compile      new vm.Script(source)      parse + compile the top level;
//                                           function bodies are only pre-parsed
//   run          script.runInContext()      execute the top level (creates N
//                                           function objects, runs no bodies)
//   1st calls    call every function once   each body is fully parsed and
//                                           compiled to bytecode on first call
//   2nd calls    call every function again  bytecode already exists
//
// Then shows two caches V8 keeps so it does not have to parse twice:
//   - the in-memory compilation cache of the running process, and
//   - the serializable "code cache", which survives into a *fresh* process
//     (this is what Node's module.enableCompileCache() / NODE_COMPILE_CACHE use).
//
// Run:  node modules/01-javascript-execution/01-source-to-execution/examples/06-parse-cost.js
//       node modules/01-javascript-execution/01-source-to-execution/examples/06-parse-cost.js path/to/some/big.js

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';

/**
 * @template T
 * @param {() => T} fn
 * @returns {{ ms: number, value: T }}
 */
function timed(fn) {
  const start = performance.now();
  const value = fn();
  return { ms: performance.now() - start, value };
}

/** @param {number} value */
const ms = (value) => `${value.toFixed(1).padStart(7)} ms`;

/** @param {number} functionCount */
function makeSource(functionCount) {
  const lines = [];
  for (let i = 0; i < functionCount; i++) {
    lines.push(
      `function f${i}(a, b) { const sum = a + b; if (sum > ${i}) { return sum * 2; } return [sum, ${i}].length; }`,
    );
  }
  // The script's completion value: an array holding every function.
  lines.push(`[${Array.from({ length: functionCount }, (_, i) => `f${i}`).join(',')}]`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Child mode. A fresh process that has never seen `source` compiles it using
// a code cache produced by its parent. Prints one JSON line with the result.
if (process.argv[2] === '--consume-cache') {
  const [sourceFile, cacheFile] = process.argv.slice(3);
  if (!sourceFile || !cacheFile) throw new Error('usage: --consume-cache <source> <cache>');
  const source = readFileSync(sourceFile, 'utf8');
  const cachedData = readFileSync(cacheFile);
  const compiled = timed(() => new vm.Script(source, { filename: sourceFile, cachedData }));
  console.log(JSON.stringify({ ms: compiled.ms, rejected: compiled.value.cachedDataRejected }));
  process.exit(0);
}

/**
 * Compile `source` three ways and print the timings.
 * @param {string} source
 * @param {string} filename
 */
function measureCaches(source, filename) {
  const fresh = timed(() => new vm.Script(source, { filename }));
  const cachedData = fresh.value.createCachedData();

  // Same process, same source text, same origin: V8's in-memory compilation
  // cache hands back the already-compiled script. No parsing happens.
  const again = timed(() => new vm.Script(source, { filename }));

  // Fresh process: write source + cache to disk, let a child consume them.
  const dir = mkdtempSync(path.join(os.tmpdir(), 'parse-cost-'));
  const sourceFile = path.join(dir, path.basename(filename));
  const cacheFile = `${sourceFile}.cache`;
  writeFileSync(sourceFile, source);
  writeFileSync(cacheFile, cachedData);
  const child = spawnSync(process.execPath, [process.argv[1] ?? '', '--consume-cache', sourceFile, cacheFile], {
    encoding: 'utf8',
  });
  if (child.status !== 0) throw new Error(`child failed: ${child.stderr}`);
  /** @type {{ ms: number, rejected: boolean }} */
  const fromCache = JSON.parse(child.stdout);

  console.log(`  compile, fresh:                         ${ms(fresh.ms)}`);
  console.log(`  compile again, same process:            ${ms(again.ms)}   (in-memory compilation cache)`);
  console.log(`  compile from code cache, new process:   ${ms(fromCache.ms)}   (cache ${(cachedData.length / 1024).toFixed(0)} KB, rejected: ${fromCache.rejected})`);
}

// ---------------------------------------------------------------------------
const customFile = process.argv[2];

if (customFile) {
  // Real-world mode: how long does V8 take to compile *your* big file?
  const source = readFileSync(customFile, 'utf8');
  console.log(`${customFile}: ${(source.length / 1024).toFixed(0)} KB`);
  measureCaches(source, path.resolve(customFile));
  process.exit(0);
}

console.log('functions   source     compile      run     1st calls    2nd calls');
console.log('─'.repeat(72));

for (const count of [1_000, 10_000, 50_000]) {
  const source = makeSource(count);
  const context = vm.createContext({});

  const compiled = timed(() => new vm.Script(source, { filename: `generated-${count}.js` }));
  /** @type {{ ms: number, value: Array<(a: number, b: number) => number> }} */
  const ran = timed(() => compiled.value.runInContext(context));
  const fns = ran.value;

  const firstCalls = timed(() => { for (const fn of fns) fn(1, 2); });
  const secondCalls = timed(() => { for (const fn of fns) fn(1, 2); });

  const kb = `${(source.length / 1024).toFixed(0)} KB`;
  console.log(
    `${String(count).padStart(9)} ${kb.padStart(8)} ${ms(compiled.ms)} ${ms(ran.ms)} ${ms(firstCalls.ms)} ${ms(secondCalls.ms)}`,
  );
}

console.log('\nCaches, for the 50,000-function script:');
// A new filename, otherwise the in-memory compilation cache (keyed on source text
// *and* origin) would hand back the script compiled in the loop above.
measureCaches(makeSource(50_000), 'generated-50000-caches.js');
