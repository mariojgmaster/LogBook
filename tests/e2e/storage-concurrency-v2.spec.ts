import { test, expect } from './extension-fixture';
import { seedProject, seedRecord, send } from './helpers';

test('keeps record updates last-write-wins and all destructive operations CAS-protected', async ({
  page,
  context,
  extensionId,
}) => {
  const project = await seedProject(page, 'Projeto concorrente');
  const record = await seedRecord(page, project.id, 'Versão inicial');
  const second = await context.newPage();
  await second.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  const payload = {
    projectId: project.id,
    localDate: record.localDate,
    startMinute: 0,
    durationMinutes: 60,
  };
  await send(page, {
    type: 'record.update',
    payload: { id: record.id, record: { ...payload, details: 'Janela A' } },
  });
  await send(second, {
    type: 'record.update',
    payload: { id: record.id, record: { ...payload, details: 'Janela B' } },
  });
  const listed = await send<{ items: Array<{ id: string; details: string; revision: number }> }>(
    page,
    {
      type: 'record.listPeriod',
      payload: { start: record.localDate, end: record.localDate, mode: 'day' },
    },
  );
  expect(listed.items.find((item) => item.id === record.id)).toMatchObject({
    details: 'Janela B',
    revision: 3,
  });
  const staleDelete = await page.evaluate((request) => chrome.runtime.sendMessage(request), {
    type: 'record.delete',
    payload: { id: record.id, expectedRevision: 1 },
  });
  expect(staleDelete).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });

  await send(page, {
    type: 'project.archive',
    payload: { id: project.id, expectedRevision: project.revision },
  });
  const staleProject = await page.evaluate((request) => chrome.runtime.sendMessage(request), {
    type: 'project.restore',
    payload: { id: project.id, expectedRevision: project.revision },
  });
  expect(staleProject).toMatchObject({ ok: false, error: { code: 'CONFLICT' } });
  await second.close();
});

test('reconstructs schema v2 and persisted preferences after service-worker restart', async ({
  page,
  context,
}) => {
  const settings = await send<{ user: { revision: number } }>(page, {
    type: 'settings.get',
    payload: {},
  });
  await send(page, {
    type: 'settings.updateMonthView',
    payload: { mode: 'eventRange', expectedRevision: settings.user.revision },
  });
  const [worker] = context.serviceWorkers();
  await worker?.evaluate(() => {
    const closeWorker = Reflect.get(globalThis, 'close') as (() => void) | undefined;
    closeWorker?.();
  });
  await page.reload();
  const restored = await send<{ user: { monthViewMode: string } }>(page, {
    type: 'settings.get',
    payload: {},
  });
  expect(restored.user.monthViewMode).toBe('eventRange');
  expect(
    await page.evaluate(
      () =>
        new Promise<number>((resolve, reject) => {
          const request = indexedDB.open('logbook');
          request.onsuccess = () => {
            const version = request.result.version;
            request.result.close();
            resolve(version);
          };
          request.onerror = () => reject(request.error ?? new Error('IndexedDB unavailable'));
        }),
    ),
  ).toBe(2);
});
