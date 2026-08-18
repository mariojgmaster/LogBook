import { describe, expect, it, vi } from 'vitest';
import { ChromeSettingsRepository } from '@/infrastructure/persistence/chrome-storage/settings-repository';
describe('settings repository', () => {
  it('returns deterministic v2 defaults', async () => {
    const settings = await new ChromeSettingsRepository().getUserSettings();
    expect(settings).toMatchObject({
      monthViewMode: 'notice',
      reminderSoundId: 'gentle-bell',
      revision: 1,
    });
  });

  it('migrates a legacy envelope and recovers unknown v2 preferences', async () => {
    await chrome.storage.local.set({
      userSettings: {
        version: 1,
        value: {
          revision: 3,
          updatedAt: '2026-08-17T12:00:00.000Z',
          monthViewMode: 'unknown',
          reminderSoundId: 'missing',
        },
      },
    });
    const settings = await new ChromeSettingsRepository().getUserSettings();
    expect(settings).toMatchObject({
      monthViewMode: 'notice',
      reminderSoundId: 'gentle-bell',
      revision: 3,
    });
    const stored = await chrome.storage.local.get(['settings.current', 'userSettings']);
    expect(stored['settings.current']).toMatchObject({ version: 2, value: settings });
    expect(stored.userSettings).toBeUndefined();
  });

  it('saves by revision and rejects stale writes', async () => {
    const repository = new ChromeSettingsRepository();
    const current = await repository.getUserSettings();
    await repository.saveUserSettings(
      { region: { uf: 'SP' }, revision: 2, updatedAt: new Date().toISOString() },
      current.revision,
    );
    await expect(
      repository.saveUserSettings(
        { region: { uf: 'RJ' }, revision: 2, updatedAt: new Date().toISOString() },
        current.revision,
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('preserves the confirmed envelope when a write fails', async () => {
    const repository = new ChromeSettingsRepository();
    const current = await repository.getUserSettings();
    await chrome.storage.local.set({ 'settings.current': { version: 2, value: current } });
    vi.spyOn(chrome.storage.local, 'set').mockRejectedValueOnce(
      new DOMException('quota', 'QuotaExceededError'),
    );
    await expect(
      repository.saveUserSettings(
        { ...current, monthViewMode: 'eventRange', revision: 2 },
        current.revision,
      ),
    ).rejects.toMatchObject({ code: 'QUOTA_EXCEEDED' });
    expect((await chrome.storage.local.get('settings.current'))['settings.current']).toEqual({
      version: 2,
      value: current,
    });
  });
});
