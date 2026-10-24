// Starts the demo backend (node:http, port 4000) and the Vite dev server
// (port 5173) together, and stops both when either exits or this process
// receives Ctrl-C / SIGTERM.
//
// Both children are spawned as direct `node` processes, not through
// `npm run` or a shell: an intermediate process might not forward the kill,
// leaving an orphaned server on its port.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteCli = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
if (!existsSync(viteCli)) {
  console.error('vite is not installed; run `npm install` first');
  process.exit(1);
}

/** @param {string} label @param {string} command @param {string[]} args */
function start(label, command, args) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
  child.on('exit', (code) => {
    console.log(`[${label}] exited with code ${code}`);
    shutdown();
  });
  return child;
}

const children = [
  start('server', process.execPath, ['--watch', 'web/server/server.ts']),
  start('client', process.execPath, [viteCli, 'web/client']),
];

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// Also on any other way out (uncaught error, process.exit): kill() is
// synchronous, so it is safe to call from an 'exit' handler.
process.on('exit', shutdown);
