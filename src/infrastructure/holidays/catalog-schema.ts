import { z } from 'zod';

export const holidayEntrySchema = z.object({
  date: z.iso.date(),
  name: z.string().min(1).max(200),
  scope: z.enum(['national', 'state', 'municipal']),
  uf: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  municipalityCode: z
    .string()
    .regex(/^\d{7}$/)
    .optional(),
});
export const holidayFileSchema = z.object({
  year: z.number().int(),
  entries: z.array(holidayEntrySchema),
});
export const holidayManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.string().min(1),
    generatedAt: z.string().datetime(),
    minYear: z.number().int(),
    maxYear: z.number().int(),
    states: z
      .array(z.object({ code: z.string().regex(/^[A-Z]{2}$/), name: z.string().min(1) }))
      .length(27),
    files: z.record(z.string(), z.string().regex(/^[a-f0-9]{64}$/)),
    sources: z.array(z.object({ name: z.string(), license: z.string(), url: z.url() })).min(1),
  })
  .refine((value) => value.maxYear >= value.minYear);
export const municipalitiesSchema = z.object({
  source: z.string(),
  municipalities: z.array(
    z.object({
      code: z.string().regex(/^\d{7}$/),
      name: z.string(),
      uf: z.string().regex(/^[A-Z]{2}$/),
    }),
  ),
});

export type HolidayManifest = z.infer<typeof holidayManifestSchema>;
export type HolidayEntry = z.infer<typeof holidayEntrySchema>;
export interface HolidayCatalogRecord extends HolidayEntry {
  id: string;
}
