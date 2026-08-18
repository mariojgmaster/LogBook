import { AppError } from '@/domain/errors/app-error';
import { findReminderSound } from '@/shared/reminder-sounds';

export interface AudioPreviewAdapter {
  preview(soundId: string): Promise<void>;
  stop(): void;
}

export class BrowserAudioPreviewAdapter implements AudioPreviewAdapter {
  private current?: HTMLAudioElement;

  stop(): void {
    if (!this.current) return;
    this.current.pause();
    this.current.currentTime = 0;
    this.current = undefined;
  }

  async preview(soundId: string): Promise<void> {
    const sound = findReminderSound(soundId);
    if (!sound) throw new AppError('AUDIO_UNAVAILABLE');
    this.stop();
    const audio = new Audio(chrome.runtime.getURL(sound.assetPath));
    this.current = audio;
    try {
      await audio.play();
    } catch {
      if (this.current === audio) this.current = undefined;
      throw new AppError('AUDIO_UNAVAILABLE');
    }
  }
}
