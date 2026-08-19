import { AppError } from '@/domain/errors/app-error';

export const formatDurationClock = (minutes: number): string => {
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 2_880) throw durationClockError();
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

export const parseDurationClock = (input: string, maxMinutes = 2_880): number => {
  const match = /^(\d{2}):([0-5]\d)$/.exec(input.trim());
  if (!match) throw durationClockError();
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  if (minutes < 1 || minutes > maxMinutes) throw durationClockError();
  return minutes;
};

const durationClockError = () =>
  new AppError('VALIDATION', {
    snoozeTime: 'Informe o adiamento no formato HH:mm, entre 00:01 e 48:00.',
  });
