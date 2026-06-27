import { errors } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/applications/:id/analytics — transparente View-Aggregate der eigenen Bewerbung.
// { views, lastViewedAt, avgDurationMs }. Cookieless aggregiert aus offero.page_view.
// Ownership-Check vor dem Lesen (applicationService.get wirft, wenn fremd). Danach lesen wir
// über den Service-Role-Client direkt aus page_view (analog zum documents-Route-Muster).
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;
    const { applicationService, supabase } = getServerContainer();

    // Ownership-Check: wirft NotFound/Forbidden, wenn die Bewerbung nicht dem Nutzer gehört.
    await applicationService.get(userId, id);

    const { data, error } = await supabase
      .from('page_view')
      .select('viewed_at, duration_ms')
      .eq('application_id', id);
    if (error) throw errors.internal(error.message);

    const rows = data ?? [];
    // Nur Zeilen ohne duration_ms sind echte Seitenaufrufe. Beacon-Updates (duration_ms IS NOT NULL)
    // gehören zur selben Sitzung und würden sonst jeden View doppelt zählen.
    const views = rows.filter(
      (r) => (r as { duration_ms: number | null }).duration_ms === null,
    ).length;

    let lastViewedAt: string | null = null;
    for (const r of rows) {
      const v = (r as { viewed_at: string | null }).viewed_at;
      if (v && (lastViewedAt === null || v > lastViewedAt)) lastViewedAt = v;
    }

    // Durchschnittliche Verweildauer nur über Zeilen mit gemessener Dauer (Beacon-Updates).
    // Der Client sendet pro Seitenaufruf HÖCHSTENS EINEN Beacon (Dedupe-Guard in RecruiterTools),
    // daher steht jede Zeile für genau einen Besuch — der Mittelwert ist nicht mehr verfälscht.
    // Härtung: 0-/Negativ-Dauern fließen nicht in den Mittelwert ein (kein echtes Engagement;
    // der Client filtert < 1s ohnehin, dies schützt zusätzlich gegen direkt erzeugte ?d=0-Pings).
    // Die Obergrenze (30 min) klemmt bereits /r/[slug] beim Schreiben — Ausreißer sind dort gekappt.
    const durations = rows
      .map((r) => (r as { duration_ms: number | null }).duration_ms)
      .filter((d): d is number => typeof d === 'number' && Number.isFinite(d) && d > 0);
    const avgDurationMs =
      durations.length > 0
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : null;

    return ok({ views, lastViewedAt, avgDurationMs });
  } catch (e) {
    return handleError(e);
  }
}
