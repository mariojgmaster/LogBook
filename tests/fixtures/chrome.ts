import { vi } from 'vitest';

export function createChromeMock() {
  const storage = new Map<string, unknown>();
  const alarms = new Map<string, chrome.alarms.Alarm>();
  let alarmsPermission = true;
  const event = <T extends (...args: never[]) => unknown>() => {
    const listeners = new Set<T>();
    return {
      addListener: (listener: T) => listeners.add(listener),
      removeListener: (listener: T) => listeners.delete(listener),
      hasListener: (listener: T) => listeners.has(listener),
      hasListeners: () => listeners.size > 0,
      dispatch: (...args: Parameters<T>) => listeners.forEach((listener) => listener(...args)),
    };
  };
  return {
    runtime: {
      id: 'test-extension',
      getURL: (path: string) => `chrome-extension://test-extension/${path}`,
      sendMessage: vi.fn(),
      onMessage: event(),
      onInstalled: event(),
      onStartup: event(),
    },
    storage: {
      local: {
        get: vi.fn(async (keys?: string | string[] | Record<string, unknown> | null) => {
          if (typeof keys === 'string') return { [keys]: storage.get(keys) };
          return Object.fromEntries(storage);
        }),
        set: vi.fn(async (values: Record<string, unknown>) => {
          Object.entries(values).forEach(([key, value]) => storage.set(key, value));
        }),
        remove: vi.fn(async (key: string | string[]) => {
          for (const value of Array.isArray(key) ? key : [key]) storage.delete(value);
        }),
      },
    },
    permissions: {
      contains: vi.fn(async () => alarmsPermission),
      request: vi.fn(async () => alarmsPermission),
      onAdded: event(),
      onRemoved: event(),
      setAllowed: (value: boolean) => {
        alarmsPermission = value;
      },
    },
    alarms: {
      create: vi.fn(async (name: string, info: chrome.alarms.AlarmCreateInfo) => {
        alarms.set(name, { name, scheduledTime: info.when ?? Date.now() });
      }),
      clear: vi.fn(async (name: string) => alarms.delete(name)),
      getAll: vi.fn(async () => [...alarms.values()]),
      onAlarm: event(),
    },
    action: { onClicked: event() },
    windows: {
      onRemoved: event(),
      get: vi.fn(),
      update: vi.fn(),
      create: vi.fn(async () => ({ id: 1 })),
    },
    __storage: storage,
    __alarms: alarms,
  };
}
