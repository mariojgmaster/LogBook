import { audioRequestSchema } from '@/shared/contracts/messages';
import { findReminderSound } from '@/shared/reminder-sounds';

const played = new Set<string>();

chrome.runtime.onMessage.addListener((raw: unknown, sender, sendResponse) => {
  const request = audioRequestSchema.safeParse(raw);
  if (!request.success || (sender.id && sender.id !== chrome.runtime.id)) return false;
  const { soundId, playbackId } = request.data.payload;
  if (played.has(playbackId)) {
    sendResponse({ ok: true, playbackId });
    return false;
  }
  const sound = findReminderSound(soundId);
  if (!sound) {
    sendResponse({ ok: false, playbackId, code: 'UNKNOWN_SOUND' });
    return false;
  }
  const audio = new Audio(chrome.runtime.getURL(sound.assetPath));
  void audio
    .play()
    .then(() => {
      played.add(playbackId);
      sendResponse({ ok: true, playbackId });
    })
    .catch(() => sendResponse({ ok: false, playbackId, code: 'PLAYBACK_FAILED' }));
  return true;
});
