console.log('main-dynamic.mjs: top of file');

// import() is an expression that loads at run time and returns a promise.
// Loading (and therefore parsing) the dependency now happens when this line
// executes, and a parse failure becomes a rejected promise you can catch.
try {
  await import('./broken.mjs');
} catch (error) {
  console.log(`main-dynamic.mjs: caught ${error.name} from import()`);
}

console.log('main-dynamic.mjs: bottom of file');
