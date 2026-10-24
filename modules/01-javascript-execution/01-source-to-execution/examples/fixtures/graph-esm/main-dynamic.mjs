console.log('main-dynamic.mjs: top of file');

try {
  await import('./broken.mjs');
} catch (error) {
  console.log(`main-dynamic.mjs: caught ${error.name} from import()`);
}

console.log('main-dynamic.mjs: bottom of file');
