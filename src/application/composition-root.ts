import { systemClock, cryptoIdGenerator } from '@/application/ports/platform';
import { CreateProject } from './use-cases/projects/create-project';
import { ListProjects } from './use-cases/projects/list-projects';
import { UpdateProject } from './use-cases/projects/update-project';
import { ArchiveProject } from './use-cases/projects/archive-project';
import { RestoreProject } from './use-cases/projects/restore-project';
import { RemoveProject } from './use-cases/projects/remove-project';
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
import { ChromeSidePanelAdapter } from '@/infrastructure/chrome/side-panel-adapter';
import { ChromeOptionalPermissionAdapter } from '@/infrastructure/chrome/permission-adapter';
import { IndexedDbDraftRepository } from '@/infrastructure/persistence/indexeddb/draft-repository';
import { UpdateReminderSound } from './use-cases/settings/update-reminder-sound';
import { UpdateMonthView } from './use-cases/settings/update-month-view';
import { ChromeReminderAudioAdapter } from '@/background/audio-playback';

export const createCompositionRoot = () => {
  const projects = new IndexedDbProjectRepository();
  const records = new IndexedDbLogRecordRepository();
  const queries = new IndexedDbRecordQueryRepository();
  const settings = new ChromeSettingsRepository();
  const holidays = new BundledHolidayProvider();
  const alarms = new ChromeAlarmAdapter();
  const drafts = new IndexedDbDraftRepository();
  const sidePanel = new ChromeSidePanelAdapter();
  const permissions = new ChromeOptionalPermissionAdapter();
  const audio = new ChromeReminderAudioAdapter();
  return {
    clock: systemClock,
    repositories: { projects, records, settings, drafts },
    holidays,
    alarms,
    sidePanel,
    permissions,
    audio,
    createProject: new CreateProject(projects, systemClock, cryptoIdGenerator),
    listProjects: new ListProjects(projects),
    updateProject: new UpdateProject(projects, systemClock),
    archiveProject: new ArchiveProject(projects, systemClock),
    restoreProject: new RestoreProject(projects, systemClock),
    removeProject: new RemoveProject(projects),
    createRecord: new CreateRecord(records, projects, systemClock, cryptoIdGenerator),
    updateRecord: new UpdateRecord(records, projects, systemClock),
    deleteRecord: new DeleteRecord(records),
    listRecords: new ListRecordsByPeriod(queries),
    getSummary: new GetHourSummary(records, holidays),
    updateRegion: new UpdateRegion(settings, holidays, systemClock),
    updateReminderSound: new UpdateReminderSound(settings, systemClock),
    updateMonthView: new UpdateMonthView(settings, systemClock),
    updateReminders: new UpdateReminders(settings, alarms, systemClock, permissions),
    reconcileReminders: new ReconcileReminders(
      settings,
      records,
      alarms,
      systemClock,
      permissions,
      audio,
    ),
    snoozeReminder: new SnoozeReminder(alarms, systemClock),
  };
};
export type CompositionRoot = ReturnType<typeof createCompositionRoot>;
