import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Glider/',
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
});
