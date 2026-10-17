# Notes — 01.01 Source code to execution

## My predictions (fill in before running)

1. runtime-error-at-end.js → stdout: … exit code: …
2. syntax-error-at-end.js → stdout: …
3. syntax-error-in-uncalled-function.js → prints the line? …
4. syntax-error-inside-eval.js → stdout: …
5. node --check on each → exit codes: …
6. Bare V8 context: defined = … · undefined = … · Node adds about … globals
7. main.mjs prints: … · main.cjs prints: …
8. Compile 5 MB / 50k functions ≈ … ms · first calls vs compile: …

## What I observed

_Which predictions were wrong, and what did the output actually show?_

## Corrections to my mental model

_Write the corrected rule in one sentence each. Example shape: "I thought X; actually Y, because Z."_

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
