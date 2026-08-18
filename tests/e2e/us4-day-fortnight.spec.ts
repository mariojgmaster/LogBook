import { test, expect } from './extension-fixture';
import { seedProject, seedRecord } from './helpers';

test('copies a day description without opening details and keeps fortnight empty days minimal', async ({
  page,
}) => {
  const project = await seedProject(page, 'Projeto Clipboard');
  await seedRecord(page, project.id, 'Descrição copiada no E2E');
  await page.reload();
  await page.evaluate(() => {
    Object.assign(window, { __copiedDescription: '' });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          Object.assign(window, { __copiedDescription: value });
        },
      },
    });
  });

  await page.getByRole('button', { name: `Copiar descrição de ${project.name}` }).click();
  await expect(page.getByRole('status')).toContainText('Descrição copiada');
  expect(await page.evaluate(() => Reflect.get(window, '__copiedDescription'))).toBe(
    'Descrição copiada no E2E',
  );
  await expect(page.getByLabel('Detalhes do registro')).toBeHidden();

  await page.getByText('Quinzena', { exact: true }).click();
  await expect(page.getByText('Sem registros').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar atividade' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Novo registro/ }).first()).toBeVisible();
});
