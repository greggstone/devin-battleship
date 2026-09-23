import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves this project from /<repo>/, so the asset base has to be
// set at build time. Locally (and on hosts that serve from the root) it stays '/'.
const base = process.env.VITE_BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
    coverage: { include: ['src/game/**'] },
  },
});
