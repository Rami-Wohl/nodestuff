// Pins down the behavior lesson 01.01 claims. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { runNode } from '../../../../shared/run-node.js';

/** @param {string} name */
const fixture = (name) => new URL(`../examples/fixtures/${name}`, import.meta.url);

test('a runtime error lets the statements before it run', () => {
  const run = runNode(fixture('runtime-error-at-end.js'));
  assert.equal(run.stdout, 'line 1 ran\nline 2 ran\n');
  assert.match(run.stderr, /ReferenceError: thisFunctionDoesNotExist is not defined/);
  assert.equal(run.status, 1);
});

test('a syntax error at the end prevents the whole file from running', () => {
  const run = runNode(fixture('syntax-error-at-end.js'));
  assert.equal(run.stdout, '');
  assert.match(run.stderr, /SyntaxError/);
  assert.equal(run.status, 1);
});

test('a syntax error inside a never-called function still prevents execution', () => {
  const run = runNode(fixture('syntax-error-in-uncalled-function.js'));
  assert.equal(run.stdout, '');
  assert.match(run.stderr, /SyntaxError/);
});

test('eval() moves parsing to run time, so earlier statements run', () => {
  const run = runNode(fixture('syntax-error-inside-eval.js'));
  assert.equal(run.stdout, 'line 1 ran\n');
  assert.match(run.stderr, /SyntaxError/);
});

test('node --check parses without executing', () => {
  const runtime = runNode(fixture('runtime-error-at-end.js'), ['--check']);
  assert.equal(runtime.status, 0, 'a file with only runtime errors passes --check');
  assert.equal(runtime.stdout, '', 'nothing executes under --check');

  const syntax = runNode(fixture('syntax-error-at-end.js'), ['--check']);
  assert.equal(syntax.status, 1);
  assert.match(syntax.stderr, /SyntaxError/);
});

test('ESM static import: a parse failure anywhere in the graph stops main before its first line', () => {
  const run = runNode(fixture('graph-esm/main.mjs'));
  assert.equal(run.stdout, '');
  assert.match(run.stderr, /SyntaxError/);
});

test('CommonJS require(): a parse failure in a dependency is a catchable runtime exception', () => {
  const run = runNode(fixture('graph-cjs/main.cjs'));
  assert.equal(run.stdout, 'main.cjs: top of file\nmain.cjs: caught SyntaxError thrown by require()\nmain.cjs: bottom of file\n');
  assert.equal(run.status, 0);
});

test('dynamic import(): a parse failure becomes a rejected promise', () => {
  const run = runNode(fixture('graph-esm/main-dynamic.mjs'));
  assert.match(run.stdout, /caught SyntaxError from import\(\)/);
  assert.equal(run.status, 0);
});

test('a bare V8 context has the language but not the host', () => {
  const bare = vm.createContext({});
  assert.equal(vm.runInContext('typeof Promise', bare), 'function');
  assert.equal(vm.runInContext('typeof Map', bare), 'function');
  assert.equal(vm.runInContext('typeof setTimeout', bare), 'undefined');
  assert.equal(vm.runInContext('typeof process', bare), 'undefined');
  assert.equal(vm.runInContext('typeof fetch', bare), 'undefined');
  assert.equal(vm.runInContext('typeof URL', bare), 'undefined');
});

test('declarations are instantiated before the first statement runs', () => {
  assert.equal(vm.runInNewContext('typeof f; function f() {}'), 'function');
  assert.equal(vm.runInNewContext('typeof v; var v = 1'), 'undefined');
  assert.throws(() => vm.runInNewContext('l; let l = 1'), {
    name: 'ReferenceError',
    message: /before initialization/,
  });
});
