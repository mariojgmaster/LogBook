import { Badge, Button, List, Typography } from 'antd';
import type { LogRecordProps } from '@/domain/entities/log-record';
import type { Period } from '@/domain/value-objects/period';
import { LocalDate } from '@/domain/value-objects/local-date';

export function MonthlyView({
  period,
  records,
  onOpenDay,
}: {
  period: Period;
  records: LogRecordProps[];
  onOpenDay: (date: string) => void;
}) {
  const counts = new Map<string, number>();
  records.forEach((record) =>
    counts.set(record.localDate, (counts.get(record.localDate) ?? 0) + 1),
  );
  const days: string[] = [];
  let current = LocalDate.parse(period.start);
  while (current.value <= period.end) {
    days.push(current.value);
    current = current.addDays(1);
  }
  const offset = LocalDate.parse(period.start).dayOfWeek();
  return (
    <>
      <div className="calendar-grid desktop-only" aria-label="Calendário mensal">
        {Array.from({ length: offset }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {days.map((date) => (
          <button
            type="button"
            className="calendar-day"
            key={date}
            onClick={() => onOpenDay(date)}
            aria-label={`${date}: ${counts.get(date) ?? 0} registros`}
          >
            <Typography.Text strong>{Number(date.slice(-2))}</Typography.Text>
            <br />
            {(counts.get(date) ?? 0) > 0 && (
              <Badge count={counts.get(date)} showZero={false} color="#65d6ad" />
            )}
          </button>
        ))}
      </div>
      <List
        className="mobile-only"
        style={{ display: 'block' }}
        dataSource={days}
        renderItem={(date) => (
          <List.Item
            actions={[
              <Button key="open" type="link" onClick={() => onOpenDay(date)}>
                Abrir
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: 'long',
                weekday: 'short',
                timeZone: 'UTC',
              }).format(new Date(`${date}T12:00:00Z`))}
              description={`${counts.get(date) ?? 0} registro(s)`}
            />
          </List.Item>
        )}
      />
    </>
  );
}
