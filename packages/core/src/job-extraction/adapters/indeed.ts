// Indeed: serverseitig zu 100 % Cloudflare-geblockt (403 JS-Challenge auf JEDEM Pfad, kein JSON-LD,
// keine Guest-API). Wir verbrennen keinen Request, sondern nudgen sofort zum Einfügen.
// Künftiger Hebel (separat zu rechtfertigen): Headless-Browser/Residential-Proxy zum Lösen der
// Challenge. Bewusst NICHT verdrahtet (Tokconomics).

import { INDEED_BLOCKED } from '../messages';
import type { ExtractResult, JobAdapter, ParsedUrl } from '../types';

export const indeedAdapter: JobAdapter = {
  id: 'indeed',
  blocked: true,
  blockedMessage: INDEED_BLOCKED,
  match: (u: ParsedUrl) => /(^|\.)indeed\.(de|com)$/.test(u.hostname),
  // Indeed: Homepage-Overlay-URL ?vjk=XXX → kanonische /viewjob?jk=XXX umschreiben,
  // damit Bright Data / CDP die Job-Detailseite statt der Homepage scrapt.
  normalizeUrl: (u: ParsedUrl): ParsedUrl => {
    const params = new URLSearchParams(u.search);
    const vjk = params.get('vjk');
    if (vjk && (u.pathname === '/' || u.pathname === '')) {
      const href = `https://${u.hostname}/viewjob?jk=${encodeURIComponent(vjk)}`;
      return { href, hostname: u.hostname, pathname: '/viewjob', search: `?jk=${encodeURIComponent(vjk)}` };
    }
    return u;
  },
  async extract(): Promise<ExtractResult | null> {
    return null; // wird bei blocked nie aufgerufen
  },
};
