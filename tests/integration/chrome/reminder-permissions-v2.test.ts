import { describe, expect, it, vi } from 'vitest';
import { ChromeOptionalPermissionAdapter } from '@/infrastructure/chrome/permission-adapter';

describe('reminder optional permissions', () => {
  it('requests the alarms permission used by scheduling', async () => {
    const adapter = new ChromeOptionalPermissionAdapter();
    (chrome.permissions.contains as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (chrome.permissions.request as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    expect(await adapter.ensure(['alarms'])).toBe(true);
    expect(chrome.permissions.request).toHaveBeenCalledWith({ permissions: ['alarms'] });
  });

  it('reports alarm denial without treating reminders as active', async () => {
    const adapter = new ChromeOptionalPermissionAdapter();
    (chrome.permissions.contains as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (chrome.permissions.request as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    expect(await adapter.ensure(['alarms'])).toBe(false);
  });

  it('detects revocation and can reactivate after a later complete grant', async () => {
    const adapter = new ChromeOptionalPermissionAdapter();
    (chrome.permissions.contains as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    (chrome.permissions.request as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    expect(await adapter.contains(['alarms'])).toBe(false);
    expect(await adapter.ensure(['alarms'])).toBe(true);
  });
});
