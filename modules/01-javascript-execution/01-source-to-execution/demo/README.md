# Demo: "Which lines print?" (5–8 minutes)

**Goal.** Make it visible that the engine parses the whole file before it runs
any of it, and that this is *why* a syntax error behaves nothing like a runtime
error.

**Setup.** Terminal, font large. Nothing else.

```sh
node modules/01-javascript-execution/01-source-to-execution/demo/predict-then-run.js
```

The script shows each small program with line numbers, waits for the room to
commit to a prediction, then runs it.

## Script

1. **Runtime error at the end.** "What prints?" Everyone gets this right:
   lines 1 and 2, then a ReferenceError. Say: *execution is top to bottom.*

2. **Syntax error at the end.** "Same question." Most people say lines 1 and 2
   again. Run it: nothing prints. Ask: *so when did the engine read line 3?*
   Answer: before running line 1. The whole file is parsed first.

3. **Syntax error in a function nobody calls.** This is the one that
   surprises. "The function is never called, so…?" Run it: nothing prints. The
   parser still has to read the body to find the closing brace, and the spec
   says early errors are reported for the whole script before evaluation.

4. **Syntax error inside eval().** Line 1 prints. Parsing moved to run time
   because the *string* is only parsed when eval executes. (Same for
   `new Function`.)

5. **`node --check`.** Show that Node can do the first phase alone:
   `node --check file.js` exits 0 for the runtime-error file and 1 for the
   syntax-error file, printing nothing either way. "Parse without execute" is a
   real, separately available step.

6. **Close with the module graph** (if time): `main.mjs` importing a broken
   module prints *nothing*, `main.cjs` requiring it prints its first line and
   can even catch the SyntaxError. Same rule, one level up: `import` is resolved
   before evaluation, `require()` is a function call.

**Takeaway sentence.** *A SyntaxError is a parse-time verdict on the whole
file; a ReferenceError is a run-time event at one statement. That is why one
produces no logs at all and the other does.*

**Alternative:** the web demo *Parse, then execute* (`npm run web`) shows the
same examples with a Parse → Execute strip that goes red at the right step.
