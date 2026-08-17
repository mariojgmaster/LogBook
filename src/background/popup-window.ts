import { AppError } from '@/domain/errors/app-error';

const POPUP_KEY = 'mainWindowId';

export const openOrFocusPopupWindow = async (
  query: Record<string, string> = {},
): Promise<number> => {
  const stored = await chrome.storage.local.get(POPUP_KEY);
  const previousId = typeof stored[POPUP_KEY] === 'number' ? stored[POPUP_KEY] : undefined;
  if (previousId !== undefined) {
    try {
      const existing = await chrome.windows.get(previousId);
      if (existing.type === 'popup') {
        await chrome.windows.update(previousId, { focused: true, state: 'normal' });
        if (query.targetLocalDate && query.slotId) {
          void chrome.runtime
            .sendMessage({
              type: 'reminder.opened',
              targetLocalDate: query.targetLocalDate,
              slotId: query.slotId,
            })
            .catch(() => undefined);
        }
        return previousId;
      }
    } catch {
      await chrome.storage.local.remove(POPUP_KEY);
    }
  }
  const search = new URLSearchParams(query).toString();
  const created = await chrome.windows.create({
    url: chrome.runtime.getURL(`index.html${search ? `?${search}` : ''}`),
    type: 'popup',
    focused: true,
    width: 1120,
    height: 760,
    left: 80,
    top: 60,
  });
  if (!created || created.id === undefined) throw new AppError('UNEXPECTED');
  await chrome.storage.local.set({ [POPUP_KEY]: created.id });
  return created.id;
};

export const forgetPopupWindow = async (windowId: number) => {
  const stored = await chrome.storage.local.get(POPUP_KEY);
  if (stored[POPUP_KEY] === windowId) await chrome.storage.local.remove(POPUP_KEY);
};
