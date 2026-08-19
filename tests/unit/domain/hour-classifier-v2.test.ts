import { describe, expect, it } from 'vitest';
import { classifyHours } from '@/domain/services/hour-classifier';
import type { LogRecordProps } from '@/domain/entities/log-record';

const overnight: LogRecordProps = {
  id: 'overnight',
  projectId: 'project',
  localDate: '2026-08-21',
  endLocalDate: '2026-08-22',
  startMinute: 1380,
  endMinute: 60,
  durationMinutes: 120,
  details: 'Sexta para sábado',
  revision: 1,
  createdAt: '2026-08-21T00:00:00.000Z',
  updatedAt: '2026-08-21T00:00:00.000Z',
};

describe('hour classifier v2', () => {
  it('classifies each daily intersection while returning one logical record and total', () => {
    const result = classifyHours([overnight], { isHoliday: () => false });
    expect(result).toMatchObject({ regular: 0, overtime50: 120, overtime100: 0, total: 120 });
    expect(result.records).toEqual([
      {
        recordId: overnight.id,
        projectId: overnight.projectId,
        regular: 0,
        overtime50: 120,
        overtime100: 0,
        total: 120,
      },
    ]);
  });

  it('does not classify a zero-length segment on the day after a midnight ending', () => {
    const result = classifyHours([{ ...overnight, endMinute: 0, durationMinutes: 60 }], {
      isHoliday: (date) => (date === '2026-08-22' ? true : false),
    });
    expect(result).toMatchObject({ regular: 0, overtime50: 60, overtime100: 0, total: 60 });
  });
});
