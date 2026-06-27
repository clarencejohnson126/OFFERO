import { errors } from '@offero/core';

import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

type Ctx = { params: Promise<{ slug: string }> };

// GET /api/v1/public/:slug — öffentlich, ohne Auth. Nur veröffentlichte Bewerbungen
// (Service-Role + Status-Filter im Service, kein Draft-Leak). Auch der Mobile-Client nutzt das.
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const { applicationService } = getServerContainer();
    const site = await applicationService.getPublic(slug);
    if (!site) throw errors.notFound('Diese Bewerbung gibt es nicht (mehr).');
    return ok({ slug: site.application.tenantSlug, content: site.content });
  } catch (e) {
    return handleError(e);
  }
}
