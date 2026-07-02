import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setupEnv.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
