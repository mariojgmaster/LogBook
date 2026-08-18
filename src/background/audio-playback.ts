import { AppError } from '@/domain/errors/app-error';
import type { ReminderAudioPort } from '@/application/ports/platform';
import { findReminderSound } from '@/shared/reminder-sounds';

const LAST_PLAYBACK_KEY = 'audio.lastPlayback';
let creatingDocument: Promise<void> | undefined;

export class ChromeReminderAudioAdapter implements ReminderAudioPort {
  async play(soundId: string, playbackId: string): Promise<void> {
    if (!findReminderSound(soundId)) throw new AppError('AUDIO_UNAVAILABLE');
    const stored = await chrome.storage.local.get(LAST_PLAYBACK_KEY);
    const previous = stored[LAST_PLAYBACK_KEY] as { playbackId?: unknown } | undefined;
    if (previous?.playbackId === playbackId) return;

    await ensureOffscreenDocument();
    const result: { ok?: boolean; playbackId?: string } | undefined =
      await chrome.runtime.sendMessage({
        type: 'audio.play',
        target: 'offscreen',
        payload: { soundId, playbackId },
      });
    if (!result?.ok || result.playbackId !== playbackId) {
      throw new AppError('AUDIO_UNAVAILABLE');
    }
    await chrome.storage.local.set({
      [LAST_PLAYBACK_KEY]: { playbackId, playedAt: new Date().toISOString() },
    });
  }

  async close(): Promise<void> {
    const contexts = await getAudioContexts();
    if (contexts.length > 0) await chrome.offscreen.closeDocument();
  }
}

const ensureOffscreenDocument = async (): Promise<void> => {
  if ((await getAudioContexts()).length > 0) return;
  creatingDocument ??= chrome.offscreen
    .createDocument({
      url: 'audio.html',
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Reproduzir o som configurado de um lembrete do LogBook.',
    })
    .finally(() => {
      creatingDocument = undefined;
    });
  try {
    await creatingDocument;
  } catch {
    throw new AppError('AUDIO_UNAVAILABLE');
  }
};

const getAudioContexts = () =>
  chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('audio.html')],
  });
