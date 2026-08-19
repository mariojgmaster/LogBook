import { AppError } from '@/domain/errors/app-error';
import { LocalDate } from '@/domain/value-objects/local-date';
import { TimeRange } from '@/domain/value-objects/time-range';

export interface LogRecordProps {
  id: string;
  projectId: string;
  localDate: string;
  startMinute: number;
  endLocalDate?: string;
  endMinute: number;
  durationMinutes: number;
  isEvent?: boolean;
  withoutLunchBreak?: boolean;
  details: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLogRecordInput {
  id: string;
  projectId: string;
  localDate: string;
  startMinute?: number;
  endLocalDate?: string;
  endMinute?: number;
  durationMinutes?: number;
  isEvent?: boolean;
  withoutLunchBreak?: boolean;
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
    if (input.isEvent) {
      const timestamp = input.now.toISOString();
      return new LogRecord({
        id: input.id,
        projectId: input.projectId,
        localDate: date.value,
        startMinute: 0,
        endLocalDate: date.value,
        endMinute: 0,
        durationMinutes: 0,
        isEvent: true,
        withoutLunchBreak: true,
        details,
        revision: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    if (input.startMinute === undefined) {
      throw new AppError('VALIDATION', { startTime: 'Informe o início.' });
    }
    if ((input.endMinute === undefined) === (input.durationMinutes === undefined)) {
      throw new AppError('VALIDATION', { endTime: 'Informe o fim ou a duração, mas não ambos.' });
    }

    const withoutLunchBreak = input.withoutLunchBreak ?? true;
    const lunchMinutes = withoutLunchBreak ? 0 : 60;
    const { range, endDate, durationMinutes } = resolveRange(input, date, lunchMinutes);
    assertNotFuture(date, range.startMinute, input.now);
    const timestamp = input.now.toISOString();
    return new LogRecord({
      id: input.id,
      projectId: input.projectId,
      localDate: date.value,
      startMinute: range.startMinute,
      endLocalDate: endDate.value,
      endMinute: range.endMinute,
      durationMinutes,
      withoutLunchBreak,
      details,
      revision: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  static restore(props: LogRecordProps): LogRecord {
    if (props.isEvent) {
      if (
        props.startMinute !== 0 ||
        props.endMinute !== 0 ||
        props.durationMinutes !== 0 ||
        props.endLocalDate !== props.localDate ||
        props.revision < 1 ||
        !props.id ||
        !props.projectId ||
        !props.details.trim()
      ) {
        throw new AppError('STORAGE_UNAVAILABLE');
      }
      return new LogRecord({ ...props, isEvent: true, withoutLunchBreak: true });
    }
    const startDate = LocalDate.parse(props.localDate);
    if (!props.endLocalDate) throw new AppError('STORAGE_UNAVAILABLE');
    const endDate = LocalDate.parse(props.endLocalDate);
    const comparison = getDayOffset(startDate, endDate, 'STORAGE_UNAVAILABLE');
    let range: TimeRange;
    try {
      range = TimeRange.fromEnd(props.startMinute, props.endMinute, comparison);
    } catch {
      throw new AppError('STORAGE_UNAVAILABLE');
    }
    const withoutLunchBreak = props.withoutLunchBreak ?? true;
    const expectedDuration = range.durationMinutes - (withoutLunchBreak ? 0 : 60);
    if (
      expectedDuration < 1 ||
      expectedDuration !== props.durationMinutes ||
      props.revision < 1 ||
      !props.id ||
      !props.projectId
    ) {
      throw new AppError('STORAGE_UNAVAILABLE');
    }
    return new LogRecord({ ...props, withoutLunchBreak });
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

const resolveRange = (input: CreateLogRecordInput, startDate: LocalDate, lunchMinutes: number) => {
  if (input.startMinute === undefined) {
    throw new AppError('VALIDATION', { startTime: 'Informe o início.' });
  }
  if (input.durationMinutes !== undefined) {
    const range = TimeRange.fromDuration(input.startMinute, input.durationMinutes + lunchMinutes);
    return {
      range,
      endDate: startDate.addDays(range.dayOffset),
      durationMinutes: input.durationMinutes,
    };
  }
  const requestedEndDate = input.endLocalDate ? LocalDate.parse(input.endLocalDate) : startDate;
  const comparison = getDayOffset(startDate, requestedEndDate, 'VALIDATION');
  if (input.endMinute === 1440 && comparison === 0) {
    const range = TimeRange.fromEnd(input.startMinute, 1440);
    return {
      range,
      endDate: startDate.addDays(1),
      durationMinutes: netDuration(range.durationMinutes, lunchMinutes),
    };
  }
  if (input.endMinute === undefined) {
    throw new AppError('VALIDATION', { endTime: 'Informe o horário final.' });
  }
  const range = TimeRange.fromEnd(input.startMinute, input.endMinute, comparison);
  return {
    range,
    endDate: requestedEndDate,
    durationMinutes: netDuration(range.durationMinutes, lunchMinutes),
  };
};

const netDuration = (elapsedMinutes: number, lunchMinutes: number) => {
  const durationMinutes = elapsedMinutes - lunchMinutes;
  if (durationMinutes < 1) {
    throw new AppError('VALIDATION', {
      endTime: 'O intervalo deve superar 1h quando houver horário de almoço.',
    });
  }
  return durationMinutes;
};

const getDayOffset = (
  startDate: LocalDate,
  endDate: LocalDate,
  code: 'VALIDATION' | 'STORAGE_UNAVAILABLE',
): 0 | 1 => {
  if (endDate.value === startDate.value) return 0;
  if (endDate.value === startDate.addDays(1).value) return 1;
  throw new AppError(
    code,
    code === 'VALIDATION'
      ? { endLocalDate: 'A data final deve ser a mesma ou a seguinte.' }
      : undefined,
  );
};

const assertNotFuture = (date: LocalDate, startMinute: number, now: Date) => {
  const today = LocalDate.fromDate(now);
  const comparison = date.compare(today);
  const currentMinute = now.getHours() * 60 + now.getMinutes();
  if (comparison > 0 || (comparison === 0 && startMinute > currentMinute)) {
    throw new AppError('VALIDATION', { startTime: 'O início não pode estar no futuro.' });
  }
};
