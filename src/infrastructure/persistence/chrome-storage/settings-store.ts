import { z } from 'zod';
import { AppError } from '@/domain/errors/app-error';

const envelopeSchema = z.object({ version: z.literal(1), value: z.unknown() });

export class ChromeSettingsStore {
  async get<T>(key: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
    try {
      const raw = await chrome.storage.local.get(key);
      if (raw[key] === undefined) return fallback;
      const envelope = envelopeSchema.parse(raw[key]);
      return schema.parse(envelope.value);
    } catch (error) {
      if (error instanceof z.ZodError) throw new AppError('STORAGE_UNAVAILABLE');
      throw AppError.fromUnknown(error);
    }
  }
  async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: { version: 1, value } });
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  }
}
