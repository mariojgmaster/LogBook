import { vi } from 'vitest';

export function createChromeMock() {
  const storage = new Map<string, unknown>();
  const alarms = new Map<string, chrome.alarms.Alarm>();
  const grantedPermissions = new Set<string>(['alarms', 'offscreen']);
  const windows = new Map<number, chrome.windows.Window>();
  let nextWindowId = 1;
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
      getContexts: vi.fn(async () => []),
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
      contains: vi.fn(async ({ permissions = [] }: chrome.permissions.Permissions) =>
        permissions.every((permission) => grantedPermissions.has(permission)),
      ),
      request: vi.fn(async ({ permissions = [] }: chrome.permissions.Permissions) => {
        permissions.forEach((permission) => grantedPermissions.add(permission));
        return true;
      }),
      remove: vi.fn(async ({ permissions = [] }: chrome.permissions.Permissions) =>
        permissions.some((permission) => grantedPermissions.delete(permission)),
      ),
      onAdded: event(),
      onRemoved: event(),
      setAllowed: (value: boolean) => {
        for (const permission of ['alarms', 'offscreen']) {
          if (value) grantedPermissions.add(permission);
          else grantedPermissions.delete(permission);
        }
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
    sidePanel: {
      setPanelBehavior: vi.fn(async () => undefined),
      setOptions: vi.fn(async () => undefined),
      open: vi.fn(async () => undefined),
      getOptions: vi.fn(async () => ({ enabled: true, path: 'sidepanel.html' })),
    },
    offscreen: {
      Reason: { AUDIO_PLAYBACK: 'AUDIO_PLAYBACK' },
      createDocument: vi.fn(async () => undefined),
      closeDocument: vi.fn(async () => undefined),
      hasDocument: vi.fn(async () => false),
    },
    windows: {
      onRemoved: event(),
      getCurrent: vi.fn(async () => ({
        id: 99,
        type: 'popup',
        focused: true,
        left: 200,
        top: 100,
        width: 500,
        height: 220,
      })),
      get: vi.fn(async (id: number) => {
        const found = windows.get(id);
        if (!found) throw new Error('Window not found');
        return found;
      }),
      update: vi.fn(async (id: number, updateInfo: chrome.windows.UpdateInfo) => {
        const current = windows.get(id);
        if (!current) throw new Error('Window not found');
        const updated = { ...current, ...updateInfo };
        windows.set(id, updated);
        return updated;
      }),
      create: vi.fn(async (createData: chrome.windows.CreateData) => {
        const rawUrl = Array.isArray(createData.url) ? createData.url[0] : createData.url;
        const created = {
          id: nextWindowId++,
          type: createData.type ?? 'normal',
          focused: true,
          tabs: rawUrl ? [{ id: 1, url: rawUrl }] : [],
        };
        windows.set(created.id, created as chrome.windows.Window);
        return created;
      }),
      remove: vi.fn(async (id: number) => {
        windows.delete(id);
      }),
    },
    __storage: storage,
    __alarms: alarms,
    __permissions: grantedPermissions,
    __windows: windows,
  };
}

export function installClipboardMock() {
  const clipboard = { writeText: vi.fn(async () => undefined) };
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
  return clipboard;
}

export function createAudioMock() {
  return {
    src: '',
    currentTime: 0,
    play: vi.fn(async () => undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}
