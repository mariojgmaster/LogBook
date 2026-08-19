import type { HolidayOccurrence } from '@/domain/entities/holiday';

export function MonthHolidayLabels({ holidays }: { holidays: HolidayOccurrence[] }) {
  if (holidays.length === 0) return null;
  return (
    <div
      className="month-holidays"
      aria-label={holidays.map((holiday) => `Feriado: ${holiday.name}`).join('. ')}
    >
      {holidays.map((holiday) => (
        <span
          className="month-holiday"
          key={`${holiday.scope}-${holiday.name}`}
          title={holiday.name}
        >
          <span className="month-holiday-dot" aria-hidden="true" />
          <span>{holiday.name}</span>
        </span>
      ))}
    </div>
  );
}
