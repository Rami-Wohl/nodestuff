/* eslint-disable @typescript-eslint/no-unused-expressions --
   This file deliberately contains an expression statement with no effect,
   because that is what the parser sees. */

// Experiment 3 — statements versus expressions, from the parser's point of view.
//
// An expression produces a value. A statement does something. Where the
// parser *is* (statement position or expression position) decides what the
// same characters mean. We use eval() because it returns the *completion
// value* of what it parsed, which makes the parser's decision visible.
//
// Run:  node modules/01-javascript-execution/01-source-to-execution/examples/03-statements-vs-expressions.js

// 1. An expression used as a statement: computed, then discarded.
1 + 1;
console.log('1. `1 + 1;` is a legal statement whose value is thrown away');

// 2. `{` at the start of a statement opens a BLOCK, not an object literal.
//    `answer:` becomes a label and `42` an expression statement inside the block.
console.log('2. eval("{ answer: 42 }")   =', eval('{ answer: 42 }'));
//    Parentheses force expression position, so now `{` starts an object literal.
console.log('   eval("({ answer: 42 })") =', eval('({ answer: 42 })'));

// 3. `function` at the start of a statement is a DECLARATION: it needs a
//    name and cannot be called in place...
try {
  eval('function () { return "called" }()');
} catch (error) {
  console.log('3. eval("function () {...}()") →', error instanceof Error ? `${error.name}: ${error.message}` : error);
}
//    ...while in expression position it is a function expression, which can.
console.log('   eval("(function () {...})()") =', eval('(function () { return "called" })()'));

// 4. The completion value of a sequence of statements is the value of the
//    last one that produced a value. `node -p "..."` prints exactly this.
console.log('4. eval("let x = 1; x + 1; x * 10") =', eval('let x = 1; x + 1; x * 10'));
console.log('   (`node -p "1 + 1"` prints 2 for the same reason)');

// 5. A declaration is a statement that produces no value at all.
console.log('5. eval("let y = 5")          =', eval('let y = 5'));
