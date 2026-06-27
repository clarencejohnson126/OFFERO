// Verträge der Job-Extraktions-Schicht. Framework-neutral: keine URL/fetch/Node-Typen.
// Der Transport (echtes fetch, SSRF, Timeout, Header-Policy) wird als `Fetcher` injiziert
// (Dependency Inversion) — so bleiben die Portal-Adapter pur und in jedem Client wiederverwendbar.

/** Vorgeparste URL als reine Daten (der Aufrufer parst mit dem echten `URL`). */
export interface ParsedUrl {
  /** Vollständige URL als String. */
  href: string;
  /** Kleingeschriebener Host. */
  hostname: string;
  /** Pfad (mit führendem `/`). */
  pathname: string;
  /** Roher Query-String inkl. führendem `?`, sonst ''. */
  search: string;
}

/** Optionen für einen einzelnen Abruf. */
export interface FetchInit {
  /** Zusätzliche/überschreibende Header (z. B. `X-API-Key`). */
  headers?: Record<string, string>;
  /** Extra-Versuche bei leerem/kurzem Body (Bot-Sensoren). */
  retries?: number;
  /** Status-Codes, die einen Retry auslösen (z. B. 429, 999). */
  retryOn?: number[];
}

/** Antwort des injizierten Transports — bewusst minimal (nur Strings/Zahlen). */
export interface FetchResponse {
  status: number;
  body: string;
}

/** Injizierter Transport. Implementiert SSRF-Schutz, Timeout, Größenlimit, Header-Policy. */
export type Fetcher = (url: string, init?: FetchInit) => Promise<FetchResponse>;

/** Ergebnis einer erfolgreichen Extraktion. */
export interface ExtractResult {
  /** Reiner Anzeigentext (Tags entfernt, Entities dekodiert). */
  text: string;
  title?: string;
  company?: string;
  /** Welche Technik gegriffen hat, z. B. `linkedin:guest-api` (Observability). */
  method: string;
}

/** Ein Portal-Adapter. Hinzufügen eines Portals = eine Datei + ein Registry-Eintrag. */
export interface JobAdapter {
  id: string;
  /** Portal ist serverseitig nicht abrufbar (z. B. Cloudflare-Challenge) → sofort Nudge. */
  blocked?: boolean;
  /** Nutzer-Hinweis bei `blocked` (nennt das Portal konkret). */
  blockedMessage?: string;
  /** Optionale URL-Normalisierung vor dem Abruf (z. B. ?vjk=→/viewjob?jk=). */
  normalizeUrl?(u: ParsedUrl): ParsedUrl;
  match(u: ParsedUrl): boolean;
  /** Liefert Ergebnis oder `null` (→ generischer Fallback im Dispatcher). */
  extract(u: ParsedUrl, fetch: Fetcher): Promise<ExtractResult | null>;
}
