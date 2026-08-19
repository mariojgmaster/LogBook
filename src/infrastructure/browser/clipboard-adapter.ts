import type { ClipboardPort } from '@/application/ports/platform';
import { AppError } from '@/domain/errors/app-error';

export class BrowserClipboardAdapter implements ClipboardPort {
  async writeText(value: string): Promise<void> {
    const activation = (
      navigator as Navigator & {
        userActivation?: { isActive: boolean };
      }
    ).userActivation;
    if (!document.hasFocus() || activation?.isActive !== true || !navigator.clipboard?.writeText) {
      throw new AppError('PERMISSION_DENIED');
    }
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      throw new AppError('PERMISSION_DENIED');
    }
  }
}

export const browserClipboard = new BrowserClipboardAdapter();
