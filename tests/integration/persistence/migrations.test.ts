import { describe, expect, it } from 'vitest';
import { getDatabase } from '@/infrastructure/persistence/indexeddb/database';
describe('IndexedDB migrations', () => {
  it('creates all v1 stores and indexes idempotently', async () => {
    const db = await getDatabase();
    expect([...db.objectStoreNames]).toEqual(['holidays', 'metadata', 'projects', 'records']);
    expect(await db.get('metadata', 'schemaVersion')).toEqual({ key: 'schemaVersion', value: 1 });
  });
});
