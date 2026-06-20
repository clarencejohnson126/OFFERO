export interface OfferoClientOptions {
  baseUrl: string;
  /** Liefert das JWT (Supabase Auth). Mobile schickt es als Bearer-Header. */
  getToken?: () => string | null | Promise<string | null>;
  /** Optionaler fetch-Impl (Tests/SSR). Default: globales fetch. */
  fetchImpl?: typeof fetch;
}

export class OfferoApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'OfferoApiError';
    this.code = code;
    this.status = status;
  }
}

export type RequestFn = <T>(method: string, path: string, body?: unknown) => Promise<T>;

export function createRequest(opts: OfferoClientOptions): RequestFn {
  const doFetch = opts.fetchImpl ?? fetch;
  return async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const token = opts.getToken ? await opts.getToken() : null;
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (token) headers.authorization = `Bearer ${token}`;

    const res = await doFetch(`${opts.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();
    const json: unknown = text.length > 0 ? JSON.parse(text) : null;

    if (!res.ok) {
      const err =
        json && typeof json === 'object' && 'error' in json
          ? (json as { error: { code: string; message: string } }).error
          : { code: 'INTERNAL', message: res.statusText };
      throw new OfferoApiError(res.status, err.code, err.message);
    }
    return json as T;
  };
}
