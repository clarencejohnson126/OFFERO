'use client';

import { supabaseBrowser } from './supabase-browser';

// Dünner Client-seitiger /api/v1-Zugriff mit Bearer-JWT. (Der typisierte @offero/api-client
// deckt die JSON-Endpunkte ab; CV-Upload/Parse brauchen multipart → hier zentral.)
async function authToken(): Promise<string | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = await authToken();
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined && !isForm) headers['content-type'] = 'application/json';

  const res = await fetch(path, {
    method,
    headers,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text.length > 0 ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(json?.error?.message ?? res.statusText);
  }
  return json as T;
}

export interface GenStreamEvent {
  type: 'progress' | 'done' | 'error';
  stage?: 'fetch_job' | 'fetch_brand' | 'analyze' | 'plan' | 'write' | 'assemble';
  current?: number;
  total?: number;
  slug?: string;
  sections?: string[];
  message?: string;
  code?: string;
}

export const api = {
  getProfile: () => request('GET', '/api/v1/profile'),
  updateProfile: (patch: Record<string, unknown>) => request('PUT', '/api/v1/profile', patch),
  uploadCv: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/api/v1/profile/cv', fd);
  },
  parseCv: () => request('POST', '/api/v1/profile/cv/parse'),
  plans: () => request('GET', '/api/v1/billing/plans'),

  listDocuments: () => request('GET', '/api/v1/profile/documents'),
  uploadDocument: (file: File, kind?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    if (kind) fd.append('kind', kind);
    return request('POST', '/api/v1/profile/documents', fd);
  },
  deleteDocument: (id: string) => request('DELETE', `/api/v1/profile/documents/${id}`),

  listApplications: () => request('GET', '/api/v1/applications'),
  getApplication: (id: string) => request('GET', `/api/v1/applications/${id}`),
  createApplication: (input: {
    jobText?: string;
    jobUrl?: string;
    titleHint?: string;
    template?: string;
  }) => request('POST', '/api/v1/applications', input),
  generateApplication: (id: string, opts?: { focusPrompt?: string; language?: string }) =>
    request('POST', `/api/v1/applications/${id}/generate`, opts ?? {}),

  // Streaming-Generierung mit echten Fortschritts-Events (NDJSON) für den Live-Ladebalken.
  generateApplicationStream: async (
    id: string,
    opts: {
      focusPrompt?: string;
      language?: string;
      branding?: boolean;
      companyUrl?: string;
      // Trust-System / Meta (ADR 0012)
      market?: 'dach' | 'intl';
      showContactDetails?: boolean;
      /** IDs der vorab hochgeladenen Bilder (user_document, kind='image') → Galerie. */
      imageDocIds?: string[];
      /** Animiertes Remotion-Intro live auf der Seite einbetten. */
      motionIntro?: boolean;
    },
    onEvent: (ev: GenStreamEvent) => void,
  ): Promise<void> => {
    const token = await authToken();
    const res = await fetch(`/api/v1/applications/${id}/generate-stream`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(opts),
    });
    if (!res.body) throw new Error('Streaming nicht verfügbar.');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    const flush = (line: string) => {
      const t = line.trim();
      if (t) onEvent(JSON.parse(t) as GenStreamEvent);
    };
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        flush(buf.slice(0, nl));
        buf = buf.slice(nl + 1);
      }
    }
    flush(buf);
  },

  // KI-Bilder: erzeugt bis zu 5 thematische Bilder und hängt sie an die Bewerbung (content.media).
  generateImages: (id: string, count: number) =>
    request('POST', `/api/v1/applications/${id}/images`, { count }),

  // View-Analytics (Eigentümer) + Outcome-Events (Moat-Daten, ADR 0012 §7).
  getAnalytics: (id: string) => request('GET', `/api/v1/applications/${id}/analytics`),
  recordOutcome: (id: string, status: string, note?: string) =>
    request('POST', `/api/v1/applications/${id}/outcome`, { status, note }),

  // ATS-Export (PDF/DOCX): authentifizierter Fetch → Blob → Download (Bearer kann nicht per <a href>).
  downloadExport: async (id: string, format: 'pdf' | 'docx', filename: string): Promise<void> => {
    const token = await authToken();
    const res = await fetch(`/api/v1/applications/${id}/export?format=${format}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Export fehlgeschlagen.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
