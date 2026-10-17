// Starts the demo backend (node:http, port 4000) and the Vite dev server
// (port 5173) together, and stops both on Ctrl-C.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCli = process.env.npm_execpath;

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
  start('client', process.execPath, [npmCli ?? 'npm', 'run', 'web:client']),
];

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
