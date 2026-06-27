import 'server-only';

import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

// Zentraler SSRF-/URL-Schutz für ALLE serverseitigen Outbound-Fetches (Job-Extraktion, Brand-Scrape).
// Ersetzt die früher dreifach duplizierten, regex-basierten Host-Blocklisten durch eine einzige Quelle:
// Protokoll-/Credential-Prüfung + DNS-Auflösung + IP-Range-Checks gegen private/reservierte Netze.
// Wichtig: Wir prüfen die REAL aufgelösten Adressen (dns.lookup), nicht nur den Hostnamen-String —
// sonst umgeht ein Angreifer den Schutz mit einer öffentlich aussehenden Domain, die auf 127.0.0.1 zeigt.

/** Cloud-Metadata-Endpunkt (AWS/GCP/Azure) — niemals erreichbar machen. */
const METADATA_IP = '169.254.169.254';

/** Liefert true, wenn die IPv4-Adresse in einem privaten/reservierten Bereich liegt. */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    // Unparsbar → vorsichtshalber als privat behandeln (blocken).
    return true;
  }
  const [a = 0, b = 0, c = 0] = parts;
  // 0.0.0.0/8 — „dieses" Netz
  if (a === 0) return true;
  // 10.0.0.0/8 — privat
  if (a === 10) return true;
  // 100.64.0.0/10 — CGNAT
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 — Loopback
  if (a === 127) return true;
  // 169.254.0.0/16 — Link-local (inkl. Cloud-Metadata)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 — privat
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 — IETF-Protokollzuweisungen
  if (a === 192 && b === 0 && c === 0) return true;
  // 192.168.0.0/16 — privat
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 — Benchmark-Tests
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

/** Liefert true, wenn die IPv6-Adresse loopback/ULA/link-local/unspecified ist
 *  oder eine IPv4-mapped Adresse mit privatem eingebettetem v4-Anteil. */
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // :: — unspecified
  if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;
  // ::1 — Loopback
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;

  // IPv4-mapped (::ffff:x.x.x.x oder ::ffff:hhhh:hhhh) → eingebettetes v4 erneut prüfen.
  const mapped = /^::ffff:(.+)$/.exec(lower);
  const tail = mapped?.[1];
  if (tail) {
    if (tail.includes('.')) {
      return isPrivateIPv4(tail);
    }
    // Hex-Form ::ffff:hhhh:hhhh → in Dotted-Quad umrechnen. WICHTIG: jede 16-Bit-Gruppe einzeln
    // auf 4 Hex-Stellen zero-padden, NICHT roh zusammenkleben — sonst wird z. B. c0a8:101 zu
    // „c0a8101" (7 Stellen → 12.10.129.1, fälschlich „öffentlich") statt „c0a80101" (= 192.168.1.1).
    const groups = tail.split(':');
    if (groups.every((g) => /^[0-9a-f]{1,4}$/.test(g))) {
      const hex = groups
        .map((g) => g.padStart(4, '0'))
        .join('')
        .padStart(8, '0')
        .slice(-8);
      const num = Number.parseInt(hex, 16) >>> 0;
      const v4 = `${(num >>> 24) & 0xff}.${(num >>> 16) & 0xff}.${(num >>> 8) & 0xff}.${num & 0xff}`;
      return isPrivateIPv4(v4);
    }
  }

  // fc00::/7 — Unique Local Address (fc.. / fd..)
  if (/^f[cd]/.test(lower)) return true;
  // fe80::/10 — Link-local
  if (/^fe[89ab]/.test(lower)) return true;
  return false;
}

/** True, wenn eine bereits-IP-Adresse in einem privaten/reservierten Bereich liegt. */
function isPrivateAddress(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  // Kein gültiges IP-Literal → kein IP-basierter Block hier.
  return false;
}

/**
 * Interne Validierung: prüft dieselben Regeln wie assertSafeUrl, liefert aber zusätzlich
 * die erste aufgelöste IP-Adresse zurück. Diese wird von safeFetch zum IP-Pinning benutzt,
 * damit DNS-Auflösung und TCP-Verbindung in EINER Operation stattfinden — kein TOCTOU-Fenster.
 * pinnedIp ist null, wenn der Host bereits ein IP-Literal ist (kein DNS-Lookup nötig).
 */
async function assertAndResolve(url: string): Promise<{ url: URL; pinnedIp: string | null }> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new Error('Ungültige URL.');
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Nur http/https-Links sind erlaubt.');
  }
  if (u.username || u.password) {
    throw new Error('URLs mit eingebetteten Zugangsdaten sind nicht erlaubt.');
  }

  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (host === 'localhost' || host.endsWith('.localhost')) {
    throw new Error('Interne/lokale Adressen sind nicht erlaubt.');
  }
  if (host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Interne/lokale Adressen sind nicht erlaubt.');
  }
  if (host === METADATA_IP) {
    throw new Error('Cloud-Metadata-Adressen sind nicht erlaubt.');
  }

  // IP-Literal: direkt prüfen, kein DNS — und kein TOCTOU-Fenster möglich.
  const literalFamily = net.isIP(host);
  if (literalFamily !== 0) {
    if (isPrivateAddress(host)) {
      throw new Error('Interne/lokale Adressen sind nicht erlaubt.');
    }
    return { url: u, pinnedIp: null }; // IP literal → fetch verbindet sich sowieso direkt
  }

  if (!host.includes('.')) {
    throw new Error('Interne/lokale Hostnamen sind nicht erlaubt.');
  }

  // DNS auflösen — ALLE Adressen prüfen (Schutz gegen Wildcard-DNS auf private Netze).
  // Die erste Adresse merken wir uns für IP-Pinning in safeFetch.
  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.promises.lookup(host, { all: true });
  } catch {
    throw new Error('Hostname konnte nicht aufgelöst werden.');
  }
  if (addresses.length === 0) {
    throw new Error('Hostname konnte nicht aufgelöst werden.');
  }
  for (const { address } of addresses) {
    if (address === METADATA_IP || isPrivateAddress(address)) {
      throw new Error('Adresse zeigt auf ein internes/reserviertes Netz.');
    }
  }

  return { url: u, pinnedIp: addresses[0]!.address };
}

/**
 * Validiert eine URL serverseitig gegen SSRF. Wirft mit klarer Meldung bei:
 * nicht-http(s), eingebetteten Credentials, lokalen/internen Hostnamen, dem Metadata-IP,
 * oder wenn IRGENDEINE per DNS aufgelöste Adresse privat/reserviert ist.
 * Gibt die geparste URL zurück, damit Aufrufer sie direkt weiterverwenden können.
 */
export async function assertSafeUrl(url: string): Promise<URL> {
  return (await assertAndResolve(url)).url;
}

/** Baut einen AbortError, der ggf. den Abbruchgrund des Signals übernimmt (wie fetch ihn meldet). */
function abortError(signal: AbortSignal): Error {
  const reason = (signal as { reason?: unknown }).reason;
  if (reason instanceof Error) return reason;
  return new DOMException('Die Anfrage wurde abgebrochen.', 'AbortError');
}

/**
 * Verbindet sich mit der bereits validierten IP, setzt dabei den richtigen Host-Header
 * (Virtual Hosting) und den TLS-SNI auf den Originalhostnamen (damit das Zertifikat
 * korrekt validiert wird). Schließt das DNS-Rebinding-Fenster, das bei einem separaten
 * fetch(url) entstünde.
 */
async function pinnedFetch(u: URL, pinnedIp: string, init?: RequestInit): Promise<Response> {
  const isHttps = u.protocol === 'https:';
  const port = u.port ? Number(u.port) : isHttps ? 443 : 80;

  const commonOpts: http.RequestOptions = {
    host: pinnedIp,
    port,
    path: `${u.pathname}${u.search}`,
    method: String(init?.method ?? 'GET'),
    headers: {
      accept: 'text/html,application/xhtml+xml,*/*',
      'user-agent': 'Offero/1.0',
      ...(init?.headers as Record<string, string> | undefined ?? {}),
      host: u.host, // korrekter Host-Header für Virtual Hosting
    },
    timeout: 15_000,
  };

  // AbortSignal des Aufrufers (z. B. der 9s-Controller aus fetch-job.ts) verdrahten: Wenn bereits
  // abgebrochen, sofort rejecten — sonst einen abort-Listener registrieren, der die laufende Anfrage
  // abbricht. Ohne diese Verdrahtung würde nur der eigene 15s-Timeout greifen und ein Abbruch nach
  // 10ms praktisch 15s dauern. Der Listener wird beim Settle wieder entfernt (kein Leak).
  const signal = init?.signal ?? undefined;

  return new Promise<Response>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError(signal));
      return;
    }

    let onAbort: (() => void) | undefined;
    const cleanup = () => {
      if (onAbort && signal) signal.removeEventListener('abort', onAbort);
    };

    const settle = {
      resolve: (r: Response) => {
        cleanup();
        resolve(r);
      },
      reject: (e: unknown) => {
        cleanup();
        reject(e);
      },
    };

    const callback = (res: http.IncomingMessage) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        const hdrs: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (v != null) hdrs[k] = Array.isArray(v) ? v.join(', ') : v;
        }
        settle.resolve(
          new Response(chunks.length > 0 ? Buffer.concat(chunks) : null, {
            status: res.statusCode ?? 200,
            headers: hdrs,
          }),
        );
      });
      res.on('error', settle.reject);
    };

    const req = isHttps
      ? https.request({ ...commonOpts, servername: u.hostname }, callback)
      : http.request(commonOpts, callback);

    req.on('error', settle.reject);
    req.on('timeout', () => {
      req.destroy();
      settle.reject(new Error('Zeitüberschreitung beim Abrufen der URL.'));
    });

    if (signal) {
      onAbort = () => {
        req.destroy();
        settle.reject(abortError(signal));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }

    req.end();
  });
}

/** Optionen für safeFetch. */
export interface SafeFetchOpts {
  /** Maximale Anzahl manuell gefolgter Redirects (Default 4). */
  maxRedirects?: number;
}

/**
 * SSRF-sicherer fetch: validiert die Ziel-URL, löst DNS auf und verbindet sich via pinnedFetch
 * direkt zur geprüften IP (kein erneuter DNS-Lookup → kein DNS-Rebinding-Fenster). Folgt
 * Redirects MANUELL und prüft + pinnt jeden Hop erneut. Methode/Header aus `init` bleiben
 * erhalten. Gibt die finale Response zurück. Wirft bei zu vielen Redirects oder blockiertem Hop.
 */
export async function safeFetch(
  url: string,
  init?: RequestInit,
  opts?: SafeFetchOpts,
): Promise<Response> {
  const maxRedirects = opts?.maxRedirects ?? 4;
  let { url: currentUrl, pinnedIp } = await assertAndResolve(url);

  for (let hop = 0; ; hop++) {
    // IP-Literal: kein pinnedIp nötig, fetch() verbindet sich direkt.
    const res = pinnedIp
      ? await pinnedFetch(currentUrl, pinnedIp, init)
      : await fetch(currentUrl.toString(), { ...init, redirect: 'manual' });

    const isRedirect = res.status >= 300 && res.status < 400;
    const location = res.headers.get('location');
    if (!isRedirect || !location) {
      return res;
    }

    if (hop >= maxRedirects) {
      throw new Error('Zu viele Weiterleitungen.');
    }

    let next: string;
    try {
      next = new URL(location, currentUrl.toString()).toString();
    } catch {
      throw new Error('Ungültige Weiterleitungs-Adresse.');
    }
    // Jeder Redirect-Hop wird erneut validiert und bekommt sein eigenes IP-Pin.
    ({ url: currentUrl, pinnedIp } = await assertAndResolve(next));
  }
}
