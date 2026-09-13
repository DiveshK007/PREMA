import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['__tests__/**/*.test.ts'],
    // Node by default, but any test file whose first line carries
    // `@vitest-environment jsdom` runs in a browser-like environment instead.
    //
    // This exists because a Node-only API (Buffer base64url) shipped to the
    // client and threw on the first real form submission while every test
    // passed. Tests that only ever run in Node cannot catch that.
    environment: 'node',
    environmentMatchGlobs: [['__tests__/**/*.browser.test.ts', 'jsdom']],
  },
});
