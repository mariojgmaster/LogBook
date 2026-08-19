import { AppError } from '@/domain/errors/app-error';

const reverseMaps = new Map<number, ReadonlyMap<string, number>>();

export const formatDurationHours = (minutes: number): string => {
  if (!Number.isInteger(minutes) || minutes < 0) throw durationError();
  const fixed = (minutes / 60).toFixed(4);
  return fixed.replace(/\.?(?:0+)$/, '').replace('.', ',');
};

export const parseDurationHours = (input: string, maxMinutes = 2_880): number => {
  const value = input.trim().replace('.', ',');
  if (!/^\d+(?:,\d+)?$/.test(value)) throw durationError();
  const canonicalInput = trimDecimalZeroes(value);
  const [, fraction = ''] = canonicalInput.split(',');
  if (fraction.length > 4) throw durationError();

  const scale = 10 ** fraction.length;
  const numerator = Number(canonicalInput.replace(',', ''));
  const product = numerator * 60;
  if (Number.isSafeInteger(product) && product % scale === 0) {
    const minutes = product / scale;
    if (minutes >= 1 && minutes <= maxMinutes) return minutes;
  }

  const recurring = getReverseMap(maxMinutes).get(canonicalInput);
  if (recurring !== undefined) return recurring;
  throw durationError();
};

const getReverseMap = (maxMinutes: number): ReadonlyMap<string, number> => {
  let map = reverseMaps.get(maxMinutes);
  if (!map) {
    const generated = new Map<string, number>();
    for (let minutes = 1; minutes <= maxMinutes; minutes += 1) {
      generated.set(formatDurationHours(minutes), minutes);
    }
    map = generated;
    reverseMaps.set(maxMinutes, map);
  }
  return map;
};

const trimDecimalZeroes = (value: string): string => {
  if (!value.includes(',')) return value.replace(/^0+(?=\d)/, '') || '0';
  const [integer, fraction] = value.split(',');
  const trimmedFraction = fraction!.replace(/0+$/, '');
  const normalizedInteger = integer!.replace(/^0+(?=\d)/, '') || '0';
  return trimmedFraction ? `${normalizedInteger},${trimmedFraction}` : normalizedInteger;
};

const durationError = () =>
  new AppError('VALIDATION', {
    durationHours: 'Informe uma duração em horas válida, com até quatro casas decimais.',
  });
