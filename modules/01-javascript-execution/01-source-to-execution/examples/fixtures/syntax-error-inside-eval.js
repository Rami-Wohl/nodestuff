console.log('line 1 ran');
// The string is only parsed when eval() *executes*, so this is a runtime
// error from the file's point of view, even though eval itself reports a
// SyntaxError. Parsing moved from load time to run time.
eval('const = 42');
console.log('line 6 never runs');
