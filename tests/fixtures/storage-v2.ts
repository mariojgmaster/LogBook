const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const RECORD_ID = '22222222-2222-4222-8222-222222222222';
const TIMESTAMP = '2026-08-17T12:00:00.000Z';

export const storageV2Ids = { project: PROJECT_ID, record: RECORD_ID } as const;

export const buildV1Project = (overrides: Record<string, unknown> = {}) => ({
  id: PROJECT_ID,
  name: 'Projeto Alpha',
  normalizedName: 'projeto alpha',
  status: 'active' as const,
  revision: 1,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
});

export const buildV2Project = (overrides: Record<string, unknown> = {}) => ({
  ...buildV1Project(),
  colorSlot: 0,
  ...overrides,
});

export const buildV1Record = (overrides: Record<string, unknown> = {}) => ({
  id: RECORD_ID,
  projectId: PROJECT_ID,
  localDate: '2026-08-16',
  startMinute: 540,
  endMinute: 600,
  durationMinutes: 60,
  details: 'Atividade de teste',
  revision: 1,
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  ...overrides,
});

export const buildV2Record = (overrides: Record<string, unknown> = {}) => ({
  ...buildV1Record(),
  endLocalDate: '2026-08-16',
  ...overrides,
});

export const buildV1SettingsEnvelope = (overrides: Record<string, unknown> = {}) => ({
  version: 1 as const,
  value: { revision: 1, updatedAt: TIMESTAMP, ...overrides },
});

export const buildV2SettingsEnvelope = (overrides: Record<string, unknown> = {}) => ({
  version: 2 as const,
  value: {
    revision: 1,
    updatedAt: TIMESTAMP,
    monthViewMode: 'notice' as const,
    reminderSoundId: 'gentle-bell',
    ...overrides,
  },
});

const draftBase = { surface: 'sidepanel' as const, updatedAt: TIMESTAMP };

export const buildRecordDraft = (overrides: Record<string, unknown> = {}) => ({
  ...draftBase,
  id: 'sidepanel:record:create:2026-08-16',
  formKind: 'record' as const,
  intent: 'create' as const,
  contextKey: '2026-08-16',
  values: {
    formKind: 'record' as const,
    localDate: '2026-08-16',
    durationHours: '1',
    details: 'Em edição',
  },
  ...overrides,
});

export const buildProjectDraft = (overrides: Record<string, unknown> = {}) => ({
  ...draftBase,
  id: 'sidepanel:project:create',
  formKind: 'project' as const,
  intent: 'create' as const,
  contextKey: 'create',
  values: { formKind: 'project' as const, name: 'Novo projeto' },
  ...overrides,
});

export const buildSettingsDraft = (overrides: Record<string, unknown> = {}) => ({
  ...draftBase,
  id: 'sidepanel:settings:month-view',
  formKind: 'settings' as const,
  intent: 'update' as const,
  contextKey: 'month-view',
  values: {
    formKind: 'settings' as const,
    section: 'month-view' as const,
    fields: { monthViewMode: 'eventRange' },
  },
  ...overrides,
});

export const buildSnoozeDraft = (overrides: Record<string, unknown> = {}) => ({
  id: 'reminder:snooze:morning:2026-08-17',
  surface: 'reminder' as const,
  formKind: 'snooze' as const,
  intent: 'update' as const,
  contextKey: 'morning:2026-08-17',
  values: {
    formKind: 'snooze' as const,
    slotId: 'morning',
    targetLocalDate: '2026-08-17',
    durationHours: '0,25',
  },
  updatedAt: TIMESTAMP,
  ...overrides,
});

export const invalidStorageV2Snapshots = {
  projectWithoutColor: buildV1Project(),
  projectWithInvalidColor: buildV2Project({ colorSlot: 12 }),
  recordWithInvalidEndDate: buildV2Record({ endLocalDate: '2026-08-18' }),
  oversizedDraft: buildRecordDraft({ values: { details: 'x'.repeat(8_193) } }),
  draftWithUnknownField: buildProjectDraft({ values: { name: 'Projeto', colorSlot: 4 } }),
  settingsWithUnknownSound: buildV2SettingsEnvelope({ reminderSoundId: 'unknown-sound' }),
} as const;
