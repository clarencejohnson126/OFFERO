import {
  type ApplicationContent,
  type MediaRef,
  type Section,
  errors,
  parseContent,
} from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

// Bild-Generierung kann bis ~45s/Bild dauern → eigenes Funktions-Budget (separat von der Text-
// generierung, weil Hobby-Vercel auf 60s cappt). Immer dynamisch.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const MAX_IMAGES = 5;

function pick<T extends Section['type']>(content: ApplicationContent, type: T) {
  return content.sections.find((s) => s.type === type) as Extract<Section, { type: T }> | undefined;
}

/** Thematische, EHRLICHE Bild-Prompts: abstrakte Bildwelt zur Rolle/Firma — NIE Personen/Gesichter
 *  (kein Fake-Portrait), kein Text, keine Logos. Erstes Bild = Hero, Rest = Sektions-Bildwelt. */
function buildPrompts(content: ApplicationContent, n: number): string[] {
  const hero = pick(content, 'hero');
  const company = content.company.name ?? '';
  const role = hero?.role ?? '';
  const colors = (content.company.brand?.colors ?? []).slice(0, 3).join(', ');
  const moodColors = colors ? `Farbstimmung: ${colors}.` : 'Edle, zurückhaltende Farbstimmung.';
  const base =
    `Editorial, cinematic, abstrakte professionelle Bildwelt für eine Bewerbungs-Website` +
    `${role ? ` für die Rolle ${role}` : ''}${company ? ` bei ${company}` : ''}. ` +
    `${moodColors} KEINE Personen, KEINE Gesichter, KEIN Text, KEINE Logos, keine Wörter. ` +
    `Hochwertig, modern, ruhig.`;
  const motifs = [
    'Weiter, atmosphärischer Hintergrund mit sanftem Lichtverlauf (Hero).',
    'Abstrakte Technologie-/Datenstruktur, dezent, unaufdringlich.',
    'Architektur/Arbeitsumgebung als unscharfe, edle Kulisse.',
    'Organische Verlaufsflächen, Material- und Texturdetail.',
    'Geometrische, ruhige Komposition mit Tiefe.',
  ];
  return Array.from({ length: Math.min(n, MAX_IMAGES) }, (_, i) => `${base} ${motifs[i] ?? motifs[0]}`);
}

// POST /api/v1/applications/:id/images { count?: 1..5 } — erzeugt KI-Bilder und hängt sie an die
// generierte Bewerbung (content.media). Ownership-geprüft; Bilder landen im public offero-image-Bucket.
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const count = Math.min(Math.max(Number(body.count ?? 3) || 3, 1), MAX_IMAGES);

    const { applicationService, repo, storage, images } = getServerContainer();
    if (!images) {
      throw errors.notImplemented('KI-Bilder benötigen ein konfiguriertes Bild-Backend (OPENAI_API_KEY).');
    }
    const application = await applicationService.get(userId, id); // Ownership-Check
    if (!application.currentVersionId) {
      throw errors.validation('Diese Bewerbung wurde noch nicht generiert.');
    }
    const version = await repo.versions.get(application.currentVersionId);
    if (!version) throw errors.notFound('Generierte Version nicht gefunden.');
    const content = parseContent(version.content);

    // N thematische Bilder PARALLEL erzeugen (je 1 Bild/Prompt, Hero zuerst).
    const prompts = buildPrompts(content, count);
    const results = await Promise.all(
      prompts.map((prompt, i) =>
        images
          .generate({ prompt, aspectRatio: i === 0 ? '16:9' : '1:1', count: 1 })
          .then((r) => ({ i, img: r.images[0], cents: r.costCents }))
          .catch(() => null),
      ),
    );

    const newRefs: MediaRef[] = [];
    let costCents = 0;
    for (const r of results) {
      if (!r?.img) continue;
      costCents += r.cents;
      const path = `${userId}/${id}/ai-${Date.now()}-${r.i}.png`;
      const ref = await storage.upload('image', path, r.img.bytes, r.img.mimeType);
      newRefs.push({
        slot: r.i === 0 ? 'hero_image' : 'section_imagery',
        kind: 'image',
        url: storage.publicUrl(ref),
        prompt: prompts[r.i],
        alt: 'KI-generierte Bildwelt',
        mimeType: r.img.mimeType,
      });
    }
    if (newRefs.length === 0) {
      throw errors.internal('Bild-Generierung lieferte kein Bild — bitte erneut versuchen.');
    }

    // Frühere KI-Bilder (mit prompt) ersetzen, hochgeladene Fotos (ohne prompt) behalten.
    const kept = (content.media ?? []).filter((m) => !m.prompt);
    content.media = [...kept, ...newRefs].slice(0, 12);
    await repo.versions.updateContent(version.id, content);

    return ok({ added: newRefs.length, totalMedia: content.media.length, costCents });
  } catch (e) {
    return handleError(e);
  }
}
