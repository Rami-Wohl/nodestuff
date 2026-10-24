// Guards in temp-dir.js are only worth something if they are proven. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, realpathSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createTempDir } from './temp-dir.js';

test('creates a directory under os.tmpdir() with the prefix, and cleanup removes it', () => {
  const temp = createTempDir('tempdir-test');
  assert.ok(existsSync(temp.dir));
  assert.ok(realpathSync(temp.dir).startsWith(realpathSync(os.tmpdir()) + path.sep));
  assert.ok(path.basename(temp.dir).startsWith('tempdir-test-'));

  writeFileSync(temp.file('a.txt'), 'a');
  writeFileSync(temp.file('b.bin'), Buffer.from([1, 2, 3]));
  temp.cleanup();
  assert.equal(existsSync(temp.dir), false);

  temp.cleanup(); // idempotent
});

test('cleanup refuses when something unregistered is inside, and deletes nothing', () => {
  const temp = createTempDir('tempdir-test');
  const registered = temp.file('known.txt');
  writeFileSync(registered, 'known');
  const stray = path.join(temp.dir, 'stray.txt');
  writeFileSync(stray, 'not registered');

  assert.throws(() => temp.cleanup(), { code: 'ENOTEMPTY' });
  assert.ok(existsSync(temp.dir), 'directory still exists');
  assert.ok(existsSync(stray), 'the unregistered file was not deleted');

  rmSync(stray); // the test created it, so the test removes it, by exact path
  temp.cleanup();
  assert.equal(existsSync(temp.dir), false);
});

test('a registered name that became a directory is never removed recursively', () => {
  const temp = createTempDir('tempdir-test');
  const name = temp.file('expected-a-file');
  mkdirSync(name);
  writeFileSync(path.join(name, 'inner.txt'), 'would be lost by a recursive delete');

  assert.throws(() => temp.cleanup());
  assert.ok(existsSync(path.join(name, 'inner.txt')), 'nested file survived');

  // The test made this directory, so the test removes it: file by exact path,
  // then the now-empty directory, non-recursively.
  rmSync(path.join(name, 'inner.txt'));
  rmdirSync(name);
  temp.cleanup();
  assert.equal(existsSync(temp.dir), false);
});

test('file() rejects anything that is not a plain file name', () => {
  const temp = createTempDir('tempdir-test');
  for (const bad of ['', '.', '..', 'a/b', '../escape', '/absolute']) {
    assert.throws(() => temp.file(bad), { message: /plain file name/ });
  }
  temp.cleanup();
});

test('prefix must be simple', () => {
  for (const bad of ['', 'With Space', '../x', 'UPPER']) {
    assert.throws(() => createTempDir(bad), { message: /prefix/ });
  }
});
