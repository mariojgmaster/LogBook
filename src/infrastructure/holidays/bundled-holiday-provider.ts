import type { HolidayProvider } from '@/application/ports/repositories';
import type { Region } from '@/domain/entities/user-settings';
import type { HolidayOccurrence } from '@/domain/entities/holiday';
import { AppError } from '@/domain/errors/app-error';
import {
  holidayFileSchema,
  holidayManifestSchema,
  type HolidayEntry,
  type HolidayManifest,
} from './catalog-schema';
import { getDatabase } from '@/infrastructure/persistence/indexeddb/database';

export class BundledHolidayProvider implements HolidayProvider {
  private manifest?: HolidayManifest;
  private region?: Region;
  private entries = new Map<string, HolidayEntry[]>();

  async initialize(): Promise<void> {
    if (this.manifest) return;
    try {
      const manifest = holidayManifestSchema.parse(await this.readJson('manifest.json'));
      const files = await Promise.all(
        Array.from({ length: manifest.maxYear - manifest.minYear + 1 }, (_, index) =>
          this.readJson(`holidays-${manifest.minYear + index}.json`).then((value) =>
            holidayFileSchema.parse(value),
          ),
        ),
      );
      const entries = new Map<string, HolidayEntry[]>();
      for (const file of files)
        for (const entry of file.entries) {
          const current = entries.get(entry.date) ?? [];
          current.push(entry);
          entries.set(entry.date, current);
        }
      await this.replacePersistedCatalog(manifest, entries);
      this.entries = entries;
      this.manifest = manifest;
    } catch {
      throw new AppError('HOLIDAY_DATA_UNAVAILABLE');
    }
  }

  isHoliday(localDate: string): boolean | undefined {
    const year = Number(localDate.slice(0, 4));
    if (!this.manifest || year < this.manifest.minYear || year > this.manifest.maxYear)
      return undefined;
    return (this.entries.get(localDate) ?? []).some((entry) => this.isApplicable(entry));
  }

  listApplicable(start: string, end: string): HolidayOccurrence[] | undefined {
    const startYear = Number(start.slice(0, 4));
    const endYear = Number(end.slice(0, 4));
    if (!this.manifest || startYear < this.manifest.minYear || endYear > this.manifest.maxYear) {
      return undefined;
    }
    const seen = new Set<string>();
    const holidays: HolidayOccurrence[] = [];
    for (const [date, entries] of this.entries) {
      if (date < start || date > end) continue;
      for (const entry of entries) {
        if (!this.isApplicable(entry)) continue;
        const key = `${entry.date}|${entry.scope}|${entry.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        holidays.push({ date: entry.date, name: entry.name, scope: entry.scope });
      }
    }
    return holidays.sort(
      (left, right) =>
        left.date.localeCompare(right.date) || left.name.localeCompare(right.name, 'pt-BR'),
    );
  }

  getCoverage() {
    return this.manifest
      ? {
          minYear: this.manifest.minYear,
          maxYear: this.manifest.maxYear,
          revision: this.manifest.revision,
        }
      : undefined;
  }
  setRegion(region: Region): Promise<void> {
    this.region = { ...region };
    return Promise.resolve();
  }

  private isApplicable(entry: HolidayEntry): boolean {
    return (
      entry.scope === 'national' ||
      (entry.scope === 'state' && entry.uf === this.region?.uf) ||
      (entry.scope === 'municipal' && entry.municipalityCode === this.region?.municipalityCode)
    );
  }

  private async readJson(file: string): Promise<unknown> {
    const url = chrome.runtime.getURL(`data/holidays/${file}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error('catalog unavailable');
    return response.json() as Promise<unknown>;
  }

  private async replacePersistedCatalog(
    manifest: HolidayManifest,
    entries: Map<string, HolidayEntry[]>,
  ): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(['holidays', 'metadata'], 'readwrite');
    await transaction.objectStore('holidays').clear();
    for (const [date, dateEntries] of entries)
      for (const entry of dateEntries) {
        const id = [
          date,
          entry.scope,
          entry.uf ?? '',
          entry.municipalityCode ?? '',
          entry.name,
        ].join('|');
        await transaction.objectStore('holidays').put({ id, ...entry });
      }
    await transaction
      .objectStore('metadata')
      .put({ key: 'holidayCatalogRevision', value: manifest.revision });
    await transaction.done;
  }
}
