import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

type Ctx = { params: Promise<{ id: string }> };

// GET /api/v1/applications/:id/status — Polling (draft|generating|ready|shared|archived).
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;
    const { applicationService } = getServerContainer();
    const application = await applicationService.get(userId, id);
    return ok({ status: application.status, currentVersionId: application.currentVersionId });
  } catch (e) {
    return handleError(e);
  }
}
