// Experiment 2 — "hoisting" is evidence that declarations are processed
// before the first statement runs.
//
// The engine has already seen the whole file when line 1 executes. Which
// bindings exist at that point, and in what state, depends on how they were
// declared.
//
// Run:  node modules/01-javascript-execution/01-source-to-execution/examples/02-hoisting-is-evidence.js

// 1. A function declaration is fully usable before the line that declares it.
console.log('1. typeof declaredLater      =', typeof declaredLater);
console.log('   declaredLater()           =', declaredLater());

// 2. A `var` binding exists before its line, holding undefined.
//    (TypeScript flags this read even though the runtime allows it: the
//    static checker is stricter than the language here.)
// @ts-expect-error — used before being assigned
console.log('2. typeof varLater           =', typeof varLater);

// 3. A `let`/`const` binding also exists before its line, but is
//    *uninitialized*: touching it throws. This window is the
//    "temporal dead zone" (TDZ).
try {
  // @ts-expect-error — TypeScript rejects statically what the runtime rejects dynamically.
  console.log(letLater);
} catch (error) {
  console.log('3. reading letLater early   →', describe(error));
}

// 4. Compare with a name that was never declared anywhere: still a
//    ReferenceError, but a different one. The engine knows the difference
//    between "not initialized yet" and "does not exist".
try {
  // @ts-expect-error — same here.
  console.log(neverDeclared);
} catch (error) {
  console.log('4. reading neverDeclared    →', describe(error));
}

// 5. A function *expression* assigned to `var` is just a `var`: the binding
//    exists early, but the function value is only created when this line runs.
try {
  // @ts-expect-error — TypeScript also knows this is not callable yet.
  expressionLater();
} catch (error) {
  console.log('5. calling expressionLater  →', describe(error));
}

function declaredLater() {
  return 'called before its line in the source';
}

var varLater = 1;
let letLater = 2;
var expressionLater = function () {
  return 'only assigned when execution reaches this line';
};

console.log('\nAfter all declarations executed:');
console.log('   varLater =', varLater, '· letLater =', letLater, '· expressionLater() =', expressionLater());

/** @param {unknown} error */
function describe(error) {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}
