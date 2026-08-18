import { AppError } from '@/domain/errors/app-error';

const POPUP_KEY = 'reminder.windowId';

export const openOrFocusReminderWindow = async (
  query: Record<string, string> = {},
): Promise<number> => {
  const stored = await chrome.storage.local.get(POPUP_KEY);
  const previousId = typeof stored[POPUP_KEY] === 'number' ? stored[POPUP_KEY] : undefined;
  if (previousId !== undefined) {
    try {
      const existing = await chrome.windows.get(previousId, { populate: true });
      const reminderUrl = chrome.runtime.getURL('reminder.html');
      const ownsReminder = existing.tabs?.some((tab) => tab.url?.startsWith(reminderUrl));
      if (existing.type === 'popup' && ownsReminder) {
        await chrome.windows.update(previousId, { focused: true, state: 'normal' });
        if (query.targetLocalDate && query.slotId) {
          await chrome.runtime.sendMessage({
            type: 'reminder.opened',
            targetLocalDate: query.targetLocalDate,
            slotId: query.slotId,
          });
        }
        return previousId;
      }
      await chrome.storage.local.remove(POPUP_KEY);
    } catch {
      await chrome.storage.local.remove(POPUP_KEY);
    }
  }
  const search = new URLSearchParams(query).toString();
  const created = await chrome.windows.create({
    url: chrome.runtime.getURL(`reminder.html${search ? `?${search}` : ''}`),
    type: 'popup',
    focused: true,
    width: 500,
    height: 220,
  });
  if (!created || created.id === undefined) throw new AppError('UNEXPECTED');
  await chrome.storage.local.set({ [POPUP_KEY]: created.id });
  return created.id;
};

export const forgetReminderWindow = async (windowId: number) => {
  const stored = await chrome.storage.local.get(POPUP_KEY);
  if (stored[POPUP_KEY] === windowId) await chrome.storage.local.remove(POPUP_KEY);
};

export const openOrFocusPopupWindow = openOrFocusReminderWindow;
export const forgetPopupWindow = forgetReminderWindow;
