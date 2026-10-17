// Experiment 1 — the whole file is parsed before any of it executes.
//
// Runs four small programs in fresh Node processes and shows, for each,
// what reached stdout, which error was reported, and the exit code.
// Then runs `node --check` (parse only, never execute) on the same files.
//
// Run:  node modules/01-javascript-execution/01-source-to-execution/examples/01-parse-before-execute.js

import { runNode, printRun } from '../../../../shared/run-node.js';

const fixtures = [
  'runtime-error-at-end.js',
  'syntax-error-at-end.js',
  'syntax-error-in-uncalled-function.js',
  'syntax-error-inside-eval.js',
];

console.log('== Normal run: node <file> ==');
for (const name of fixtures) {
  printRun(runNode(new URL(`./fixtures/${name}`, import.meta.url)));
}

console.log('\n== Parse only: node --check <file> ==');
console.log('(exit 0 means "this file parses"; nothing is executed either way)');
for (const name of fixtures) {
  const run = runNode(new URL(`./fixtures/${name}`, import.meta.url), ['--check']);
  printRun(run);
}
