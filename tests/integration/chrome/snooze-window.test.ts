import { beforeEach, describe, expect, it, vi } from 'vitest';
import { closeSnoozeWindow, openOrFocusSnoozeWindow } from '@/infrastructure/chrome/snooze-window';

describe('snooze popup window', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    (chrome as any).__windows.clear();
    await chrome.storage.local.remove(['reminder.snoozeWindowId', 'reminder.snoozeParentWindowId']);
  });

  it('opens outside the reminder bounds and reuses the same focused window', async () => {
    const occurrence = { targetLocalDate: '2026-08-17', slotId: 'morning' };
    const id = await openOrFocusSnoozeWindow(occurrence);

    expect(chrome.windows.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'popup',
        focused: true,
        url: expect.stringContaining('snooze.html?'),
        width: 500,
        height: 390,
        left: 712,
        top: 100,
      }),
    );
    expect(await openOrFocusSnoozeWindow(occurrence)).toBe(id);
    expect(chrome.windows.create).toHaveBeenCalledTimes(1);
    expect(chrome.windows.update).toHaveBeenCalledWith(
      id,
      expect.objectContaining({ focused: true, state: 'normal' }),
    );

    await closeSnoozeWindow();
    expect(chrome.windows.remove).toHaveBeenCalledWith(id);
  });
});
