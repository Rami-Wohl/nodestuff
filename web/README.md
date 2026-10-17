# web/ — visual demos

A deliberately small setup for showing runtime behavior to coworkers.

```
web/
├── client/   Vite + vanilla TypeScript. No UI framework.
│   └── src/
│       ├── main.ts        navigation + mounting (hash routing: #/<demo id>)
│       ├── shell.ts       the demo frame: explanation · prediction · controls · output · reset
│       ├── demos/         one file per demo, registered in demos/index.ts
│       └── style.css
└── server/
    └── server.ts  node:http backend on :4000, JSON endpoints under /api/
```

```sh
npm run web            # both; client on http://localhost:5173, API proxied to :4000
npm run web:client     # only the Vite dev server
npm run web:server     # only the backend (node --watch, restarts on change)
```

## Adding a demo

1. Create `client/src/demos/<lesson>-<name>.ts` exporting a `Demo` (see `shell.ts`):
   an id, the lesson it belongs to, a title, a summary, a prediction prompt and a
   `mount(ctx)` function that builds controls into `ctx.controls` and writes to
   `ctx.output`/`ctx.log`. Return a cleanup function if you start timers or
   listeners; **Reset** calls it and mounts the demo again.
2. Add it to the list in `client/src/demos/index.ts`.
3. If the demo needs Node behavior, add a route to `server/server.ts` and
   `fetch('/api/...')` from the demo. Keep endpoints plain JSON.

Rules: controls over polish, console-style output where that is clearer, no
library in front of the concept being shown.
