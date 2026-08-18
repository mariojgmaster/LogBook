import type { CSSProperties, ReactNode } from 'react';
import type { LogRecordProps } from '@/domain/entities/log-record';
import { LocalDate } from '@/domain/value-objects/local-date';
import { projectMonthRecords } from '@/domain/services/month-projection';
import { formatClockTime } from '@/domain/value-objects/time-range';
import { projectColor } from '@/ui/theme/project-colors';
import { DayCreateButton, type MonthCalendarProps } from './NoticeCalendar';
import { formatDate, monthDays } from './month-calendar-utils';
import { MonthHolidayLabels } from './MonthHolidayLabels';
import { MonthRecordTooltip } from './MonthRecordTooltip';

export function EventRangeCalendar({
  period,
  records,
  projects,
  holidays = [],
  layout,
  onOpenRecord,
  onCreateDate,
}: MonthCalendarProps) {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  if (layout === 'narrow') {
    return (
      <div className="event-range-agenda" aria-label="Event Range mensal">
        {holidays.map((holiday) => (
          <section
            className="event-range-holiday"
            key={`${holiday.date}-${holiday.scope}-${holiday.name}`}
          >
            <strong>{formatDate(holiday.date, 'narrow')}</strong>
            <MonthHolidayLabels holidays={[holiday]} />
          </section>
        ))}
        {records.map((record) => (
          <RangeButton
            key={record.id}
            record={record}
            project={projectById.get(record.projectId)}
            onOpenRecord={onOpenRecord}
          >
            <span>
              {formatDate(record.localDate, 'narrow')} {formatClockTime(record.startMinute)} →{' '}
              {formatDate(record.endLocalDate ?? record.localDate, 'narrow')}{' '}
              {formatClockTime(record.endMinute)}
            </span>
          </RangeButton>
        ))}
      </div>
    );
  }
  const projection = projectMonthRecords(records, period);
  const offset = LocalDate.parse(period.start).dayOfWeek();
  const days = monthDays(period);
  const visualSegments = assignLanes(projection.rangeSegments, days, offset);
  const weekCount = Math.ceil((offset + days.length) / 7);
  const rowTemplate = Array.from({ length: weekCount }, (_, index) => {
    const laneCount = visualSegments.reduce(
      (highest, item) => (item.week === index + 1 ? Math.max(highest, item.lane + 1) : highest),
      0,
    );
    return `max(var(--month-cell-block-size), ${48 + laneCount * 26}px)`;
  }).join(' ');
  const tabbed = new Set<string>();
  return (
    <div className="event-range-calendar" aria-label="Event Range mensal">
      <div className="event-range-days" style={{ gridTemplateRows: rowTemplate }}>
        {Array.from({ length: offset }, (_, index) => (
          <span aria-hidden="true" key={`blank-${index}`} />
        ))}
        {days.map((date) => {
          const dateHolidays = holidays.filter((holiday) => holiday.date === date);
          return (
            <div
              className="event-range-day"
              key={date}
              aria-label={`${formatDate(date, 'narrow')}${dateHolidays.length ? `, ${dateHolidays.map((holiday) => holiday.name).join(', ')}` : ''}`}
            >
              <DayCreateButton date={date} onCreateDate={onCreateDate} />
              <span aria-hidden="true">{Number(date.slice(-2))}</span>
              <MonthHolidayLabels holidays={dateHolidays} />
            </div>
          );
        })}
      </div>
      <div className="event-range-items" style={{ gridTemplateRows: rowTemplate }}>
        {visualSegments.map(({ segment, week, lane }) => {
          const record = records.find((item) => item.id === segment.recordId)!;
          const firstTabStop = !tabbed.has(record.id);
          tabbed.add(record.id);
          return (
            <RangeButton
              key={`${segment.recordId}-${segment.segmentIndex}`}
              record={record}
              project={projectById.get(record.projectId)}
              onOpenRecord={onOpenRecord}
              tabIndex={firstTabStop ? 0 : -1}
              variant="bar"
              style={
                {
                  gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 1}`,
                  gridRow: week,
                  '--event-lane': lane,
                } as CSSProperties
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function RangeButton({
  record,
  project,
  onOpenRecord,
  tabIndex,
  style,
  children,
  variant = 'card',
}: {
  record: LogRecordProps;
  project?: { name: string; colorSlot?: number };
  onOpenRecord: (record: LogRecordProps) => void;
  tabIndex?: number;
  style?: CSSProperties;
  children?: ReactNode;
  variant?: 'bar' | 'card';
}) {
  const color = projectColor(project?.colorSlot);
  const projectName = project?.name ?? 'Projeto arquivado';
  const button = (
    <button
      type="button"
      className={`month-record event-range-record event-range-record--${variant}`}
      data-record-id={record.id}
      data-color-slot={project?.colorSlot ?? 0}
      tabIndex={tabIndex}
      style={
        {
          ...style,
          '--project-bg': color.background,
          '--project-border': color.border,
          '--project-text': color.text,
          '--project-accent': color.border,
        } as CSSProperties
      }
      aria-label={`${projectName}, ${formatClockTime(record.startMinute)}–${formatClockTime(record.endMinute)}, ${record.details}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpenRecord(record);
      }}
    >
      {variant === 'bar' ? (
        <span className="event-range-label">
          <strong>{projectName}</strong>
          <span aria-hidden="true"> · </span>
          <span>{record.details}</span>
        </span>
      ) : (
        <>
          <strong>{projectName}</strong>
          <span>{record.details}</span>
          {children}
        </>
      )}
    </button>
  );
  return (
    <MonthRecordTooltip record={record} projectName={projectName}>
      {button}
    </MonthRecordTooltip>
  );
}

interface RangeSegment {
  startColumn: number;
  endColumn: number;
  startDate: string;
}

const assignLanes = <T extends RangeSegment>(
  segments: readonly T[],
  days: readonly string[],
  offset: number,
) => {
  const occupiedByWeek = new Map<number, Array<Array<{ start: number; end: number }>>>();
  return segments.map((segment) => {
    const dayIndex = days.indexOf(segment.startDate);
    const week = Math.floor((offset + dayIndex) / 7) + 1;
    const lanes = occupiedByWeek.get(week) ?? [];
    let lane = lanes.findIndex((ranges) =>
      ranges.every((range) => segment.endColumn <= range.start || segment.startColumn >= range.end),
    );
    if (lane < 0) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane]!.push({ start: segment.startColumn, end: segment.endColumn });
    occupiedByWeek.set(week, lanes);
    return { segment, week, lane };
  });
};
