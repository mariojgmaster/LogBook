import type { Period } from '@/domain/value-objects/period';
import { LocalDate } from '@/domain/value-objects/local-date';

export const monthDays = (period: Pick<Period, 'start' | 'end'>): string[] => {
  const days: string[] = [];
  let cursor = LocalDate.parse(period.start);
  while (cursor.value <= period.end) {
    days.push(cursor.value);
    cursor = cursor.addDays(1);
  }
  return days;
};

export const formatDate = (date: string, layout: 'narrow' | 'wide') =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    ...(layout === 'narrow' ? { month: 'long' as const, weekday: 'short' as const } : {}),
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
