// Experiment 4 — what is the language, and what is Node?
//
// node:vm can create a fresh V8 context: a new global object with only what
// the engine itself provides. Comparing it with Node's main context shows
// exactly what the host (Node) adds on top of the language (ECMAScript as
// implemented by V8).
//
// Run:  node modules/01-javascript-execution/01-source-to-execution/examples/04-ecmascript-vs-host.js

import vm from 'node:vm';

const bare = vm.createContext({});

/** @param {string} expression */
const inBare = (expression) => vm.runInContext(expression, bare);
/** @param {string} expression */
const inNode = (expression) => vm.runInThisContext(expression);

// 1. Probe a few well-known names in both worlds.
const probes = [
  'Array', 'Promise', 'Map', 'JSON', 'globalThis', 'Intl', 'WebAssembly', 'console',
  'setTimeout', 'queueMicrotask', 'structuredClone', 'fetch', 'URL', 'TextEncoder',
  'process', 'Buffer', 'require', 'module', '__dirname',
];

console.log('name               bare V8 context    Node main context');
console.log('─'.repeat(58));
for (const name of probes) {
  const bareType = String(inBare(`typeof ${name}`));
  const nodeType = String(inNode(`typeof ${name}`));
  const marker = bareType === nodeType ? ' ' : '◀';
  console.log(`${name.padEnd(18)} ${bareType.padEnd(18)} ${nodeType.padEnd(14)} ${marker}`);
}

// 2. Compute the full difference between the two global objects.
/** @type {string[]} */
const bareNames = inBare('Object.getOwnPropertyNames(globalThis)');
/** @type {string[]} */
const nodeNames = inNode('Object.getOwnPropertyNames(globalThis)');

const bareSet = new Set(bareNames);
const addedByNode = nodeNames.filter((name) => !bareSet.has(name)).sort();

console.log(`\nGlobals in a bare V8 context: ${bareNames.length}`);
console.log(`Globals in Node's main context: ${nodeNames.length}`);
console.log(`\nAdded by Node (${addedByNode.length}):`);
console.log(wrap(addedByNode, 78));

// 3. `console` exists in the bare context. Does it do anything?
inBare('console.log("you will not see this line")');
console.log('\n(console.log in the bare context printed nothing: V8 ships a console whose');
console.log(' output goes to an attached debugger, not to stdout. Node replaces it.)');

/** @param {string[]} words @param {number} width */
function wrap(words, width) {
  const lines = [''];
  for (const word of words) {
    const last = lines[lines.length - 1] ?? '';
    if (last.length + word.length + 1 > width) lines.push(`  ${word}`);
    else lines[lines.length - 1] = last ? `${last} ${word}` : `  ${word}`;
  }
  return lines.join('\n');
}
