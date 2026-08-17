import { Card } from 'antd';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { ProjectProps } from '@/domain/entities/project';
import type { Period } from '@/domain/value-objects/period';
import { LocalDate } from '@/domain/value-objects/local-date';
import { DailyView } from './DailyView';

export function FortnightView({
  period,
  records,
  projects,
  onOpen,
  onCreate,
}: {
  period: Period;
  records: LogRecordProps[];
  projects: ProjectProps[];
  onOpen: (record: LogRecordProps) => void;
  onCreate: (date: string) => void;
}) {
  const days: string[] = [];
  let current = LocalDate.parse(period.start);
  while (current.value <= period.end) {
    days.push(current.value);
    current = current.addDays(1);
  }
  return (
    <div className="fortnight-grid">
      {days.map((date) => (
        <Card
          key={date}
          title={new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            timeZone: 'UTC',
          }).format(new Date(`${date}T12:00:00Z`))}
        >
          <DailyView
            records={records.filter((record) => record.localDate === date)}
            projects={projects}
            onOpen={onOpen}
            onCreate={() => onCreate(date)}
          />
        </Card>
      ))}
    </div>
  );
}
