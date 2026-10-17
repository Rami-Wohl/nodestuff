// Lesson 01.01 — the whole source is parsed before any of it executes.
//
// `new Function(source)` parses a body without running it; calling the
// result runs it. That separation is exactly the two phases this lesson is
// about, and the browser can do it without a backend. (Node's equivalent is
// `new vm.Script(source)` followed by `script.runInThisContext()`.)

import { button, el, type Demo, type DemoContext } from '../shell.ts';

interface Preset {
  name: string;
  source: string;
}

const presets: Preset[] = [
  {
    name: 'Runtime error at the end',
    source: `console.log('line 1 ran');
console.log('line 2 ran');
thisFunctionDoesNotExist();
console.log('line 4 never runs');`,
  },
  {
    name: 'Syntax error at the end',
    source: `console.log('line 1 ran?');
console.log('line 2 ran?');
const = 42;`,
  },
  {
    name: 'Syntax error in a function nobody calls',
    source: `console.log('does this print?');

function neverCalled() {
  return 1 + ;
}`,
  },
  {
    name: 'Syntax error inside eval()',
    source: `console.log('line 1 ran');
eval('const = 42');
console.log('line 3 never runs');`,
  },
  {
    name: 'Function called before its declaration',
    source: `console.log(typeof later);
console.log(later());

function later() { return 'hoisted'; }`,
  },
  {
    name: 'let used before its declaration (TDZ)',
    source: `console.log('about to read x');
console.log(x);
let x = 1;`,
  },
];

type StepState = 'idle' | 'ok' | 'fail' | 'skipped';

function pipelineStep(label: string): { node: HTMLElement; set(state: StepState, detail?: string): void } {
  const detail = el('small');
  const node = el('div', { className: 'step idle' }, [el('strong', { textContent: label }), detail]);
  return {
    node,
    set(state, text = '') {
      node.className = `step ${state}`;
      detail.textContent = text;
    },
  };
}

function mount(ctx: DemoContext): void {
  const select = el('select');
  presets.forEach((preset, index) => {
    const option = el('option', { textContent: preset.name });
    option.value = String(index);
    select.append(option);
  });

  const editor = el('textarea', { className: 'code' });
  editor.rows = 7;
  editor.spellcheck = false;
  editor.value = presets[0]?.source ?? '';
  select.addEventListener('change', () => {
    editor.value = presets[Number(select.value)]?.source ?? '';
    ctx.clear();
    parseStep.set('idle');
    runStep.set('idle');
  });

  const parseStep = pipelineStep('1 · Parse');
  const runStep = pipelineStep('2 · Execute');
  const pipeline = el('div', { className: 'pipeline' }, [parseStep.node, el('span', { textContent: '→' }), runStep.node]);

  // A console that writes into the output panel instead of the DevTools console.
  const fakeConsole = {
    log: (...args: unknown[]) => ctx.log(args.map(String).join(' '), 'ok'),
  };

  const parse = (): ((console: typeof fakeConsole) => void) | undefined => {
    ctx.clear();
    runStep.set('idle');
    try {
      // Parsing happens here. Nothing in the body runs yet.
      const fn = new Function('console', editor.value) as (console: typeof fakeConsole) => void;
      parseStep.set('ok', 'no early errors');
      return fn;
    } catch (error) {
      parseStep.set('fail', String(error));
      runStep.set('skipped', 'never reached');
      ctx.log(String(error), 'error');
      ctx.explain('The parser rejected the source. Not a single statement ran: there was nothing to run yet.');
      return undefined;
    }
  };

  const parseAndRun = (): void => {
    const fn = parse();
    if (!fn) return;
    try {
      fn(fakeConsole);
      runStep.set('ok', 'completed');
      ctx.explain('Parsing succeeded, then execution ran top to bottom.');
    } catch (error) {
      runStep.set('fail', String(error));
      ctx.log(String(error), 'error');
      ctx.explain(
        'Parsing succeeded, so execution started and the statements before the failing one ran. ' +
          'The error was only discovered when execution reached it.',
      );
    }
  };

  ctx.controls.append(
    el('label', {}, ['Example ', select]),
    editor,
    el('div', { className: 'row' }, [
      button('Parse only', () => {
        if (parse()) {
          runStep.set('skipped', 'not requested');
          ctx.log('(parsed OK — nothing executed)', 'muted');
          ctx.explain('The whole body was parsed and no early error was found. It has still not run.');
        }
      }),
      button('Parse + execute', parseAndRun),
    ]),
    pipeline,
  );
}

export const parseVsExecute: Demo = {
  id: '01-01-parse-vs-execute',
  lesson: '01.01',
  title: 'Parse, then execute',
  summary:
    'An engine reads and checks the entire source before running the first statement. ' +
    'Syntax errors therefore stop everything; runtime errors stop only what comes after them.',
  prediction:
    'For each example, decide which console.log lines will appear in the output and at which step the ' +
    'example fails: Parse, Execute, or neither. Then press "Parse only" and "Parse + execute" and compare.',
  mount,
};
