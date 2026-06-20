// Subdomain-Slugs für Multi-Tenant (*.offero.app). Logik im Kern → Web & Mobile teilen sie.
export const RESERVED_SUBDOMAINS = new Set<string>([
  'www', 'app', 'api', 'admin', 'mail', 'static', 'assets', 'cdn', 'status', 'help',
  'support', 'blog', 'docs', 'dashboard', 'auth', 'login', 'signup', 'account', 'offero',
]);

const NON_SLUG = /[^a-z0-9]+/g;
const EDGE_DASHES = /^-+|-+$/g;

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
 * Erzeugt einen eindeutigen Slug. `exists` prüft Kollision (DB-Unique ist die harte Grenze).
 * Reservierte Slugs bekommen direkt ein Suffix.
 */
export async function buildUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base);
  let n = isReserved(root) ? 1 : 0;
  let candidate = n === 0 ? root : `${root}-${n}`;
  while (await exists(candidate)) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}
