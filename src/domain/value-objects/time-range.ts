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
  readonly dayOffset: 0 | 1;
  readonly durationMinutes: number;

  private constructor(startMinute: number, endMinute: number, dayOffset: 0 | 1) {
    this.startMinute = startMinute;
    this.endMinute = endMinute;
    this.dayOffset = dayOffset;
    this.durationMinutes = dayOffset * 1440 + endMinute - startMinute;
  }

  static fromEnd(startMinute: number, endMinute: number, dayOffset: 0 | 1 = 0): TimeRange {
    validateMinute(startMinute, 0, 1439, 'startTime');
    if (endMinute === 1440 && dayOffset === 0) return new TimeRange(startMinute, 0, 1);
    validateMinute(endMinute, dayOffset === 0 ? 1 : 0, 1439, 'endTime');
    const duration = dayOffset * 1440 + endMinute - startMinute;
    if (duration < 1 || duration > 1440) {
      throw new AppError('VALIDATION', { endTime: 'O intervalo deve durar até 24 horas.' });
    }
    return new TimeRange(startMinute, endMinute, dayOffset);
  }

  static fromDuration(startMinute: number, durationMinutes: number): TimeRange {
    validateMinute(startMinute, 0, 1439, 'startTime');
    validateMinute(durationMinutes, 1, 1440, 'durationMinutes');
    const absoluteEnd = startMinute + durationMinutes;
    const dayOffset = absoluteEnd >= 1440 ? 1 : 0;
    return new TimeRange(startMinute, absoluteEnd % 1440, dayOffset);
  }
}

const validateMinute = (value: number, min: number, max: number, field: string) => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new AppError('VALIDATION', { [field]: `Informe um valor entre ${min} e ${max}.` });
  }
};
