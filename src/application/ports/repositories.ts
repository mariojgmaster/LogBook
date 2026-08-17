import type { LogRecord, LogRecordProps } from '@/domain/entities/log-record';
import type { Project, ProjectProps } from '@/domain/entities/project';
import type { ReminderScheduleProps } from '@/domain/entities/reminder-schedule';
import type { UserSettingsProps } from '@/domain/entities/user-settings';

export interface ProjectRepository {
  add(project: Project): Promise<void>;
  list(includeArchived?: boolean): Promise<ProjectProps[]>;
  get(id: string): Promise<ProjectProps | undefined>;
  update(project: Project, expectedRevision: number): Promise<void>;
}

export interface RecordRepository {
  add(record: LogRecord): Promise<void>;
  get(id: string): Promise<LogRecordProps | undefined>;
  listByDate(localDate: string): Promise<LogRecordProps[]>;
  listByProject(projectId: string): Promise<LogRecordProps[]>;
  listRange(start: string, end: string): Promise<LogRecordProps[]>;
  update(record: LogRecord, expectedRevision: number): Promise<void>;
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
  getCoverage(): { minYear: number; maxYear: number; revision: string } | undefined;
  setRegion(region: { uf: string; municipalityCode?: string }): Promise<void>;
}
