// Greenhouse: öffentliche Boards-API. $.content ist entity-escaptes HTML → erst entkodieren,
// dann Tags strippen. Deckt viele Tech-/SaaS-Stellen ab (Offero-Zielgruppe).

import { decodeEntities, htmlToText } from '../html';
import type { ExtractResult, Fetcher, JobAdapter, ParsedUrl } from '../types';

const RE = /greenhouse\.io\/(?:boards\/|embed\/job_app\?[^#]*token=)?([^/?#&]+)\/jobs\/(\d+)/;
const RE_ALT = /greenhouse\.io\/[^/]*\/?([^/?#&]+)\/jobs\/(\d+)/;

export const greenhouseAdapter: JobAdapter = {
  id: 'greenhouse',
  match: (u: ParsedUrl) => /(^|\.)greenhouse\.io$/.test(u.hostname) && /\/jobs\/\d+/.test(u.href),
  async extract(u: ParsedUrl, fetch: Fetcher): Promise<ExtractResult | null> {
    const m = RE.exec(u.href) ?? RE_ALT.exec(u.href);
    const token = m?.[1];
    const id = m?.[2];
    if (!token || !id) return null;
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs/${id}`);
    if (res.status >= 400 || !res.body) return null;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(res.body) as Record<string, unknown>;
    } catch {
      return null;
    }
    const content = data['content'];
    if (typeof content !== 'string') return null;
    const text = htmlToText(decodeEntities(content));
    if (text.length < 200) return null;
    return {
      text,
      title: typeof data['title'] === 'string' ? data['title'] : undefined,
      method: 'greenhouse:boards-api',
    };
  },
};
