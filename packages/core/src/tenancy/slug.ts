// Subdomain-Slugs für Multi-Tenant (*.offero.app). Logik im Kern → Web & Mobile teilen sie.
export const RESERVED_SUBDOMAINS = new Set<string>([
  'www', 'app', 'api', 'admin', 'mail', 'static', 'assets', 'cdn', 'status', 'help',
  'support', 'blog', 'docs', 'dashboard', 'auth', 'login', 'signup', 'account', 'offero',
]);

const NON_SLUG = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-+|-+$/g;

// Nicht-erratbarer Zufalls-Token (ADR 0012 / Task #35): hängt an JEDEN Slug an, damit öffentliche
// Bewerbungs-URLs nicht durch Raten von „firma-rolle" enumeriert werden können (PII-Schutz).
// Crypto, wo verfügbar (Node 20+/Browser), sonst Math.random-Fallback. Verwechslungsarme Alphabet.
const TOKEN_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
export function randomToken(len = 8): string {
  const g = globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => Uint8Array } };
  const bytes = new Uint8Array(len);
  if (g.crypto?.getRandomValues) {
    g.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < len; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = '';
  for (let i = 0; i < len; i += 1) out += TOKEN_ALPHABET[(bytes[i] ?? 0) % TOKEN_ALPHABET.length];
  return out;
}

export function slugify(input: string): string {
  // NFKD zerlegt Umlaute/Akzente; NON_SLUG entfernt danach Kombinationszeichen & Sonderzeichen.
  const s = input
    .normalize('NFKD')
    .toLowerCase()
    .replace(NON_SLUG, '-')
    .replace(EDGE_DASHES, '')
    .slice(0, 48)
    .replace(EDGE_DASHES, '');
  return s.length > 0 ? s : 'bewerbung';
}

export function isReserved(slug: string): boolean {
  return RESERVED_SUBDOMAINS.has(slug);
}

/**
 * Erzeugt einen eindeutigen, NICHT-erratbaren Slug: lesbarer Stamm + Zufalls-Token
 * (z. B. `maibornwolff-frontend-7h3k9q2x`). `exists` prüft Kollision (DB-Unique ist die harte
 * Grenze; bei der winzigen Kollisionschance wird neu gewürfelt). Der Token-Generator ist
 * injizierbar (Tests/Determinismus). Reservierte Stämme sind durch den Suffix nie exakt reserviert.
 */
export async function buildUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
  opts?: { token?: () => string },
): Promise<string> {
  const root = slugify(base);
  const tok = opts?.token ?? (() => randomToken());
  let candidate = `${root}-${tok()}`;
  while (await exists(candidate)) {
    candidate = `${root}-${tok()}`;
  }
  return candidate;
}
