import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  holidayFileSchema,
  holidayManifestSchema,
  municipalitiesSchema,
} from '@/infrastructure/holidays/catalog-schema';
const base = 'public/data/holidays';
describe('holiday dataset', () => {
  const manifest = holidayManifestSchema.parse(
    JSON.parse(readFileSync(`${base}/manifest.json`, 'utf8')),
  );
  it('covers currentYear-5 through currentYear+2 and all UFs', () => {
    expect(manifest.minYear).toBe(new Date().getFullYear() - 5);
    expect(manifest.maxYear).toBe(new Date().getFullYear() + 2);
    expect(new Set(manifest.states.map((state) => state.code)).size).toBe(27);
  });
  it('validates every year and checksum', () => {
    for (let year = manifest.minYear; year <= manifest.maxYear; year += 1) {
      const name = `holidays-${year}.json`;
      const raw = readFileSync(`${base}/${name}`, 'utf8');
      expect(createHash('sha256').update(raw).digest('hex')).toBe(manifest.files[name]);
      expect(holidayFileSchema.parse(JSON.parse(raw)).year).toBe(year);
    }
  });
  it('bundles official municipality codes', () =>
    expect(
      municipalitiesSchema.parse(JSON.parse(readFileSync(`${base}/municipalities.json`, 'utf8')))
        .municipalities.length,
    ).toBeGreaterThan(5500));
});
