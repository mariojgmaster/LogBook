import { AppError } from '@/domain/errors/app-error';

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export class LocalDate {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static parse(value: string): LocalDate {
    const match = LOCAL_DATE_PATTERN.exec(value);
    if (!match) throw new AppError('VALIDATION', { date: 'Use uma data válida.' });
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new AppError('VALIDATION', { date: 'Use uma data válida.' });
    }
    return new LocalDate(value);
  }

  static fromDate(date: Date): LocalDate {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return new LocalDate(`${year}-${month}-${day}`);
  }

  compare(other: LocalDate): number {
    return this.value.localeCompare(other.value);
  }

  addDays(days: number): LocalDate {
    const [year, month, day] = this.parts();
    const date = new Date(year, month - 1, day + days, 12);
    return LocalDate.fromDate(date);
  }

  dayOfWeek(): number {
    const [year, month, day] = this.parts();
    return new Date(year, month - 1, day, 12).getDay();
  }

  parts(): readonly [number, number, number] {
    const [year, month, day] = this.value.split('-').map(Number);
    if (year === undefined || month === undefined || day === undefined) {
      throw new AppError('VALIDATION', { date: 'Use uma data válida.' });
    }
    return [year, month, day];
  }

  toString(): string {
    return this.value;
  }
}
