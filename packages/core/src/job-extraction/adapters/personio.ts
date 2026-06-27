// Personio: der /xml-Feed listet alle Positionen einer Firma. Wir filtern nach der Stellen-ID
// und ziehen die jobDescriptions (CDATA-HTML). Hart rate-limitiert (429) → 1 Retry, sonst null.

import { htmlToText } from '../html';
import type { ExtractResult, Fetcher, JobAdapter, ParsedUrl } from '../types';

const HOST_RE = /^([a-z0-9-]+)\.jobs\.personio\.(de|com)$/;
const ID_RE = /\/job\/(\d+)/;

export const personioAdapter: JobAdapter = {
  id: 'personio',
  match: (u: ParsedUrl) => HOST_RE.test(u.hostname) && ID_RE.test(u.pathname),
  async extract(u: ParsedUrl, fetch: Fetcher): Promise<ExtractResult | null> {
    const host = HOST_RE.exec(u.hostname);
    const company = host?.[1];
    const id = ID_RE.exec(u.pathname)?.[1];
    if (!company || !id) return null;
    const res = await fetch(`https://${company}.jobs.personio.de/xml`, {
      retries: 1,
      retryOn: [429],
    });
    if (res.status >= 400 || !res.body) return null;

    const positions = res.body.match(/<position>[\s\S]*?<\/position>/gi) ?? [];
    const block = positions.find((p) => new RegExp(`<id>\\s*${id}\\s*</id>`).test(p));
    if (!block) return null;

    const descContainer = /<jobDescriptions>([\s\S]*?)<\/jobDescriptions>/i.exec(block)?.[1];
    if (!descContainer) return null;

    const parts: string[] = [];
    const cdataRe = /<!\[CDATA\[([\s\S]*?)\]\]>/g;
    let cm: RegExpExecArray | null;
    while ((cm = cdataRe.exec(descContainer)) !== null) {
      const piece = cm[1];
      if (piece) {
        const t = htmlToText(piece);
        if (t) parts.push(t);
      }
    }
    const text = parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length < 200) return null;

    const title = /<name>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/name>/i.exec(block)?.[1];
    return {
      text,
      title: title ? htmlToText(title) : undefined,
      method: 'personio:xml-feed',
    };
  },
};
