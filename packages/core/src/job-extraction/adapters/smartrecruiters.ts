// SmartRecruiters: öffentliche Postings-API. Die Beschreibung verteilt sich auf jobAd.sections.*.text
// (jeweils HTML). Manche Abschnitte sind legitim leer → erst nach dem Join die Mindestlänge prüfen.

import { htmlToText } from '../html';
import type { ExtractResult, Fetcher, JobAdapter, ParsedUrl } from '../types';

const RE = /smartrecruiters\.com\/([^/?#]+)\/(\d+)/;
const SECTION_KEYS = [
  'companyDescription',
  'jobDescription',
  'qualifications',
  'additionalInformation',
];

export const smartrecruitersAdapter: JobAdapter = {
  id: 'smartrecruiters',
  match: (u: ParsedUrl) => /(^|\.)smartrecruiters\.com$/.test(u.hostname) && RE.test(u.href),
  async extract(u: ParsedUrl, fetch: Fetcher): Promise<ExtractResult | null> {
    const m = RE.exec(u.href);
    const company = m?.[1];
    const id = m?.[2];
    if (!company || !id) return null;
    const res = await fetch(`https://api.smartrecruiters.com/v1/companies/${company}/postings/${id}`);
    if (res.status >= 400 || !res.body) return null;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(res.body) as Record<string, unknown>;
    } catch {
      return null;
    }
    const jobAd = data['jobAd'];
    const sections =
      jobAd && typeof jobAd === 'object'
        ? ((jobAd as Record<string, unknown>)['sections'] as Record<string, unknown> | undefined)
        : undefined;
    if (!sections) return null;
    const parts: string[] = [];
    for (const key of SECTION_KEYS) {
      const sec = sections[key];
      if (sec && typeof sec === 'object') {
        const t = (sec as Record<string, unknown>)['text'];
        if (typeof t === 'string' && t.trim()) parts.push(htmlToText(t));
      }
    }
    const text = parts.join('\n\n').trim();
    if (text.length < 200) return null;
    return {
      text,
      title: typeof data['name'] === 'string' ? data['name'] : undefined,
      method: 'smartrecruiters:postings-api',
    };
  },
};
