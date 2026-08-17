import { AppError } from '@/domain/errors/app-error';
import { responseSchema, type AppRequest } from '@/shared/contracts/messages';

export const sendAppMessage = async <T>(request: AppRequest): Promise<T> => {
  if (!globalThis.chrome?.runtime?.sendMessage) throw new AppError('STORAGE_UNAVAILABLE');
  const response = responseSchema.parse(await chrome.runtime.sendMessage(request));
  if (!response.ok) throw new AppError(response.error.code, response.error.fieldErrors);
  return response.data as T;
};
