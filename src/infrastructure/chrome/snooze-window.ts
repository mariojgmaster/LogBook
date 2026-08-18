const SNOOZE_WINDOW_KEY = 'reminder.snoozeWindowId';
const SNOOZE_PARENT_KEY = 'reminder.snoozeParentWindowId';
const SNOOZE_WIDTH = 500;
const SNOOZE_HEIGHT = 390;
const WINDOW_GAP = 12;

interface SnoozeWindowContext {
  targetLocalDate: string;
  slotId: string;
}

const getPosition = (parent: chrome.windows.Window) => {
  const display = globalThis.screen as
    | (Screen & { availLeft?: number; availTop?: number })
    | undefined;
  const availableLeft = display?.availLeft ?? 0;
  const availableTop = display?.availTop ?? 0;
  const availableRight = availableLeft + (display?.availWidth ?? 1920);
  const availableBottom = availableTop + (display?.availHeight ?? 1080);
  const parentLeft = parent.left ?? availableLeft;
  const parentTop = parent.top ?? availableTop;
  const parentWidth = parent.width ?? 500;

  const right = parentLeft + parentWidth + WINDOW_GAP;
  const left =
    right + SNOOZE_WIDTH <= availableRight
      ? right
      : Math.max(availableLeft, parentLeft - SNOOZE_WIDTH - WINDOW_GAP);
  const top = Math.min(Math.max(parentTop, availableTop), availableBottom - SNOOZE_HEIGHT);
  return { left, top };
};

export const openOrFocusSnoozeWindow = async ({
  targetLocalDate,
  slotId,
}: SnoozeWindowContext): Promise<number> => {
  const parent = await chrome.windows.getCurrent();
  if (parent.id === undefined) throw new Error('Reminder window unavailable');
  const position = getPosition(parent);
  const stored = await chrome.storage.local.get(SNOOZE_WINDOW_KEY);
  const previousId: unknown = stored[SNOOZE_WINDOW_KEY] as unknown;

  if (typeof previousId === 'number') {
    try {
      const existing = await chrome.windows.get(previousId, { populate: true });
      const snoozeUrl = chrome.runtime.getURL('snooze.html');
      if (existing.tabs?.some((tab) => tab.url?.startsWith(snoozeUrl))) {
        await chrome.windows.update(previousId, {
          ...position,
          focused: true,
          state: 'normal',
        });
        return previousId;
      }
    } catch {
      // A stale id is replaced below.
    }
  }

  const query = new URLSearchParams({
    targetLocalDate,
    slotId,
    parentWindowId: String(parent.id),
  });
  const created = await chrome.windows.create({
    url: chrome.runtime.getURL(`snooze.html?${query}`),
    type: 'popup',
    focused: true,
    width: SNOOZE_WIDTH,
    height: SNOOZE_HEIGHT,
    ...position,
  });
  if (created?.id === undefined) throw new Error('Unable to create snooze window');
  await chrome.storage.local.set({
    [SNOOZE_WINDOW_KEY]: created.id,
    [SNOOZE_PARENT_KEY]: parent.id,
  });
  return created.id;
};

export const closeSnoozeWindow = async () => {
  const stored = await chrome.storage.local.get(SNOOZE_WINDOW_KEY);
  const windowId: unknown = stored[SNOOZE_WINDOW_KEY] as unknown;
  if (typeof windowId === 'number') {
    await chrome.windows.remove(windowId).catch(() => undefined);
  }
  await chrome.storage.local.remove([SNOOZE_WINDOW_KEY, SNOOZE_PARENT_KEY]);
};

export const forgetSnoozeWindow = async (windowId: number) => {
  const stored = await chrome.storage.local.get([SNOOZE_WINDOW_KEY, SNOOZE_PARENT_KEY]);
  if (stored[SNOOZE_WINDOW_KEY] === windowId) {
    await chrome.storage.local.remove([SNOOZE_WINDOW_KEY, SNOOZE_PARENT_KEY]);
    return;
  }
  if (stored[SNOOZE_PARENT_KEY] === windowId) await closeSnoozeWindow();
};
