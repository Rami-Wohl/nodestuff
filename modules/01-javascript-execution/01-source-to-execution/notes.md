# Notes — 01.01 Source code to execution

## My predictions (fill in before running)

1. runtime-error-at-end.js → stdout: `line 1 ran`, `line 2 ran`; `line 4 never runs` does not print. stderr: ReferenceError. exit code: 1.
2. syntax-error-at-end.js → stdout: nothing. The SyntaxError is raised in the parse phase, before evaluation, so neither console.log runs. (Model B: whole file read first.)
3. syntax-error-in-uncalled-function.js → prints the line? No. Function bodies are also read in phase 1, so a syntax error anywhere in the file stops the whole script before execution.
4. syntax-error-inside-eval.js → stdout: `line 1 ran` only; `line 3 never runs` does not print. The eval string is a separate program, parsed and evaluated at run time, so the SyntaxError is raised while parsing that string, i.e. during execution of the file.
5. node --check on each → runtime-error-at-end.js: 0 (valid syntax); syntax-error-at-end.js: 1; syntax-error-in-uncalled-function.js: 1; syntax-error-inside-eval.js: 0, because the eval string is only parsed during execution and --check never executes. stdout: none in all four (implied: nothing runs).
6. Bare V8 context: defined = Array, Promise, Intl, WebAssembly · undefined = console, setTimeout, fetch, URL, process, structuredClone · Node adds about 70 globals. (First pass had URL and structuredClone as language and WebAssembly as Node; re-sorted after the rule 'ECMA-262 or shipped in the engine' was stated. The ~70 count was not a blind guess: the number appeared in the setup summary.)
7. main.mjs prints: nothing. The whole import tree is parsed before execution, so a syntax error in any imported file is thrown before any code runs, regardless of where the import statement sits. · main.cjs prints: `main.cjs: top of file`, then the catch line (require() throws the SyntaxError at run time and the try catches it), then `main.cjs: bottom of file`. Exit code 0 (implied). CJS loading is dynamic: main.cjs parses fine on its own; the error happens while it executes.
8. Compile 5 MB / 50k functions ≈ 1 second (guess: compile time scales with bundle size) · first calls vs compile: first calls more expensive, reasoning: no caches filled yet · second calls: cheaper than first, served from cache. (Marked as a pure guess; the theory read so far did not cover this.)

## What I observed

Run on 2026-10-24, Node 24, Apple M4. Predictions 1–5 and 7 matched the output exactly.

- 6 was partly wrong: `console` exists in the bare V8 context (`object` in both columns). Its `console.log` printed nothing there. Node adds 68 names; the list is mostly Web API names (URL, fetch, streams, AbortController, TextEncoder …). `require`, `module`, `__dirname` are undefined in *both* columns because example 4 is an ES module.
- 8 was wrong on magnitude: compile of 5.7 MB took 65 ms, not ~1 s (≈11 ms/MB). Scaling was linear as predicted: 1.1 / 10.5 / 65 ms for 1k / 10k / 50k functions. First calls (125 ms) cost more than the compile, as predicted, but for a different reason than I gave (see corrections). Second calls: 3.6 ms. Same-process recompile: 0.1 ms (in-memory compilation cache). Fresh process with code cache: 8 ms vs 59 ms fresh.
- Not predicted, noticed: two different ReferenceError messages in experiment 2 ("Cannot access 'letLater' before initialization" vs "neverDeclared is not defined"); calling a `var`-held function expression early is a TypeError, not a ReferenceError. `eval("{ answer: 42 }")` is `42` (block + label), `eval("({ answer: 42 })")` is an object.
- Experiment 7 printed only `add(2, 3) = 5` from the runner; the bytecode needs `--print-bytecode --print-bytecode-filter=add`.

## Corrections to my mental model

- I thought `console` is something Node adds; actually a bare V8 context already has a `console` object (output goes to an attached debugger), and Node *replaces* it with one that writes to stdout. The engine ships more than ECMA-262: `Intl` (ECMA-402), `WebAssembly` and the `console` stub are engine-provided but specified elsewhere.
- I said function bodies are "evaluated" in phase 1; actually they are *parsed* (and in V8 only *pre-parsed*: syntax-checked, scope recorded, no bytecode). Evaluation is phase 2 and never happens for an uncalled function.
- I thought compiling ~5 MB takes about a second; actually ~65 ms (~11 ms/MB here). The "scales with size" intuition was right; the constant can only come from measuring.
- I thought first calls are expensive because "no caches are filled yet"; actually the function bodies were never compiled during the compile step. The first call does the deferred full parse + bytecode generation. That is lazy compilation, not a cold cache; `--no-lazy` moves the cost into the compile column instead of removing it (variation 7).
- "Cache" is the right word for two other things: V8's in-memory compilation cache (same source + same origin in one process → ~0 ms) and the serializable code cache that a fresh process can load instead of parsing (8 ms vs 59 ms).

## Open questions

_Anything that belongs to a later lesson goes to PROGRESS.md → "Interesting follow-up questions" with the lesson number._

---

## Instructor notes (reference run)

Environment: Node v24.21.0, V8 13.6.233.17, libuv 1.52.1, macOS, Apple Silicon.
Date: 2026-10-17.

- Experiment 1: `runtime-error-at-end.js` prints two lines, `ReferenceError`,
  exit 1. Both syntax-error files print nothing, `SyntaxError`, exit 1. The
  eval file prints one line, then `SyntaxError`, exit 1. Under `--check`: exit
  0 / 1 / 1 / 0 and no stdout.
- Experiment 2: `typeof declaredLater` is `'function'`; `typeof varLater` is
  `'undefined'`; reading `letLater` throws `ReferenceError: Cannot access
  'letLater' before initialization`; `neverDeclared` throws `ReferenceError:
  neverDeclared is not defined`; calling `expressionLater` early is
  `TypeError: expressionLater is not a function`.
- Experiment 4: bare context 67 globals, Node main context 135, so Node adds
  68. `console` exists in the bare context but prints nothing. `URL`,
  `TextEncoder`, `fetch`, `structuredClone`, `queueMicrotask` are all in the
  "added by Node" list.
- Experiment 5: `main.mjs` prints nothing; `main.cjs` prints three lines
  including "caught SyntaxError thrown by require()" and exits 0;
  `main-dynamic.mjs` catches the rejection and exits 0.
- Experiment 6: ≈10 ms per MB fresh compile; first-call pass ≈2× the compile;
  second pass ≈2% of it; code cache in a fresh process ≈8× cheaper than a
  fresh compile. `typescript.js` (8.9 MB): 48 ms fresh → 4 ms from cache, cache
  2.5 MB.
- Experiment 7: bytecode for `add` is `Ldar a1 / Add a0, [0] / Return`, printed
  at the first call.

Gotcha found while writing this lesson: measuring "compile from code cache" in
the *same* process gives ~0 ms for the wrong reason (V8's in-memory compilation
cache, keyed on source text and origin). The example therefore measures the
cached compile in a child process.
