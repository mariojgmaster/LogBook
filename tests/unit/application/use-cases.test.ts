import { describe, expect, it } from 'vitest';
import type { AlarmPort } from '@/application/ports/platform';
import type {
  HolidayProvider,
  ProjectRepository,
  RecordPage,
  RecordQueryRepository,
  RecordRepository,
  SettingsRepository,
} from '@/application/ports/repositories';
import { CreateProject } from '@/application/use-cases/projects/create-project';
import { ListProjects } from '@/application/use-cases/projects/list-projects';
import { UpdateProject } from '@/application/use-cases/projects/update-project';
import { ArchiveProject } from '@/application/use-cases/projects/archive-project';
import { CreateRecord } from '@/application/use-cases/records/create-record';
import { UpdateRecord } from '@/application/use-cases/records/update-record';
import { DeleteRecord } from '@/application/use-cases/records/delete-record';
import { ListRecordsByPeriod } from '@/application/queries/list-records-by-period';
import { GetHourSummary } from '@/application/queries/get-hour-summary';
import { UpdateRegion } from '@/application/use-cases/settings/update-region';
import { UpdateReminders } from '@/application/use-cases/reminders/update-reminders';
import { ReconcileReminders } from '@/application/use-cases/reminders/reconcile-reminders';
import { SnoozeReminder } from '@/application/use-cases/reminders/snooze-reminder';
import { AppError } from '@/domain/errors/app-error';
import type { LogRecord, LogRecordProps } from '@/domain/entities/log-record';
import { Project, type ProjectProps } from '@/domain/entities/project';
import type {
  ReminderOccurrence,
  ReminderScheduleProps,
} from '@/domain/entities/reminder-schedule';
import type { UserSettingsProps } from '@/domain/entities/user-settings';
import { FixedClock, SequentialIds } from '../../fixtures/clock';

class Projects implements ProjectRepository {
  values = new Map<string, ProjectProps>();
  add(project: Project) {
    this.values.set(project.props.id, project.props);
    return Promise.resolve();
  }
  list(includeArchived = true) {
    return Promise.resolve(
      [...this.values.values()].filter((item) => includeArchived || item.status === 'active'),
    );
  }
  get(id: string) {
    return Promise.resolve(this.values.get(id));
  }
  update(project: Project, expectedRevision: number) {
    const current = this.values.get(project.props.id);
    if (current?.revision !== expectedRevision) throw new AppError('CONFLICT');
    this.values.set(project.props.id, project.props);
    return Promise.resolve();
  }
  restoreArchived(id: string, expectedRevision: number, now: Date) {
    const current = this.values.get(id);
    if (!current || current.revision !== expectedRevision) throw new AppError('CONFLICT');
    const restored = Project.restore(current).restore(now).props;
    this.values.set(id, restored);
    return Promise.resolve(restored);
  }
  removeArchived(id: string, expectedRevision: number) {
    const current = this.values.get(id);
    if (!current || current.revision !== expectedRevision) throw new AppError('CONFLICT');
    this.values.delete(id);
    return Promise.resolve();
  }
}
class Records implements RecordRepository {
  values = new Map<string, LogRecordProps>();
  add(record: LogRecord) {
    this.values.set(record.props.id, record.props);
    return Promise.resolve();
  }
  get(id: string) {
    return Promise.resolve(this.values.get(id));
  }
  listByDate(date: string) {
    return Promise.resolve([...this.values.values()].filter((item) => item.localDate === date));
  }
  listByProject(id: string) {
    return Promise.resolve([...this.values.values()].filter((item) => item.projectId === id));
  }
  listRange(start: string, end: string) {
    return Promise.resolve(
      [...this.values.values()].filter((item) => item.localDate >= start && item.localDate <= end),
    );
  }
  update(record: LogRecord, expectedRevision: number) {
    if (this.values.get(record.props.id)?.revision !== expectedRevision)
      throw new AppError('CONFLICT');
    this.values.set(record.props.id, record.props);
    return Promise.resolve();
  }
  delete(id: string, expectedRevision: number) {
    if (this.values.get(id)?.revision !== expectedRevision) throw new AppError('CONFLICT');
    this.values.delete(id);
    return Promise.resolve();
  }
}
class Settings implements SettingsRepository {
  user: UserSettingsProps = {
    monthViewMode: 'notice',
    reminderSoundId: 'gentle-bell',
    revision: 1,
    updatedAt: new Date(0).toISOString(),
  };
  reminder: ReminderScheduleProps = {
    enabled: false,
    weekdays: [1, 2, 3, 4, 5],
    times: ['17:30'],
    snoozeMinutes: 10,
    revision: 1,
  };
  getUserSettings() {
    return Promise.resolve(this.user);
  }
  saveUserSettings(value: UserSettingsProps, expected: number) {
    if (this.user.revision !== expected) throw new AppError('CONFLICT');
    this.user = value;
    return Promise.resolve();
  }
  getReminderSchedule() {
    return Promise.resolve(this.reminder);
  }
  saveReminderSchedule(value: ReminderScheduleProps, expected: number) {
    if (this.reminder.revision !== expected) throw new AppError('CONFLICT');
    this.reminder = value;
    return Promise.resolve();
  }
}
class Alarms implements AlarmPort {
  allowed = true;
  values = new Map<string, ReminderOccurrence>();
  hasPermission() {
    return Promise.resolve(this.allowed);
  }
  requestPermission() {
    return Promise.resolve(this.allowed);
  }
  schedule(value: ReminderOccurrence) {
    this.values.set(value.slotId, value);
    return Promise.resolve();
  }
  cancel(name: string) {
    return Promise.resolve(this.values.delete(name));
  }
  list() {
    return Promise.resolve(
      [...this.values.entries()].map(([name, value]) => ({ name, when: value.when })),
    );
  }
}
const clock = new FixedClock(new Date(2026, 7, 17, 8));

describe('application use cases', () => {
  it('creates, lists, renames and archives projects', async () => {
    const repository = new Projects();
    const ids = new SequentialIds();
    const created = await new CreateProject(repository, clock, ids).execute(' Projeto ');
    expect(await new ListProjects(repository).execute(false)).toHaveLength(1);
    const renamed = await new UpdateProject(repository, clock).execute(created.id, 'Novo', 1);
    expect(renamed.revision).toBe(2);
    const archived = await new ArchiveProject(repository, clock).execute(created.id, 2);
    expect(archived.status).toBe('archived');
  });
  it('creates, edits, moves and deletes records only for known projects', async () => {
    const projects = new Projects(),
      records = new Records(),
      ids = new SequentialIds();
    const project = await new CreateProject(projects, clock, ids).execute('P');
    const create = new CreateRecord(records, projects, clock, ids);
    const item = await create.execute({
      projectId: project.id,
      localDate: '2026-08-16',
      startMinute: 480,
      endMinute: 540,
      details: 'feito',
    });
    const updated = await new UpdateRecord(records, projects, clock).execute(item.id, 1, {
      projectId: project.id,
      localDate: '2026-08-15',
      startMinute: 480,
      durationMinutes: 120,
      details: 'movido',
    });
    expect(updated.localDate).toBe('2026-08-15');
    await new DeleteRecord(records).execute(item.id, 2);
    expect(await records.get(item.id)).toBeUndefined();
    await expect(
      create.execute({
        projectId: crypto.randomUUID(),
        localDate: '2026-08-16',
        startMinute: 480,
        endMinute: 540,
        details: 'x',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });
  it('lists bounded periods and calculates summaries', async () => {
    const page: RecordPage = { items: [] };
    const query: RecordQueryRepository = { list: () => Promise.resolve(page) };
    expect(
      await new ListRecordsByPeriod(query).execute({
        start: '2026-08-01',
        end: '2026-08-31',
        mode: 'month',
      }),
    ).toBe(page);
    const records = new Records();
    const holidays: HolidayProvider = {
      isHoliday: () => false,
      listApplicable: () => [],
      getCoverage: () => ({ minYear: 2021, maxYear: 2028, revision: '1' }),
      setRegion: () => Promise.resolve(),
    };
    expect(
      (
        await new GetHourSummary(records, holidays).execute({
          start: '2026-08-17',
          end: '2026-08-17',
          mode: 'day',
        })
      ).total,
    ).toBe(0);
  });
  it('applies a region only after confirmation', async () => {
    const settings = new Settings();
    const regions: any[] = [];
    const holidays: HolidayProvider = {
      isHoliday: () => false,
      listApplicable: () => [],
      getCoverage: () => undefined,
      setRegion: (region) => {
        regions.push(region);
        return Promise.resolve();
      },
    };
    const useCase = new UpdateRegion(settings, holidays, clock);
    expect((await useCase.execute({ uf: 'SP' }, 1, false)).region).toBeUndefined();
    expect((await useCase.execute({ uf: 'SP' }, 1, true)).region).toEqual({ uf: 'SP' });
    expect(regions).toHaveLength(1);
  });
  it('updates, reconciles and snoozes reconstructible reminders', async () => {
    const settings = new Settings(),
      records = new Records(),
      alarms = new Alarms();
    const update = new UpdateReminders(settings, alarms, clock);
    const result = await update.execute(
      { enabled: true, weekdays: [1], times: ['09:00'], snoozeMinutes: 10 },
      1,
      true,
    );
    expect(result.nextOccurrence?.targetLocalDate).toBe('2026-08-17');
    expect(alarms.values.size).toBeGreaterThan(0);
    const reconciled = await new ReconcileReminders(settings, records, alarms, clock).execute();
    expect(reconciled.permission).toBe(true);
    const original = result.nextOccurrence!;
    const snoozed = await new SnoozeReminder(alarms, clock).execute(original, 30);
    expect(snoozed.targetLocalDate).toBe(original.targetLocalDate);
    alarms.allowed = false;
    await expect(
      update.execute(
        { enabled: true, weekdays: [1], times: ['10:00'], snoozeMinutes: 10 },
        2,
        true,
      ),
    ).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });
});
