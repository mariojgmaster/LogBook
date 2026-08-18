import { test, expect } from './extension-fixture';
import { seedProject, seedRecord } from './helpers';

test('shows durations in decimal hours across diary, details, settings and reminder', async ({
  page,
  context,
  extensionId,
}) => {
  const project = await seedProject(page, 'Projeto Horas');
  await seedRecord(page, project.id, 'Duas horas', 120);
  await seedRecord(page, project.id, 'Meia hora', 30);
  await page.reload();
  await expect(page.getByText('2 h', { exact: true })).toBeVisible();
  await expect(page.getByText('0,5 h', { exact: true })).toBeVisible();
  await page.getByText('Meia hora').click();
  await expect(
    page.getByLabel('Detalhes do registro').getByText('0,5 h', { exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Detalhes do registro')).toBeHidden();

  await page.getByRole('menuitem', { name: 'Configurações' }).click();
  await expect(page.getByLabel('Adiamento padrão')).toHaveValue('00:10');
  await expect(page.locator('body')).not.toContainText(/\bmin(?:uto|utos)?\b/i);

  const reminder = await context.newPage();
  await reminder.goto(
    `chrome-extension://${extensionId}/reminder.html?targetLocalDate=2026-08-17&slotId=morning`,
  );
  const snoozeWindowPromise = context.waitForEvent('page', {
    predicate: (candidate) => candidate.url().includes('snooze.html'),
  });
  await reminder.getByRole('button', { name: 'Adiar lembrete' }).hover();
  const snoozeWindow = await snoozeWindowPromise;
  await expect(snoozeWindow.getByLabel('Personalizado')).toHaveValue('00:10');
  await expect(snoozeWindow.locator('body')).not.toContainText(/\bmin(?:uto|utos)?\b/i);
  await snoozeWindow.close();
  await reminder.close();
});
