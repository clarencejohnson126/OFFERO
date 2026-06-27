import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/applications/:id — Bewerbung + aktuelle generierte Version (Inhalt).
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;
    const { applicationService, repo } = getServerContainer();
    const application = await applicationService.get(userId, id);
    const version = application.currentVersionId
      ? await repo.versions.get(application.currentVersionId)
      : null;
    return ok({ application, version });
  } catch (e) {
    return handleError(e);
  }
}

// DELETE /api/v1/applications/:id — Bewerbung löschen (DSGVO-Hebel).
export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;
    const { applicationService } = getServerContainer();
    await applicationService.remove(userId, id);
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
