import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the built site also works from a sub-path (e.g. GitHub Pages).
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
