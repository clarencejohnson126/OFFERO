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
    const cvText = new TextDecoder().decode(bytes).trim();
    if (cvText.length === 0) {
      throw errors.validation('CV-Inhalt leer oder kein Text (PDF-Parsing kommt später).');
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
