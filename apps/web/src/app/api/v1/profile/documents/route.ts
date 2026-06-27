import { type StorageBucket, errors } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB gesamt über alle Unterlagen
const VALID_KINDS = ['cv', 'cover_letter', 'certificate', 'image', 'video', 'other'] as const;

// content-type → { bucket, default-kind }. Deckt LV, Anschreiben, Zertifikate, Bilder, Video, ZIP.
const TYPE_MAP: Record<string, { bucket: StorageBucket; kind: string }> = {
  'application/pdf': { bucket: 'pdf', kind: 'other' },
  'text/plain': { bucket: 'pdf', kind: 'other' },
  'text/markdown': { bucket: 'pdf', kind: 'other' },
  'application/msword': { bucket: 'pdf', kind: 'other' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    bucket: 'pdf',
    kind: 'other',
  },
  'image/png': { bucket: 'image', kind: 'image' },
  'image/jpeg': { bucket: 'image', kind: 'image' },
  'image/webp': { bucket: 'image', kind: 'image' },
  'image/gif': { bucket: 'image', kind: 'image' },
  'video/mp4': { bucket: 'video', kind: 'video' },
  // Audio-Selbst-Intro (kamerascheu): in den public video-Bucket, kind 'video' (per content_type
  // als Audio erkannt). ADR 0012 §5.
  'audio/mpeg': { bucket: 'video', kind: 'video' },
  'audio/mp4': { bucket: 'video', kind: 'video' },
  'audio/x-m4a': { bucket: 'video', kind: 'video' },
  'audio/wav': { bucket: 'video', kind: 'video' },
  'audio/webm': { bucket: 'video', kind: 'video' },
  'audio/ogg': { bucket: 'video', kind: 'video' },
  'application/zip': { bucket: 'pdf', kind: 'other' },
  'application/x-zip-compressed': { bucket: 'pdf', kind: 'other' },
};

const EXT_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  weba: 'audio/webm',
  zip: 'application/zip',
};

function classify(file: File): { bucket: StorageBucket; kind: string } | null {
  const ct = (file.type || '').toLowerCase();
  if (TYPE_MAP[ct]) return TYPE_MAP[ct];
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const mapped = EXT_MAP[ext];
  return mapped ? (TYPE_MAP[mapped] ?? null) : null;
}

// Text aus Anschreiben/Zertifikaten ziehen: PDF → unpdf, Text/MD → UTF-8. Bilder/Video/ZIP/Word: null
// (Bild-OCR via Vision folgt; Word/ZIP später). Liefert getrimmten Text oder null.
async function extractDocText(
  bytes: Uint8Array,
  contentType: string,
  name: string,
): Promise<string | null> {
  const isPdf =
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46; // "%PDF"
  if (isPdf) {
    try {
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(bytes);
      const { text } = await extractText(pdf, { mergePages: true });
      const t = (Array.isArray(text) ? text.join('\n') : text).trim();
      return t.length > 0 ? t.slice(0, 40_000) : null;
    } catch {
      return null;
    }
  }
  const ct = (contentType || '').toLowerCase();
  if (ct.startsWith('text/') || /\.(txt|md)$/i.test(name)) {
    const t = new TextDecoder().decode(bytes).trim();
    return t.length > 0 ? t.slice(0, 40_000) : null;
  }
  return null;
}

// GET /api/v1/profile/documents — eigene Unterlagen + Gesamtgröße.
export async function GET(req: Request) {
  try {
    const { userId } = await authenticate(req);
    const { supabase } = getServerContainer();
    const { data, error } = await supabase
      .from('user_document')
      .select('id, kind, bucket, path, file_name, content_type, size_bytes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw errors.internal(error.message);
    const documents = data ?? [];
    const totalBytes = documents.reduce((s, d) => s + Number(d.size_bytes ?? 0), 0);
    return ok({ documents, totalBytes, maxBytes: MAX_TOTAL_BYTES });
  } catch (e) {
    return handleError(e);
  }
}

// POST /api/v1/profile/documents — eine Unterlage hochladen (multipart: file, optional kind).
export async function POST(req: Request) {
  try {
    const { userId } = await authenticate(req);
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      throw errors.validation('Datei fehlt — multipart/form-data Feld "file".');
    }
    const cls = classify(file);
    if (!cls) {
      throw errors.validation(
        'Dateityp nicht erlaubt. Erlaubt: PDF, Word, Text, PNG/JPG/WEBP/GIF, MP4, ZIP.',
      );
    }
    const requestedKind = String(form.get('kind') ?? '');
    const kind = (VALID_KINDS as readonly string[]).includes(requestedKind)
      ? requestedKind
      : cls.kind;
    // Tagt der Nutzer ein PDF als CV, kommt es in den privaten cv-Bucket.
    const bucket: StorageBucket = kind === 'cv' ? 'cv' : cls.bucket;

    const { storage, supabase } = getServerContainer();

    // 50-MB-Gesamtlimit (bestehende + diese Datei) prüfen.
    const { data: existing, error: sumErr } = await supabase
      .from('user_document')
      .select('size_bytes')
      .eq('user_id', userId);
    if (sumErr) throw errors.internal(sumErr.message);
    const used = (existing ?? []).reduce((s, d) => s + Number(d.size_bytes ?? 0), 0);
    if (used + file.size > MAX_TOTAL_BYTES) {
      const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
      throw errors.validation(
        `Limit überschritten: ${mb(used)} MB belegt, diese Datei ${mb(file.size)} MB — max. 50 MB gesamt.`,
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'datei';
    const path = `${userId}/${Date.now()}-${safeName}`;
    const ref = await storage.upload(bucket, path, bytes, file.type || 'application/octet-stream');

    // Text gleich beim Upload ziehen (PDF/Text) → fließt später als Material in die Generierung.
    const extractedText = await extractDocText(bytes, file.type, file.name);

    const { data: row, error: insErr } = await supabase
      .from('user_document')
      .insert({
        user_id: userId,
        kind,
        bucket: ref.bucket,
        path: ref.path,
        file_name: file.name.slice(0, 200),
        content_type: file.type || null,
        size_bytes: file.size,
        extracted_text: extractedText,
      })
      .select('id, kind, bucket, path, file_name, content_type, size_bytes, created_at')
      .single();
    if (insErr) throw errors.internal(insErr.message);

    return ok({ document: row }, 201);
  } catch (e) {
    return handleError(e);
  }
}
