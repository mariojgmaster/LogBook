import { openDB } from 'idb';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DATABASE_NAME,
  getDatabase,
  resetDatabaseConnection,
} from '@/infrastructure/persistence/indexeddb/database';
import { buildV1Project, buildV1Record } from '../../fixtures/storage-v2';

const openLegacyDatabase = async (seed?: (db: IDBDatabase) => void) => {
  const database = await openDB(DATABASE_NAME, 1, {
    upgrade(db) {
      const projects = db.createObjectStore('projects', { keyPath: 'id' });
      projects.createIndex('by-status', 'status');
      projects.createIndex('by-normalized-name', 'normalizedName');
      const records = db.createObjectStore('records', { keyPath: 'id' });
      records.createIndex('by-date', 'localDate');
      records.createIndex('by-project', 'projectId');
      records.createIndex('by-date-project', ['localDate', 'projectId']);
      const holidays = db.createObjectStore('holidays', { keyPath: 'id' });
      holidays.createIndex('by-date', 'date');
      holidays.createIndex('by-scope', 'scope');
      db.createObjectStore('metadata', { keyPath: 'key' });
      seed?.(db as unknown as IDBDatabase);
    },
  });
  return database;
};

afterEach(() => resetDatabaseConnection());

describe('IndexedDB migrations', () => {
  it('creates all v2 stores, indexes and metadata for an empty database', async () => {
    const db = await getDatabase();
    expect([...db.objectStoreNames]).toEqual([
      'formDrafts',
      'holidays',
      'metadata',
      'projects',
      'records',
    ]);
    expect(await db.get('metadata', 'schemaVersion')).toEqual({ key: 'schemaVersion', value: 2 });
  });

  it('atomically migrates projects and typical/24:00 records without changing duration', async () => {
    const legacy = await openLegacyDatabase();
    await legacy.put('projects', buildV1Project());
    await legacy.put('records', buildV1Record());
    await legacy.put(
      'records',
      buildV1Record({
        id: crypto.randomUUID(),
        startMinute: 1380,
        endMinute: 1440,
        durationMinutes: 60,
      }),
    );
    legacy.close();
    resetDatabaseConnection();

    const db = await getDatabase();
    expect((await db.get('projects', buildV1Project().id))?.colorSlot).toBe(0);
    const records = await db.getAll('records');
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ endLocalDate: '2026-08-16', endMinute: 600 }),
        expect.objectContaining({ endLocalDate: '2026-08-17', endMinute: 0 }),
      ]),
    );
    expect(records.map((record) => record.durationMinutes).sort()).toEqual([60, 60]);
  });

  it('aborts the entire upgrade when legacy data is inconsistent', async () => {
    const legacy = await openLegacyDatabase();
    await legacy.put('projects', buildV1Project());
    await legacy.put('records', buildV1Record({ durationMinutes: 61 }));
    legacy.close();
    resetDatabaseConnection();

    await expect(getDatabase()).rejects.toBeDefined();
    resetDatabaseConnection();
    const unchanged = await openDB(DATABASE_NAME, 1);
    expect([...unchanged.objectStoreNames]).not.toContain('formDrafts');
    expect(await unchanged.get('records', buildV1Record().id)).toMatchObject({
      endMinute: 600,
      durationMinutes: 61,
    });
    unchanged.close();
  });
});
