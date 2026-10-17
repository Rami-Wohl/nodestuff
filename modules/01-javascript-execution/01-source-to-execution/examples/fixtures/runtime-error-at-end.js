console.log('line 1 ran');
console.log('line 2 ran');
// A ReferenceError is a *runtime* error. The engine only discovers it when
// execution reaches this statement, after the two lines above already ran.
thisFunctionDoesNotExist();
console.log('line 6 never runs');
