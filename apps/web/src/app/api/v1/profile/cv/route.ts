import { errors } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

// CV-Upload nach offero-cv (privat). Ref landet in profile.cv_raw. Parse (INGEST) folgt separat.
export async function POST(req: Request) {
  try {
    const { userId } = await authenticate(req);
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      throw errors.validation('Datei fehlt — multipart/form-data Feld "file".');
    }
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { storage, profileService } = getServerContainer();
    await profileService.ensureInitialized(userId);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'cv';
    const path = `${userId}/${Date.now()}-${safeName}`;
    const ref = await storage.upload('cv', path, bytes, file.type || 'application/octet-stream');
    const profile = await profileService.update(userId, { cvRaw: ref });

    return ok({ cvRaw: ref, profile });
  } catch (e) {
    return handleError(e);
  }
}
