import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Run a JavaScript file in a *fresh* Node process and capture what happened.
 * A fresh process matters: a SyntaxError or an uncaught exception ends the
 * process, and we want to observe exactly that.
 *
 * @param {string | URL} file  path (or file: URL) of the script to run
 * @param {string[]} [nodeFlags]  flags passed to node before the file, e.g. ['--check']
 */
export function runNode(file, nodeFlags = []) {
  const filePath = file instanceof URL ? fileURLToPath(file) : file;
  const result = spawnSync(process.execPath, [...nodeFlags, filePath], { encoding: 'utf8' });
  return {
    file: path.basename(filePath),
    flags: nodeFlags,
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
  };
}

/**
 * Print a run in a compact, comparable form.
 * @param {ReturnType<typeof runNode>} run
 */
export function printRun(run) {
  const command = ['node', ...run.flags, run.file].join(' ');
  console.log(`\n$ ${command}`);
  const out = run.stdout.trimEnd();
  console.log(out ? indent(out, '  stdout │ ') : '  stdout │ (nothing)');
  const errorLine = firstInterestingLine(run.stderr);
  if (errorLine) console.log(`  stderr │ ${errorLine}`);
  console.log(`  exit   │ ${run.status}`);
}

/** @param {string} text @param {string} prefix */
function indent(text, prefix) {
  return text.split('\n').map((line) => prefix + line).join('\n');
}

/**
 * Node prints a source excerpt and a stack trace; the line naming the error
 * is the one that matters for comparison.
 * @param {string} stderr
 */
function firstInterestingLine(stderr) {
  return stderr.split('\n').find((line) => /^\w*Error\b/.test(line.trim())) ?? stderr.trim().split('\n')[0] ?? '';
}
