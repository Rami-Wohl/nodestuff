# Solutions — 01.01

## 1. Predict this output

```
a function undefined
b ReferenceError
c one
d TypeError
e ReferenceError
f 1 1
g one two three
```

then `SyntaxError: Unexpected token '='` on stderr and exit code 1. Line `h`
never prints.

- `a`: `one` is a function declaration, fully initialized before the first
  statement runs. `two` is a `var`: the binding exists, holding `undefined`.
- `b`: `three` is a `const` in its temporal dead zone. `typeof` is safe for
  names that were **never declared** (`typeof nope` is `'undefined'`), but it
  is *not* safe for a declared-but-uninitialized binding: it throws. The
  engine distinguishes "does not exist" from "exists, not initialized yet".
- `c`: calling a hoisted function declaration works.
- `d`: `two` holds `undefined` until its line runs, so calling it is a
  `TypeError: two is not a function`, not a ReferenceError.
- `e`: reading `three` in the TDZ is a `ReferenceError`.
- `f`: `{ value: 1 }` in statement position is a block containing a labelled
  expression statement; its completion value is `1`. With parentheses it is an
  object literal.
- `g`: after the declarations executed, all three work.
- The final `eval('const = 42')` is a *runtime* SyntaxError: the file itself
  parsed fine (otherwise nothing would have printed), lines a–g ran, then eval
  parsed its string and failed. The exception is uncaught, so the process exits
  with code 1 before `h`.

## 2. Make it catchable

Replace the static import with a dynamic one and catch the rejection:

```js
console.log('starting');
try {
  await import('./fixtures/broken.mjs');
} catch (error) {
  console.log('could not load:', error.message);
}
console.log('recovered');
```

The broken file is now parsed **when the `import()` expression executes**, so
the failure is a rejected promise inside your program instead of a load-time
failure of your program. (Converting the file to CommonJS and using
`require()` inside `try` is the other valid answer; `require` is a function
call and the error is an ordinary exception.)

## 3. Host or language?

| Name | Belongs to |
| --- | --- |
| `Promise`, `globalThis`, `JSON`, `Symbol.asyncIterator` | ECMA-262 |
| `Intl.DateTimeFormat` | ECMA-402 (bundled by V8) |
| `WebAssembly` | WebAssembly JS API spec; bundled by V8, so present in a bare context |
| `console` | WHATWG Console; V8 ships a stub, Node and browsers provide the real one |
| `setTimeout`, `queueMicrotask`, `URL`, `fetch`, `structuredClone`, `TextEncoder`, `AbortController`, `performance` | Web/HTML APIs implemented by the host, both in browsers and in Node |
| `Buffer`, `process` | Node-only |
| `require`, `module`, `__dirname` | Not globals: parameters of the CommonJS function wrapper. Undefined in an ES module. |

Check: `node -e "console.log(typeof require, typeof __dirname)"` runs as CJS
and prints `function string`; put the same line in a `.mjs` file and both are
`undefined`.

## 4. Time your own bundle

Typical laptop numbers for `typescript.js` (≈8.7 MB): 40–60 ms fresh, under
10 ms from the code cache. Roughly 5–7 ms per MB fresh. The code cache is
smaller than the source because V8 only compiled the top-level code and the
functions it decided to compile eagerly; everything else was *pre-parsed* and
is not in the cache until it is called (a cache created *after* running the
code includes the functions that ran).

Module 13 (CPU profiling) shows these phases as `(parse)` and `(compile)`
entries in a profile; Module 14 covers measuring startup properly.

## 5. Early errors without typos

Any five of:

```js
let a = 1; let a = 2;          // duplicate lexical declaration
break;                         // break outside a loop or switch
1 = 2;                         // invalid assignment target
'use strict'; with (obj) {}    // `with` forbidden in strict mode
'use strict'; function f(x, x) {}   // duplicate parameter names in strict mode
({ __proto__: 1, __proto__: 2 })    // duplicate __proto__ in an object literal
/a/gg                          // duplicate regular-expression flag
return 1;                      // the .cjs / .mjs one, see below
```

`return` at the top level is a SyntaxError in a script or module, but a
CommonJS file is compiled as the body of a **function** (the module wrapper
`function (exports, require, module, __filename, __dirname) { … }`), so a
top-level `return` is legal in `.cjs` and illegal in `.mjs`. The parser's goal
symbol (Script, Module or FunctionBody) decides which rules apply.
