// LinkedIn: kein JSON-LD, aber eine saubere Guest-API liefert die volle Beschreibung ohne Auth.
// /jobs-guest/jobs/api/jobPosting/<id> — empirisch verifiziert. Soft-Throttle (429/999) → 1 Retry.

import { firstText, htmlToText } from '../html';
import type { ExtractResult, Fetcher, JobAdapter, ParsedUrl } from '../types';

const ID_RE = /(?:jobPosting[:/]|currentJobId=|\/jobs\/view\/(?:[^/?#]*-)?)(\d{6,})/;
const MARKUP_RE =
  /<div class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<button/;
const MARKUP_FALLBACK_RE = /<div class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/;
const TITLE_RE = /<h2 class="top-card-layout__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/;
const COMPANY_RE = /<a class="topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/;

export const linkedinAdapter: JobAdapter = {
  id: 'linkedin',
  match: (u: ParsedUrl) => /(^|\.)linkedin\.com$/.test(u.hostname) && ID_RE.test(u.href),
  async extract(u: ParsedUrl, fetch: Fetcher): Promise<ExtractResult | null> {
    const id = ID_RE.exec(u.href)?.[1];
    if (!id) return null;
    const res = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`, {
      retries: 1,
      retryOn: [429, 999],
    });
    if (res.status >= 400 || !res.body) return null;
    const markup = MARKUP_RE.exec(res.body)?.[1] ?? MARKUP_FALLBACK_RE.exec(res.body)?.[1];
    if (!markup) return null;
    const text = htmlToText(markup);
    if (text.length < 200) return null;
    return {
      text,
      title: firstText(TITLE_RE, res.body),
      company: firstText(COMPANY_RE, res.body),
      method: 'linkedin:guest-api',
    };
  },
};
