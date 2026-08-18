import { describe, expect, it } from 'vitest';
import { LogRecord } from '@/domain/entities/log-record';
import { Project } from '@/domain/entities/project';
import { UserSettings } from '@/domain/entities/user-settings';
import { TimeRange } from '@/domain/value-objects/time-range';

const now = new Date('2026-08-17T15:00:00-03:00');
const baseRecord = {
  id: crypto.randomUUID(),
  projectId: crypto.randomUUID(),
  localDate: '2026-08-16',
  startMinute: 1_380,
  details: 'Plantão',
  now,
};

describe('v2 domain entities', () => {
  it('accepts a range crossing one midnight and normalizes its civil end', () => {
    const record = LogRecord.create({
      ...baseRecord,
      endLocalDate: '2026-08-17',
      endMinute: 60,
    });

    expect(record.props).toMatchObject({ endLocalDate: '2026-08-17', endMinute: 60 });
    expect(record.props.durationMinutes).toBe(120);
  });

  it('accepts exactly 24 hours but rejects longer or more than one midnight', () => {
    expect(TimeRange.fromDuration(1_380, 1_440)).toMatchObject({
      endMinute: 1_380,
      dayOffset: 1,
      durationMinutes: 1_440,
    });
    expect(() => TimeRange.fromDuration(1_380, 1_441)).toThrow();
    expect(() =>
      LogRecord.create({
        ...baseRecord,
        endLocalDate: '2026-08-18',
        endMinute: 60,
      }),
    ).toThrow();
  });

  it('validates and preserves Project.colorSlot while restoring', () => {
    const project = Project.create('Projeto', crypto.randomUUID(), now, 11);
    expect(project.props.colorSlot).toBe(11);
    expect(Project.restore(project.props).props.colorSlot).toBe(11);
    expect(() => Project.restore({ ...project.props, colorSlot: 12 })).toThrow();
  });

  it('restores an archived project without changing identity or color', () => {
    const archived = Project.create('Projeto', crypto.randomUUID(), now, 4).archive(now);
    const restored = archived.restore(now);
    expect(restored.props).toMatchObject({
      id: archived.props.id,
      status: 'active',
      colorSlot: 4,
      revision: archived.props.revision + 1,
    });
  });

  it('applies and validates v2 preference defaults', () => {
    expect(UserSettings.defaults(now).props).toMatchObject({
      monthViewMode: 'notice',
      reminderSoundId: 'gentle-bell',
    });
    expect(() =>
      UserSettings.restore({
        revision: 1,
        updatedAt: now.toISOString(),
        monthViewMode: 'grid' as 'notice',
        reminderSoundId: 'gentle-bell',
      }),
    ).toThrow();
  });
});
