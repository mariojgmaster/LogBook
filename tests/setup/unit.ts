import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { resetDatabaseConnection } from '@/infrastructure/persistence/indexeddb/database';
import { createChromeMock } from '../fixtures/chrome';

beforeEach(async () => {
  resetDatabaseConnection();
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase('logbook');
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  Object.assign(globalThis, { chrome: createChromeMock() });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    class TestResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.assign(globalThis, { ResizeObserver: TestResizeObserver });
    const computedStyle = window.getComputedStyle.bind(window);
    window.getComputedStyle = (element: Element) => computedStyle(element);
  }
});
afterEach(() => {
  vi.restoreAllMocks();
  resetDatabaseConnection();
});
