import { test, expect } from './extension-fixture';
test('surfaces malformed local settings without exposing raw data', async ({ page }) => {
  await page.evaluate(() =>
    chrome.storage.local.set({
      userSettings: { version: 1, value: { region: { uf: 'INVALID' }, revision: -1 } },
    }),
  );
  await page.getByRole('menuitem', { name: 'Configurações' }).click();
  await expect(page.getByText('Não foi possível carregar')).toBeVisible();
  await expect(page.getByText(/stack|INVALID/i)).toHaveCount(0);
});
