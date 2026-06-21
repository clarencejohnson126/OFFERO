import { NextResponse } from 'next/server';

import { DomainError } from '@offero/core';

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function notImplemented(message = 'Noch nicht implementiert'): NextResponse {
  return NextResponse.json({ error: { code: 'NOT_IMPLEMENTED', message } }, { status: 501 });
}

/** Mappt DomainError → { error: { code, message } } mit passendem HTTP-Status; sonst 500. */
export function handleError(e: unknown): NextResponse {
  if (e instanceof DomainError) {
    return NextResponse.json(e.toResponse(), { status: e.status });
  }
  // zod-Validierungsfehler → 422 (ohne zod-Import: via name).
  if (e && typeof e === 'object' && (e as { name?: string }).name === 'ZodError') {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'Ungültige Eingabe.' } },
      { status: 422 },
    );
  }
  const message = e instanceof Error ? e.message : 'Interner Fehler';
  return NextResponse.json({ error: { code: 'INTERNAL', message } }, { status: 500 });
}
