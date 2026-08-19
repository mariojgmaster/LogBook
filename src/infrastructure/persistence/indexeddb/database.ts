import { openDB, type DBSchema, type IDBPDatabase, type IDBPTransaction } from 'idb';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import type { HolidayCatalogRecord } from '@/infrastructure/holidays/catalog-schema';

export const DATABASE_NAME = 'logbook';
export const DATABASE_VERSION = 2;

export interface StoredFormDraft {
  id: string;
  surface: 'sidepanel' | 'reminder';
  formKind: 'record' | 'project' | 'settings' | 'snooze';
  intent: 'create' | 'edit' | 'update';
  entityId?: string;
  contextKey: string;
  values: unknown;
  updatedAt: string;
}

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
  formDrafts: {
    key: string;
    value: StoredFormDraft;
    indexes: { 'by-updated-at': string };
  };
  holidays: {
    key: string;
    value: HolidayCatalogRecord;
    indexes: { 'by-date': string; 'by-scope': string };
  };
  metadata: { key: string; value: { key: string; value: unknown } };
}

type StoreName = 'projects' | 'records' | 'formDrafts' | 'holidays' | 'metadata';
type UpgradeTransaction = IDBPTransaction<LogBookDatabase, StoreName[], 'versionchange'>;

let databasePromise: Promise<IDBPDatabase<LogBookDatabase>> | undefined;
let activeDatabase: IDBPDatabase<LogBookDatabase> | undefined;

export const getDatabase = (): Promise<IDBPDatabase<LogBookDatabase>> => {
  databasePromise ??= openDB<LogBookDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database, oldVersion, newVersion, transaction) {
      runMigrations(database, oldVersion, newVersion ?? DATABASE_VERSION, transaction);
    },
    blocked() {
      databasePromise = undefined;
    },
    terminated() {
      activeDatabase = undefined;
      databasePromise = undefined;
    },
  })
    .then((database) => {
      activeDatabase = database;
      return database;
    })
    .catch((error: unknown) => {
      databasePromise = undefined;
      throw error;
    });
  return databasePromise;
};

export const resetDatabaseConnection = () => {
  activeDatabase?.close();
  activeDatabase = undefined;
  databasePromise = undefined;
};

export const runMigrations = (
  database: IDBPDatabase<LogBookDatabase>,
  oldVersion: number,
  _newVersion: number,
  transaction: UpgradeTransaction,
) => {
  if (oldVersion < 1) createV1Stores(database, transaction);
  if (oldVersion < 2) {
    void transaction.done.catch(() => undefined);
    const drafts = database.createObjectStore('formDrafts', { keyPath: 'id' });
    drafts.createIndex('by-updated-at', 'updatedAt');
    void migrateToV2(transaction).catch(() => {
      try {
        transaction.abort();
      } catch {
        // A transação já pode ter sido abortada pelo IndexedDB.
      }
    });
  }
};

const createV1Stores = (
  database: IDBPDatabase<LogBookDatabase>,
  transaction: UpgradeTransaction,
) => {
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
};

const migrateToV2 = async (transaction: UpgradeTransaction) => {
  const projectsStore = transaction.objectStore('projects');
  const recordsStore = transaction.objectStore('records');
  const [legacyProjects, legacyRecords] = await Promise.all([
    projectsStore.getAll(),
    recordsStore.getAll(),
  ]);

  const projects = [...legacyProjects]
    .sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id),
    )
    .map((project, index) => {
      if (!project.id || !project.name || !project.normalizedName || project.revision < 1) {
        throw new Error('Invalid legacy project');
      }
      return { ...project, colorSlot: index % 12 };
    });

  const records = legacyRecords.map((record) => {
    if (
      !record.id ||
      !record.projectId ||
      !/^\d{4}-\d{2}-\d{2}$/.test(record.localDate) ||
      !Number.isInteger(record.startMinute) ||
      !Number.isInteger(record.endMinute) ||
      record.startMinute < 0 ||
      record.startMinute > 1439 ||
      record.endMinute < 1 ||
      record.endMinute > 1440 ||
      record.endMinute - record.startMinute !== record.durationMinutes
    ) {
      throw new Error('Invalid legacy record');
    }
    return record.endMinute === 1440
      ? { ...record, endLocalDate: addCivilDay(record.localDate), endMinute: 0 }
      : { ...record, endLocalDate: record.localDate };
  });

  for (const project of projects) await projectsStore.put(project);
  for (const record of records) await recordsStore.put(record);
  await transaction.objectStore('metadata').put({ key: 'schemaVersion', value: 2 });
};

const addCivilDay = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day! + 1));
  return date.toISOString().slice(0, 10);
};
