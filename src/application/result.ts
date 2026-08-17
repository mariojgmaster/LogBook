import type { AppError } from '@/domain/errors/app-error';

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(error: AppError): Result<T> => ({ ok: false, error });
