// Lesson runner.
//
//   npm run lesson                      list all lessons that have materials
//   npm run lesson -- 01.01             run every example of lesson 01.01, in order
//   npm run lesson -- 01.01 parse       run only examples whose file name contains "parse"
//   npm run lesson -- 01.01 --demo      run the lesson's coworker demo script(s)
//
// Deliberately boring: it finds files and spawns `node` on them. Each example
// is an ordinary script you can also run directly with `node <path>`.

import { readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modulesDir = path.join(root, 'modules');

const RUNNABLE = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts']);

/** @returns {{ id: string, dir: string, title: string }[]} */
function listLessons() {
  const lessons = [];
  for (const moduleName of readdirSync(modulesDir).sort()) {
    const moduleDir = path.join(modulesDir, moduleName);
    const moduleNumber = moduleName.slice(0, 2);
    let entries;
    try {
      entries = readdirSync(moduleDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || !/^\d\d-/.test(entry.name)) continue;
      const dir = path.join(moduleDir, entry.name);
      if (!existsSync(path.join(dir, 'README.md'))) continue;
      lessons.push({ id: `${moduleNumber}.${entry.name.slice(0, 2)}`, dir, title: entry.name.slice(3) });
    }
  }
  return lessons;
}

/** @param {string} dir @param {string} subdir @param {string} [filter] */
function listRunnable(dir, subdir, filter) {
  const target = path.join(dir, subdir);
  if (!existsSync(target)) return [];
  return readdirSync(target)
    .filter((name) => RUNNABLE.has(path.extname(name)))
    .filter((name) => (filter ? name.includes(filter) : true))
    .sort()
    .map((name) => path.join(target, name));
}

/** @param {string} file */
function run(file) {
  const relative = path.relative(root, file);
  console.log(`\n${'─'.repeat(78)}\n▶ node ${relative}\n${'─'.repeat(78)}`);
  const result = spawnSync(process.execPath, [file], { stdio: 'inherit', cwd: root });
  if (result.status !== 0) {
    console.log(`\n(exit code ${result.status} — some examples exit non-zero on purpose)`);
  }
}

const [lessonId, ...rest] = process.argv.slice(2);
const lessons = listLessons();

if (!lessonId) {
  console.log('Lessons with materials:\n');
  for (const lesson of lessons) console.log(`  ${lesson.id}  ${lesson.title}`);
  console.log('\nRun one with:  npm run lesson -- <id>');
  process.exit(0);
}

const lesson = lessons.find((l) => l.id === lessonId);
if (!lesson) {
  console.error(`No lesson with id "${lessonId}". Known ids: ${lessons.map((l) => l.id).join(', ')}`);
  process.exit(1);
}

const wantsDemo = rest.includes('--demo');
const filter = rest.find((arg) => !arg.startsWith('--'));
const files = listRunnable(lesson.dir, wantsDemo ? 'demo' : 'examples', filter);

if (files.length === 0) {
  console.error(`Nothing runnable found in ${path.relative(root, lesson.dir)}/${wantsDemo ? 'demo' : 'examples'}`);
  process.exit(1);
}

console.log(`Lesson ${lesson.id} — ${lesson.title}`);
console.log(`README: ${path.relative(root, path.join(lesson.dir, 'README.md'))}`);
for (const file of files) run(file);
