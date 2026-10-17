// Minimal JSON backend for the web demos. Plain node:http, no framework,
// so that nothing sits between a demo and the runtime behavior it shows.
//
// Run:  node --watch web/server/server.ts      (or: npm run web)

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import vm from 'node:vm';

const PORT = Number(process.env.PORT ?? 4000);

type Handler = (url: URL, request: IncomingMessage) => object | Promise<object>;

const routes: Record<string, Handler> = {
  '/api/health': () => ({ ok: true, pid: process.pid, uptimeSeconds: Math.round(process.uptime()) }),

  '/api/runtime': () => ({
    node: process.version,
    v8: process.versions.v8,
    uv: process.versions.uv,
    platform: process.platform,
    arch: process.arch,
  }),

  // Lesson 01.01: which globals come from the engine, and which does Node add?
  '/api/globals': () => {
    const bare = vm.createContext({});
    const bareNames: string[] = vm.runInContext('Object.getOwnPropertyNames(globalThis)', bare);
    const nodeNames: string[] = vm.runInThisContext('Object.getOwnPropertyNames(globalThis)');
    const bareSet = new Set(bareNames);
    return {
      node: process.version,
      v8: process.versions.v8,
      bare: [...bareNames].sort(),
      addedByNode: nodeNames.filter((name) => !bareSet.has(name)).sort(),
    };
  },
};

function sendJson(response: ServerResponse, status: number, body: object): void {
  const json = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(json),
    // Lets the API be called directly (not only through the Vite proxy).
    'access-control-allow-origin': '*',
  });
  response.end(json);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const handler = routes[url.pathname];
  const started = performance.now();
  try {
    if (!handler) {
      sendJson(response, 404, { error: `no route for ${url.pathname}`, routes: Object.keys(routes) });
    } else {
      sendJson(response, 200, await handler(url, request));
    }
  } catch (error) {
    sendJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
  }
  console.log(`${request.method} ${url.pathname} → ${response.statusCode} (${(performance.now() - started).toFixed(1)} ms)`);
});

server.listen(PORT, () => {
  console.log(`demo backend listening on http://localhost:${PORT}  (routes: ${Object.keys(routes).join(', ')})`);
});
