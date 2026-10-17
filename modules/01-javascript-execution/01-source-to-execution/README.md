# 01.01 — Source code to execution

> Module 01 · JavaScript execution model · Lesson 1 of 8
>
> Covers: parsing · execution · statements and expressions · runtime versus host
> environment · ECMAScript versus implementation.

```sh
npm run lesson -- 01.01            # run all experiments in order
npm run lesson -- 01.01 --demo     # the coworker demo
npm test                           # the assertions this lesson makes
```

---

## 1. Why this matters

You have shipped a NestJS service that crashed on deploy with a `SyntaxError`
in a file whose code is never executed on the failing path. You have seen a
Next.js build fail because one dependency used syntax the target Node version
could not parse. You have watched a Lambda cold start spend 300 ms "doing
nothing" before the handler ran. And you have had a `User` type on
`JSON.parse(...)` that did not protect you from anything.

All four are the same lesson: **a JavaScript engine reads and checks an entire
program before it executes any of it, and everything that is not the language
itself comes from whoever embeds the engine.** Specifically:

- A syntax error is a verdict on the *whole file* at load time, which is why a
  broken, never-called function stops the process before your first log line.
  With ES modules the verdict covers the *whole import graph*: a bad file three
  imports away stops `main` before its first statement. (This is why some
  crashes have no logs at all, and others log "Starting Nest application…"
  first.)
- Parsing and compiling are real CPU work, roughly proportional to source size.
  Server bundle size is startup time; this is what Node's compile cache and
  V8's code cache exist to reduce.
- `setTimeout`, `fetch`, `URL`, `console`, `process`, `Buffer`, `document`
  are not JavaScript. They are provided by the *host* (Node, a browser, an
  edge runtime, a test environment). That is why the same language behaves
  differently in Next.js route handlers, Edge middleware, Vitest with jsdom
  and the browser.
- TypeScript never reaches the engine. Something strips the types first.
  Where that boundary is decides what a type can and cannot guarantee
  (Module 11).

By the end of this lesson you should be able to look at any failing program and
say, with evidence, whether it failed *before* or *during* execution, and look
at any global and say *who* provided it.

## 2. Mental model

### Two phases, not one

```
   your-file.js
        │
        ▼
  ┌───────────────┐    reads EVERY character, EVERY function body,
  │  1. PARSE     │    checks the static rules of the language
  └───────────────┘
        │
        ├── any early error? ──▶  SyntaxError. Nothing has run. Exit.
        │
        ▼
  ┌───────────────┐    creates bindings for every declaration in the file
  │  instantiate  │    (functions: ready; var: undefined; let/const: not yet)
  └───────────────┘
        │
        ▼
  ┌───────────────┐    statement by statement, top to bottom;
  │  2. EXECUTE   │    ReferenceError / TypeError / your throw happen HERE,
  └───────────────┘    after the statements above them already ran
```

The beginner model "JavaScript runs line by line" describes phase 2 only. It
is a fine model for execution order. It is wrong about *when the engine reads
your code*, and that is what a syntax error exposes.

### Who provides what

```
┌─────────────────────────────────────────────────────────────────────────┐
│  your application code  (+ frameworks: Nest, Next, Vite, React, …)      │
├─────────────────────────────────────────────────────────────────────────┤
│  HOST environment            Node:    process, Buffer, fs, require, …   │
│  "the embedder"                       setTimeout, fetch, URL, console   │
│                              Browser: document, fetch, URL, console, …  │
│                              Edge:    fetch, URL, Request, Response, …  │
├─────────────────────────────────────────────────────────────────────────┤
│  ENGINE (V8)                 parser · interpreter · compilers · GC       │
│                              Object, Array, Promise, Map, JSON, Intl, … │
├─────────────────────────────────────────────────────────────────────────┤
│  ECMAScript specification    defines the language and its built-ins;    │
│  (ECMA-262, plus ECMA-402)   leaves "host hooks" deliberately open      │
└─────────────────────────────────────────────────────────────────────────┘
```

The engine implements the language. The host embeds the engine and bolts on
everything that touches the outside world: time, I/O, networking, the DOM, the
process. The same engine (V8) sits under Node, Chrome, Deno, Electron and
Cloudflare Workers; what differs is the host.

### `node file.js`, as a timeline

```
 OS starts the node binary
   └─ Node bootstraps: V8 isolate + startup snapshot (its own internals, precompiled)
        └─ Node reads your file (synchronously) and decides: CommonJS or ES module?
             └─ V8 PARSES it (CJS: as a function body; ESM: as a module)
                  ├─ ESM only: resolve + read + parse every import, recursively
                  └─ V8 EXECUTES the top level (ESM: dependencies first)
                       └─ Node runs the event loop until nothing is pending  ← Module 02
                            └─ process exits
```

## 3. Important terminology

| Term | Meaning in this lesson |
| --- | --- |
| **ECMAScript** | The language standard (ECMA-262). It specifies syntax, semantics and built-ins such as `Array` and `Promise`. ECMA-402 adds `Intl`. |
| **Engine** | An implementation of ECMAScript. V8 (Node, Chrome), JavaScriptCore (Safari, Bun), SpiderMonkey (Firefox). |
| **Host / embedder** | The program that embeds an engine and provides everything the standard leaves to the host: Node, a browser, Deno, an edge runtime. |
| **Host hook** | A named operation the spec calls but does not define, e.g. `HostEnqueuePromiseJob`, `HostLoadImportedModule`. The host decides what happens. |
| **Parse** | Turn source text into a structure the engine can execute (an AST, and in V8 then bytecode), checking static rules along the way. |
| **Early error** | An error the spec requires to be reported during parsing, before any evaluation. All syntax errors and some static-semantics rules (duplicate `let`, `break` outside a loop, …). |
| **Evaluate / execute** | Run the parsed program: create bindings, then perform statements in order. |
| **Statement** | A unit of execution that does something: `if`, `for`, `return`, a declaration, an *expression statement*. |
| **Expression** | A unit that produces a value: `1 + 1`, `f()`, `{ a: 1 }`, `function () {}`. |
| **Completion value** | The value a statement list "ends with". `node -p` and `eval` return it. |
| **Realm** | One global object plus one set of built-ins. `node:vm` can create a fresh one. |
| **Lazy parsing / compilation** | V8's habit of only syntax-checking function bodies at load, and fully compiling a function the first time it is called. |

## 4. What actually happens

Labelled by whose rule it is.

### ECMAScript (the specification)

- **Scripts.** Running a script is two abstract operations: `ParseScript`
  turns source text into a Script Record *or* a list of early errors, and only
  if that succeeded does `ScriptEvaluation` run. Evaluation starts with
  *GlobalDeclarationInstantiation*: every `function` declaration gets a
  binding initialized to its function object; every `var` gets a binding set to
  `undefined`; every `let`/`const`/`class` gets a binding that exists but is
  **uninitialized**. Then the statements execute in order. That instantiation
  step is what people call "hoisting", and it can only exist because parsing
  already happened.
- **Modules.** For ES modules the two phases are even further apart:
  `ParseModule` for each file, then *loading* every requested module
  recursively, then *linking* the whole graph (creating all bindings, including
  imports), and only then *evaluating*, dependencies first. A parse failure
  anywhere in the graph means nothing in the graph evaluates.
- **Early errors** must be reported "as part of parsing" (clause *Error
  Handling and Language Extensions*). Runtime errors (`ReferenceError`,
  `TypeError`, your `throw`) are reported when the construct is evaluated.
- **Statement vs expression** is decided by the grammar from the parser's
  current position. The characters `{` and `function` at the *start of a
  statement* begin a block and a declaration; anywhere an expression is
  expected they begin an object literal and a function expression. Nothing at
  runtime is involved.
- **`eval` and `new Function`** are the language's two ways to parse *at run
  time*. The string is a brand-new program with its own parse phase.
- **Host hooks.** The spec does not define timers, I/O, the console, module
  loading from disk, or *when* promise jobs run relative to anything else. It
  defines named hooks (`HostEnqueuePromiseJob`, `HostPromiseRejectionTracker`,
  `HostLoadImportedModule`, `HostMakeJobCallback`, `HostEnsureCanCompileStrings`
  …) and says: the host decides. Everything in Module 02 about ordering is the
  host's (Node's) answer to those hooks.

### V8 (the engine)

- **Scanner → parser → AST → bytecode.** V8 tokenizes the source, builds an
  AST, and generates *bytecode* for its interpreter, Ignition. Experiment 7
  shows the bytecode for a function. Hot functions are later recompiled by
  Sparkplug, Maglev and TurboFan (Module 07); none of that changes the
  parse/execute distinction.
- **Lazy parsing.** V8 does not fully parse every function body at load. Inner
  functions are *pre-parsed*: syntax-checked (which is why a syntax error in a
  never-called function is still found) and scope-analysed, but no AST or
  bytecode is kept. The full parse and bytecode generation happen on the
  function's **first call**. Top-level code and functions that look immediately
  invoked (`(function () { … })()`) are compiled eagerly. Experiment 6 makes
  the first-call cost visible.
- **Two caches.** Within one process, compiling the same source text with the
  same origin again hits V8's in-memory *compilation cache* and costs nothing.
  Across processes, V8 can serialize compiled code into a *code cache* and
  later deserialize it instead of parsing (`vm.Script#createCachedData`).
- **A bare V8 context** (a new realm, via `node:vm`) contains ECMA-262,
  ECMA-402 (`Intl`), `WebAssembly`, and a `console` whose output goes to an
  attached debugger, not to stdout. That is the whole engine-provided global
  object: 67 names on Node 24.

### Node (the host)

- **Startup** deserializes a prebuilt snapshot of Node's own internal JS, so
  Node's own bootstrap is not re-parsed on every start.
- **Module format decides the parse goal.** A CommonJS file is compiled as the
  body of a function (the wrapper `function (exports, require, module,
  __filename, __dirname) { … }`), which is why `require` and `__dirname` are
  not globals (experiment 4 shows them `undefined` in an ES module) and why a
  top-level `return` is legal in `.cjs`. An ES module is compiled with the
  Module goal, then linked with its imports before anything evaluates.
- **`require()` is a function call**; it reads, parses and executes the target
  when it runs. Its errors are ordinary exceptions. **`import` declarations**
  are resolved before evaluation; **`import()`** is an expression and loads
  at run time, returning a promise.
- **`node --check`** runs phase 1 only.
- **Globals.** Node adds 68 names on top of the bare context (experiment 4):
  `process`, `Buffer`, timers, and a large set of *Web* APIs (`fetch`, `URL`,
  `TextEncoder`, streams, `AbortController`, `structuredClone`, …). Web APIs
  are host APIs in Node, exactly as they are host APIs in a browser.
- **Compile cache.** `module.enableCompileCache()` or `NODE_COMPILE_CACHE=<dir>`
  stores V8 code caches for your modules on disk.
- **TypeScript.** `node file.ts` works because Node (≥ 22.18 / 23.6) replaces
  type annotations with whitespace *before* handing the text to V8
  (`process.features.typescript === 'strip'`). The engine never sees a type.
  Only erasable syntax is supported without a flag; `enum`, `namespace` with
  values and parameter properties need `--experimental-transform-types`.

### Operating system

- The OS loads the `node` binary and its libraries; Node reads your file with
  a blocking `read` system call during startup (Module 05 explains why that is
  fine here and not inside a request handler). That is the OS's entire role in
  this lesson.

## 5. Prediction exercise

Write your answers in [`notes.md`](./notes.md) **before** running anything.
Commit to specific output, not "an error".

1. `runtime-error-at-end.js` logs two lines, then calls a function that does
   not exist, then logs a third. What appears on stdout? What is the exit code?
2. `syntax-error-at-end.js` logs two lines, then has `const = 42;` on line 5.
   What appears on stdout?
3. `syntax-error-in-uncalled-function.js` logs one line, then declares a
   function with a syntax error in its body. The function is never called.
   Does the line print?
4. `syntax-error-inside-eval.js` logs one line, then `eval('const = 42')`,
   then logs another. What prints?
5. `node --check <file>` for each of the four: exit code and output?
6. In a brand-new V8 context created with `node:vm`, which of these are
   defined: `Array`, `Promise`, `console`, `setTimeout`, `fetch`, `URL`,
   `process`, `Intl`, `WebAssembly`, `structuredClone`? How many globals does
   Node add on top of such a context: about 10, 30, 70 or 200?
7. `main.mjs` logs a line, statically imports a module containing a syntax
   error, and logs another. `main.cjs` does the same with `require()` inside a
   `try`. What does each print?
8. Compiling a 5 MB script of 50,000 small functions, with none of them
   called: closer to 1 ms, 50 ms or 1 s? Calling each function once
   afterwards: cheaper or more expensive than the compile?

## 6. Experiment

Each file is self-contained; the lesson runner just runs them in order.

| # | File | Shows |
| --- | --- | --- |
| 1 | [`examples/01-parse-before-execute.js`](./examples/01-parse-before-execute.js) | Four small programs run in fresh processes, then the same four under `node --check`. Fixtures in [`examples/fixtures/`](./examples/fixtures/). |
| 2 | [`examples/02-hoisting-is-evidence.js`](./examples/02-hoisting-is-evidence.js) | Which bindings exist, and in what state, when the first statement runs. |
| 3 | [`examples/03-statements-vs-expressions.js`](./examples/03-statements-vs-expressions.js) | `{` and `function` meaning different things depending on parser position; completion values. |
| 4 | [`examples/04-ecmascript-vs-host.js`](./examples/04-ecmascript-vs-host.js) | A bare V8 context next to Node's main context; the exact list of what Node adds. |
| 5 | [`examples/05-module-graphs-parse-first.js`](./examples/05-module-graphs-parse-first.js) | The same rule one level up: `import` vs `require()` vs `import()`. |
| 6 | [`examples/06-parse-cost.js`](./examples/06-parse-cost.js) | Compile time vs source size; lazy compilation on first call; the two caches. Accepts a path to time a real file. |
| 7 | [`examples/07-what-v8-executes.js`](./examples/07-what-v8-executes.js) | Run with `--print-bytecode --print-bytecode-filter=add` to see what Ignition actually executes, and *when* it is generated. |

```sh
npm run lesson -- 01.01
node --print-bytecode --print-bytecode-filter=add modules/01-javascript-execution/01-source-to-execution/examples/07-what-v8-executes.js
node modules/01-javascript-execution/01-source-to-execution/examples/06-parse-cost.js node_modules/typescript/lib/typescript.js
```

## 7. Observation

For each experiment, look at:

- **Experiment 1:** which `stdout` lines exist at all, the *name* of the error
  on stderr (`SyntaxError` vs `ReferenceError`), the exit code. Then the
  `--check` block: exit codes with no stdout in any case.
- **Experiment 2:** the three different outcomes for "used before its line":
  works (function declaration), `undefined` (`var`), throws (`let`), and the
  two *different* `ReferenceError` messages.
- **Experiment 3:** `42` vs `{ answer: 42 }` for the same characters; the
  SyntaxError message "Function statements require a function name".
- **Experiment 4:** the `◀` markers; the two counts; which well-known Web APIs
  are in the "added by Node" list; `require`/`module`/`__dirname` being
  `undefined` in *both* columns; the bare context's `console.log` printing
  nothing.
- **Experiment 5:** `main.mjs` prints nothing at all; `main.cjs` prints three
  lines and exits 0; `main-dynamic.mjs` behaves like the CommonJS one.
- **Experiment 6:** compile time growing roughly linearly with source size;
  "1st calls" costing *more* than compile; "2nd calls" costing almost nothing;
  the code cache compile in a fresh process being several times cheaper than a
  fresh compile. On this machine (Node 24, V8 13.6, Apple Silicon):

  ```
  functions   source     compile      run     1st calls    2nd calls
       1000   106 KB     1.2 ms     0.5 ms     2.6 ms     0.1 ms
      10000  1099 KB    11.7 ms     4.6 ms    23.2 ms     0.7 ms
      50000  5669 KB    60.7 ms    24.6 ms   117.1 ms     3.1 ms

  compile, fresh:                            58.3 ms
  compile again, same process:                0.1 ms   (in-memory compilation cache)
  compile from code cache, new process:       7.1 ms   (cache 5868 KB, rejected: false)
  ```

  and for TypeScript's 8.9 MB compiler: 48 ms fresh, 4 ms from a code cache.
- **Experiment 7:** the bytecode block (`Ldar a1 · Add a0 · Return`) appears
  *before* the `add(2, 3) = 5` line, but only because the call triggers the
  compile that prints it. Comment out the call and run again: no bytecode is
  printed at all.

## 8. Explanation

**Experiment 1.** The three programs that fail with a `SyntaxError` print
nothing because the failure is produced by `ParseScript`/`ParseModule`, before
`ScriptEvaluation`. The engine must find the end of `neverCalled`'s body to
know where the next statement starts, and V8's pre-parser reports syntax
errors even in functions it chooses not to compile. The `eval` program is
different in kind: the *file* parsed successfully, line 1 ran, then `eval`
started a second parse of a second program, which failed at run time. That is
why `--check` passes it: `--check` parses the file, and the file is fine.

**Experiment 2.** Before the first statement runs, every declaration in the
file has already been processed: that is the instantiation step between the
two phases. The three outcomes are three binding *states*, not three
mechanisms: a function declaration is created *and initialized*; a `var` is
created and initialized to `undefined`; a `let`/`const` is created but left
uninitialized, and reading an uninitialized binding throws. "Hoisting" is the
folk name for the fact that this step exists. A `var` holding a function
expression is just a `var`: the function object is only created when its line
executes, hence `TypeError: expressionLater is not a function` (the binding
exists; its value is `undefined`).

**Experiment 3.** The parser has no idea what you *meant*; it has a position
in the grammar. `{ answer: 42 }` in statement position is a *block* containing
a *labelled statement* whose body is the expression statement `42`, so the
completion value is `42`. In expression position (inside parentheses) the same
characters are an object literal. The same rule explains why an IIFE needs
parentheses and why `node -p` can print the value of an expression: a script's
completion value is the value of its last value-producing statement, and
declarations produce none (`eval('let y = 5')` is `undefined`).

**Experiment 4.** Everything with the same `typeof` in both columns is
engine-provided: the language (ECMA-262), `Intl` (ECMA-402) and `WebAssembly`,
which V8 bundles, plus a `console` whose methods are real V8 built-ins that
forward to an attached inspector and otherwise do nothing. Everything marked
`◀` is the host: Node created the main context, then *installed* `process`,
`Buffer`, the timers, and its implementations of the Web APIs onto that
context's global object. That is why `fetch` in Node is not "the browser's
fetch": it is Node's (via undici), implementing the same standard. `require`,
`module` and `__dirname` are `undefined` in both columns because experiment 4
is an ES module; in a CommonJS file they are *parameters* of the function
wrapper, never globals.

**Experiment 5.** `require()` is a plain function that, when called, reads the
file, compiles it (as a function body) and runs it. A compile failure there
is thrown from the call site, which is why `try`/`catch` works and the process
exits 0. A static `import` is not executed when "reached": the ESM loader
collects all `import` declarations during parsing, loads and parses the
entire graph, and only then evaluates it, dependencies first. `broken.mjs`
never parses, so `main.mjs` never evaluates, so nothing prints. `import()`
is an expression: it is evaluated at run time and returns a promise, so a
parse failure becomes a rejection, and the program is back in charge.

**Experiment 6.** Parsing is linear-ish work over the source text: on this
machine about 10 ms per megabyte for a fresh compile. "run" only *creates*
50,000 function objects; the bodies are still just pre-parsed. The first call
to each function triggers the full parse and bytecode generation for that
function, and in total that costs more than the initial compile did. The
second pass runs existing bytecode. The in-memory compilation cache explains
the "0.1 ms": V8 recognised identical source text with an identical origin and
returned the already-compiled script. The code cache is the same idea across
processes: a serialized form of the compiled code that is cheaper to load than
to regenerate. It is smaller than the source for TypeScript's compiler because
only eagerly compiled code is in it; functions that were never called were
never compiled.

**Experiment 7.** The source text is not what executes. `add` becomes three
bytecode instructions: load argument `b` into the accumulator, add argument
`a` (with a feedback slot `[0]`, which Module 07 explains), return. And it
becomes bytecode *when first called*, which is lazy compilation observed
directly.

### Fact vs simplification

| Level | Model | Good for | Wrong about |
| --- | --- | --- | --- |
| Beginner | "JavaScript is interpreted line by line." | Execution order of statements. | When code is *read*; why syntax errors behave differently; hoisting. |
| Runtime model | "Parse everything (reporting early errors), instantiate declarations, then execute statements in order. Modules: parse and link the whole graph first." | Everything in this lesson. Predicting what prints. | Nothing important at the application level. |
| V8 detail | "Pre-parse inner functions; fully compile on first call; interpret bytecode; cache compiled code." | Startup cost, first-call latency, why bundle size matters, what profiles will show. | Not needed to predict program *behavior*, only its cost. |

## 9. Modify the experiment

Each variation tests a specific part of the model. Predict first.

1. **Move the syntax error to line 1** of `syntax-error-at-end.js`. Does the
   output change? (It should not. Where in the file the error is does not
   matter; *whether* there is one does.)
2. **Make it strict.** Add `'use strict';` and then `with ({}) {}` to a file.
   A statement that is legal in sloppy mode becomes an early error. Which
   phase reports it?
3. **Swap the extension.** Rename `graph-esm/main.mjs` to `.cjs`, change the
   `import` to `require`, and run it. Then do the reverse with `main.cjs`.
   Confirm the behavior follows the module system, not the file.
4. **Comment out the call in experiment 7** and run with `--print-bytecode`
   again. Then put the call back but wrap `add` in parentheses:
   `(function add(a, b) { … })`. Does the bytecode now appear before or after
   the first call? (V8 treats parenthesized functions as "probably invoked
   immediately" and compiles them eagerly.)
5. **Realms are separate.** In experiment 4 add:
   `console.log(vm.runInNewContext('[]') instanceof Array)`. Explain the
   result using the term *realm*. (This is the mechanism behind
   `Array.isArray` existing at all, and behind iframes in browsers.)
6. **Defeat the compilation cache.** In experiment 6 change the filename in
   the final `measureCaches` call back to one used in the loop. Watch "compile,
   fresh" drop to ~0 ms and the code cache grow to 18 MB. Explain both numbers.
7. **Turn laziness off.** Run experiment 6 as
   `node --no-lazy modules/.../examples/06-parse-cost.js`. Before you do,
   predict which columns move and in which direction. (Observed here: compile
   roughly doubles, 60 ms → 128 ms for 50,000 functions, and "1st calls" drops
   to the "2nd calls" level. The work did not disappear; it moved.)
8. **TypeScript.** Create `playground/typed.ts` with
   `const n: number = JSON.parse('"not a number"'); console.log(typeof n);` and
   run `node playground/typed.ts`. What did the engine receive? What did the
   type guarantee?

## 10. Real-world relevance

- **"It crashed with no logs."** An ES-module (or bundled) server that fails at
  parse time exits before your logger exists. A CommonJS NestJS build logs up
  to the `require` that loads the broken file. Knowing which phase failed tells
  you where to look: parse failures are about the *file and the Node version*,
  not about data or state.
- **Node version mismatches.** Using syntax the deployed Node cannot parse
  (newer class features, regex flags, `using`) fails at parse time for the
  *entire* file, even if the feature is used in one rarely-executed branch.
  Your TypeScript `target` and your bundler's target decide what syntax
  reaches V8.
- **`node --check` in CI** is a free, instant check that a generated bundle
  parses on the exact Node version you deploy with.
- **Startup time is parse time.** A Next.js standalone server, a NestJS
  `dist/main.js`, a CLI: every megabyte costs milliseconds before the first
  request, more on throttled container CPUs. Smaller server bundles,
  externalizing large dependencies instead of bundling them, and Node's
  compile cache (`NODE_COMPILE_CACHE`) are the direct levers. In a CPU profile
  (Module 13) this shows up as `(parse)` and `(compile)`.
- **Lazy compilation shapes first-request latency.** Code that runs for the
  first time on the first request pays its compile cost on that request. Warm-
  up traffic and "p99 of the first minute" are this effect (Module 14).
- **One language, many hosts.** Next.js Edge middleware has `Request`,
  `Response` and `fetch` but no `fs` or `process.cwd()`; Vitest with jsdom adds
  `document` on top of Node's globals; Bun uses a different engine entirely.
  "Is this ECMAScript, or is this the host?" answers most "why doesn't X exist
  here" questions.
- **Types are deleted, not checked.** Node strips them before V8 parses.
  Anything at a runtime boundary (`JSON.parse`, HTTP bodies, environment
  variables, database rows) needs runtime validation (Module 11).

## 11. Demo for coworkers

See [`demo/README.md`](./demo/README.md) for a 5–8 minute terminal script
built around the question *"which lines print?"*, with the surprise in the
third program (a syntax error in a function nobody calls). Run:

```sh
npm run lesson -- 01.01 --demo
```

Or, in the browser, `npm run web` → **Parse, then execute** (the same examples
with a Parse → Execute strip that fails at the right step) and
**ECMAScript vs. host** (bare V8 · Node · browser globals side by side).

## 12. Knowledge check

Answer in your own words; the point is the explanation, not the term.

1. A coworker says "JavaScript is interpreted, so it just runs top to bottom
   until it hits a problem". Which experiment refutes this, and what is the
   more accurate two-phase description?
2. Why does a syntax error in a function that is never called still prevent
   the file from running, when V8 does not even compile that function at load?
3. Why can a CommonJS `require()` of a broken file be caught with `try`, while
   a static `import` of the same file cannot? What makes `import()` behave like
   `require()` again?
4. `typeof someName` is often described as "safe". Experiment 2 shows a case
   where it throws. Which binding state causes that, and why does the engine
   distinguish it from "not declared"?
5. Explain, to someone who writes both Next.js route handlers and Edge
   middleware, why `fetch` exists in both but `fs` only in one, using the words
   *engine* and *host*.
6. A 6 MB server bundle takes 60 ms to compile at startup. Name two mechanisms
   V8/Node offer to reduce that, and say what each one caches.
7. What is the difference between the moment V8 *parses* a function and the
   moment it *compiles* it, and how did experiment 7 make that visible?

## 13. Further exploration

Optional. None of it is required to complete the lesson.

**Specification**

- ECMA-262, *Scripts* (`ParseScript`, `ScriptEvaluation`,
  `GlobalDeclarationInstantiation`) and *Modules* (`ParseModule`, `Link`,
  `Evaluate`): clause 16 in current editions.
- ECMA-262, *Jobs and Host Operations to Enqueue Jobs* (`HostEnqueuePromiseJob`)
  and the list of host hooks in the *Host Layering Points* annex: the exact
  boundary between language and host.
- ECMA-262, *Error Handling and Language Extensions*: the sentence that
  requires early errors to be reported during parsing.

**V8**

- V8 blog: *Blazingly fast parsing, part 1: optimizing the scanner* and
  *part 2: lazy parsing* (the pre-parser, PIFE heuristic).
- V8 blog: *Code caching for JavaScript developers* (what gets cached, when a
  cache is rejected).
- Flags to try: `--print-bytecode --print-bytecode-filter=<name>` (this
  lesson), `--no-lazy` (variation 7), and V8's function-event log, which
  records what happened to every function, including the pre-parse:

  ```sh
  node --log-function-events --logfile=fn.log --no-logfile-per-isolate \
    modules/01-javascript-execution/01-source-to-execution/examples/07-what-v8-executes.js
  grep '^function,' fn.log | grep ',add$'            # preparse-resolution, full-parse, first-execution, …
  grep '^function,' fn.log | cut -d, -f2 | sort | uniq -c   # event types, with counts
  ```

  The `baseline` and `maglev` events in that log are the compiler tiers of
  Module 07.

**Node**

- `lib/internal/modules/cjs/loader.js` — `wrapSafe` and `Module.prototype._compile`:
  the CommonJS wrapper becoming a compiled function.
- `lib/internal/modules/esm/module_job.js` — `ModuleJob.run`: link, then
  evaluate. Notice the name in your ESM stack traces.
- `src/node_contextify.cc` — the C++ behind `node:vm` and the CJS compile.
- `lib/internal/main/run_main_module.js` — the entry point `node file.js` runs.
- Docs: `node:vm`, `module.enableCompileCache()`, the *TypeScript* page
  (type stripping, `--experimental-transform-types`), `--check`.

**Experiments**

- Measure startup of a real project with `node --cpu-prof dist/main.js` and
  find `(parse)`/`(compile)` in the profile (Module 13 shows how to read it).
- Compare `NODE_COMPILE_CACHE` on and off for a NestJS or Next.js server start
  using `hyperfine`, once Module 14 has covered benchmark hygiene.
