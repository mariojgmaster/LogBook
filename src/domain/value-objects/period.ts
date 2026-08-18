import { AppError } from '@/domain/errors/app-error';
import { LocalDate } from '@/domain/value-objects/local-date';

export type PeriodMode = 'day' | 'fortnight' | 'month';
export interface Period {
  start: string;
  end: string;
  mode: PeriodMode;
}

export const periodFor = (anchorValue: string, mode: PeriodMode): Period => {
  const anchor = LocalDate.parse(anchorValue);
  const [year, month, day] = anchor.parts();
  if (mode === 'day') return { start: anchor.value, end: anchor.value, mode };
  if (mode === 'fortnight') {
    const startDay = day <= 15 ? 1 : 16;
    const endDay = day <= 15 ? 15 : new Date(year, month, 0).getDate();
    return {
      start: LocalDate.parse(
        `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
      ).value,
      end: LocalDate.parse(
        `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
      ).value,
      mode,
    };
  }
  const endDay = new Date(year, month, 0).getDate();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return { start: `${prefix}-01`, end: `${prefix}-${String(endDay).padStart(2, '0')}`, mode };
};

export const navigatePeriod = (period: Period, direction: -1 | 1): Period => {
  const [year, month, day] = LocalDate.parse(period.start).parts();
  if (period.mode === 'day')
    return periodFor(LocalDate.parse(period.start).addDays(direction).value, 'day');
  if (period.mode === 'month') {
    const next = new Date(year, month - 1 + direction, 1, 12);
    return periodFor(LocalDate.fromDate(next).value, 'month');
  }
  const next =
    day === 1
      ? direction === 1
        ? new Date(year, month - 1, 16, 12)
        : new Date(year, month - 2, 16, 12)
      : direction === 1
        ? new Date(year, month, 1, 12)
        : new Date(year, month - 1, 1, 12);
  return periodFor(LocalDate.fromDate(next).value, 'fortnight');
};

export const assertPeriodLimit = (period: Period) => {
  let days = 1;
  let cursor = LocalDate.parse(period.start);
  const end = LocalDate.parse(period.end);
  if (cursor.value > end.value) {
    throw new AppError('VALIDATION', { period: 'A data inicial deve anteceder a data final.' });
  }
  while (cursor.value < period.end && days <= 367) {
    cursor = cursor.addDays(1);
    days += 1;
  }
  if (days > 366) throw new AppError('VALIDATION', { period: 'O período máximo é de 366 dias.' });
};
