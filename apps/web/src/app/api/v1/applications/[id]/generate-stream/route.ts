import type { Brand, SelfIntro } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { resolveCompanyBrand } from '@/lib/brand-extract';
import { getServerContainer } from '@/lib/container';
import { fetchJobText } from '@/lib/fetch-job';

// Vercel-Funktions-Timeout: Generierung (API-Backend, Scrape + parallele Sektionen) kann >30s dauern.
// Hobby cappt auf 60s; auf Pro hier auf bis zu 300 erhöhen. Streaming-Route → immer dynamisch.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// POST /api/v1/applications/:id/generate-stream — wie /generate, aber als NDJSON-Stream mit
// ECHTEN Fortschritts-Events (kein Fake-Timer): fetch_job → analyze → plan → write (k/N je fertiger
// Sektion) → assemble → done | error. Der Scrape passiert hier (nicht im create), damit der
// Ladebalken auch den echten Scrape-Stand zeigt. −1 Credit erst nach Erfolg (im Service).
export async function POST(req: Request, ctx: Ctx) {
  let userId: string;
  try {
    ({ userId } = await authenticate(req));
  } catch {
    return new Response(`${JSON.stringify({ type: 'error', message: 'Nicht autorisiert' })}\n`, {
      status: 401,
      headers: { 'content-type': 'application/x-ndjson; charset=utf-8' },
    });
  }

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const language = typeof body.language === 'string' ? body.language : undefined;
  const focusPrompt = typeof body.focusPrompt === 'string' ? body.focusPrompt : undefined;
  const branding = body.branding === true;
  const companyUrl = typeof body.companyUrl === 'string' ? body.companyUrl.trim() : '';
  const market = body.market === 'intl' ? 'intl' : 'dach';
  const showContactDetails = body.showContactDetails === true;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
        } catch {
          /* Client getrennt — Generierung läuft serverseitig zu Ende. */
        }
      };
      try {
        const { applicationService, aiText, supabase } = getServerContainer();
        const app = await applicationService.get(userId, id);

        // 1) Scrape (echter Stand): nur, wenn kein eingefügter Text vorliegt.
        let jobText = app.jobText?.trim() ?? '';
        if (!jobText && app.jobUrl) {
          send({ type: 'progress', stage: 'fetch_job' });
          console.log(`[generate-stream] scraping: url=${app.jobUrl}`);
          try {
            jobText = await fetchJobText(app.jobUrl);
            console.log(`[generate-stream] scraped OK: chars=${jobText.length} preview="${jobText.slice(0, 120).replace(/\n/g, ' ')}"`);
          } catch (scrapeErr) {
            const msg = scrapeErr instanceof Error ? scrapeErr.message : String(scrapeErr);
            console.log(`[generate-stream] scrape FAILED: ${msg}`);
            throw scrapeErr;
          }
        } else if (jobText) {
          console.log(`[generate-stream] job text from DB: chars=${jobText.length}`);
        }
        if (!jobText) {
          send({ type: 'error', message: 'Keine Stellenanzeige hinterlegt.' });
          return;
        }

        // 2) Optional: Firmen-Branding scrapen (eigene Ladebalken-Stufe). Die Firmen-URL wird
        //    automatisch aus der Stelle abgeleitet, wenn der Nutzer keine angibt. Scheitert es,
        //    geht es ohne Branding weiter (Default-Palette) — nie ein harter Fehler.
        let brand: Brand | undefined;
        if (branding && aiText) {
          send({ type: 'progress', stage: 'fetch_brand' });
          brand =
            (await resolveCompanyBrand({
              jobText,
              companyUrl: companyUrl || undefined,
              ai: aiText,
            })) ?? undefined;
        }

        // 2b) Material aus hochgeladenen Unterlagen (Anschreiben/Zertifikate-Text) aggregieren.
        let extraMaterial: string | undefined;
        const { data: docs } = await supabase
          .from('user_document')
          .select('kind, file_name, extracted_text')
          .eq('user_id', userId)
          .not('extracted_text', 'is', null);
        const parts = (docs ?? [])
          .filter((d) => typeof d.extracted_text === 'string' && d.extracted_text.trim())
          .map((d) => `[${d.kind}: ${d.file_name ?? 'Datei'}]\n${d.extracted_text}`);
        if (parts.length > 0) extraMaterial = parts.join('\n\n---\n\n').slice(0, 40_000);

        // 2c) Echtes Selbst-Intro: jüngstes hochgeladenes Video/Audio → öffentliche URL (Bucket public).
        let selfIntro: SelfIntro | undefined;
        const { data: introDocs } = await supabase
          .from('user_document')
          .select('content_type, bucket, path, file_name')
          .eq('user_id', userId)
          .eq('kind', 'video')
          .order('created_at', { ascending: false })
          .limit(1);
        const introDoc = introDocs?.[0];
        if (introDoc) {
          const { data: pub } = supabase.storage.from(introDoc.bucket).getPublicUrl(introDoc.path);
          if (pub?.publicUrl) {
            const isAudio = (introDoc.content_type ?? '').startsWith('audio/');
            selfIntro = {
              kind: isAudio ? 'audio' : 'video',
              url: pub.publicUrl,
              mimeType: introDoc.content_type ?? undefined,
              caption: introDoc.file_name ?? undefined,
            };
          }
        }

        // 3) Generierung mit Live-Fortschritt.
        const result = await applicationService.generate(userId, id, {
          language,
          focusPrompt,
          jobText,
          brand,
          extraMaterial,
          market,
          showContactDetails,
          selfIntro,
          onProgress: (p) => send({ type: 'progress', ...p }),
        });

        send({
          type: 'done',
          slug: result.application.tenantSlug,
          sections: result.version.content.sections.map((s) => s.type),
        });
      } catch (e) {
        const err = e as { code?: string; message?: string };
        send({
          type: 'error',
          code: err.code,
          message: err.message ?? 'Fehler bei der Generierung.',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'x-accel-buffering': 'no',
    },
  });
}
