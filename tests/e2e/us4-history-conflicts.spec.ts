import { test, expect } from './extension-fixture';
import { seedProject, seedRecord, send } from './helpers';
test('rejects stale writes from a second extension window', async ({
  page,
  context,
  extensionId,
}) => {
  const project = await seedProject(page);
  const record = await seedRecord(page, project.id);
  const second = await context.newPage();
  await second.goto(`chrome-extension://${extensionId}/index.html`);
  const payload = {
    projectId: project.id,
    localDate: record.localDate,
    startMinute: 0,
    endMinute: 120,
    details: 'Primeira janela',
  };
  await send(page, {
    type: 'record.update',
    payload: { id: record.id, expectedRevision: 1, record: payload },
  });
  const response = await second.evaluate((request) => chrome.runtime.sendMessage(request), {
    type: 'record.update',
    payload: {
      id: record.id,
      expectedRevision: 1,
      record: { ...payload, details: 'Segunda janela' },
    },
  });
  expect(response).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  await second.close();
});
