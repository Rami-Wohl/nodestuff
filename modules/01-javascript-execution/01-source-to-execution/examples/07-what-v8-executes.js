// Experiment 7 — V8 does not execute your source text.
//
// Run it normally first:
//   node modules/01-javascript-execution/01-source-to-execution/examples/07-what-v8-executes.js
//
// Then ask V8 to print the bytecode it generates for `add`:
//   node --print-bytecode --print-bytecode-filter=add modules/01-javascript-execution/01-source-to-execution/examples/07-what-v8-executes.js
//
// The bytecode is what Ignition (V8's interpreter) actually runs. Note *when*
// it is printed: at the first call, not when the file is loaded. That is lazy
// compilation, seen directly. Module 07 reads this output line by line.

/** @param {number} a @param {number} b */
function add(a, b) {
  return a + b;
}

console.log('add(2, 3) =', add(2, 3));
