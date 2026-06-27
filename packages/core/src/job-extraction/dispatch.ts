// Dispatcher: passender Adapter → bei Treffer dessen Ergebnis; sonst generischer Pfad
// (JSON-LD JobPosting → Readability). Scheitert alles, wird ein freundlicher „Text einfügen"-Hinweis
// als VALIDATION-Fehler (422) geworfen — die UI behandelt ihn als Nudge, nicht als harten Fehler.

import { errors } from '../domain/errors';
import { extractJsonLdJobPosting, htmlToText, stripLeadingNull } from './html';
import { PASTE_NUDGE } from './messages';
import { REGISTRY } from './registry';
import type { ExtractResult, FetchResponse, Fetcher, ParsedUrl } from './types';

// Keine Zeichenanzahl-Schwelle — alles wird an die Pipeline weitergegeben.
// Wer blockieren will, blockt im Adapter (blocked: true). Sonst gilt: scrapen, übergeben.
const MIN_CHARS = 1;

/** Optionaler echter-Browser-Abruf (löst Cloudflare/JS-Challenges). Wird vom Web-Container
 *  injiziert, wenn ein Browser-Backend konfiguriert ist (lokal: CDP; prod: Hosted-Browser).
 *  Bleibt er undefiniert, nudgen geblockte Portale wie bisher zum Einfügen. */
export type BrowserFetch = (u: ParsedUrl) => Promise<ExtractResult | null>;

export interface DispatchOptions {
  browserFetch?: BrowserFetch;
}

export async function dispatchJobExtraction(
  u: ParsedUrl,
  fetch: Fetcher,
  opts: DispatchOptions = {},
): Promise<ExtractResult> {
  const adapter = REGISTRY.find((a) => a.match(u));

  if (adapter?.blocked) {
    // Cloudflare/JS-gewallt (z. B. Indeed): URL normalisieren, dann echter Browser.
    const target = adapter.normalizeUrl ? adapter.normalizeUrl(u) : u;
    const viaBrowser = await tryBrowser(opts.browserFetch, target);
    if (viaBrowser) return viaBrowser;
    throw errors.validation(adapter.blockedMessage ?? PASTE_NUDGE);
  }

  if (adapter) {
    try {
      const r = await adapter.extract(u, fetch);
      if (r && r.text.trim().length >= MIN_CHARS) return r;
    } catch {
      // Adapter-Fehler (z. B. LinkedIn-Throttle) → generischer Pfad als Auffangnetz.
    }
  }

  // Generischer Pfad: Originalseite holen und schema.org-konform / per Readability auswerten.
  let page: FetchResponse | null = null;
  try {
    page = await fetch(u.href);
  } catch {
    page = null;
  }
  if (page && page.status < 400 && page.body) {
    const generic = genericExtract(page.body);
    if (generic) return generic;
  }

  // Letzte Instanz: echter Browser (falls verfügbar) für JS-lastige/abgewehrte Seiten.
  const viaBrowser = await tryBrowser(opts.browserFetch, u);
  if (viaBrowser) return viaBrowser;

  throw errors.validation(PASTE_NUDGE);
}

async function tryBrowser(
  browserFetch: BrowserFetch | undefined,
  u: ParsedUrl,
): Promise<ExtractResult | null> {
  if (!browserFetch) return null;
  try {
    const r = await browserFetch(u);
    return r && r.text.trim().length >= MIN_CHARS ? r : null;
  } catch {
    return null;
  }
}

/** Universeller Default: JSON-LD `JobPosting` (StepStone/Xing/Ashby/…), sonst Readability-Boden. */
export function genericExtract(html: string): ExtractResult | null {
  const jp = extractJsonLdJobPosting(html);
  if (jp?.description) {
    const text = htmlToText(stripLeadingNull(jp.description));
    if (text.trim().length >= MIN_CHARS) {
      return { text, title: jp.title, company: jp.company, method: 'generic:json-ld' };
    }
  }
  const text = htmlToText(html);
  if (text.trim().length >= MIN_CHARS) return { text, method: 'generic:readability' };
  return null;
}
