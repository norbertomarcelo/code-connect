import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // Every service spec boots its own in-process Postgres (PGlite); starting
    // several at once on a busy machine can exceed the 10s default.
    hookTimeout: 60_000,
  },
});
