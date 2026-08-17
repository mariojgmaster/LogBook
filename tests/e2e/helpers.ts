import type { Page } from '@playwright/test';

export async function send<T>(page: Page, request: unknown): Promise<T> {
  const result = await page.evaluate(async (value) => {
    const response = await chrome.runtime.sendMessage(value);
    if (!response.ok) throw new Error(JSON.stringify(response.error));
    return response.data;
  }, request);
  return result as T;
}

export async function seedProject(page: Page, name = 'Projeto E2E') {
  return send<{ id: string; revision: number; name: string }>(page, {
    type: 'project.create',
    payload: { name },
  });
}

export async function seedRecord(page: Page, projectId: string, details = 'Atividade E2E') {
  const localDate = await page.evaluate(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  return send<{ id: string; revision: number; localDate: string }>(page, {
    type: 'record.create',
    payload: { projectId, localDate, startMinute: 0, endMinute: 60, details },
  });
}
