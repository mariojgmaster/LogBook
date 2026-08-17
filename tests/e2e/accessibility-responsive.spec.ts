import { test, expect } from './extension-fixture';

for (const viewport of [
  { width: 360, height: 600 },
  { width: 640, height: 700 },
  { width: 960, height: 720 },
  { width: 1440, height: 900 },
]) {
  test(`reflows without page overflow at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.reload();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    if (viewport.width <= 720) await expect(page.getByLabel('Abrir navegação')).toBeVisible();
    else await expect(page.getByRole('menuitem', { name: 'Diário' })).toBeVisible();
  });
}
