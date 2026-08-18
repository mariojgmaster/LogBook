import { test, expect } from './extension-fixture';
import { seedProject, send } from './helpers';

test('keeps month density stable at 1, 4 and 20 items with responsive Notice/Event Range', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const project = await seedProject(page, 'Projeto Calendário');
  const localDate = await page.evaluate(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const addUntil = async (count: number, current: number) => {
    for (let index = current; index < count; index += 1) {
      await send(page, {
        type: 'record.create',
        payload: {
          projectId: project.id,
          localDate,
          startMinute: 0,
          durationMinutes: 5,
          details: `Atividade mensal ${index + 1}`,
        },
      });
    }
  };
  const openMonth = async () => {
    await page.reload();
    await page.getByRole('radiogroup').first().locator('label').nth(2).click();
    await expect(page.getByLabel('Notice Calendar mensal')).toBeVisible();
  };

  await addUntil(1, 0);
  await openMonth();
  await expect(page.getByLabel(/1 registro$/)).toBeVisible();
  const noticeRecord = page.locator('.notice-calendar .month-record').first();
  await noticeRecord.hover();
  let tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('Projeto');
  await expect(tooltip).toContainText('Período');
  await expect(tooltip).toContainText('Descrição');
  await expect(tooltip).toContainText('Atividade mensal 1');
  const oneItemHeight = await page
    .getByLabel(/1 registro$/)
    .evaluate((element) => element.closest('.month-day')?.getBoundingClientRect().height);

  await addUntil(4, 1);
  await openMonth();
  await expect(page.getByLabel(/4 registros$/)).toBeVisible();
  expect(
    await page
      .getByLabel(/4 registros$/)
      .evaluate((element) => element.closest('.month-day')?.getBoundingClientRect().height),
  ).toBe(oneItemHeight);

  await addUntil(20, 4);
  await openMonth();
  const overflow = page.getByLabel(/20 registros$/);
  await expect(overflow).toBeVisible();
  expect(await overflow.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  );
  await overflow.focus();
  await page.keyboard.press('PageDown');
  await expect.poll(() => overflow.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await overflow.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const pageScrollBefore = await page.evaluate(() => scrollY);
  await overflow.hover();
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(pageScrollBefore);

  await page.setViewportSize({ width: 479, height: 720 });
  await expect(page.locator('.month-calendar')).toHaveAttribute('data-layout', 'narrow');
  await expect(page.locator('.notice-calendar--narrow .month-day')).toHaveCount(1);

  const settings = await send<{ user: { revision: number } }>(page, {
    type: 'settings.get',
    payload: {},
  });
  await send(page, {
    type: 'settings.updateMonthView',
    payload: { mode: 'eventRange', expectedRevision: settings.user.revision },
  });
  await expect(page.getByLabel('Event Range mensal')).toBeVisible();
  await expect(page.locator('.event-range-agenda [data-record-id]')).toHaveCount(20);

  await page.setViewportSize({ width: 800, height: 720 });
  await page.reload();
  await page.getByRole('radiogroup').first().locator('label').nth(2).click();
  await expect(page.getByLabel('Event Range mensal')).toBeVisible();
  await expect(page.locator('.month-calendar')).toHaveAttribute('data-layout', 'wide');
  const rangeRecords = page.locator('.event-range-items [data-record-id]');
  await expect(rangeRecords).toHaveCount(20);
  const rangeTops = await rangeRecords.evaluateAll((items) =>
    items.map((item) => Math.round(item.getBoundingClientRect().top)),
  );
  expect(new Set(rangeTops).size).toBe(20);
  await rangeRecords.first().hover();
  tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('Projeto Calendário');
  await expect(tooltip).toContainText('Período');
  await expect(tooltip).toContainText('Atividade mensal 1');

  const monthStart = `${localDate.slice(0, 8)}01`;
  const monthStartLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${monthStart}T12:00:00Z`));
  await page.getByRole('button', { name: `Novo registro em ${monthStartLabel}` }).click();
  const form = page.getByRole('dialog', { name: 'Novo registro' });
  await expect(form).toBeVisible();
  await expect(form.getByLabel('Data', { exact: true })).toHaveValue(
    `${monthStart.slice(8, 10)}/${monthStart.slice(5, 7)}/${monthStart.slice(0, 4)}`,
  );
});
