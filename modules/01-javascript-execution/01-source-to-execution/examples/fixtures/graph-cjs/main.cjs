console.log('main.cjs: top of file');

// In CommonJS, require() is an ordinary function call. The dependency is
// read, parsed and executed *when this line runs*, so its SyntaxError
// surfaces here as a normal exception, and normal exceptions can be caught.
try {
  require('./broken.cjs');
} catch (error) {
  console.log(`main.cjs: caught ${error.name} thrown by require()`);
}

console.log('main.cjs: bottom of file');
