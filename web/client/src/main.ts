import { demos } from './demos/index.ts';
import { el, renderDemo } from './shell.ts';

const app = document.getElementById('app');
if (!app) throw new Error('missing #app');

const nav = el('nav');
const main = el('main');
app.append(nav, main);

nav.append(el('p', { className: 'brand', textContent: 'node-fundamentals' }));
const list = el('ul');
for (const demo of demos) {
  const link = el('a', { textContent: demo.title });
  link.href = `#/${demo.id}`;
  link.dataset['id'] = demo.id;
  list.append(el('li', {}, [el('span', { className: 'lesson-tag', textContent: demo.lesson }), link]));
}
nav.append(list);

let unmount: (() => void) | undefined;

function route(): void {
  const id = location.hash.replace(/^#\/?/, '') || demos[0]?.id;
  const demo = demos.find((d) => d.id === id) ?? demos[0];
  if (!demo) return;
  for (const a of nav.querySelectorAll('a')) a.classList.toggle('active', a.dataset['id'] === demo.id);
  unmount?.();
  unmount = renderDemo(main, demo);
}

window.addEventListener('hashchange', route);
route();
