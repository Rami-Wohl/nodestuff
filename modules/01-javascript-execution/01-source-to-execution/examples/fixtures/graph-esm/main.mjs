console.log('main.mjs: top of file');

// A static import is not a statement that "runs" when reached. The whole
// module graph is loaded and parsed before any module body executes, and
// dependencies are evaluated before the modules that import them.
import './broken.mjs';

console.log('main.mjs: bottom of file');
