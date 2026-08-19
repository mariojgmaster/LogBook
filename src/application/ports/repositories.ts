import type { LogRecord, LogRecordProps } from '@/domain/entities/log-record';
import type { Project, ProjectProps } from '@/domain/entities/project';
import type { ReminderScheduleProps } from '@/domain/entities/reminder-schedule';
import type { UserSettingsProps } from '@/domain/entities/user-settings';
import type { FormDraft } from '@/shared/contracts/messages';
import type { HolidayOccurrence } from '@/domain/entities/holiday';

export type FormDraftSnapshot = FormDraft & { id: string; updatedAt: string };

export interface DraftRepository {
  get(id: string): Promise<FormDraftSnapshot | undefined>;
  upsert(draft: FormDraftSnapshot): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ProjectRepository {
  add(project: Project): Promise<void>;
  list(includeArchived?: boolean): Promise<ProjectProps[]>;
  get(id: string): Promise<ProjectProps | undefined>;
  update(project: Project, expectedRevision: number): Promise<void>;
  restoreArchived(id: string, expectedRevision: number, now: Date): Promise<ProjectProps>;
  removeArchived(id: string, expectedRevision: number): Promise<void>;
}

export interface RecordRepository {
  add(record: LogRecord): Promise<void>;
  get(id: string): Promise<LogRecordProps | undefined>;
  listByDate(localDate: string): Promise<LogRecordProps[]>;
  listByProject(projectId: string): Promise<LogRecordProps[]>;
  listRange(start: string, end: string): Promise<LogRecordProps[]>;
  update(record: LogRecord, expectedRevision?: number): Promise<LogRecordProps | void>;
  delete(id: string, expectedRevision: number): Promise<void>;
}

export interface RecordFilters {
  projectIds?: string[];
  search?: string;
  cursor?: string;
  limit?: number;
}
export interface RecordPage {
  items: LogRecordProps[];
  nextCursor?: string;
}
export interface RecordQueryRepository {
  list(start: string, end: string, filters?: RecordFilters): Promise<RecordPage>;
}

export interface SettingsRepository {
  getUserSettings(): Promise<UserSettingsProps>;
  saveUserSettings(settings: UserSettingsProps, expectedRevision: number): Promise<void>;
  getReminderSchedule(): Promise<ReminderScheduleProps>;
  saveReminderSchedule(schedule: ReminderScheduleProps, expectedRevision: number): Promise<void>;
}

export interface HolidayProvider {
  isHoliday(localDate: string): boolean | undefined;
  listApplicable(start: string, end: string): HolidayOccurrence[] | undefined;
  getCoverage(): { minYear: number; maxYear: number; revision: string } | undefined;
  setRegion(region: { uf: string; municipalityCode?: string }): Promise<void>;
}
