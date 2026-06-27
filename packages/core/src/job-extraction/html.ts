// Reine HTML-/JSON-LD-Helfer (kein DOM). Portiert aus apps/web/fetch-job.ts und erweitert
// um numerische Entities (ATS-APIs liefern entity-escaptes HTML in JSON-Feldern).

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ',
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  euro: '€',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  szlig: 'ß',
  auml: 'ä',
  ouml: 'ö',
  uuml: 'ü',
  Auml: 'Ä',
  Ouml: 'Ö',
  Uuml: 'Ü',
};

/** Dekodiert HTML-Entities: benannte + dezimale (&#123;) + hexadezimale (&#x1F;). */
export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => safeFromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => safeFromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9#]*);/g, (m, name: string) => NAMED_ENTITIES[name] ?? m);
}

function safeFromCodePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return '';
  try {
    return String.fromCodePoint(code);
  } catch {
    return '';
  }
}

/** Strippt Tags, dekodiert Entities, normalisiert Whitespace. Robuster Lesbarkeits-Boden. */
export function htmlToText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer|ul|ol|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '– ')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(stripped)
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Einige Portale (Xing) stellen der JSON-LD-Beschreibung ein leeres `null`-Token voran. */
export function stripLeadingNull(s: string): string {
  return s.replace(/^\s*null\s*/, '');
}

interface JobPostingFields {
  description?: string;
  title?: string;
  company?: string;
}

/**
 * Findet das erste schema.org-`JobPosting` in ALLEN <script type="application/ld+json">-Blöcken
 * (toleriert Arrays und `@graph`) und liefert description/title/company. Universeller Default —
 * deckt StepStone, Xing, Ashby-Seite und jedes Google-for-Jobs-konforme Portal ab.
 */
export function extractJsonLdJobPosting(html: string): JobPostingFields | null {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1];
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const found = findJobPosting(parsed);
    if (found) return found;
  }
  return null;
}

function findJobPosting(node: unknown, depth = 0): JobPostingFields | null {
  if (depth > 6 || node === null || typeof node !== 'object') return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const r = findJobPosting(item, depth + 1);
      if (r) return r;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  const type = obj['@type'];
  const isJobPosting =
    type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'));
  if (isJobPosting && typeof obj['description'] === 'string') {
    return {
      description: obj['description'],
      title: typeof obj['title'] === 'string' ? obj['title'] : undefined,
      company: orgName(obj['hiringOrganization']),
    };
  }
  // @graph / verschachtelte Container durchsuchen.
  const graph = obj['@graph'];
  if (graph) {
    const r = findJobPosting(graph, depth + 1);
    if (r) return r;
  }
  return null;
}

function orgName(org: unknown): string | undefined {
  if (typeof org === 'string') return org;
  if (org && typeof org === 'object') {
    const name = (org as Record<string, unknown>)['name'];
    if (typeof name === 'string') return name;
  }
  return undefined;
}

/** Erste Capture-Group eines Regex auf einem String, als getrimmter Text (oder undefined). */
export function firstText(re: RegExp, s: string): string | undefined {
  const m = re.exec(s);
  const g = m?.[1];
  if (!g) return undefined;
  const t = htmlToText(g);
  return t.length ? t : undefined;
}
