// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/domain/errors/app-error';
import { BrowserClipboardAdapter } from '@/infrastructure/browser/clipboard-adapter';

const setActivation = (isActive: boolean) => {
  Object.defineProperty(navigator, 'userActivation', {
    configurable: true,
    value: { isActive, hasBeenActive: isActive },
  });
};

describe('BrowserClipboardAdapter', () => {
  beforeEach(() => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    setActivation(true);
  });

  it('writes only the requested text while focused and transiently activated', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    await new BrowserClipboardAdapter().writeText('descrição exata');
    expect(writeText).toHaveBeenCalledWith('descrição exata');
    expect(navigator.clipboard).not.toHaveProperty('readText');
  });

  it.each([
    ['documento sem foco', false, true],
    ['gesto ausente', true, false],
  ])('rejects %s without touching the clipboard', async (_, focused, activated) => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(focused);
    setActivation(activated);
    const writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    await expect(new BrowserClipboardAdapter().writeText('texto')).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
    } satisfies Partial<AppError>);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('maps unavailable or rejected clipboard writes to a controlled error', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    await expect(new BrowserClipboardAdapter().writeText('texto')).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
    });

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new DOMException('denied')) },
    });
    await expect(new BrowserClipboardAdapter().writeText('texto')).rejects.toMatchObject({
      code: 'PERMISSION_DENIED',
    });
    expect(document).not.toHaveProperty('execCommand');
  });
});
