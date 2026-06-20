// Einheitliche Domänenfehler → Wire-Form { error: { code, message } } (v1-spec §5).

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'INSUFFICIENT_CREDITS'
  | 'WALLET_NOT_FOUND'
  | 'FEATURE_NOT_ENABLED'
  | 'SLUG_TAKEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'NOT_IMPLEMENTED'
  | 'INTERNAL';

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string, status = 400) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.status = status;
  }

  toResponse(): { error: { code: ErrorCode; message: string } } {
    return { error: { code: this.code, message: this.message } };
  }
}

export const errors = {
  unauthorized: (m = 'Nicht autorisiert') => new DomainError('UNAUTHORIZED', m, 401),
  notFound: (m = 'Nicht gefunden') => new DomainError('NOT_FOUND', m, 404),
  validation: (m = 'Ungültige Eingabe') => new DomainError('VALIDATION', m, 422),
  insufficientCredits: (m = 'Nicht genug Credits') =>
    new DomainError('INSUFFICIENT_CREDITS', m, 402),
  walletNotFound: (m = 'Kein Guthabenkonto') => new DomainError('WALLET_NOT_FOUND', m, 404),
  featureNotEnabled: (m = 'Feature nicht im Paket enthalten') =>
    new DomainError('FEATURE_NOT_ENABLED', m, 403),
  slugTaken: (m = 'Subdomain bereits vergeben') => new DomainError('SLUG_TAKEN', m, 409),
  conflict: (m = 'Konflikt') => new DomainError('CONFLICT', m, 409),
  notImplemented: (m = 'Noch nicht implementiert') =>
    new DomainError('NOT_IMPLEMENTED', m, 501),
  internal: (m = 'Interner Fehler') => new DomainError('INTERNAL', m, 500),
};
