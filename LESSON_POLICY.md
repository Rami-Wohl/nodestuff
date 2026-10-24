# Lesson authoring policy

Rules for writing or changing anything under `modules/`, `shared/`, `scripts/`
and `web/`. The philosophy is in `README.md`; the map is `CURRICULUM.md`. This
file is the checklist.

## 1. Anatomy of a lesson

- Folder `modules/<NN>-<module>/<NN>-<lesson>/` with `README.md`, `notes.md`
  and, where useful, `examples/`, `exercises/`, `demo/`, `test/`.
- `README.md` has the thirteen fixed sections (CURRICULUM.md, "Lesson format")
  **and** the "How to work through this lesson" box at the top, because the
  fixed order is not the reading order.
- `notes.md` starts as a template: predictions, observations, corrections,
  open questions, then an "Instructor notes" block with the reference run
  (Node version, machine, date, key numbers).
- Examples are numbered in the order the README uses them. Every example runs
  on its own with `node <path>`; the lesson runner adds nothing.

## 2. Teaching rules

- Prediction before result. Section 5 asks for specific outputs, not "an error".
- **Fixtures must not spoil.** A fixture is any file whose source a learner is
  asked to predict from, including everything the coworker demo prints.
  Comments in fixtures describe what the code *does* ("not valid JavaScript",
  "nobody calls this function"), never why it behaves as it does. Explanations
  live in the README. Example *drivers* may state the conclusion in their
  header, because they are run, not read, before the explanation.
- Label every explanation: ECMAScript, V8, Node, libuv, operating system; and
  beginner model vs. runtime model vs. implementation detail.
- Terminology is corrected when it is wrong, gently and immediately
  ("parsed, not evaluated").
- Interesting runtime behavior and practical production advice are kept
  visibly separate. No flag or trick is called a win without a measurement.

## 3. Code rules

- Node ≥ 24, ESM unless a CommonJS lesson needs CommonJS, TypeScript strict,
  no `any`, no unnecessary `unknown`. Plain JavaScript examples are allowed and
  are type-checked too (`checkJs`), with JSDoc where a type is needed.
- `// @ts-expect-error` marks lines where static checking and runtime behavior
  deliberately disagree, with a one-line reason. Never `@ts-ignore`,
  never `@ts-nocheck`.
- Fixtures with intentional errors live in a `fixtures/` folder, which tsc and
  ESLint exclude. A non-fixture file that imports a broken fixture must be
  excluded explicitly in `tsconfig.json` (tsc follows imports).
- Small functions, explicit names, comments about runtime behavior rather than
  syntax. No helper may hide the mechanism a lesson is about; `shared/` is for
  plumbing only.
- No dependencies in lessons. Dev tooling (TypeScript, ESLint, Vite) only.

## 4. Measurement honesty

- Anything that measures a cache, a cold start or a "first time" effect runs
  in a fresh process; V8's in-memory compilation cache and the module cache
  silently invalidate same-process re-measurements.
- Reference numbers in READMEs and notes name the Node version, machine and
  date, and are described as "on this machine". No number is presented as a
  constant.
- Unit tests assert behavior and ordering, never performance. Benchmarks are
  separate scripts and say what they do not control.

## 5. Resources and cleanup

A resource is anything a script creates that is not a plain heap object:
files, directories, child processes, listening servers, workers, timers,
readline interfaces, open handles.

- The garbage collector reclaims unreachable heap objects and nothing else.
  Files and directories outlive the process; sockets, file descriptors and
  memory are reclaimed by the OS at process exit; child processes may be
  orphaned. Each kind needs its own release.
- **Everything created is released by the same code path, in `finally`,** so
  it also happens on error. A script that exits with a resource still held is
  a bug, not a leftover.
- Temporary files go in a fresh directory from `shared/temp-dir.js`
  (`createTempDir(prefix)`), under `os.tmpdir()`, with a lesson-specific
  prefix. Never in the repository, the working directory or `/tmp` directly.
  Files a lesson is *about* (heap snapshots, profiles) go in a git-ignored
  output folder named in the README, and the README says how to delete them.
- Child processes spawned asynchronously are killed on the parent's `exit`,
  `SIGINT` and `SIGTERM`. Spawn `node` directly rather than through `npm run`
  or a shell, which may not forward the kill. Synchronous spawns need a
  `timeout`.
- Servers and interactive scripts handle `SIGINT`/`SIGTERM` explicitly: close
  the server or interface, then exit.
- After running an example, nothing new may exist under `os.tmpdir()` and
  no process may remain. Section 8 checks this.

## 6. Deleting files and directories

Deletion is the one operation that cannot be undone, so it gets extra checks
whether it happens in lesson code or in a shell command while working on the
repo.

1. **Never delete recursively on a computed path.** No `rm -rf`, no
   `rmSync(path, { recursive: true })` on anything whose value came from a
   variable, an argument, an environment variable or a glob.
2. **Delete known files by exact path, then remove the directory
   non-recursively.** An unexpected file inside makes the removal fail
   (`ENOTEMPTY`) instead of disappearing. `shared/temp-dir.js` does exactly
   this and refuses to touch anything it did not register.
3. **Before deleting, assert the target is ours**: an absolute, resolved path
   inside the directory we created, with our prefix, a real directory and not
   a symlink. The helper's guard throws otherwise. Any new deletion code
   reuses the helper or reproduces every one of these checks.
4. `force: true` is only for tolerating "already gone". It never replaces a
   check.
5. Nothing in this repository deletes anything outside a temp directory it
   created or a git-ignored output folder named in a lesson README. In
   particular, never the user's home directory, the repo, `node_modules`, or
   anything found by pattern in a directory we did not create.
6. In shell commands while working on the repo: list the target first, use
   exact paths rather than globs, and prefer moving to a scratch location over
   deleting when in doubt.
7. Every deletion path has a test that proves the refusal cases
   (`shared/temp-dir.test.js` is the model).

## 7. The web shell

- Vanilla TypeScript, no UI framework. Each demo is one file registered in
  `web/client/src/demos/index.ts`; the frame provides explanation, prediction,
  controls, output and reset.
- Demos that need Node behavior call a plain JSON route in
  `web/server/server.ts`. Keep routes small and readable; the route is part of
  the lesson.
- Anything a demo starts (intervals, workers, event sources) is stopped by the
  cleanup function it returns from `mount()`.

## 8. Verification before a lesson is "materials ready"

```sh
npm run typecheck && npm run lint && npm test
npm run lesson -- <id>              # every example runs; expected non-zero exits are commented
npm run lesson -- <id> --demo       # the demo runs end to end, Ctrl-C leaves a clean terminal
ls "$(node -p 'require("node:os").tmpdir()')" | grep '<prefix>-'   # prints nothing
ps aux | grep -E 'node|vite' | grep -v grep                        # nothing left from the lesson
```

Then: the reference run goes into `notes.md`, the lesson is listed in the
module README, and `PROGRESS.md` is updated.

## 9. Progress tracking

`PROGRESS.md` is updated whenever a lesson's status changes: predictions made,
experiments run, lesson completed. Experiments are logged as
`lesson id · example · one-line result`. The "can now explain confidently"
section is only ever filled by the learner.
