import { getServerContainer } from '@/lib/container';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string }> };

// 1×1 transparentes GIF (43 Byte). Wird IMMER zurückgegeben — das Logging ist best-effort.
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

const MAX_DURATION_MS = 1000 * 60 * 30; // 30 min Verweildauer-Obergrenze (Ausreißer/Beacon-Spam kappen).

function gifResponse(): Response {
  return new Response(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(PIXEL.length),
      // Niemals cachen — jeder Aufruf soll ein frischer View sein (kein CDN-/Browser-Cache).
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
    },
  });
}

// Gemeinsame Logging-Logik für GET (Pixel/keepalive-fetch) UND POST (navigator.sendBeacon).
// COOKIELESS: kein user_id, kein roher IP/UA. Löst den Slug auf eine ready/shared-Bewerbung auf
// und schreibt serverseitig (Service-Role) einen page_view. Fehler werden NIE an den Client
// durchgereicht — im Zweifel kommt einfach nur das GIF zurück.
async function logView(req: Request, ctx: Ctx): Promise<void> {
  try {
    const { slug } = await ctx.params;
    const { supabase } = getServerContainer();

    // Slug → Bewerbung (nur ausgelieferte Stände loggen wir: ready/shared).
    const { data: app } = await supabase
      .from('application')
      .select('id, tenant_slug, status')
      .eq('tenant_slug', slug)
      .in('status', ['ready', 'shared'])
      .maybeSingle();

    if (app?.id) {
      // Optionale Verweildauer aus ?d= (Beacon-Update). Ganzzahl, geklemmt auf [0, 30 min].
      const url = new URL(req.url);
      const raw = url.searchParams.get('d');
      let durationMs: number | null = null;
      if (raw != null) {
        const n = Number.parseInt(raw, 10);
        if (Number.isFinite(n) && n >= 0) durationMs = Math.min(n, MAX_DURATION_MS);
      }

      await supabase.from('page_view').insert({
        application_id: app.id,
        tenant_slug: app.tenant_slug,
        duration_ms: durationMs,
        coarse_signal: {},
      });
    }
  } catch (e) {
    // Best-effort: View-Logging darf den Pixel nie blockieren.
    console.error('[r] view-pixel:', e);
  }
}

// GET /r/:slug[?d=<ms>] — transparenter View-Pixel (initialer View, keepalive-fetch-Fallback).
export async function GET(req: Request, ctx: Ctx) {
  await logView(req, ctx);
  return gifResponse();
}

// POST /r/:slug?d=<ms> — Verweildauer-Beacon via navigator.sendBeacon (das IMMER POST sendet;
// ein reiner GET-Handler hätte 405 geliefert und die Dauer verworfen). Gleiche Logik wie GET.
export async function POST(req: Request, ctx: Ctx) {
  await logView(req, ctx);
  return gifResponse();
}
