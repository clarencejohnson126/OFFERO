// Lever: öffentliche Postings-API (?mode=json). Die volle Anzeige steckt nicht in descriptionPlain
// allein (nur Intro), sondern in descriptionPlain + lists[].text/.content + additionalPlain.

import { htmlToText } from '../html';
import type { ExtractResult, Fetcher, JobAdapter, ParsedUrl } from '../types';

const RE =
  /lever\.co\/([^/]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/;

export const leverAdapter: JobAdapter = {
  id: 'lever',
  match: (u: ParsedUrl) => /(^|\.)lever\.co$/.test(u.hostname) && RE.test(u.href),
  async extract(u: ParsedUrl, fetch: Fetcher): Promise<ExtractResult | null> {
    const m = RE.exec(u.href);
    const company = m?.[1];
    const id = m?.[2];
    if (!company || !id) return null;
    const res = await fetch(`https://api.lever.co/v0/postings/${company}/${id}?mode=json`);
    if (res.status >= 400 || !res.body) return null;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(res.body) as Record<string, unknown>;
    } catch {
      return null;
    }
    const parts: string[] = [];
    if (typeof data['descriptionPlain'] === 'string') parts.push(data['descriptionPlain']);
    const lists = data['lists'];
    if (Array.isArray(lists)) {
      for (const item of lists) {
        if (item && typeof item === 'object') {
          const l = item as Record<string, unknown>;
          if (typeof l['text'] === 'string') parts.push(htmlToText(l['text']));
          if (typeof l['content'] === 'string') parts.push(htmlToText(l['content']));
        }
      }
    }
    if (typeof data['additionalPlain'] === 'string') parts.push(data['additionalPlain']);
    const text = parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length < 200) return null;
    return {
      text,
      title: typeof data['text'] === 'string' ? data['text'] : undefined,
      method: 'lever:postings-api',
    };
  },
};
