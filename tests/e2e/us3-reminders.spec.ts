import { test, expect } from './extension-fixture';

test('validates multiple reminder times and default snooze in HH:mm', async ({ page }) => {
  await page.getByRole('menuitem', { name: 'Configurações' }).click();
  await expect(page.getByText('Lembretes', { exact: true })).toBeVisible();
  const snooze = page.getByLabel('Adiamento padrão');
  await snooze.fill('48:01');
  await page.getByRole('button', { name: 'Salvar lembretes' }).click();
  await expect(page.getByText(/Informe o adiamento no formato HH:mm/)).toBeVisible();
  await snooze.fill('48:00');
  await expect(snooze).toHaveValue('48:00');
});

test('opens the dedicated reminder popup when a configured alarm fires', async ({
  page,
  context,
}) => {
  await page.getByRole('menuitem', { name: 'Configurações' }).click();
  await page.getByLabel('Ativar lembretes').click();
  await page.getByRole('button', { name: 'Salvar lembretes' }).click();
  await expect(page.getByText(/Próximo lembrete:/)).toBeVisible();

  const alarmName = await page.evaluate(async () => {
    const alarm = (await chrome.alarms.getAll()).find((item) =>
      item.name.startsWith('logbook:reminder:'),
    );
    if (!alarm) throw new Error('Nenhum alarme foi agendado.');
    return alarm.name;
  });
  const popupPromise = context.waitForEvent('page');
  await page.evaluate(({ name, when }) => chrome.alarms.create(name, { when }), {
    name: alarmName,
    when: Date.now() + 250,
  });
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup).toHaveURL(/reminder\.html\?reminder=1&targetLocalDate=/);
  await expect(popup.getByRole('heading', { name: 'Hora de atualizar o diário' })).toBeVisible();
  await popup.close();
});
