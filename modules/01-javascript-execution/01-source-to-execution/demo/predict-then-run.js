// Interactive coworker demo: show a program, wait for a prediction, run it.
//
// Run:  node modules/01-javascript-execution/01-source-to-execution/demo/predict-then-run.js
//       npm run lesson -- 01.01 --demo

import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { runNode, printRun } from '../../../../shared/run-node.js';

const steps = [
  { file: 'runtime-error-at-end.js', question: 'Which lines print?' },
  { file: 'syntax-error-at-end.js', question: 'Which lines print?' },
  { file: 'syntax-error-in-uncalled-function.js', question: 'The function is never called. Does line 1 print?' },
  { file: 'syntax-error-inside-eval.js', question: 'Does line 1 print this time?' },
];

const rl = createInterface({ input: process.stdin, output: process.stdout });

for (const [index, step] of steps.entries()) {
  const url = new URL(`../examples/fixtures/${step.file}`, import.meta.url);
  const source = readFileSync(url, 'utf8');

  console.log(`\n${'═'.repeat(70)}\n ${index + 1}/${steps.length}  ${step.file}\n${'═'.repeat(70)}`);
  source
    .trimEnd()
    .split('\n')
    .forEach((line, i) => console.log(`${String(i + 1).padStart(3)} │ ${line}`));

  await rl.question(`\n${step.question}  (press Enter to run)`);
  printRun(runNode(url));
}

console.log(`\n${'═'.repeat(70)}\n Bonus: node --check  (parse only, never execute)\n${'═'.repeat(70)}`);
await rl.question('What exit code does --check give the runtime-error file? And the syntax-error file?  (Enter)');
for (const name of ['runtime-error-at-end.js', 'syntax-error-at-end.js']) {
  printRun(runNode(fileURLToPath(new URL(`../examples/fixtures/${name}`, import.meta.url)), ['--check']));
}

rl.close();
