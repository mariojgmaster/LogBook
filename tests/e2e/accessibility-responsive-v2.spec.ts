import { test, expect } from './extension-fixture';
import { seedProject, seedRecord } from './helpers';

for (const width of [320, 479, 480, 800]) {
  test(`keeps keyboard, 200% text zoom and adaptive month usable at ${width}px`, async ({
    page,
  }) => {
    const project = await seedProject(page, `Projeto acessível ${width}`);
    await seedRecord(page, project.id, `Descrição acessível ${width}`);
    await page.setViewportSize({ width, height: 720 });
    await page.emulateMedia({
      colorScheme: 'dark',
      reducedMotion: 'reduce',
      forcedColors: 'active',
    });
    await page.reload();
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    const copy = page.getByRole('button', { name: `Copiar descrição de ${project.name}` });
    const copyBox = await copy.boundingBox();
    expect(copyBox?.width).toBeGreaterThanOrEqual(44);
    expect(copyBox?.height).toBeGreaterThanOrEqual(44);

    if (width <= 720)
      await expect(page.getByRole('button', { name: /Abrir navega/ })).toBeVisible();
    else await expect(page.getByRole('menuitem', { name: /Di.rio/ })).toBeVisible();

    await page.getByRole('radiogroup').first().locator('label').nth(2).click();
    await expect(page.locator('.month-calendar')).toHaveAttribute(
      'data-layout',
      width === 800 ? 'wide' : 'narrow',
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator('.month-record')
        .first()
        .evaluate((element) =>
          getComputedStyle(element).outlineStyle === 'none'
            ? getComputedStyle(element).borderStyle
            : getComputedStyle(element).outlineStyle,
        ),
    ).not.toBe('none');
  });
}
