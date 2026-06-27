import { type Json, errors } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

// GET /api/v1/applications — eigene Bewerbungen auflisten.
export async function GET(req: Request) {
  try {
    const { userId } = await authenticate(req);
    const { applicationService } = getServerContainer();
    const applications = await applicationService.list(userId);
    return ok({ applications });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/v1/applications — neue Bewerbung anlegen (Stellenanzeige als Text oder URL).
export async function POST(req: Request) {
  try {
    const { userId } = await authenticate(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const jobText = typeof body.jobText === 'string' ? body.jobText.trim() : '';
    const jobUrl = typeof body.jobUrl === 'string' ? body.jobUrl.trim() : '';
    const titleHint = typeof body.titleHint === 'string' ? body.titleHint : undefined;
    const template = typeof body.template === 'string' ? body.template : undefined;
    // Der eigentliche Scrape passiert jetzt im Streaming-Generate (echter Ladebalken) — hier nur
    // validieren, dass entweder Text ODER ein Link da ist, und die Bewerbung anlegen.
    if (jobText.length < 40 && !jobUrl) {
      throw errors.validation('Bitte die Stellenanzeige als Link oder Text angeben.');
    }
    const { applicationService } = getServerContainer();
    const application = await applicationService.create(userId, {
      jobText: jobText || undefined,
      jobUrl: jobUrl || undefined,
      titleHint,
      company: body.company as Json | undefined,
      template,
    });
    return ok({ application }, 201);
  } catch (e) {
    return handleError(e);
  }
}
