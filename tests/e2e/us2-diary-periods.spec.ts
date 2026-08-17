import { test, expect } from './extension-fixture';
import { seedProject, seedRecord } from './helpers';
test('switches day, fortnight and month while preserving filters', async ({ page }) => {
  const project = await seedProject(page);
  await seedRecord(page, project.id, 'Busca exclusiva');
  await page.reload();
  await expect(page.getByText('Busca exclusiva')).toBeVisible();
  await page.getByLabel('Buscar nos detalhes').fill('busca');
  await page.getByText('Quinzena', { exact: true }).click();
  await expect(page.getByRole('radiogroup', { name: 'Período' })).toContainText('Quinzena');
  await page.getByText('Mês', { exact: true }).click();
  await expect(page.getByLabel('Calendário mensal')).toBeVisible();
  await page.getByText('Dia', { exact: true }).click();
  await expect(page.getByLabel('Buscar nos detalhes')).toHaveValue('busca');
});
