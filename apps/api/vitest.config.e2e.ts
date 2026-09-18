import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/support/global-setup.ts'],
    fileParallelism: false,
    env: {
      DATABASE_URL:
        'postgres://codeconnect:codeconnect@localhost:5432/codeconnect_test',
    },
  },
});
