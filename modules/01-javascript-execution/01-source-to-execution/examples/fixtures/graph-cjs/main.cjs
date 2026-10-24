console.log('main.cjs: top of file');

try {
  require('./broken.cjs');
} catch (error) {
  console.log(`main.cjs: caught ${error.name} thrown by require()`);
}

console.log('main.cjs: bottom of file');
