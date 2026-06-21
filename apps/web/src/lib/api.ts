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
};
