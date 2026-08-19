import { test, expect } from './extension-fixture';

test('keeps the application in the side-panel shell and Ant overlays in the same page', async ({
  page,
  context,
}) => {
  await expect(page).toHaveURL(/sidepanel\.html/);
  await expect(page.getByRole('menuitem', { name: 'Diário' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Projetos' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Configurações' })).toBeVisible();
  const pageCount = context.pages().length;
  await page
    .getByRole('button', { name: /Novo registro/ })
    .first()
    .click();
  await expect(page.getByRole('dialog', { name: 'Novo registro' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByRole('button', { name: 'Próximo período' }).click();
  await expect(page.getByRole('dialog', { name: 'Novo registro' })).toBeHidden();
  await page.getByRole('menuitem', { name: 'Configurações' }).click();
  await page.getByRole('menuitem', { name: 'Diário' }).click();
  await expect(page.getByRole('dialog', { name: 'Novo registro' })).toBeHidden();
  expect(context.pages()).toHaveLength(pageCount);
});

test('uses the dedicated popup shell only for a valid reminder occurrence', async ({
  context,
  extensionId,
}) => {
  const reminder = await context.newPage();
  await reminder.goto(
    `chrome-extension://${extensionId}/reminder.html?targetLocalDate=2026-08-17&slotId=morning`,
  );
  await expect(reminder.getByRole('heading', { name: 'Hora de atualizar o diário' })).toBeVisible();
  await expect(reminder.getByRole('button', { name: 'Adiar lembrete' })).toBeVisible();
  const snoozeWindowPromise = context.waitForEvent('page', {
    predicate: (candidate) => candidate.url().includes('snooze.html'),
  });
  await reminder.getByRole('button', { name: 'Adiar lembrete' }).hover();
  const snoozeWindow = await snoozeWindowPromise;
  await snoozeWindow.setViewportSize({ width: 500, height: 351 });
  await expect(snoozeWindow.getByLabel('Opções de adiamento')).toBeVisible();
  await expect(snoozeWindow.getByRole('button', { name: /Adiar por 00:10, padrão/ })).toBeVisible();
  const snoozeBounds = await snoozeWindow.locator('body').evaluate((body) => ({
    clientHeight: body.clientHeight,
    scrollHeight: body.scrollHeight,
  }));
  expect(snoozeBounds.scrollHeight).toBeLessThanOrEqual(snoozeBounds.clientHeight);
  await expect(reminder.getByRole('menuitem', { name: 'Projetos' })).toHaveCount(0);
  await snoozeWindow.close();
  await reminder.close();
});
