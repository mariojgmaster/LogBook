import { test, expect } from './extension-fixture';
test('validates multiple reminder times and snooze public limits', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Configurações' }).click();
  await expect(page.getByText('Lembretes', { exact: true })).toBeVisible();
  const snooze = page.getByLabel('Adiamento padrão (minutos)');
  await snooze.fill('2881');
  await page.getByRole('button', { name: 'Salvar lembretes' }).click();
  await expect(page.getByText('Use de 1 minuto a 48 horas.')).toBeVisible();
  await snooze.fill('2880');
  await expect(snooze).toHaveValue('2880');
});
