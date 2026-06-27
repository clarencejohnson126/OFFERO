import { errors } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

const MAX_CV_BYTES = 10 * 1024 * 1024; // 10 MB pro Lebenslauf

// Erlaubte CV-Typen — deckt, was der Parser tatsächlich verarbeitet (PDF/Text/MD/Word).
const CV_TYPE_MAP: Record<string, true> = {
  'application/pdf': true,
  'text/plain': true,
  'text/markdown': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
};
const CV_EXT_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Content-Type ODER Endung muss als CV-Typ erlaubt sein.
function isAllowedCv(file: File): boolean {
  const ct = (file.type || '').toLowerCase();
  if (CV_TYPE_MAP[ct]) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return Boolean(CV_EXT_MAP[ext]);
}

// CV-Upload nach offero-cv (privat). Ref landet in profile.cv_raw. Parse (INGEST) folgt separat.
export async function POST(req: Request) {
  try {
    const { userId } = await authenticate(req);
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      throw errors.validation('Datei fehlt — multipart/form-data Feld "file".');
    }
    if (!isAllowedCv(file)) {
      throw errors.validation('Dateityp nicht erlaubt. Erlaubt für Lebenslauf: PDF, Word, Text, Markdown.');
    }
    if (file.size > MAX_CV_BYTES) {
      const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
      throw errors.validation(`Datei zu groß: ${mb(file.size)} MB — max. 10 MB pro Lebenslauf.`);
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
