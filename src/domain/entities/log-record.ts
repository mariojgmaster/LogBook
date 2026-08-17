import { AppError } from '@/domain/errors/app-error';
import { LocalDate } from '@/domain/value-objects/local-date';
import { TimeRange } from '@/domain/value-objects/time-range';

export interface LogRecordProps {
  id: string;
  projectId: string;
  localDate: string;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
  details: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLogRecordInput {
  id: string;
  projectId: string;
  localDate: string;
  startMinute: number;
  endMinute?: number;
  durationMinutes?: number;
  details: string;
  now: Date;
}

export class LogRecord {
  private constructor(readonly props: Readonly<LogRecordProps>) {}

  static create(input: CreateLogRecordInput): LogRecord {
    if (!input.id || !input.projectId) throw new AppError('VALIDATION');
    const date = LocalDate.parse(input.localDate);
    const details = input.details.trim();
    if (details.length < 1 || details.length > 2_000) {
      throw new AppError('VALIDATION', {
        details: 'Os detalhes devem ter entre 1 e 2.000 caracteres.',
      });
    }
    if ((input.endMinute === undefined) === (input.durationMinutes === undefined)) {
      throw new AppError('VALIDATION', { endTime: 'Informe o fim ou a duração, mas não ambos.' });
    }
    const range =
      input.endMinute !== undefined
        ? TimeRange.fromEnd(input.startMinute, input.endMinute)
        : TimeRange.fromDuration(input.startMinute, input.durationMinutes!);
    assertNotFuture(date, range.startMinute, input.now);
    const timestamp = input.now.toISOString();
    return new LogRecord({
      id: input.id,
      projectId: input.projectId,
      localDate: date.value,
      startMinute: range.startMinute,
      endMinute: range.endMinute,
      durationMinutes: range.durationMinutes,
      details,
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static restore(props: LogRecordProps): LogRecord {
    LocalDate.parse(props.localDate);
    const range = TimeRange.fromEnd(props.startMinute, props.endMinute);
    if (
      range.durationMinutes !== props.durationMinutes ||
      props.revision < 1 ||
      !props.id ||
      !props.projectId
    ) {
      throw new AppError('STORAGE_UNAVAILABLE');
    }
    return new LogRecord({ ...props });
  }

  update(input: Omit<CreateLogRecordInput, 'id' | 'now'> & { now: Date }): LogRecord {
    const updated = LogRecord.create({ ...input, id: this.props.id });
    return new LogRecord({
      ...updated.props,
      revision: this.props.revision + 1,
      createdAt: this.props.createdAt,
    });
  }
}

const assertNotFuture = (date: LocalDate, startMinute: number, now: Date) => {
  const today = LocalDate.fromDate(now);
  const comparison = date.compare(today);
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  if (comparison > 0 || (comparison === 0 && startMinute > currentMinute)) {
    throw new AppError('VALIDATION', { startTime: 'O início não pode estar no futuro.' });
  }
};
