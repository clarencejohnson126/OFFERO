import 'server-only';

import { dispatchJobExtraction, errors } from '@offero/core';
import type { FetchInit, FetchResponse, Fetcher, ParsedUrl } from '@offero/core';

import { makeBrowserFetch } from './browser-fetch';
import { assertSafeUrl, safeFetch } from './server-url-safety';

// Web-Transport für die Job-Extraktion: SSRF-Schutz, Timeout, Größenlimit und Header-Policy.
// Die Portal-Logik (welcher Adapter, welche API) lebt framework-neutral in @offero/core; hier ist
// nur „wie wird real gefetcht". Ein echter Desktop-Chrome-Header-Satz ersetzt den alten Bot-UA —
// mehrere Portale (StepStone/Akamai, LinkedIn) liefern nur damit den vollen Inhalt.
// SSRF-Prüfung liegt zentral in server-url-safety.ts (DNS-Auflösung + IP-Range-Checks).

// Kein `accept-encoding` setzen: undici (Node-fetch) verhandelt gzip/br selbst und dekomprimiert —
// ein manueller Header würde die Auto-Dekompression abschalten und Müll-Bytes liefern.
const CHROME_HEADERS: Record<string, string> = {
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'de-DE,de;q=0.9,en;q=0.8',
  'sec-ch-ua': '"Chromium";v="124", "Not.A/Brand";v="24", "Google Chrome";v="124"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'upgrade-insecure-requests': '1',
};

const TIMEOUT_MS = 9000;
const MAX_BYTES = 3_000_000;

/** Wirft VALIDATION (422) bei nicht-http(s) oder internen/lokalen Adressen. Für JEDE Ziel-URL,
 *  auch die von Adaptern angesprochenen (greenhouse-api, rest.arbeitsagentur.de …).
 *  Delegiert an den zentralen SSRF-Guard (DNS + IP-Range) und übersetzt dessen Fehler in
 *  eine VALIDATION-Domain-Fehlermeldung, damit die UI sie als 422 behandelt. */
async function assertAllowed(url: URL): Promise<void> {
  try {
    await assertSafeUrl(url.toString());
  } catch (e) {
    throw errors.validation(
      e instanceof Error ? e.message : 'Interne/lokale Adressen sind nicht erlaubt.',
    );
  }
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Baut den injizierten Fetcher: Chrome-Header + Referer, Header-Overrides, Retry-Logik. */
function makeFetcher(): Fetcher {
  return async (target: string, init?: FetchInit): Promise<FetchResponse> => {
    const url = new URL(target);
    await assertAllowed(url);
    const headers: Record<string, string> = {
      ...CHROME_HEADERS,
      referer: `${url.protocol}//${url.host}/`,
      ...(init?.headers ?? {}),
    };
    const maxRetries = init?.retries ?? 0;
    const retryOn = init?.retryOn ?? [];

    for (let attempt = 0; ; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      let res: Response;
      try {
        // safeFetch folgt Redirects manuell und prüft jeden Hop erneut gegen den SSRF-Guard.
        res = await safeFetch(url.toString(), {
          signal: ctrl.signal,
          headers,
        });
      } catch {
        clearTimeout(timer);
        if (attempt < maxRetries) {
          await delay(800);
          continue;
        }
        return { status: 0, body: '' };
      }
      clearTimeout(timer);

      const buf = await res.arrayBuffer();
      const slice = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
      const body = new TextDecoder().decode(slice);

      // Bot-Sensoren (Akamai) liefern manchmal 200 mit leerem Body → ein Retry hilft.
      const tooShort = body.trim().length < 64;
      if (attempt < maxRetries && (retryOn.includes(res.status) || tooShort)) {
        await delay(1200);
        continue;
      }
      return { status: res.status, body };
    }
  };
}

/**
 * Holt den Anzeigentext einer Stellen-URL. Erkennt das Portal (LinkedIn Guest-API, Arbeitsagentur-
 * REST, ATS-JSON, schema.org-JSON-LD …) über die Adapter-Registry in @offero/core und fällt sonst
 * auf generische Extraktion zurück. Nicht-lesbare Links (z. B. Indeed/Cloudflare) werfen einen
 * freundlichen „Text einfügen"-Hinweis (VALIDATION/422), den die UI als Nudge behandelt.
 */
export async function fetchJobText(rawUrl: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw errors.validation('Das ist kein gültiger Link.');
  }
  await assertAllowed(url);

  const parsed: ParsedUrl = {
    href: url.toString(),
    hostname: url.hostname.toLowerCase(),
    pathname: url.pathname,
    search: url.search,
  };

  const result = await dispatchJobExtraction(parsed, makeFetcher(), {
    browserFetch: makeBrowserFetch(),
  });
  return result.text.slice(0, 60_000);
}
