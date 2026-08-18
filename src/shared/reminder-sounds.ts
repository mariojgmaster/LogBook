export const REMINDER_SOUND_IDS = [
  'gentle-bell',
  'bright-chime',
  'soft-knock',
  'digital-ping',
  'calm-gong',
] as const;

export type ReminderSoundId = (typeof REMINDER_SOUND_IDS)[number];

export interface ReminderSound {
  id: ReminderSoundId;
  label: string;
  assetPath: string;
  durationMs: number;
}

export const REMINDER_SOUNDS: readonly ReminderSound[] = [
  { id: 'gentle-bell', label: 'Sino suave', assetPath: 'sounds/reminder-01.wav', durationMs: 700 },
  {
    id: 'bright-chime',
    label: 'Carrilhão claro',
    assetPath: 'sounds/reminder-02.wav',
    durationMs: 650,
  },
  {
    id: 'soft-knock',
    label: 'Toque discreto',
    assetPath: 'sounds/reminder-03.wav',
    durationMs: 500,
  },
  {
    id: 'digital-ping',
    label: 'Ping digital',
    assetPath: 'sounds/reminder-04.wav',
    durationMs: 550,
  },
  { id: 'calm-gong', label: 'Gongo calmo', assetPath: 'sounds/reminder-05.wav', durationMs: 900 },
] as const;

export const DEFAULT_REMINDER_SOUND_ID: ReminderSoundId = REMINDER_SOUNDS[0]!.id;

export const findReminderSound = (id: string): ReminderSound | undefined =>
  REMINDER_SOUNDS.find((sound) => sound.id === id);
