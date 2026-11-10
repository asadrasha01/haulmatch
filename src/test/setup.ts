// Global Vitest setup, loaded via `test.setupFiles` in vite.config.ts.
// Extends `expect` with jest-dom's DOM-specific matchers (toBeInTheDocument,
// toHaveTextContent, etc.) for every test file in the suite.
import '@testing-library/jest-dom/vitest';

if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = (blob: Blob) => `blob:mock-${blob.size}`;
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {};
}

