import { beforeEach, describe, expect, it } from 'vitest';
import { forgetReminderWindow, openOrFocusReminderWindow } from '@/background/popup-window';

describe('reminder popup window', () => {
  beforeEach(() => {
    (chrome as any).__windows.clear();
  });

  it('creates only reminder.html and reuses its validated popup', async () => {
    const occurrence = { targetLocalDate: '2026-08-17', slotId: 'morning' };
    const id = await openOrFocusReminderWindow(occurrence);
    expect(chrome.windows.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'popup',
        url: expect.stringContaining('reminder.html?'),
        width: 500,
        height: 220,
      }),
    );
    expect(chrome.windows.create).not.toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('index.html') }),
    );
    expect(await openOrFocusReminderWindow(occurrence)).toBe(id);
    expect(chrome.windows.create).toHaveBeenCalledTimes(1);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'reminder.opened',
      ...occurrence,
    });
  });

  it('does not reuse an incompatible stored window and forgets only its own id', async () => {
    (chrome as any).__windows.set(9, {
      id: 9,
      type: 'popup',
      tabs: [{ url: 'https://example.com' }],
    });
    await chrome.storage.local.set({ 'reminder.windowId': 9 });
    const created = await openOrFocusReminderWindow({});
    expect(created).not.toBe(9);
    await forgetReminderWindow(9);
    expect((await chrome.storage.local.get('reminder.windowId'))['reminder.windowId']).toBe(
      created,
    );
    await forgetReminderWindow(created);
    expect(
      (await chrome.storage.local.get('reminder.windowId'))['reminder.windowId'],
    ).toBeUndefined();
  });
});
