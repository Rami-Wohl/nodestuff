// The demo frame. Every demo gets the same skeleton:
//   title · explanation · prediction · controls · output · explanation-after · reset
// A demo only fills in `controls` and writes to `output`.

export type LogKind = 'info' | 'ok' | 'error' | 'muted';

export interface DemoContext {
  /** Put inputs and buttons here. */
  controls: HTMLElement;
  /** Visible results; use `log` for console-style lines or render your own elements. */
  output: HTMLElement;
  log(line: string, kind?: LogKind): void;
  clear(): void;
  /** Text shown under the output after an experiment ran. */
  explain(text: string): void;
}

export interface Demo {
  /** Used in the URL hash, e.g. `01-01-parse-vs-execute`. */
  id: string;
  /** Lesson id, e.g. `01.01`. */
  lesson: string;
  title: string;
  /** What the demo shows and why it matters. One or two sentences. */
  summary: string;
  /** What to predict before touching the controls. */
  prediction: string;
  /** Build the demo. Return a cleanup function if you created timers or listeners. */
  mount(ctx: DemoContext): void | (() => void);
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Pick<HTMLElementTagNameMap[K], 'className' | 'textContent' | 'title'>> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

export function button(label: string, onClick: () => void, className = ''): HTMLButtonElement {
  const b = el('button', { textContent: label, className });
  b.addEventListener('click', onClick);
  return b;
}

/** Renders a demo into `host` and returns a function that unmounts it. */
export function renderDemo(host: HTMLElement, demo: Demo): () => void {
  host.replaceChildren();

  const controls = el('div', { className: 'controls' });
  const output = el('pre', { className: 'output' });
  const explainAfter = el('p', { className: 'explain-after' });

  const ctx: DemoContext = {
    controls,
    output,
    log(line, kind = 'info') {
      output.append(el('span', { className: `line ${kind}`, textContent: `${line}\n` }));
      output.scrollTop = output.scrollHeight;
    },
    clear() {
      output.replaceChildren();
      explainAfter.textContent = '';
    },
    explain(text) {
      explainAfter.textContent = text;
    },
  };

  let cleanup: (() => void) | undefined;
  const start = (): void => {
    cleanup = demo.mount(ctx) ?? undefined;
  };
  const reset = (): void => {
    cleanup?.();
    controls.replaceChildren();
    ctx.clear();
    start();
  };

  host.append(
    el('header', {}, [
      el('p', { className: 'lesson-tag', textContent: `Lesson ${demo.lesson}` }),
      el('h1', { textContent: demo.title }),
      el('p', { className: 'summary', textContent: demo.summary }),
    ]),
    el('section', { className: 'prediction' }, [
      el('h2', { textContent: 'Predict first' }),
      el('p', { textContent: demo.prediction }),
    ]),
    el('section', {}, [el('h2', { textContent: 'Experiment' }), controls]),
    el('section', {}, [
      el('div', { className: 'output-header' }, [el('h2', { textContent: 'Output' }), button('Reset', reset, 'secondary')]),
      output,
      explainAfter,
    ]),
  );

  start();
  return () => cleanup?.();
}
