# node-fundamentals

A long-running, experiment-driven exploration of what JavaScript, V8, Node.js
and libuv actually do underneath application frameworks. Written for
experienced React/Next.js/NestJS developers who want to stop treating the
runtime as a black box.

This is not a JavaScript course. It is a bottom-up tour of the runtime: how
code is parsed and executed, how asynchrony works, how memory and garbage
collection behave, how I/O reaches the operating system, how V8 optimizes, how
streams and HTTP work, where TypeScript ends, and how to observe, profile and
measure all of it. [`CURRICULUM.md`](./CURRICULUM.md) is the map;
[`PROGRESS.md`](./PROGRESS.md) is the log.

## Philosophy

**Learn experimentally.** Every lesson follows the same loop: establish a
mental model → make a prediction → run an experiment → observe → explain →
modify the experiment → connect it to real application engineering. Predicting
*before* running is the part that does the teaching.

**Prefer small programs.** Lessons are plain JavaScript or TypeScript run with
Node, with no dependencies, so that the only moving parts are the ones under
study. Frameworks appear only in Module 15, where the point is applying the
fundamentals to them.

**Separate fact from simplification.** Explanations are explicitly labelled as
beginner model, more accurate runtime model, or V8/Node implementation detail.
A simplification is never presented as the whole truth.

**Measure, don't believe.** Performance claims are shown experimentally, and
interesting runtime behavior is kept distinct from practical production advice.

## Requirements

- Node.js 24 or newer (`.nvmrc` is set; `nvm use`). Node 24 runs `.ts` files
  directly by stripping types, so there is no build step anywhere in the repo.
- npm.

```sh
nvm use
npm install
```

## Running lessons

Each lesson is a folder under `modules/` with a `README.md` and small runnable
examples. Read the README, write down your predictions, then run:

```sh
npm run lesson                   # list lessons that have materials
npm run lesson -- 01.01          # run all examples of lesson 01.01 in order
npm run lesson -- 01.01 host     # run only examples whose name contains "host"
npm run lesson -- 01.01 --demo   # run the lesson's coworker demo
```

Every example is also an ordinary script, so `node modules/.../examples/x.js`
works and is what the lesson READMEs show.

Other commands:

```sh
npm run web          # web demo shell: Vite client on :5173 + node:http backend on :4000
npm test             # node --test: tests that pin down the behavior the lessons claim
npm run typecheck    # tsc, strict, for Node code and for the web client
npm run lint         # eslint (no `any`, no unused code)
```

## Layout

```
modules/     one folder per module, one subfolder per lesson
web/         visual demos (client/ = Vite + vanilla TypeScript, server/ = node:http)
shared/      tiny helpers reused by lessons; never hides a mechanism under study
playground/  scratch space
scripts/     the lesson runner and the web launcher; plain Node scripts
```

A lesson folder looks like:

```
modules/01-javascript-execution/01-source-to-execution/
├── README.md      the lesson (13 fixed sections, see CURRICULUM.md)
├── notes.md       your predictions, observations and open questions
├── examples/      runnable experiments, numbered in the order the README uses them
├── exercises/     variations to do yourself, with solutions
├── demo/          a 2–10 minute version for showing a coworker
└── test/          node:test files asserting the behavior the lesson claims
```

## Web demos

`npm run web` starts a small Vite app (`web/client`) and a `node:http` backend
(`web/server`). The client is vanilla TypeScript with a tiny demo shell: each
demo registers a title, an explanation, a prediction prompt, controls, an output
area and a reset. Demos that need Node behavior (memory, event-loop delay,
workers, streams) call the backend under `/api/`. Nothing is built on top of a
UI framework on purpose: the concepts should stay visible.

## Status

See [`PROGRESS.md`](./PROGRESS.md). Lessons are written one at a time, in
order; only lessons with materials appear in `npm run lesson`.
