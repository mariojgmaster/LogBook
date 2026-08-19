import { describe, expect, it } from 'vitest';
import { projectMonthRecords } from '@/domain/services/month-projection';
import type { LogRecordProps } from '@/domain/entities/log-record';
import { assignProjectColorSlot } from '@/domain/services/project-color-assignment';

const record = (overrides: Partial<LogRecordProps> = {}): LogRecordProps => ({
  id: 'record-1',
  projectId: 'project-1',
  localDate: '2026-08-08',
  endLocalDate: '2026-08-09',
  startMinute: 1380,
  endMinute: 60,
  durationMinutes: 120,
  details: 'Plantão',
  revision: 1,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  ...overrides,
});

describe('month projection', () => {
  it('clips month boundaries and preserves a single logical record across days and weeks', () => {
    const projection = projectMonthRecords(
      [
        record({
          id: 'from-july',
          localDate: '2026-07-31',
          endLocalDate: '2026-08-01',
          startMinute: 1380,
          endMinute: 60,
        }),
        record(),
      ],
      { start: '2026-08-01', end: '2026-08-31' },
    );
    expect(projection.daySegments.map((segment) => [segment.recordId, segment.date])).toEqual([
      ['from-july', '2026-08-01'],
      ['record-1', '2026-08-08'],
      ['record-1', '2026-08-09'],
    ]);
    expect(
      projection.rangeSegments.filter((segment) => segment.recordId === 'record-1'),
    ).toHaveLength(2);
    expect(new Set(projection.rangeSegments.map((segment) => segment.logicalRecordId)).size).toBe(
      2,
    );
  });

  it('handles 24 hours, midnight endings and semi-open intervals without empty next-day segments', () => {
    const projection = projectMonthRecords(
      [
        record({
          id: 'full-day',
          localDate: '2026-08-10',
          endLocalDate: '2026-08-11',
          startMinute: 600,
          endMinute: 600,
          durationMinutes: 1440,
        }),
        record({
          id: 'midnight',
          localDate: '2026-08-12',
          endLocalDate: '2026-08-13',
          startMinute: 1320,
          endMinute: 0,
          durationMinutes: 120,
        }),
      ],
      { start: '2026-08-01', end: '2026-08-31' },
    );
    expect(
      projection.daySegments
        .filter((segment) => segment.recordId === 'full-day')
        .map((segment) => [segment.date, segment.startMinute, segment.endMinute]),
    ).toEqual([
      ['2026-08-10', 600, 1440],
      ['2026-08-11', 0, 600],
    ]);
    expect(
      projection.daySegments.filter((segment) => segment.recordId === 'midnight'),
    ).toHaveLength(1);
  });

  it('projects every week-start position deterministically and applies project/text filters', () => {
    const records = Array.from({ length: 7 }, (_, day) =>
      record({
        id: `weekday-${day}`,
        projectId: day % 2 === 0 ? 'wanted' : 'other',
        localDate: `2026-08-${String(2 + day).padStart(2, '0')}`,
        endLocalDate: `2026-08-${String(2 + day).padStart(2, '0')}`,
        startMinute: 480,
        endMinute: 540,
        durationMinutes: 60,
        details: day === 4 ? 'Revisão crítica' : 'Rotina',
      }),
    );
    const projection = projectMonthRecords(
      records,
      { start: '2026-08-01', end: '2026-08-31' },
      {
        projectIds: ['wanted'],
        search: 'revisao',
      },
    );
    expect(projection.daySegments.map((segment) => segment.recordId)).toEqual(['weekday-4']);
  });

  it('projects an event once without fabricating a time range', () => {
    const projection = projectMonthRecords(
      [
        record({
          id: 'event',
          localDate: '2026-08-18',
          endLocalDate: '2026-08-18',
          startMinute: 0,
          endMinute: 0,
          durationMinutes: 0,
          isEvent: true,
        }),
      ],
      { start: '2026-08-01', end: '2026-08-31' },
    );
    expect(projection.daySegments).toEqual([
      expect.objectContaining({ recordId: 'event', date: '2026-08-18', isEvent: true }),
    ]);
    expect(projection.rangeSegments).toHaveLength(1);
  });

  it('assigns the least-used color deterministically and reuses a released slot', () => {
    const projects = [0, 0, 1].map((colorSlot, index) => ({
      id: `project-${index}`,
      name: `Projeto ${index}`,
      normalizedName: `projeto ${index}`,
      status: 'active' as const,
      colorSlot,
      revision: 1,
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    }));
    expect(assignProjectColorSlot(projects)).toBe(2);
    expect(assignProjectColorSlot(projects.filter((project) => project.colorSlot !== 1))).toBe(1);
  });
});
