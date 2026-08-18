import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChromeReminderAudioAdapter } from '@/background/audio-playback';

describe('reminder audio playback', () => {
  beforeEach(() => {
    (chrome.runtime.getContexts as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      playbackId: 'occurrence-1',
    });
  });

  it('creates one offscreen document and plays an occurrence only once', async () => {
    const audio = new ChromeReminderAudioAdapter();
    await audio.play('gentle-bell', 'occurrence-1');
    await audio.play('gentle-bell', 'occurrence-1');
    expect(chrome.offscreen.createDocument).toHaveBeenCalledTimes(1);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'audio.play',
      target: 'offscreen',
      payload: { soundId: 'gentle-bell', playbackId: 'occurrence-1' },
    });
  });

  it('reuses an existing offscreen context and permits a distinct snooze occurrence', async () => {
    (chrome.runtime.getContexts as ReturnType<typeof vi.fn>).mockResolvedValue([
      { contextType: 'OFFSCREEN_DOCUMENT', documentUrl: chrome.runtime.getURL('audio.html') },
    ]);
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      playbackId: 'snooze-2',
    });
    const audio = new ChromeReminderAudioAdapter();
    await audio.play('gentle-bell', 'snooze-2');
    expect(chrome.offscreen.createDocument).not.toHaveBeenCalled();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('maps an asset/device failure to AUDIO_UNAVAILABLE without closing the reminder', async () => {
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      playbackId: 'occurrence-1',
      code: 'PLAYBACK_FAILED',
    });
    await expect(
      new ChromeReminderAudioAdapter().play('gentle-bell', 'occurrence-1'),
    ).rejects.toMatchObject({ code: 'AUDIO_UNAVAILABLE' });
    expect(chrome.windows.update).not.toHaveBeenCalled();
  });
});
