// Bundesagentur für Arbeit (Jobbörse): öffentliche JSON-API, kein Auth/Cookie — aber ein
// MANDATORY statischer Key-Header. refnr aus der URL → base64 (=‑Padding URL-encoded) → /jobdetails.
// Die öffentliche /jobsuche/jobdetail-Seite ist eine Angular-SPA ohne Text im DOM → API ist Pflicht.

import { base64Encode } from '../base64';
import type { ExtractResult, Fetcher, JobAdapter, ParsedUrl } from '../types';

// Öffentlicher, statischer Key der jobsuche-Web-App (kein Geheimnis). In Konstante gehalten = swapbar.
const ARBEITSAGENTUR_API_KEY = 'jobboerse-jobsuche';
const REFNR_RE = /\/jobdetail\/([^/?#]+)/;

export const arbeitsagenturAdapter: JobAdapter = {
  id: 'arbeitsagentur',
  match: (u: ParsedUrl) =>
    /(^|\.)arbeitsagentur\.de$/.test(u.hostname) && REFNR_RE.test(u.pathname),
  async extract(u: ParsedUrl, fetch: Fetcher): Promise<ExtractResult | null> {
    const refnr = REFNR_RE.exec(u.pathname)?.[1];
    if (!refnr) return null;
    const seg = base64Encode(decodeURIComponent(refnr)).replace(/=/g, '%3D');
    const res = await fetch(
      `https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobdetails/${seg}`,
      { headers: { 'X-API-Key': ARBEITSAGENTUR_API_KEY } },
    );
    if (res.status >= 400 || !res.body) return null;
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(res.body) as Record<string, unknown>;
    } catch {
      return null;
    }
    const desc = data['stellenangebotsBeschreibung'];
    const text = typeof desc === 'string' ? desc.replace(/\r\n/g, '\n').trim() : '';
    if (text.length < 200) return null;
    return {
      text,
      title: typeof data['titel'] === 'string' ? data['titel'] : undefined,
      company: typeof data['arbeitgeber'] === 'string' ? data['arbeitgeber'] : undefined,
      method: 'arbeitsagentur:rest-api',
    };
  },
};
