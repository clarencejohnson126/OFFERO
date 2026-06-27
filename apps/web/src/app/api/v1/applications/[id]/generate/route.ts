import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/v1/applications/:id/generate — Text-Generierung (−1 Credit), synchron.
// Pipeline: ANALYZE → PLAN → WRITE → ASSEMBLE. Liefert die neue Version (Inhalt) zurück.
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const focusPrompt = typeof body.focusPrompt === 'string' ? body.focusPrompt : undefined;
    const language = typeof body.language === 'string' ? body.language : undefined;
    const { applicationService } = getServerContainer();
    const result = await applicationService.generate(userId, id, { focusPrompt, language });
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
