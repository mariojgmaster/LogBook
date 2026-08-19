// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserAudioPreviewAdapter } from '@/infrastructure/browser/audio-preview-adapter';

describe('BrowserAudioPreviewAdapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('stops and rewinds the prior preview before playing another', async () => {
    interface AudioMockInstance {
      pause: ReturnType<typeof vi.fn>;
      play: ReturnType<typeof vi.fn>;
      currentTime: number;
    }
    const instances: AudioMockInstance[] = [];
    vi.stubGlobal(
      'Audio',
      vi.fn(function AudioMock(this: AudioMockInstance) {
        this.currentTime = 5;
        this.pause = vi.fn();
        this.play = vi.fn(async () => undefined);
        instances.push(this);
      }),
    );
    const preview = new BrowserAudioPreviewAdapter();
    await preview.preview('gentle-bell');
    await preview.preview('bright-chime');
    expect(instances[0]?.pause).toHaveBeenCalledOnce();
    expect(instances[0]?.currentTime).toBe(0);
  });
});
