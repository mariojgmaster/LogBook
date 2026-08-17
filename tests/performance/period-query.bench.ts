import { bench, describe } from 'vitest';
import { classifyHours } from '@/domain/services/hour-classifier';
import type { LogRecordProps } from '@/domain/entities/log-record';
const records: LogRecordProps[] = Array.from({ length: 10_000 }, (_, index) => ({
  id: String(index),
  projectId: `p${index % 20}`,
  localDate: `2026-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
  startMinute: index % 1000,
  endMinute: (index % 1000) + 30,
  durationMinutes: 30,
  details: 'benchmark',
  revision: 1,
  createdAt: new Date(index * 1000).toISOString(),
  updatedAt: new Date(index * 1000).toISOString(),
}));
describe('10k record summary', () => {
  bench(
    'classifies under the 2 second budget',
    () => {
      classifyHours(records, { isHoliday: () => false });
    },
    { time: 1000 },
  );
});
