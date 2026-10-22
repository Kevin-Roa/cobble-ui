import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom has no canvas implementation; sprites simply are not drawn in tests.
HTMLCanvasElement.prototype.getContext = vi.fn<() => null>(
  () => null,
) as unknown as HTMLCanvasElement['getContext'];

afterEach(() => {
  cleanup();
});
