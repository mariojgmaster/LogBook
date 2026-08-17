export const APP_ERROR_CODES = [
  'VALIDATION',
  'NOT_FOUND',
  'CONFLICT',
  'DUPLICATE',
  'QUOTA_EXCEEDED',
  'STORAGE_UNAVAILABLE',
  'PERMISSION_DENIED',
  'HOLIDAY_DATA_UNAVAILABLE',
  'INVALID_MESSAGE',
  'UNEXPECTED',
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

const safeMessages: Record<AppErrorCode, string> = {
  VALIDATION: 'Revise os campos informados.',
  NOT_FOUND: 'O item solicitado não foi encontrado.',
  CONFLICT: 'Este item foi alterado em outra janela. Recarregue os dados.',
  DUPLICATE: 'Já existe um item com esses dados.',
  QUOTA_EXCEEDED: 'Não há espaço local suficiente para salvar.',
  STORAGE_UNAVAILABLE: 'Não foi possível acessar os dados locais.',
  PERMISSION_DENIED: 'A permissão necessária não foi concedida.',
  HOLIDAY_DATA_UNAVAILABLE: 'O calendário de feriados não cobre este período.',
  INVALID_MESSAGE: 'A solicitação recebida é inválida.',
  UNEXPECTED: 'Não foi possível concluir a operação.',
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly fieldErrors?: Readonly<Record<string, string>>;

  constructor(code: AppErrorCode, fieldErrors?: Readonly<Record<string, string>>) {
    super(safeMessages[code]);
    this.name = 'AppError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return new AppError('QUOTA_EXCEEDED');
    }
    return new AppError('UNEXPECTED');
  }

  toJSON() {
    return { code: this.code, message: this.message, fieldErrors: this.fieldErrors };
  }
}
