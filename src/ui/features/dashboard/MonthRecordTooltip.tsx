import type { ReactElement } from 'react';
import { Tooltip } from 'antd';
import type { LogRecordProps } from '@/domain/entities/log-record';
import { formatClockTime } from '@/domain/value-objects/time-range';

export function MonthRecordTooltip({
  record,
  projectName,
  children,
}: {
  record: LogRecordProps;
  projectName: string;
  children: ReactElement;
}) {
  return (
    <Tooltip
      placement="top"
      mouseEnterDelay={0.3}
      title={
        <dl className="month-record-tooltip">
          <dt>Projeto</dt>
          <dd>{projectName}</dd>
          <dt>Período</dt>
          <dd>{formatRecordPeriod(record)}</dd>
          <dt>Descrição</dt>
          <dd>{record.details}</dd>
        </dl>
      }
    >
      {children}
    </Tooltip>
  );
}

const formatRecordPeriod = (record: LogRecordProps) => {
  const endDate = record.endLocalDate ?? record.localDate;
  const start = `${formatDate(record.localDate)} ${formatClockTime(record.startMinute)}`;
  const end = `${formatDate(endDate)} ${formatClockTime(record.endMinute)}`;
  return record.localDate === endDate
    ? `${formatDate(record.localDate)}, ${formatClockTime(record.startMinute)}–${formatClockTime(record.endMinute)}`
    : `${start} → ${end}`;
};

const formatDate = (value: string) => value.split('-').reverse().join('/');
