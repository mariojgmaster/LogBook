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

export interface SidePanelPort {
  enableActionClick(): Promise<void>;
  open(windowId?: number): Promise<void>;
}

export interface OptionalPermissionPort {
  contains(permissions: readonly 'alarms'[]): Promise<boolean>;
  request(permissions: readonly 'alarms'[]): Promise<boolean>;
  ensure(permissions: readonly 'alarms'[]): Promise<boolean>;
}

export interface ReminderWindowPort {
  openOrFocus(targetLocalDate: string, slotId: string): Promise<number>;
  forget(windowId: number): Promise<void>;
}

export interface ReminderAudioPort {
  play(soundId: string, playbackId: string): Promise<void>;
  close(): Promise<void>;
}

export interface ClipboardPort {
  writeText(value: string): Promise<void>;
}

export const systemClock: Clock = { now: () => new Date() };
export const cryptoIdGenerator: IdGenerator = { next: () => crypto.randomUUID() };
