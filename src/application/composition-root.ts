import { systemClock, cryptoIdGenerator } from '@/application/ports/platform';
import { CreateProject } from './use-cases/projects/create-project';
import { ListProjects } from './use-cases/projects/list-projects';
import { UpdateProject } from './use-cases/projects/update-project';
import { ArchiveProject } from './use-cases/projects/archive-project';
import { CreateRecord } from './use-cases/records/create-record';
import { UpdateRecord } from './use-cases/records/update-record';
import { DeleteRecord } from './use-cases/records/delete-record';
import { ListRecordsByPeriod } from './queries/list-records-by-period';
import { GetHourSummary } from './queries/get-hour-summary';
import { UpdateRegion } from './use-cases/settings/update-region';
import { UpdateReminders } from './use-cases/reminders/update-reminders';
import { ReconcileReminders } from './use-cases/reminders/reconcile-reminders';
import { SnoozeReminder } from './use-cases/reminders/snooze-reminder';
import { IndexedDbProjectRepository } from '@/infrastructure/persistence/indexeddb/project-repository';
import { IndexedDbLogRecordRepository } from '@/infrastructure/persistence/indexeddb/log-record-repository';
import { IndexedDbRecordQueryRepository } from '@/infrastructure/persistence/indexeddb/record-query-repository';
import { ChromeSettingsRepository } from '@/infrastructure/persistence/chrome-storage/settings-repository';
import { BundledHolidayProvider } from '@/infrastructure/holidays/bundled-holiday-provider';
import { ChromeAlarmAdapter } from '@/infrastructure/chrome/alarm-adapter';

export const createCompositionRoot = () => {
  const projects = new IndexedDbProjectRepository();
  const records = new IndexedDbLogRecordRepository();
  const queries = new IndexedDbRecordQueryRepository();
  const settings = new ChromeSettingsRepository();
  const holidays = new BundledHolidayProvider();
  const alarms = new ChromeAlarmAdapter();
  return {
    clock: systemClock,
    repositories: { projects, records, settings },
    holidays,
    alarms,
    createProject: new CreateProject(projects, systemClock, cryptoIdGenerator),
    listProjects: new ListProjects(projects),
    updateProject: new UpdateProject(projects, systemClock),
    archiveProject: new ArchiveProject(projects, systemClock),
    createRecord: new CreateRecord(records, projects, systemClock, cryptoIdGenerator),
    updateRecord: new UpdateRecord(records, projects, systemClock),
    deleteRecord: new DeleteRecord(records),
    listRecords: new ListRecordsByPeriod(queries),
    getSummary: new GetHourSummary(records, holidays),
    updateRegion: new UpdateRegion(settings, holidays, systemClock),
    updateReminders: new UpdateReminders(settings, alarms, systemClock),
    reconcileReminders: new ReconcileReminders(settings, records, alarms, systemClock),
    snoozeReminder: new SnoozeReminder(alarms, systemClock),
  };
};
export type CompositionRoot = ReturnType<typeof createCompositionRoot>;
