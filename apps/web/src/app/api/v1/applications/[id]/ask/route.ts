import { type ApplicationContent, errors, modelFor, parseContent } from '@offero/core';

import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';
import { QA_REFUSAL, buildGroundedQa } from '@/lib/grounded-qa';

type Ctx = { params: Promise<{ id: string }> };

const MAX_QUESTION_LEN = 400;

// Einfaches In-Memory-Rate-Limit. Reicht für MVP; in Prod durch Redis/Supabase ersetzen.
// Funktioniert im selben Vercel-Worker-Prozess zuverlässig.
//
// Defense-in-Depth: zwei unabhängige Limits.
//  1) pro IP (10/Min)  — bremst einzelne Clients.
//  2) pro applicationId (60/Min) — deckelt eine einzelne öffentliche Bewerbung auch dann,
//     wenn aus rotierenden IPs (wechselndes x-forwarded-for) gefragt wird.
const _rl = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_IP = 10;
const RATE_LIMIT_APP = 60;
const RATE_WINDOW_MS = 60_000;
// Hard-Cap gegen unbegrenztes Map-Wachstum (Memory-Leak). Bei Überschreitung werden zuerst
// abgelaufene Einträge entfernt, danach notfalls die ältesten (kleinster reset = am ältesten).
const RL_MAX_ENTRIES = 10_000;

// Opportunistisch abgelaufene Einträge räumen und die Map deckeln. Läuft bei jeder Anfrage —
// solange Traffic fließt, bleibt die Map klein; ohne externen Store, ohne Timer.
function sweepRateLimit(now: number): void {
  for (const [key, entry] of _rl) {
    if (now > entry.reset) _rl.delete(key);
  }
  if (_rl.size <= RL_MAX_ENTRIES) return;
  // Notfall: immer noch zu groß (viele frische Einträge) — ältester reset zuerst weg,
  // bis wir wieder unter dem Cap sind.
  const sorted = [..._rl.entries()].sort((a, b) => a[1].reset - b[1].reset);
  for (const [key] of sorted) {
    if (_rl.size <= RL_MAX_ENTRIES) break;
    _rl.delete(key);
  }
}

// Ein Schlüssel/Limit prüfen und (bei Erfolg) zählen. Schlüssel sind durch Präfix getrennt,
// damit IP- und App-Buckets nicht kollidieren.
function hit(key: string, limit: number, now: number): boolean {
  const entry = _rl.get(key);
  if (!entry || now > entry.reset) {
    _rl.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// true = erlaubt. IP-Limit ZUERST und mit Kurzschluss: eine bereits gedrosselte IP darf NICHT
// das knappe App-Budget (60/Min) verbrauchen — sonst könnte eine einzelne IP mit wiederholten,
// längst abgelehnten Anfragen alle App-Slots blockieren (DoS gegen die Q&A einer Bewerbung).
// Erst wenn die IP unter ihrem Limit liegt, wird das App-Limit gezählt/geprüft.
function checkRateLimit(ip: string, applicationId: string): boolean {
  const now = Date.now();
  sweepRateLimit(now);
  if (!hit(`ip:${ip}`, RATE_LIMIT_IP, now)) return false; // IP gedrosselt → App-Bucket unberührt
  return hit(`app:${applicationId}`, RATE_LIMIT_APP, now);
}

// POST /api/v1/applications/:id/ask — grounded „Frag mich" (ADR 0012 §5, Constitution Art. II).
// RECRUITER-SEITIG auf einer ÖFFENTLICHEN Bewerbung: KEINE Bewerber-Auth. Stattdessen wird die
// Bewerbung per Service-Role direkt geladen und NUR beantwortet, wenn ihr Status öffentlich ist
// (ready|shared) — kein Draft-Leak. Geantwortet wird AUSSCHLIESSLICH aus dem echten Material;
// fehlt die Information, lehnt das Modell mit einem festen Satz ab (kein Erfinden).
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '0.0.0.0';
    // Zwei Limits: pro IP UND pro Bewerbung (Letzteres gegen IP-Rotation, siehe oben).
    if (!checkRateLimit(ip, id)) {
      return new Response(
        JSON.stringify({
          error: { code: 'RATE_LIMIT', message: 'Zu viele Anfragen — bitte warte eine Minute.' },
        }),
        { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '60' } },
      );
    }

    // Eingabe-Härtung: question muss ein nicht-leerer String < 400 Zeichen sein.
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    if (!question) {
      throw errors.validation('Frage fehlt — Feld "question" (nicht-leerer String).');
    }
    if (question.length >= MAX_QUESTION_LEN) {
      throw errors.validation(`Frage zu lang — max. ${MAX_QUESTION_LEN} Zeichen.`);
    }

    const { supabase, aiText } = getServerContainer();
    if (!aiText) {
      throw errors.notImplemented('Q&A benötigt ein konfiguriertes KI-Backend.');
    }

    // Bewerbung per Service-Role laden — nur öffentliche Stati, sonst 404 (kein Draft-Leak,
    // keine Existenz-Bestätigung für nicht-veröffentlichte IDs).
    const { data: app, error: appErr } = await supabase
      .from('application')
      .select('id, status, current_version_id')
      .eq('id', id)
      .maybeSingle();
    if (appErr) throw errors.internal(appErr.message);
    if (!app || (app.status !== 'ready' && app.status !== 'shared') || !app.current_version_id) {
      throw errors.notFound('Bewerbung nicht gefunden');
    }

    // Aktuelle Generierungs-Version (das echte Material) laden.
    const { data: version, error: verErr } = await supabase
      .from('generation_version')
      .select('content')
      .eq('id', app.current_version_id)
      .maybeSingle();
    if (verErr) throw errors.internal(verErr.message);
    if (!version) throw errors.notFound('Bewerbung nicht gefunden');

    // Validieren statt blind vertrauen (vor jeder Nutzung von DB-JSON).
    const content: ApplicationContent = parseContent(version.content);

    const { system, user } = buildGroundedQa(content, question);

    // Billiges Modell über die Routing-Policy (KEINE ID hartcodiert) — mechanischer Lese-Task.
    const result = await aiText.complete({
      model: modelFor('analyze', 'free'),
      system,
      messages: [{ role: 'user', content: user }],
      // Material steht im user-Block; system bleibt klein und cachebar.
      cacheBreakpoints: [0],
      maxTokens: 400,
      temperature: 0,
    });

    const answer = result.text.trim();
    const refused = answer === QA_REFUSAL;

    return ok({ answer, refused });
  } catch (e) {
    return handleError(e);
  }
}
