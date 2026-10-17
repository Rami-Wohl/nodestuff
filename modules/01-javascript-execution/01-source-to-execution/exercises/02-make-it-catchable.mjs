// Exercise 2 — this prints nothing and exits 1. Change only this file so that
// it prints "recovered" and exits 0. Do not touch fixtures/broken.mjs.
// Run:  node modules/01-javascript-execution/01-source-to-execution/exercises/02-make-it-catchable.mjs

console.log('starting');

import './fixtures/broken.mjs';

console.log('recovered');
