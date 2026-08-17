import type { ReminderOccurrence } from '@/domain/entities/reminder-schedule';

export interface Clock {
  now(): Date;
}
export interface IdGenerator {
  next(): string;
}
export interface AlarmPort {
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  schedule(occurrence: ReminderOccurrence): Promise<void>;
  cancel(name: string): Promise<boolean>;
  list(): Promise<Array<{ name: string; when: number }>>;
}

export const systemClock: Clock = { now: () => new Date() };
export const cryptoIdGenerator: IdGenerator = { next: () => crypto.randomUUID() };
