# Exercises — 01.01

Do these after the experiments. Solutions are in [`solutions.md`](./solutions.md);
try each one before looking.

## 1. Predict this output

[`01-predict-this.js`](./01-predict-this.js) mixes hoisting, the temporal dead
zone and eval. Write down the exact output (including which error ends the
program, if any) in `notes.md`, then run it:

```sh
node modules/01-javascript-execution/01-source-to-execution/exercises/01-predict-this.js
```

## 2. Make it catchable

[`02-make-it-catchable.mjs`](./02-make-it-catchable.mjs) statically imports a
module with a syntax error, so it prints nothing and exits 1. Change **only**
`02-make-it-catchable.mjs` so that it prints `recovered` and exits 0. Then
explain in one sentence *when* the broken file is now parsed.

## 3. Host or language?

Without running anything, sort the following names into: **ECMA-262** (the
language), **ECMA-402** (Intl), **host API that both Node and browsers
provide**, **Node-only**, **not a global at all** (something else gives it to
you).

```
Promise  setTimeout  Buffer  URL  Intl.DateTimeFormat  structuredClone  require
globalThis  fetch  process  __dirname  TextEncoder  WebAssembly  queueMicrotask
Symbol.asyncIterator  AbortController  console  JSON  performance  module
```

Then check yourself with the experiment-4 technique (`node:vm` bare context
versus the main context) for anything you were unsure about.

## 4. Time your own bundle

Run experiment 6 against a real artifact: the compiled `main.js` of a NestJS
app, a Next.js standalone server file, or simply TypeScript's own compiler:

```sh
node modules/01-javascript-execution/01-source-to-execution/examples/06-parse-cost.js node_modules/typescript/lib/typescript.js
```

Questions: how many milliseconds per megabyte does a fresh compile cost on your
machine? Why is the code cache so much smaller than the source? Now start the
same file with Node's compile cache enabled and compare the two runs:

```sh
NODE_COMPILE_CACHE=/tmp/nf-cache node -e "require('typescript')"   # first run fills the cache
NODE_COMPILE_CACHE=/tmp/nf-cache node -e "require('typescript')"   # second run uses it
```

(Use `time` or `--cpu-prof` to see the difference; a rigorous measurement
method is the subject of Module 14.)

## 5. Early errors without typos

Write five *different* one-line programs that fail at **parse** time (nothing
executes, `node --check` exits 1) but contain no misspelling or unbalanced
bracket. Each should break a different static rule. One of them should pass
`--check` as a `.cjs` file and fail as an `.mjs` file. Explain why.
