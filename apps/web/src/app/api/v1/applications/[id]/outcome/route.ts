import { errors } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

type Ctx = { params: Promise<{ id: string }> };

// Erlaubte Outcome-Status (deckungsgleich mit dem CHECK in 0006_outcome_and_views.sql).
const VALID_STATUS = [
  'sent',
  'viewed',
  'replied',
  'interview',
  'offer',
  'accepted',
  'rejected',
  'ghosted',
] as const;

const MAX_NOTE_LEN = 2000;

// GET /api/v1/applications/:id/outcome — Outcome-Historie der eigenen Bewerbung (jüngste zuerst).
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;
    const { applicationService, supabase } = getServerContainer();

    // Ownership-Check: wirft, wenn die Bewerbung nicht dem Nutzer gehört.
    await applicationService.get(userId, id);

    const { data, error } = await supabase
      .from('application_outcome')
      .select('id, status, note, created_at')
      .eq('application_id', id)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw errors.internal(error.message);

    return ok({ outcomes: data ?? [] });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/v1/applications/:id/outcome — ein Outcome-Event anhängen (append-only).
// Body: { status, note? }. Ownership wird geprüft; user_id kommt aus dem Token, nie aus dem Body.
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;
    const { applicationService, supabase } = getServerContainer();

    // Ownership-Check (wirft NotFound/Forbidden, wenn nicht die eigene Bewerbung).
    await applicationService.get(userId, id);

    const body = (await req.json().catch(() => null)) as { status?: unknown; note?: unknown } | null;
    const status = typeof body?.status === 'string' ? body.status : '';
    if (!(VALID_STATUS as readonly string[]).includes(status)) {
      throw errors.validation(
        `Ungültiger Status. Erlaubt: ${VALID_STATUS.join(', ')}.`,
      );
    }
    const note =
      typeof body?.note === 'string' && body.note.trim().length > 0
        ? body.note.trim().slice(0, MAX_NOTE_LEN)
        : null;

    const { data: row, error } = await supabase
      .from('application_outcome')
      .insert({ application_id: id, user_id: userId, status, note })
      .select('id, status, note, created_at')
      .single();
    if (error) throw errors.internal(error.message);

    return ok({ outcome: row }, 201);
  } catch (e) {
    return handleError(e);
  }
}
