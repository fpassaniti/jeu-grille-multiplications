import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  // Résout le runtime client de Svelte 5 (sinon `mount` indisponible côté « server »)
  resolve: {
    conditions: ['browser']
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/**/*.{test,spec}.{js,ts}'],
    exclude: ['src/tests/e2e/**', '**/node_modules/**'],
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
});
