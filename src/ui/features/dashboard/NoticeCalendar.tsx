import type { CSSProperties } from 'react';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import type { Period } from '@/domain/value-objects/period';
import type { HolidayOccurrence } from '@/domain/entities/holiday';
import { LocalDate } from '@/domain/value-objects/local-date';
import { projectMonthRecords } from '@/domain/services/month-projection';
import { formatClockTime } from '@/domain/value-objects/time-range';
import { projectColor } from '@/ui/theme/project-colors';
import { formatDate, monthDays } from './month-calendar-utils';
import { MonthHolidayLabels } from './MonthHolidayLabels';
import { MonthRecordTooltip } from './MonthRecordTooltip';

export interface MonthCalendarProps {
  period: Period;
  records: LogRecordProps[];
  projects: ProjectProps[];
  holidays?: HolidayOccurrence[];
  layout: 'narrow' | 'wide';
  onOpenRecord: (record: LogRecordProps) => void;
  onCreateDate?: (date: string) => void;
}

export function NoticeCalendar({
  period,
  records,
  projects,
  holidays = [],
  layout,
  onOpenRecord,
  onCreateDate,
}: MonthCalendarProps) {
  const projection = projectMonthRecords(records, period);
  const recordById = new Map(records.map((record) => [record.id, record]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const days = monthDays(period);
  const daysToRender =
    layout === 'narrow'
      ? days.filter(
          (date) =>
            projection.daySegments.some((segment) => segment.date === date) ||
            holidays.some((holiday) => holiday.date === date),
        )
      : days;
  return (
    <div
      className={`notice-calendar notice-calendar--${layout}`}
      aria-label="Notice Calendar mensal"
    >
      {layout === 'wide'
        ? Array.from({ length: LocalDate.parse(period.start).dayOfWeek() }, (_, index) => (
            <span aria-hidden="true" key={`blank-${index}`} />
          ))
        : null}
      {daysToRender.map((date) => {
        const segments = projection.daySegments.filter((segment) => segment.date === date);
        const dateHolidays = holidays.filter((holiday) => holiday.date === date);
        return (
          <section className="month-day" key={date} aria-labelledby={`notice-day-${date}`}>
            <DayCreateButton date={date} onCreateDate={onCreateDate} />
            <h3 id={`notice-day-${date}`}>{formatDate(date, layout)}</h3>
            <MonthHolidayLabels holidays={dateHolidays} />
            <div
              className="month-day-items"
              aria-label={`${formatAccessibleDate(date)}: ${segments.length} ${segments.length === 1 ? 'registro' : 'registros'}`}
              tabIndex={segments.length > 3 ? 0 : undefined}
              onClick={(event) => {
                if (event.target === event.currentTarget) onCreateDate?.(date);
              }}
            >
              {segments.map((segment) => {
                const project = projectById.get(segment.projectId);
                const record = recordById.get(segment.recordId)!;
                const color = projectColor(project?.colorSlot);
                const projectName = project?.name ?? 'Projeto arquivado';
                return (
                  <MonthRecordTooltip
                    key={`${segment.recordId}-${segment.date}`}
                    record={record}
                    projectName={projectName}
                  >
                    <button
                      type="button"
                      className="month-record"
                      data-color-slot={project?.colorSlot ?? 0}
                      style={
                        {
                          '--project-bg': color.background,
                          '--project-border': color.border,
                          '--project-text': color.text,
                          '--project-accent': color.border,
                        } as CSSProperties
                      }
                      aria-label={`${projectName}, ${formatClockTime(segment.startMinute)}–${formatClockTime(segment.endMinute)}, ${segment.details}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenRecord(record);
                      }}
                    >
                      <span className="month-record-dot" aria-hidden="true" />
                      <span className="month-record-label">
                        <span className="month-record-time">
                          {formatClockTime(segment.startMinute)}–
                          {formatClockTime(segment.endMinute)}
                        </span>
                        <span aria-hidden="true"> · </span>
                        <strong>{projectName}</strong>
                        <span aria-hidden="true"> · </span>
                        <span>{segment.details}</span>
                      </span>
                    </button>
                  </MonthRecordTooltip>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function DayCreateButton({
  date,
  onCreateDate,
}: {
  date: string;
  onCreateDate?: (date: string) => void;
}) {
  const future = date > LocalDate.fromDate(new Date()).value;
  return (
    <button
      type="button"
      className="month-day-trigger"
      aria-label={`Novo registro em ${formatAccessibleDate(date)}`}
      disabled={future || !onCreateDate}
      onClick={() => onCreateDate?.(date)}
    />
  );
}

const formatAccessibleDate = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
