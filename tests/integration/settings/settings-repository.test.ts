import { describe, expect, it } from 'vitest';
import { ChromeSettingsRepository } from '@/infrastructure/persistence/chrome-storage/settings-repository';
describe('settings repository', () => {
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
});
