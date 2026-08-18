// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App, ConfigProvider } from 'antd';
import { ReminderSoundPicker } from '@/ui/features/settings/ReminderSettings';
import type { AudioPreviewAdapter } from '@/infrastructure/browser/audio-preview-adapter';

const renderPicker = (preview: AudioPreviewAdapter) =>
  render(
    <ConfigProvider>
      <App>
        <ReminderSoundPicker
          soundId="gentle-bell"
          expectedRevision={1}
          preview={preview}
          onSaved={vi.fn(async () => undefined)}
        />
      </App>
    </ConfigProvider>,
  );

describe('reminder sound settings', () => {
  afterEach(cleanup);
  beforeEach(() => {
    (chrome.runtime.sendMessage as ReturnType<typeof vi.fn>).mockImplementation(
      (request: { type?: string }) => ({
        ok: true,
        data: request.type === 'draft.get' ? undefined : { revision: 2 },
      }),
    );
  });
  it('offers five previews and does not persist selection until Save', async () => {
    const user = userEvent.setup();
    const preview = { preview: vi.fn(async () => undefined), stop: vi.fn() };
    renderPicker(preview);
    expect(screen.getAllByRole('button', { name: /Ouvir/ })).toHaveLength(5);
    await user.click(screen.getAllByRole('button', { name: /Ouvir/ })[0]!);
    await user.click(screen.getByRole('radio', { name: 'Carrilhão claro' }));
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'settings.updateReminderSound' }),
    );
    await user.click(screen.getByRole('button', { name: 'Salvar som' }));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'settings.updateReminderSound',
      payload: { soundId: 'bright-chime', expectedRevision: 1 },
    });
  });

  it('shows preview failure next to the affected option', async () => {
    const user = userEvent.setup();
    const preview = {
      preview: vi.fn(async () => Promise.reject(new Error('Dispositivo indisponível'))),
      stop: vi.fn(),
    };
    renderPicker(preview);
    const option = screen.getByTestId('sound-gentle-bell');
    await user.click(within(option).getByRole('button', { name: /Ouvir/ }));
    expect(within(option).getByRole('alert')).toHaveTextContent('Não foi possível reproduzir');
  });
});
