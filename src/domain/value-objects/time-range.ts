import { AppError } from '@/domain/errors/app-error';

export const parseClockTime = (value: string): number => {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new AppError('VALIDATION', { time: 'Use o formato HH:mm.' });
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    throw new AppError('VALIDATION', { time: 'Use um horário válido.' });
  }
  return hours * 60 + minutes;
};

export const formatClockTime = (minute: number): string => {
  if (!Number.isInteger(minute) || minute < 0 || minute > 1440) {
    throw new AppError('VALIDATION', { time: 'Minuto inválido.' });
  }
  if (minute === 1440) return '24:00';
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
};

export class TimeRange {
  readonly startMinute: number;
  readonly endMinute: number;
  readonly durationMinutes: number;

  private constructor(startMinute: number, endMinute: number) {
    this.startMinute = startMinute;
    this.endMinute = endMinute;
    this.durationMinutes = endMinute - startMinute;
  }

  static fromEnd(startMinute: number, endMinute: number): TimeRange {
    validateMinute(startMinute, 0, 1439, 'startTime');
    validateMinute(endMinute, 1, 1440, 'endTime');
    if (endMinute <= startMinute) {
      throw new AppError('VALIDATION', {
        endTime: 'O fim deve ser posterior ao início no mesmo dia.',
      });
    }
    return new TimeRange(startMinute, endMinute);
  }

  static fromDuration(startMinute: number, durationMinutes: number): TimeRange {
    validateMinute(startMinute, 0, 1439, 'startTime');
    validateMinute(durationMinutes, 1, 1440, 'durationMinutes');
    const endMinute = startMinute + durationMinutes;
    if (endMinute > 1440) {
      throw new AppError('VALIDATION', { durationMinutes: 'A tarefa deve terminar no mesmo dia.' });
    }
    return new TimeRange(startMinute, endMinute);
  }
}

const validateMinute = (value: number, min: number, max: number, field: string) => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError('VALIDATION', { [field]: `Informe um valor entre ${min} e ${max}.` });
  }
};
