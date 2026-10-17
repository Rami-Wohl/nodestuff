// Experiment 5 — the same rule, one level up: module graphs.
//
// CommonJS `require()` is a function call executed at run time.
// ES module `import` declarations are resolved and parsed *before* any
// module in the graph executes. A syntax error in a dependency therefore
// shows up at very different moments.
//
// Run:  node modules/01-javascript-execution/01-source-to-execution/examples/05-module-graphs-parse-first.js

import { runNode, printRun } from '../../../../shared/run-node.js';

console.log('== CommonJS: require() runs when reached ==');
printRun(runNode(new URL('./fixtures/graph-cjs/main.cjs', import.meta.url)));

console.log('\n== ES modules: static import, whole graph parsed first ==');
printRun(runNode(new URL('./fixtures/graph-esm/main.mjs', import.meta.url)));

console.log('\n== ES modules: dynamic import(), loading moved back to run time ==');
printRun(runNode(new URL('./fixtures/graph-esm/main-dynamic.mjs', import.meta.url)));
