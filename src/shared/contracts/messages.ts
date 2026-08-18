import { z } from 'zod';
import { APP_ERROR_CODES } from '@/domain/errors/app-error';
import { REMINDER_SOUND_IDS } from '@/shared/reminder-sounds';
export { REMINDER_SOUND_IDS } from '@/shared/reminder-sounds';

const strictObject = <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict();
const projectInput = strictObject({ name: z.string().trim().min(1).max(100) });
const recordInput = strictObject({
  projectId: z.string().uuid(),
  localDate: z.iso.date(),
  startMinute: z.number().int().min(0).max(1439),
  endLocalDate: z.iso.date().optional(),
  endMinute: z.number().int().min(0).max(1439).optional(),
  durationMinutes: z.number().int().min(1).max(1440).optional(),
  withoutLunchBreak: z.boolean().optional(),
  details: z.string().trim().min(1).max(2000),
}).superRefine((value, context) => {
  const usesEnd = value.endMinute !== undefined || value.endLocalDate !== undefined;
  const valid =
    value.durationMinutes !== undefined
      ? !usesEnd
      : value.endMinute !== undefined && value.endLocalDate !== undefined;
  if (!valid) context.addIssue({ code: 'custom', message: 'Informe fim completo ou duração.' });
});
const periodInput = strictObject({
  start: z.iso.date(),
  end: z.iso.date(),
  mode: z.enum(['day', 'fortnight', 'month']),
  projectIds: z.array(z.string().uuid()).optional(),
  search: z.string().max(2000).optional(),
});

export const settingsDraftSectionSchema = z.enum([
  'region',
  'workdays',
  'reminders',
  'month-view',
  'reminder-sound',
]);

const draftContextSchema = strictObject({
  id: z.string().min(1).max(240).optional(),
  surface: z.enum(['sidepanel', 'reminder']),
  formKind: z.enum(['record', 'project', 'settings', 'snooze']),
  intent: z.enum(['create', 'edit', 'update']),
  entityId: z.string().uuid().optional(),
  contextKey: z.string().min(1).max(200),
  updatedAt: z.iso.datetime().optional(),
}).superRefine((value, context) => {
  if (value.surface === 'reminder' && !['record', 'snooze'].includes(value.formKind)) {
    context.addIssue({ code: 'custom', message: 'Formulário incompatível com lembrete.' });
  }
  if (value.surface === 'sidepanel' && value.formKind === 'snooze') {
    context.addIssue({ code: 'custom', message: 'Snooze pertence ao lembrete.' });
  }
  if (value.intent === 'edit' && !value.entityId) {
    context.addIssue({ code: 'custom', message: 'Edição exige entidade.' });
  }
});

const recordDraftValues = strictObject({
  formKind: z.literal('record'),
  projectId: z.string().uuid().optional(),
  localDate: z.iso.date().optional(),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  mode: z.enum(['end', 'duration']).optional(),
  endLocalDate: z.iso.date().optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  durationHours: z.string().max(32).optional(),
  withoutLunchBreak: z.boolean().optional(),
  details: z.string().max(2000).optional(),
});
const projectDraftValues = strictObject({
  formKind: z.literal('project'),
  name: z.string().max(120).optional(),
});
const settingFieldValue = z.union([
  z.string().max(200),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().max(100)).max(31),
  z.array(z.number().int()).max(31),
  z.null(),
]);
const settingsDraftValues = strictObject({
  formKind: z.literal('settings'),
  section: settingsDraftSectionSchema,
  fields: z.record(z.string().max(40), settingFieldValue),
});
const snoozeDraftValues = strictObject({
  formKind: z.literal('snooze'),
  slotId: z.string().max(200).optional(),
  targetLocalDate: z.iso.date().optional(),
  durationHours: z.string().max(32).optional(),
});
const draftValuesSchema = z.discriminatedUnion('formKind', [
  recordDraftValues,
  projectDraftValues,
  settingsDraftValues,
  snoozeDraftValues,
]);

const draftPayloadSchema = draftContextSchema;
const draftUpsertPayloadSchema = draftContextSchema
  .safeExtend({ values: draftValuesSchema })
  .superRefine((value, context) => {
    if (value.formKind !== value.values.formKind) {
      context.addIssue({ code: 'custom', message: 'Tipos de rascunho incompatíveis.' });
    }
    if (
      value.values.formKind === 'settings' &&
      (value.contextKey !== value.values.section || !validateSettingsFields(value.values))
    ) {
      context.addIssue({ code: 'custom', message: 'Seção ou campos não permitidos.' });
    }
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 8 * 1024) {
      context.addIssue({ code: 'custom', message: 'Rascunho excede 8 KiB.' });
    }
  });

const commonIdRevision = {
  id: z.string().uuid(),
  expectedRevision: z.number().int().positive(),
};

export const requestSchema = z.discriminatedUnion('type', [
  strictObject({ type: z.literal('project.create'), payload: projectInput }),
  strictObject({
    type: z.literal('project.list'),
    payload: strictObject({ includeArchived: z.boolean().optional() }),
  }),
  strictObject({
    type: z.literal('project.update'),
    payload: strictObject({ ...commonIdRevision, name: z.string().trim().min(1).max(100) }),
  }),
  strictObject({ type: z.literal('project.archive'), payload: strictObject(commonIdRevision) }),
  strictObject({ type: z.literal('project.restore'), payload: strictObject(commonIdRevision) }),
  strictObject({ type: z.literal('project.remove'), payload: strictObject(commonIdRevision) }),
  strictObject({ type: z.literal('record.create'), payload: recordInput }),
  strictObject({
    type: z.literal('record.update'),
    payload: strictObject({ id: z.string().uuid(), record: recordInput }),
  }),
  strictObject({ type: z.literal('record.delete'), payload: strictObject(commonIdRevision) }),
  strictObject({ type: z.literal('record.listPeriod'), payload: periodInput }),
  strictObject({
    type: z.literal('summary.getPeriod'),
    payload: periodInput.pick({ start: true, end: true, mode: true }).strict(),
  }),
  strictObject({ type: z.literal('settings.get'), payload: strictObject({}) }),
  strictObject({
    type: z.literal('settings.updateRegion'),
    payload: strictObject({
      uf: z.string().regex(/^[A-Z]{2}$/),
      municipalityCode: z
        .string()
        .regex(/^\d{7}$/)
        .optional(),
      expectedRevision: z.number().int().positive(),
      confirmed: z.boolean(),
    }),
  }),
  strictObject({
    type: z.literal('settings.updateMonthView'),
    payload: strictObject({
      mode: z.enum(['notice', 'eventRange']),
      expectedRevision: z.number().int().positive(),
    }),
  }),
  strictObject({
    type: z.literal('settings.updateReminderSound'),
    payload: strictObject({
      soundId: z.enum(REMINDER_SOUND_IDS),
      expectedRevision: z.number().int().positive(),
    }),
  }),
  strictObject({
    type: z.literal('reminder.update'),
    payload: strictObject({
      enabled: z.boolean(),
      weekdays: z.array(z.number().int().min(0).max(6)).min(1),
      times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
      snoozeMinutes: z.number().int().min(1).max(2880),
      expectedRevision: z.number().int().positive(),
    }),
  }),
  strictObject({
    type: z.literal('reminder.snooze'),
    payload: strictObject({
      slotId: z.string().min(1).max(200),
      when: z.number().positive(),
      targetLocalDate: z.iso.date(),
      minutes: z.number().int().min(1).max(2880),
    }),
  }),
  strictObject({
    type: z.literal('reminder.reconcile'),
    payload: strictObject({ requestPermission: z.boolean().optional() }),
  }),
  strictObject({ type: z.literal('holiday.coverage'), payload: strictObject({}) }),
  strictObject({
    type: z.literal('holiday.listPeriod'),
    payload: strictObject({ start: z.iso.date(), end: z.iso.date() }).refine(
      (value) => value.end >= value.start,
      { message: 'Período inválido.' },
    ),
  }),
  strictObject({ type: z.literal('draft.get'), payload: draftPayloadSchema }),
  strictObject({ type: z.literal('draft.upsert'), payload: draftUpsertPayloadSchema }),
  strictObject({ type: z.literal('draft.delete'), payload: draftPayloadSchema }),
]);

export const audioRequestSchema = strictObject({
  type: z.literal('audio.play'),
  target: z.literal('offscreen'),
  payload: strictObject({
    soundId: z.enum(REMINDER_SOUND_IDS),
    playbackId: z.string().min(1).max(240),
  }),
});

export type AppRequest = z.infer<typeof requestSchema>;
export type FormDraft = z.infer<typeof draftUpsertPayloadSchema>;
export const appErrorSchema = strictObject({
  code: z.enum(APP_ERROR_CODES),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});
export const responseSchema = z.discriminatedUnion('ok', [
  strictObject({ ok: z.literal(true), data: z.unknown() }),
  strictObject({ ok: z.literal(false), error: appErrorSchema }),
]);
export type AppResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: z.infer<typeof appErrorSchema> };
export const entityChangedEventSchema = strictObject({
  type: z.literal('entity.changed'),
  entity: z.enum(['project', 'record', 'settings', 'reminder', 'draft', 'preferences']),
  id: z.string(),
  revision: z.number().int().positive(),
});
export const reminderOpenedEventSchema = strictObject({
  type: z.literal('reminder.opened'),
  targetLocalDate: z.iso.date(),
  slotId: z.string().min(1),
});

const SETTINGS_FIELDS: Record<z.infer<typeof settingsDraftSectionSchema>, ReadonlySet<string>> = {
  region: new Set(['uf', 'municipalityCode']),
  workdays: new Set(['weekdays', 'startTime', 'endTime']),
  reminders: new Set(['enabled', 'weekdays', 'times', 'snoozeTime', 'snoozeHours']),
  'month-view': new Set(['monthViewMode']),
  'reminder-sound': new Set(['reminderSoundId']),
};

const validateSettingsFields = (value: z.infer<typeof settingsDraftValues>): boolean =>
  Object.keys(value.fields).every((field) => SETTINGS_FIELDS[value.section].has(field));
