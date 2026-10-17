import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // Demos call the node:http backend as /api/...; Vite forwards it.
    proxy: { '/api': 'http://127.0.0.1:4000' },
  },
});
