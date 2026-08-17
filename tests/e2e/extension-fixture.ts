import path from 'node:path';
import { test as base, chromium, expect, type BrowserContext } from '@playwright/test';

interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
}

export const test = base.extend<ExtensionFixtures>({
  context: async ({ browserName }, use, testInfo) => {
    if (browserName !== 'chromium') throw new Error('Extension E2E requires Chromium.');
    const extensionPath = path.resolve('dist');
    const context = await chromium.launchPersistentContext(testInfo.outputPath('profile'), {
      channel: 'chromium',
      headless: true,
      serviceWorkers: 'allow',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker');
    await use(new URL(worker.url()).host);
  },
  page: async ({ context, extensionId }, use) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/index.html`);
    await use(page);
    await page.close();
  },
});

export { expect };
