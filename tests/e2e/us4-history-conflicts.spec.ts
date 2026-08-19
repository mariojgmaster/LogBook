import { test, expect } from './extension-fixture';
import { seedProject, seedRecord, send } from './helpers';
test('applies last-write-wins from a second extension surface', async ({
  page,
  context,
  extensionId,
}) => {
  const project = await seedProject(page);
  const record = await seedRecord(page, project.id);
  const second = await context.newPage();
  await second.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  const payload = {
    projectId: project.id,
    localDate: record.localDate,
    startMinute: 0,
    durationMinutes: 120,
    details: 'Primeira janela',
  };
  await send(page, {
    type: 'record.update',
    payload: { id: record.id, record: payload },
  });
  const response = await second.evaluate((request) => chrome.runtime.sendMessage(request), {
    type: 'record.update',
    payload: {
      id: record.id,
      record: { ...payload, details: 'Segunda janela' },
    },
  });
  expect(response).toMatchObject({ ok: true, data: { details: 'Segunda janela', revision: 3 } });
  await second.close();
});
