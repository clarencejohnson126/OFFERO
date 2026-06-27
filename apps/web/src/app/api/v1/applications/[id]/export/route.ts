import { errors } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError } from '@/app/api/v1/_lib/responses';
import { buildAtsDocx, buildAtsPdf } from '@/lib/ats-export';
import { getServerContainer } from '@/lib/container';

type Ctx = { params: Promise<{ id: string }> };

const CONTENT_TYPE = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

const EXTENSION = { pdf: 'pdf', docx: 'docx' } as const;

// GET /api/v1/applications/:id/export?format=pdf|docx — ATS-saubere Beilage (Task #34, ADR 0012).
// Lädt die aktuelle Version des Owners und liefert die Bytes als Datei-Download. Default pdf.
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;

    const url = new URL(req.url);
    const requested = (url.searchParams.get('format') ?? 'pdf').toLowerCase();
    const format = requested === 'docx' ? 'docx' : requested === 'pdf' ? 'pdf' : null;
    if (!format) {
      throw errors.validation('Ungültiges Format — erlaubt: pdf, docx.');
    }

    const { applicationService, repo } = getServerContainer();
    const application = await applicationService.get(userId, id); // Ownership-Check
    if (!application.currentVersionId) {
      throw errors.validation('Diese Bewerbung wurde noch nicht generiert.');
    }
    const version = await repo.versions.get(application.currentVersionId);
    if (!version) {
      throw errors.notFound('Generierte Version nicht gefunden.');
    }

    // Bewerbungs-Website-URL in das Dokument einbetten (ADR 0012: Website ist das Produkt, PDF ist
    // die ATS-Beilage — der Link führt den HR-Manager zur echten, vollständigen Bewerbung).
    const siteBase = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://offero.app').replace(/\/$/, '');
    const websiteUrl = `${siteBase}/p/${application.tenantSlug}`;

    const bytes =
      format === 'pdf'
        ? await buildAtsPdf(version.content, websiteUrl)
        : await buildAtsDocx(version.content, websiteUrl);

    const safeSlug =
      application.tenantSlug.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'bewerbung';
    const filename = `${safeSlug}-ats.${EXTENSION[format]}`;

    // Uint8Array → frischer ArrayBuffer-Slice (BodyInit-kompatibel, ohne SharedArrayBuffer-Risiko).
    const body = bytes.slice().buffer;
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': CONTENT_TYPE[format],
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'no-store',
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
