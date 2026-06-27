import { type Json, type Tier, errors, ingestCv } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

// INGEST: CV-Rohtext aus offero-cv laden → strukturieren (Haiku) → profile.cv_structured.
export async function POST(req: Request) {
  try {
    const { userId } = await authenticate(req);
    const { repo, storage, profileService, aiText } = getServerContainer();
    if (!aiText) {
      throw errors.notImplemented('CV-Parse benötigt ANTHROPIC_API_KEY in der Umgebung.');
    }

    await profileService.ensureInitialized(userId);
    const profile = await profileService.get(userId);
    if (!profile.cvRaw) {
      throw errors.validation('Kein CV hochgeladen — zuerst POST /api/v1/profile/cv.');
    }

    const bytes = await storage.download(profile.cvRaw);
    const cvText = (await extractCvText(bytes)).trim();
    if (cvText.length < 30) {
      throw errors.validation(
        'Konnte keinen Text aus dem Lebenslauf lesen — leer oder ein gescanntes Bild-PDF?',
      );
    }

    const wallet = await repo.billing.getWallet(userId);
    const tier: Tier = wallet?.plan ?? 'free';
    const cvStructured = await ingestCv(aiText, { cvText, tier });

    const updated = await profileService.update(userId, {
      cvStructured: cvStructured as unknown as Json,
    });
    return ok({ cvStructured, profile: updated });
  } catch (e) {
    return handleError(e);
  }
}

// Liest Text aus dem hochgeladenen CV: PDF → unpdf-Textextraktion, sonst UTF-8.
async function extractCvText(bytes: Uint8Array): Promise<string> {
  const isPdf =
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46; // "%PDF"
  if (isPdf) {
    const { extractText, getDocumentProxy } = await import('unpdf');
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join('\n') : text;
  }
  return new TextDecoder().decode(bytes);
}
