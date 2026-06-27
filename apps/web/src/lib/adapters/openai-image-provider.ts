import 'server-only';

import type {
  AspectRatio,
  GeneratedImage,
  ImageGenRequest,
  ImageGenResult,
  ImageProvider,
} from '@offero/core';

// KI-Bild-Provider hinter dem ImageProvider-Port (Constitution Art. IV.2: extensibel, kein Lock).
// Nutzt OpenAI gpt-image-1 per REST (liefert b64-PNG → Bytes; der Aufrufer lädt sie in den Storage).
// Aktiv, weil der OpenAI-Key Budget hat; ein GeminiImageProvider kann denselben Port erfüllen und
// per AI_IMAGE_BACKEND=gemini eingewechselt werden, sobald ein gültiger Gemini-Key vorliegt.

const IMAGES_URL = 'https://api.openai.com/v1/images/generations';
const REQUEST_TIMEOUT_MS = 45_000;

/** Seitenverhältnis → von gpt-image-1 erlaubte Größe. */
function sizeFor(ar?: AspectRatio): string {
  if (ar === '16:9') return '1536x1024';
  if (ar === '9:16' || ar === '3:4') return '1024x1536';
  return '1024x1024';
}

// gpt-image-1 Richtpreis (USD) je Bild grob nach Qualität — nur für Observability/Kostenzuordnung.
const PRICE_PER_IMAGE_USD = 0.02; // quality 'low'

export class OpenAIImageProvider implements ImageProvider {
  constructor(private readonly apiKey: string) {}

  async generate(req: ImageGenRequest): Promise<ImageGenResult> {
    const n = Math.min(Math.max(req.count ?? 1, 1), 5);
    const body = {
      model: 'gpt-image-1',
      prompt: req.prompt.slice(0, 4000),
      size: sizeFor(req.aspectRatio),
      quality: 'low', // schnell + günstig; reicht für Hintergrund-/Sektions-Bildwelt (Hobby-60s-Budget)
      n,
    };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
    let data: { data?: { b64_json?: string }[] };
    try {
      const res = await fetch(IMAGES_URL, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`OpenAI-Bild ${res.status}: ${t.slice(0, 200)}`);
      }
      data = (await res.json()) as { data?: { b64_json?: string }[] };
    } finally {
      clearTimeout(timer);
    }

    const images: GeneratedImage[] = (data.data ?? [])
      .map((d) => d.b64_json)
      .filter((b): b is string => typeof b === 'string' && b.length > 0)
      .map((b64) => ({
        bytes: Uint8Array.from(Buffer.from(b64, 'base64')),
        mimeType: 'image/png',
        meta: { model: 'gpt-image-1', prompt: req.prompt.slice(0, 200) },
      }));

    const costCents = Math.round(images.length * PRICE_PER_IMAGE_USD * 100 * 1000) / 1000;
    return { images, costCents };
  }
}
