import { test, expect } from './extension-fixture';
test('shows regional catalog coverage and requires confirmation', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Configurações' }).click();
  await expect(page.getByText(/Cobertura de 2021 a 2028/)).toBeVisible();
  const state = page.getByLabel('Estado (UF)');
  await state.fill('SP');
  await state.press('Enter');
  await page.getByRole('button', { name: 'Salvar região' }).click();
  await expect(page.getByText('Confirmar troca de região')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByText('Confirmar troca de região')).not.toBeVisible();
});
