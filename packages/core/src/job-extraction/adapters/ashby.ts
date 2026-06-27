// Ashby: das Board-Endpoint liefert ALLE Jobs der Firma inkl. voller descriptionPlain in EINEM Call.
// Der per-Job-Pfad antwortet 401 — also Board laden und nach UUID filtern.

import type { ExtractResult, Fetcher, JobAdapter, ParsedUrl } from '../types';

const RE = /ashbyhq\.com\/([^/?#]+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/;

export const ashbyAdapter: JobAdapter = {
  id: 'ashby',
  match: (u: ParsedUrl) => /(^|\.)ashbyhq\.com$/.test(u.hostname) && RE.test(u.href),
  async extract(u: ParsedUrl, fetch: Fetcher): Promise<ExtractResult | null> {
    const m = RE.exec(u.href);
    const company = m?.[1];
    const id = m?.[2];
    if (!company || !id) return null;
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company}`);
    if (res.status >= 400 || !res.body) return null;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(res.body) as Record<string, unknown>;
    } catch {
      return null;
    }
    const jobs = data['jobs'];
    if (!Array.isArray(jobs)) return null;
    const job = jobs.find(
      (j) => j && typeof j === 'object' && (j as Record<string, unknown>)['id'] === id,
    ) as Record<string, unknown> | undefined;
    if (!job) return null;
    const desc = job['descriptionPlain'];
    const text = typeof desc === 'string' ? desc.trim() : '';
    if (text.length < 200) return null;
    return {
      text,
      title: typeof job['title'] === 'string' ? job['title'] : undefined,
      method: 'ashby:posting-api',
    };
  },
};
