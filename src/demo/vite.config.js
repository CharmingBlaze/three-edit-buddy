import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  build: {
    outDir: '../../dist/demo',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../'),
    },
    extensions: ['.ts', '.js', '.json'],
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: ['three'],
  },
});
