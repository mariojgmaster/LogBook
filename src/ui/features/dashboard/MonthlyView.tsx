import { useEffect, useRef, useState } from 'react';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import type { MonthViewMode } from '@/domain/entities/user-settings';
import type { Period } from '@/domain/value-objects/period';
import type { HolidayOccurrence } from '@/domain/entities/holiday';
import { EventRangeCalendar } from './EventRangeCalendar';
import { NoticeCalendar } from './NoticeCalendar';
import '@/ui/theme/month-calendar.css';

export function MonthlyView({
  period,
  records,
  projects,
  holidays = [],
  mode,
  onOpenRecord,
  onCreateDate,
  layout: controlledLayout,
}: {
  period: Period;
  records: LogRecordProps[];
  projects: ProjectProps[];
  holidays?: HolidayOccurrence[];
  mode: MonthViewMode;
  onOpenRecord: (record: LogRecordProps) => void;
  onCreateDate: (date: string) => void;
  layout?: 'narrow' | 'wide';
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredLayout, setMeasuredLayout] = useState<'narrow' | 'wide'>('narrow');
  useEffect(() => {
    if (controlledLayout || !containerRef.current || !globalThis.ResizeObserver) return;
    const observer = new ResizeObserver(([entry]) => {
      setMeasuredLayout((entry?.contentRect.width ?? 0) >= 480 ? 'wide' : 'narrow');
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [controlledLayout]);
  const layout = controlledLayout ?? measuredLayout;
  return (
    <div className="month-calendar" ref={containerRef} data-layout={layout}>
      {mode === 'notice' ? (
        <NoticeCalendar
          period={period}
          records={records}
          projects={projects}
          holidays={holidays}
          layout={layout}
          onOpenRecord={onOpenRecord}
          onCreateDate={onCreateDate}
        />
      ) : (
        <EventRangeCalendar
          period={period}
          records={records}
          projects={projects}
          holidays={holidays}
          layout={layout}
          onOpenRecord={onOpenRecord}
          onCreateDate={onCreateDate}
        />
      )}
    </div>
  );
}
