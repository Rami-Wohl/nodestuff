// Exercise 1 — write down the exact output before running.
// Run:  node modules/01-javascript-execution/01-source-to-execution/exercises/01-predict-this.js

/** @param {unknown} error */
const name = (error) => (error instanceof Error ? error.name : String(error));

// @ts-expect-error — TypeScript is stricter than the runtime about `two` here.
console.log('a', typeof one, typeof two);

try {
  // @ts-expect-error — TypeScript rejects this statically; what does the runtime do?
  console.log('b', typeof three);
} catch (error) {
  console.log('b', name(error));
}

try {
  console.log('c', one());
} catch (error) {
  console.log('c', name(error));
}

try {
  // @ts-expect-error — and here.
  console.log('d', two());
} catch (error) {
  console.log('d', name(error));
}

try {
  // @ts-expect-error — same question for a call.
  console.log('e', three());
} catch (error) {
  console.log('e', name(error));
}

console.log('f', eval('{ value: 1 }'), eval('({ value: 1 })').value);

function one() {
  return 'one';
}
var two = function () {
  return 'two';
};
const three = () => 'three';

console.log('g', one(), two(), three());

eval('const = 42');

console.log('h');
