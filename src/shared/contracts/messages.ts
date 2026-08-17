import { z } from 'zod';
import { APP_ERROR_CODES } from '@/domain/errors/app-error';

const projectInput = z.object({ name: z.string().trim().min(1).max(100) });
const recordInput = z
  .object({
    projectId: z.string().uuid(),
    localDate: z.iso.date(),
    startMinute: z.number().int().min(0).max(1439),
    endMinute: z.number().int().min(1).max(1440).optional(),
    durationMinutes: z.number().int().min(1).max(1440).optional(),
    details: z.string().trim().min(1).max(2000),
  })
  .refine((value) => (value.endMinute === undefined) !== (value.durationMinutes === undefined), {
    message: 'Informe fim ou duração.',
  });
const periodInput = z.object({
  start: z.iso.date(),
  end: z.iso.date(),
  mode: z.enum(['day', 'fortnight', 'month']),
  projectIds: z.array(z.string().uuid()).optional(),
  search: z.string().max(2000).optional(),
});

export const requestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('project.create'), payload: projectInput }),
  z.object({
    type: z.literal('project.list'),
    payload: z.object({ includeArchived: z.boolean().optional() }),
  }),
  z.object({
    type: z.literal('project.update'),
    payload: z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1).max(100),
      expectedRevision: z.number().int().positive(),
    }),
  }),
  z.object({
    type: z.literal('project.archive'),
    payload: z.object({ id: z.string().uuid(), expectedRevision: z.number().int().positive() }),
  }),
  z.object({ type: z.literal('record.create'), payload: recordInput }),
  z.object({
    type: z.literal('record.update'),
    payload: z.object({
      id: z.string().uuid(),
      expectedRevision: z.number().int().positive(),
      record: recordInput,
    }),
  }),
  z.object({
    type: z.literal('record.delete'),
    payload: z.object({ id: z.string().uuid(), expectedRevision: z.number().int().positive() }),
  }),
  z.object({ type: z.literal('record.listPeriod'), payload: periodInput }),
  z.object({
    type: z.literal('summary.getPeriod'),
    payload: periodInput.pick({ start: true, end: true, mode: true }),
  }),
  z.object({ type: z.literal('settings.get'), payload: z.object({}) }),
  z.object({
    type: z.literal('settings.updateRegion'),
    payload: z.object({
      uf: z.string().regex(/^[A-Z]{2}$/),
      municipalityCode: z
        .string()
        .regex(/^\d{7}$/)
        .optional(),
      expectedRevision: z.number().int().positive(),
      confirmed: z.boolean(),
    }),
  }),
  z.object({
    type: z.literal('reminder.update'),
    payload: z.object({
      enabled: z.boolean(),
      weekdays: z.array(z.number().int().min(0).max(6)).min(1),
      times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
      snoozeMinutes: z.number().int().min(1).max(2880),
      expectedRevision: z.number().int().positive(),
    }),
  }),
  z.object({
    type: z.literal('reminder.snooze'),
    payload: z.object({
      slotId: z.string().min(1).max(200),
      when: z.number().positive(),
      targetLocalDate: z.iso.date(),
      minutes: z.number().int().min(1).max(2880),
    }),
  }),
  z.object({
    type: z.literal('reminder.reconcile'),
    payload: z.object({ requestPermission: z.boolean().optional() }),
  }),
  z.object({ type: z.literal('holiday.coverage'), payload: z.object({}) }),
]);

export type AppRequest = z.infer<typeof requestSchema>;
export const appErrorSchema = z.object({
  code: z.enum(APP_ERROR_CODES),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});
export const responseSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), data: z.unknown() }),
  z.object({ ok: z.literal(false), error: appErrorSchema }),
]);
export type AppResponse<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: z.infer<typeof appErrorSchema> };
export const entityChangedEventSchema = z.object({
  type: z.literal('entity.changed'),
  entity: z.enum(['project', 'record', 'settings', 'reminder']),
  id: z.string(),
  revision: z.number().int().positive(),
});
export const reminderOpenedEventSchema = z.object({
  type: z.literal('reminder.opened'),
  targetLocalDate: z.iso.date(),
  slotId: z.string().min(1),
});
