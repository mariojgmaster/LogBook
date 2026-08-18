import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { BundledHolidayProvider } from '@/infrastructure/holidays/bundled-holiday-provider';
import { getDatabase } from '@/infrastructure/persistence/indexeddb/database';
describe('bundled holiday catalog', () => {
  it('looks up national and regional dates and reports coverage gaps', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const file = url.split('/').at(-1)!;
        return {
          ok: true,
          json: async () => JSON.parse(readFileSync(`public/data/holidays/${file}`, 'utf8')),
        } as Response;
      }),
    );
    const provider = new BundledHolidayProvider();
    await provider.initialize();
    await provider.setRegion({ uf: 'SP' });
    expect(provider.isHoliday('2026-01-01')).toBe(true);
    expect(provider.isHoliday('2026-07-09')).toBe(true);
    expect(provider.listApplicable('2026-07-01', '2026-07-31')).toEqual([
      {
        date: '2026-07-09',
        name: 'Revolução Constitucionalista',
        scope: 'state',
      },
    ]);
    expect(provider.isHoliday('2030-01-01')).toBeUndefined();
    expect(provider.listApplicable('2030-01-01', '2030-01-31')).toBeUndefined();
    expect(provider.getCoverage()).toMatchObject({ minYear: 2021, maxYear: 2028 });
    const database = await getDatabase();
    expect(await database.count('holidays')).toBeGreaterThan(0);
    expect(await database.get('metadata', 'holidayCatalogRevision')).toBeDefined();
    vi.unstubAllGlobals();
  });

  it('applies municipality scope and preserves the prior transaction on load failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const file = url.split('/').at(-1)!;
        const value = JSON.parse(readFileSync(`public/data/holidays/${file}`, 'utf8'));
        if (file === 'holidays-2026.json') {
          const municipal = {
            date: '2026-08-17',
            name: 'Feriado municipal de teste',
            scope: 'municipal',
            municipalityCode: '3550308',
          };
          value.entries.push(municipal, municipal);
        }
        return { ok: true, json: async () => value } as Response;
      }),
    );
    const provider = new BundledHolidayProvider();
    await provider.initialize();
    await provider.setRegion({ uf: 'SP', municipalityCode: '3550308' });
    expect(provider.isHoliday('2026-08-17')).toBe(true);
    expect(provider.listApplicable('2026-08-01', '2026-08-31')).toContainEqual({
      date: '2026-08-17',
      name: 'Feriado municipal de teste',
      scope: 'municipal',
    });
    expect(
      provider
        .listApplicable('2026-08-01', '2026-08-31')
        ?.filter((holiday) => holiday.name === 'Feriado municipal de teste'),
    ).toHaveLength(1);
    const database = await getDatabase();
    expect(
      (await database.getAllFromIndex('holidays', 'by-date', '2026-08-17')).filter(
        (entry) => entry.scope === 'municipal',
      ),
    ).toHaveLength(1);
    const before = await database.count('holidays');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false }) as Response),
    );
    await expect(new BundledHolidayProvider().initialize()).rejects.toMatchObject({
      code: 'HOLIDAY_DATA_UNAVAILABLE',
    });
    expect(await database.count('holidays')).toBe(before);
    vi.unstubAllGlobals();
  });
});
