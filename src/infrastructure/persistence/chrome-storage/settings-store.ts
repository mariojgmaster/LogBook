import { z } from 'zod';
import { AppError } from '@/domain/errors/app-error';

const envelopeSchema = z.union([
  z.object({ version: z.literal(1), value: z.unknown() }).strict(),
  z.object({ version: z.literal(2), value: z.unknown() }).strict(),
]);

export class ChromeSettingsStore {
  async get<T>(key: string, schema: z.ZodType<T>, fallback: T, legacyKey?: string): Promise<T> {
    try {
      const raw = await chrome.storage.local.get(legacyKey ? [key, legacyKey] : key);
      const sourceKey =
        raw[key] === undefined && legacyKey && raw[legacyKey] !== undefined ? legacyKey : key;
      if (raw[sourceKey] === undefined) return fallback;
      const envelope = envelopeSchema.parse(raw[sourceKey]);
      const value = schema.parse(envelope.value);
      if (envelope.version === 1 || sourceKey !== key) {
        await this.set(key, value);
        if (sourceKey !== key) await chrome.storage.local.remove(sourceKey);
      }
      return value;
    } catch (error) {
      if (error instanceof z.ZodError) throw new AppError('STORAGE_UNAVAILABLE');
      throw AppError.fromUnknown(error);
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: { version: 2, value } });
    } catch (error) {
      throw AppError.fromUnknown(error);
    }
  }
}
