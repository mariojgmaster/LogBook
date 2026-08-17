import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import type { HolidayCatalogRecord } from '@/infrastructure/holidays/catalog-schema';

export const DATABASE_NAME = 'logbook';
export const DATABASE_VERSION = 1;

export interface LogBookDatabase extends DBSchema {
  projects: {
    key: string;
    value: ProjectProps;
    indexes: { 'by-status': string; 'by-normalized-name': string };
  };
  records: {
    key: string;
    value: LogRecordProps;
    indexes: { 'by-date': string; 'by-project': string; 'by-date-project': [string, string] };
  };
  holidays: {
    key: string;
    value: HolidayCatalogRecord;
    indexes: { 'by-date': string; 'by-scope': string };
  };
  metadata: { key: string; value: { key: string; value: unknown } };
}

let databasePromise: Promise<IDBPDatabase<LogBookDatabase>> | undefined;

export const getDatabase = (): Promise<IDBPDatabase<LogBookDatabase>> => {
  databasePromise ??= openDB<LogBookDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database, oldVersion, newVersion, transaction) {
      runMigrations(database, oldVersion, newVersion ?? DATABASE_VERSION, transaction);
    },
    blocked() {
      databasePromise = undefined;
    },
    terminated() {
      databasePromise = undefined;
    },
  });
  return databasePromise;
};

export const resetDatabaseConnection = () => {
  databasePromise = undefined;
};

export const runMigrations = (
  database: IDBPDatabase<LogBookDatabase>,
  oldVersion: number,
  _newVersion: number,
  transaction: IDBPTransaction<
    LogBookDatabase,
    ('projects' | 'records' | 'holidays' | 'metadata')[],
    'versionchange'
  >,
) => {
  if (oldVersion < 1) {
    const projects = database.createObjectStore('projects', { keyPath: 'id' });
    projects.createIndex('by-status', 'status');
    projects.createIndex('by-normalized-name', 'normalizedName');
    const records = database.createObjectStore('records', { keyPath: 'id' });
    records.createIndex('by-date', 'localDate');
    records.createIndex('by-project', 'projectId');
    records.createIndex('by-date-project', ['localDate', 'projectId']);
    const holidays = database.createObjectStore('holidays', { keyPath: 'id' });
    holidays.createIndex('by-date', 'date');
    holidays.createIndex('by-scope', 'scope');
    database.createObjectStore('metadata', { keyPath: 'key' });
    void transaction.objectStore('metadata').put({ key: 'schemaVersion', value: 1 });
  }
};
