import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OfferoClient } from '../src';

// Baut eine Response, die das Server-Envelope spiegelt (ok(data) → reines JSON, kein Wrapper).
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const BASE = 'https://api.offero.test';

// Minimale, aber typtreue Fixtures (camelCase wie die Domänen-Entities).
const application = {
  id: 'app-1',
  userId: 'user-1',
  tenantSlug: 'app-1',
  jobUrl: null,
  jobText: 'Stellenanzeige …',
  company: {},
  status: 'ready' as const,
  currentVersionId: 'ver-1',
  customDomain: null,
  template: 'aurora',
  createdAt: '2026-06-20T00:00:00.000Z',
};

const version = {
  id: 'ver-1',
  applicationId: 'app-1',
  kind: 'generation' as const,
  content: {} as never,
  modelUsed: null,
  costCents: 0,
  createdAt: '2026-06-20T00:00:00.000Z',
};

describe('ApplicationsResource — Wire-Contract gegen /api/v1', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: OfferoClient;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    client = new OfferoClient({ baseUrl: BASE });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function lastCall(): { url: string; method: string } {
    const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    return { url, method: String(init.method) };
  }

  it('list() → GET /api/v1/applications, packt { applications } aus', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ applications: [application] }));
    const result = await client.applications.list();
    const { url, method } = lastCall();
    expect(method).toBe('GET');
    expect(url).toBe(`${BASE}/api/v1/applications`);
    expect(result).toEqual([application]);
  });

  it('create() → POST /api/v1/applications, packt { application } aus', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ application }, 201));
    const result = await client.applications.create({ jobUrl: 'https://example.com/job' });
    const { url, method } = lastCall();
    expect(method).toBe('POST');
    expect(url).toBe(`${BASE}/api/v1/applications`);
    expect(result).toEqual(application);
  });

  it('create() sendet jobUrl/jobText/titleHint/template/company im Body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ application }, 201));
    await client.applications.create({
      jobUrl: 'https://example.com/job',
      jobText: 'Text',
      titleHint: 'Frontend',
      template: 'aurora',
      company: { name: 'ACME' },
    });
    const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      jobUrl: 'https://example.com/job',
      jobText: 'Text',
      titleHint: 'Frontend',
      template: 'aurora',
      company: { name: 'ACME' },
    });
  });

  it('get() → GET /api/v1/applications/:id, liefert { application, version }', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ application, version }));
    const result = await client.applications.get('app-1');
    const { url, method } = lastCall();
    expect(method).toBe('GET');
    expect(url).toBe(`${BASE}/api/v1/applications/app-1`);
    expect(result).toEqual({ application, version });
  });

  it('get() reicht version: null durch (keine generierte Version)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ application, version: null }));
    const result = await client.applications.get('app-1');
    expect(result.version).toBeNull();
  });

  it('remove() → DELETE /api/v1/applications/:id, liefert { ok: true }', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const result = await client.applications.remove('app-1');
    const { url, method } = lastCall();
    expect(method).toBe('DELETE');
    expect(url).toBe(`${BASE}/api/v1/applications/app-1`);
    expect(result).toEqual({ ok: true });
  });

  it('generate() → POST /api/v1/applications/:id/generate, liefert { application, version }', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ application, version }));
    const result = await client.applications.generate('app-1');
    const { url, method } = lastCall();
    expect(method).toBe('POST');
    expect(url).toBe(`${BASE}/api/v1/applications/app-1/generate`);
    expect(result).toEqual({ application, version });
  });

  it('status() → GET /api/v1/applications/:id/status, liefert { status, currentVersionId }', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ status: 'generating', currentVersionId: null }),
    );
    const result = await client.applications.status('app-1');
    const { url, method } = lastCall();
    expect(method).toBe('GET');
    expect(url).toBe(`${BASE}/api/v1/applications/app-1/status`);
    expect(result).toEqual({ status: 'generating', currentVersionId: null });
  });

  it('wirft OfferoApiError mit code/message aus dem Error-Envelope', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { code: 'VALIDATION', message: 'Ungültige Eingabe.' } }, 422),
    );
    await expect(client.applications.create({})).rejects.toMatchObject({
      name: 'OfferoApiError',
      status: 422,
      code: 'VALIDATION',
    });
  });
});
