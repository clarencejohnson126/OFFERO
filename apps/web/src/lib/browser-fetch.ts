import 'server-only';

import { decodeEntities, genericExtract, htmlToText } from '@offero/core';
import type { BrowserFetch, ExtractResult, ParsedUrl } from '@offero/core';

import { assertSafeUrl } from './server-url-safety';

// Echter-Browser-Fallback für JS-/Cloudflare-gewallte Portale (z. B. Indeed). Läuft NUR, wenn die
// billige HTTP-Schicht nicht reicht (siehe dispatchJobExtraction) — schnell + günstig im Normalfall.
// Umsetzung über ROHES CDP (Node-22-WebSocket): funktioniert auf der lokalen Automation-Chrome
// (deren Flags Playwrights Browser-Context-Kommandos ablehnen) UND gegen jeden gehosteten Browser,
// da alle das DevTools-Protokoll sprechen. Provider-agnostisch über die CDP-URL:
//  - lokal:  BU_CDP_URL  (http://127.0.0.1:9333)
//  - prod:   BROWSER_FETCH_CDP_URL  (http(s)- oder ws(s)-CDP-Endpunkt eines Browser-Dienstes)

const ENDPOINT = process.env.BROWSER_FETCH_CDP_URL ?? process.env.BU_CDP_URL;
const CONNECT_TIMEOUT = 8000;
const TOTAL_TIMEOUT = 26000;
const MIN_CHARS = 200;

const BRIGHTDATA_TOKEN = process.env.BRIGHTDATA_API_TOKEN;
const BRIGHTDATA_ZONE = process.env.BRIGHTDATA_ZONE ?? 'web_unlocker1';
const BRIGHTDATA_URL = 'https://api.brightdata.com/request';
const BRIGHTDATA_TIMEOUT = 40_000;

/**
 * Liefert den „echter Browser"-Fetcher (oder undefined, wenn kein Backend konfiguriert ist).
 * Kette: Bright Data (Produktion, BRIGHTDATA_API_TOKEN) → CDP (Lokal-Dev, BROWSER_FETCH_CDP_URL
 * oder BU_CDP_URL). In Produktion ohne CDP-Env ist nur Bright Data aktiv. Jedes Backend liefert
 * null zurück, wenn es scheitert — dann übernimmt das nächste in der Kette.
 */
export function makeBrowserFetch(): BrowserFetch | undefined {
  const bd = BRIGHTDATA_TOKEN ? makeBrightDataFetch(BRIGHTDATA_TOKEN, BRIGHTDATA_ZONE) : null;
  const cdp: BrowserFetch | null = ENDPOINT
    ? (u: ParsedUrl) => withTimeout(scrape(u, ENDPOINT as string), TOTAL_TIMEOUT)
    : null;

  // Kette: Bright Data → CDP (lokal). Keine Zeichenanzahl-Schwelle.
  const chain = [bd, cdp].filter((x): x is BrowserFetch => x !== null);
  if (chain.length === 0) return undefined;

  return async (u: ParsedUrl): Promise<ExtractResult | null> => {
    for (const backend of chain) {
      const r = await backend(u);
      if (r && r.text.trim().length > 0) return r;
    }
    return null;
  };
}

/** Bright Data Web Unlocker: ein API-Call löst Cloudflare/CAPTCHA, liefert die entsperrte Seite.
 *  Wir fragen Markdown an (data_format) und fallen sonst auf HTML-Extraktion zurück. */
function makeBrightDataFetch(token: string, zone: string): BrowserFetch {
  return async (u: ParsedUrl): Promise<ExtractResult | null> => {
    try {
      const res = await fetch(BRIGHTDATA_URL, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ zone, url: u.href, format: 'raw', data_format: 'markdown' }),
        signal: AbortSignal.timeout(BRIGHTDATA_TIMEOUT),
      });
      if (!res.ok) return null;
      const payload = await res.text();
      if (!payload) return null;
      // Mit data_format:markdown ist payload Markdown; ignoriert die Zone den Parameter, ist es HTML.
      const looksHtml = /<\s*(html|body|div|script|main)\b/i.test(payload.slice(0, 1000));
      const text = looksHtml ? (genericExtract(payload)?.text ?? htmlToText(payload)) : markdownToText(payload);
      if (text.trim().length < MIN_CHARS) return null;
      return { text: text.slice(0, 60_000), method: 'brightdata:unlocker' };
    } catch {
      return null;
    }
  };
}

/** Markdown leicht entschlacken: Bilder raus, Link-Text behalten, Struktur (Überschriften/Listen) bleibt. */
function markdownToText(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface InPageResult {
  best: string;
  ld: string;
  title: string;
  body: string;
}

// Läuft IM gerenderten Tab. Job-Container > JSON-LD JobPosting > Body-Text. Reines Browser-JS (String).
const EXTRACTOR = `(function(){
  var sels=['#jobDescriptionText','.jobsearch-JobComponent-description','[data-testid=jobDescriptionText]','.show-more-less-html__markup','[class*=JobDescription]','[class*=jobDescription]','[class*=job-description]','article','main'];
  var best='';
  for(var i=0;i<sels.length;i++){var el=document.querySelector(sels[i]);var t=el&&el.innerText?el.innerText.trim():'';if(t.length>best.length)best=t;}
  var ld='';
  var bl=document.querySelectorAll('script[type="application/ld+json"]');
  for(var j=0;j<bl.length;j++){try{var p=JSON.parse(bl[j].textContent||'null');var arr=Array.isArray(p)?p:(p&&p['@graph']?p['@graph']:[p]);for(var k=0;k<arr.length;k++){var o=arr[k];var ty=o&&o['@type'];var isJob=ty==='JobPosting'||(Array.isArray(ty)&&ty.indexOf('JobPosting')>=0);if(isJob&&typeof o.description==='string'&&o.description.length>ld.length)ld=o.description;}}catch(e){}}
  var h1=document.querySelector('h1');var title=(h1&&h1.innerText)||document.title||'';
  var body=document.body?document.body.innerText:'';
  return {best:best,ld:ld,title:title,body:body.slice(0,120000)};
})()`;

const READY = `(function(){var d=document;return {ready:d.readyState,hasJob:!!d.querySelector('#jobDescriptionText, .jobsearch-JobComponent-description'),bodyLen:d.body?d.body.innerText.length:0};})()`;

async function scrape(u: ParsedUrl, endpoint: string): Promise<ExtractResult | null> {
  const browserWs = await resolveBrowserWs(endpoint);
  if (!browserWs) return null;
  let cdp: CdpClient;
  try {
    cdp = await CdpClient.connect(browserWs, CONNECT_TIMEOUT);
  } catch {
    return null;
  }
  let targetId: string | undefined;
  try {
    const created = await cdp.send('Target.createTarget', { url: 'about:blank' });
    targetId = created['targetId'] as string;
    const attached = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = attached['sessionId'] as string;

    await cdp.send('Page.enable', {}, sessionId).catch(() => undefined);

    // Der Browser löst die URL für Page.navigate selbst per DNS auf und umgeht damit das IP-Pinning
    // der HTTP-Schicht (TOCTOU). Echtes Pinning ist im Browser nicht möglich — also re-validieren wir
    // UNMITTELBAR vor der Navigation, dass ALLE aktuell aufgelösten IPs öffentlich sind. Das schließt
    // das Zeitfenster so weit, wie es bei einem Browser geht. Wirft die Prüfung, brechen wir sauber ab.
    // Hinweis: Bright Data ist ein EXTERNER Proxy (kein Zugang zum internen Netz, kein SSRF-Vektor);
    // CDP ist nur Lokal-Dev.
    try {
      await assertSafeUrl(u.href);
    } catch {
      return null;
    }

    await cdp.send('Page.navigate', { url: u.href }, sessionId);
    await waitForContent(cdp, sessionId);

    const res = await cdp.send(
      'Runtime.evaluate',
      { expression: EXTRACTOR, returnByValue: true, awaitPromise: true },
      sessionId,
    );
    const value = (res['result'] as Record<string, unknown> | undefined)?.['value'] as
      | InPageResult
      | undefined;
    if (!value) return null;
    // innerText kann vereinzelt rohe Entities / NBSP enthalten → normalisieren.
    const text = decodeEntities(pickBest(value)).replace(/\u00a0/g, ' ');
    if (text.trim().length < MIN_CHARS) return null;
    return { text: text.slice(0, 60_000), title: value.title || undefined, method: 'browser:cdp' };
  } catch {
    return null;
  } finally {
    if (targetId) await cdp.send('Target.closeTarget', { targetId }).catch(() => undefined);
    cdp.close();
  }
}

/** Wartet, bis Job-Inhalt da ist (Cloudflare gelöst / SPA hydratisiert) — oder Timeout. */
async function waitForContent(cdp: CdpClient, sessionId: string): Promise<void> {
  await sleep(1400); // Cloudflare-Challenge lösen lassen
  for (let i = 0; i < 12; i++) {
    try {
      const res = await cdp.send(
        'Runtime.evaluate',
        { expression: READY, returnByValue: true },
        sessionId,
      );
      const v = (res['result'] as Record<string, unknown> | undefined)?.['value'] as
        | { ready?: string; hasJob?: boolean; bodyLen?: number }
        | undefined;
      if (v?.hasJob) return;
      if (i >= 2 && v?.ready === 'complete' && (v.bodyLen ?? 0) > 800) return;
    } catch {
      // weiter versuchen
    }
    await sleep(1200);
  }
}

function pickBest(r: InPageResult): string {
  if (r.best && r.best.length >= MIN_CHARS) return r.best;
  if (r.ld) {
    const t = htmlToText(r.ld);
    if (t.length >= MIN_CHARS) return t;
  }
  return r.body ?? '';
}

/** http(s)-Endpunkt → Browser-WS via /json/version; ws(s)-Endpunkt → direkt. */
async function resolveBrowserWs(endpoint: string): Promise<string | null> {
  if (/^wss?:\/\//i.test(endpoint)) return endpoint;
  try {
    const base = endpoint.replace(/\/+$/, '');
    const res = await fetch(`${base}/json/version`, { signal: AbortSignal.timeout(4000) });
    const data = (await res.json()) as Record<string, unknown>;
    const ws = data['webSocketDebuggerUrl'];
    return typeof ws === 'string' ? ws : null;
  } catch {
    return null;
  }
}

type CdpResult = Record<string, unknown>;

/** Minimaler CDP-Client: korrelierte id→Antwort, Session-Routing via flatten. */
class CdpClient {
  private id = 1;
  private readonly pending = new Map<
    number,
    { resolve: (v: CdpResult) => void; reject: (e: Error) => void }
  >();

  private constructor(private readonly ws: WebSocket) {
    ws.onmessage = (ev: MessageEvent) => this.onMessage(String(ev.data));
    ws.onclose = () => this.failAll(new Error('cdp closed'));
  }

  static connect(url: string, timeoutMs: number): Promise<CdpClient> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => {
        try {
          ws.close();
        } catch {
          /* noop */
        }
        reject(new Error('cdp connect timeout'));
      }, timeoutMs);
      ws.onopen = () => {
        clearTimeout(timer);
        resolve(new CdpClient(ws));
      };
      ws.onerror = () => {
        clearTimeout(timer);
        reject(new Error('cdp connect error'));
      };
    });
  }

  send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<CdpResult> {
    const id = this.id++;
    const msg: Record<string, unknown> = { id, method, params };
    if (sessionId) msg['sessionId'] = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      try {
        this.ws.send(JSON.stringify(msg));
      } catch (e) {
        this.pending.delete(id);
        reject(e instanceof Error ? e : new Error('cdp send failed'));
      }
    });
  }

  private onMessage(data: string): void {
    let m: Record<string, unknown>;
    try {
      m = JSON.parse(data) as Record<string, unknown>;
    } catch {
      return;
    }
    const id = m['id'];
    if (typeof id === 'number' && this.pending.has(id)) {
      const p = this.pending.get(id)!;
      this.pending.delete(id);
      const err = m['error'] as { message?: string } | undefined;
      if (err) p.reject(new Error(err.message ?? 'cdp error'));
      else p.resolve((m['result'] as CdpResult) ?? {});
    }
  }

  private failAll(e: Error): void {
    for (const p of this.pending.values()) p.reject(e);
    this.pending.clear();
  }

  close(): void {
    try {
      this.ws.close();
    } catch {
      /* noop */
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}
