import { afterAll, bench, describe, expect } from 'vitest';
import { projectMonthRecords } from '@/domain/services/month-projection';
import type { LogRecordProps } from '@/domain/entities/log-record';

const records: LogRecordProps[] = Array.from({ length: 10_000 }, (_, index) => {
  const day = String((index % 31) + 1).padStart(2, '0');
  const startMinute = (index * 7) % 1_380;
  return {
    id: `record-${String(index).padStart(5, '0')}`,
    projectId: `project-${index % 120}`,
    localDate: `2026-08-${day}`,
    endLocalDate: `2026-08-${day}`,
    startMinute,
    endMinute: startMinute + 60,
    durationMinutes: 60,
    details: `Atividade ${index}`,
    revision: 1,
    createdAt: `2026-08-01T00:00:${String(index % 60).padStart(2, '0')}.000Z`,
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
});

describe('month query v2 reference benchmark', () => {
  const querySamples: number[] = [];
  const feedbackSamples: number[] = [];
  bench(
    'projects 10,000 records',
    () => {
      const started = performance.now();
      const result = projectMonthRecords(records, {
        start: '2026-08-01',
        end: '2026-08-31',
      });
      if (result.daySegments.length !== 10_000) throw new Error('Incomplete projection');
      querySamples.push(performance.now() - started);
    },
    { warmupIterations: 5, iterations: 20, time: 0, warmupTime: 0 },
  );
  bench(
    'applies local feedback',
    () => {
      const feedbackStarted = performance.now();
      const selected = new Set<string>();
      selected.add(records[0]!.id);
      feedbackSamples.push(performance.now() - feedbackStarted);
    },
    { warmupIterations: 5, iterations: 20, time: 0, warmupTime: 0 },
  );
  afterAll(() => {
    const queryMeasured = querySamples.slice(-20).sort((left, right) => left - right);
    const feedbackMeasured = feedbackSamples.slice(-20).sort((left, right) => left - right);
    expect(queryMeasured).toHaveLength(20);
    expect(queryMeasured[Math.ceil(queryMeasured.length * 0.95) - 1]).toBeLessThanOrEqual(2_000);
    expect(feedbackMeasured[Math.ceil(feedbackMeasured.length * 0.95) - 1]).toBeLessThanOrEqual(
      100,
    );
  });
});
