// Lesson 01.01 — what is the language, and what is the host?
//
// The backend creates a bare V8 context (node:vm) and reports its globals
// next to Node's. The browser adds its own list. Three columns:
// engine · Node · this browser.

import { button, el, type Demo, type DemoContext } from '../shell.ts';

interface GlobalsReport {
  node: string;
  v8: string;
  bare: string[];
  addedByNode: string[];
}

const probes = ['Promise', 'Map', 'Intl', 'WebAssembly', 'console', 'setTimeout', 'fetch', 'URL', 'structuredClone', 'process', 'Buffer', 'document'];

function column(title: string, names: string[]): HTMLElement {
  return el('div', { className: 'column' }, [
    el('h3', { textContent: `${title} (${names.length})` }),
    el('div', { className: 'names', textContent: names.join('  ') }),
  ]);
}

function mount(ctx: DemoContext): void {
  const probeInput = el('input');
  probeInput.placeholder = 'type a global name, e.g. fetch';
  const probeResult = el('div', { className: 'probe-result' });
  let report: GlobalsReport | undefined;

  const probe = (name: string): void => {
    if (!name) return;
    const inBrowser = name in globalThis;
    const row = (label: string, present: boolean | undefined): string =>
      `${label.padEnd(16)} ${present === undefined ? '? (backend not loaded)' : present ? 'present' : 'absent'}`;
    probeResult.textContent = [
      row('bare V8:', report ? report.bare.includes(name) : undefined),
      row('Node adds:', report ? report.addedByNode.includes(name) : undefined),
      row('this browser:', inBrowser),
    ].join('\n');
  };
  probeInput.addEventListener('input', () => probe(probeInput.value.trim()));

  const load = async (): Promise<void> => {
    ctx.clear();
    ctx.log('fetching /api/globals from the node:http backend…', 'muted');
    try {
      const response = await fetch('/api/globals');
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      report = (await response.json()) as GlobalsReport;
    } catch (error) {
      ctx.log(`could not reach the backend (${String(error)}). Start it with: npm run web`, 'error');
      return;
    }

    const bareSet = new Set(report.bare);
    const browserAdds = Object.getOwnPropertyNames(globalThis)
      .filter((name) => !bareSet.has(name))
      .sort();

    ctx.clear();
    ctx.log(`Node ${report.node} · V8 ${report.v8}`, 'muted');
    ctx.log(`bare V8 context: ${report.bare.length} globals · Node adds ${report.addedByNode.length} · this browser adds ${browserAdds.length}`, 'ok');
    ctx.log('');
    for (const name of probes) {
      const where = [
        bareSet.has(name) ? 'engine' : '',
        report.addedByNode.includes(name) ? 'node' : '',
        name in globalThis && !bareSet.has(name) ? 'browser' : '',
      ].filter(Boolean);
      ctx.log(`${name.padEnd(16)} ${where.join(' + ') || 'nowhere'}`, bareSet.has(name) ? 'info' : 'muted');
    }

    ctx.output.append(
      el('div', { className: 'columns' }, [
        column('Bare V8 context', report.bare),
        column('Added by Node', report.addedByNode),
        column('Added by this browser', browserAdds),
      ]),
    );
    ctx.explain(
      'Everything in the first column is the language (ECMA-262 plus Intl and WebAssembly, which V8 bundles). ' +
        'Timers, fetch, URL, console output, process, document: all of it comes from whichever host embeds the engine. ' +
        'Web APIs are host APIs in Node too, which is why Node and browsers can share them without sharing code.',
    );
    probe(probeInput.value.trim());
  };

  ctx.controls.append(
    el('div', { className: 'row' }, [button('Load globals from backend', () => void load())]),
    el('label', {}, ['Probe a name: ', probeInput]),
    probeResult,
  );
}

export const ecmascriptVsHost: Demo = {
  id: '01-01-ecmascript-vs-host',
  lesson: '01.01',
  title: 'ECMAScript vs. host',
  summary:
    'A bare V8 context contains only what the language defines. Everything else, in Node and in the browser, is added by the host.',
  prediction:
    'Guess how many globals a bare engine has, and how many Node adds. ' +
    'Then sort these into engine or host before loading: Promise, Intl, console, setTimeout, fetch, URL, structuredClone, Buffer.',
  mount,
};
