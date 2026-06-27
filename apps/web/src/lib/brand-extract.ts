import 'server-only';

import { type AIProvider, type Brand, modelFor } from '@offero/core';

import { safeFetch } from './server-url-safety';

// Firmen-Branding (ohne Logo): die Website der ausschreibenden Firma laden und ihr Brand-Kit ziehen —
// Markenfarben + Font. HTML-Regex allein ist zu ungenau (Brand-Farben stecken oft in externem CSS),
// daher liest ein billiges Modell (Haiku) die relevanten Stellen (Head + Inline-CSS + Haupt-Stylesheet)
// und extrahiert die echte Markenfarbe/Font. Tolerant: liefert null statt zu werfen (→ Default-Palette).
// SSRF-Schutz (Protokoll, Credentials, DNS-Auflösung, IP-Range, Redirect-Hops) liegt zentral in
// server-url-safety.ts; getText bleibt tolerant und schluckt geblockte/fehlgeschlagene URLs als null.

const CHROME_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function getText(url: string, maxBytes: number): Promise<string | null> {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    // safeFetch validiert die URL (inkl. DNS + IP-Range) und folgt Redirects sicher manuell.
    const res = await safeFetch(normalized, {
      signal: ctrl.signal,
      headers: {
        'user-agent': CHROME_UA,
        accept: 'text/html,text/css,application/xhtml+xml,*/*',
        'accept-language': 'de-DE,de;q=0.9,en;q=0.8',
      },
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > maxBytes ? buf.slice(0, maxBytes) : buf;
    return new TextDecoder().decode(slice);
  } catch {
    return null;
  }
}

/** Sammelt brand-relevante Beweise: Head, Inline-Styles, theme-color, und das erste Haupt-Stylesheet
 *  (auf farb-/font-relevante Zeilen reduziert), kompakt für das Modell. */
async function collectEvidence(pageUrl: string, html: string): Promise<string> {
  const head = /<head[\s\S]*?<\/head>/i.exec(html)?.[0] ?? html.slice(0, 8000);
  const inlineStyles = (html.match(/<style[\s\S]*?<\/style>/gi) ?? []).join('\n').slice(0, 24_000);

  // Erstes echtes Stylesheet (kein Preload), grob brand-relevante Zeilen extrahieren.
  let cssLines = '';
  const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
  let lm: RegExpExecArray | null;
  const hrefs: string[] = [];
  while ((lm = linkRe.exec(html)) !== null && hrefs.length < 2) {
    const href = /href=["']([^"']+)["']/i.exec(lm[0])?.[1];
    if (href) hrefs.push(href);
  }
  for (const href of hrefs) {
    const abs = (() => {
      try {
        return new URL(href, pageUrl).toString();
      } catch {
        return null;
      }
    })();
    if (!abs) continue;
    const css = await getText(abs, 600_000);
    if (!css) continue;
    const relevant = css
      .split(/[\n}]/)
      .filter((l) => /(--[\w-]*(?:color|brand|primary|accent|bg|ink)|background(?:-color)?\s*:|color\s*:|font-family\s*:|theme)/i.test(l))
      .slice(0, 400)
      .join('\n');
    cssLines += `\n/* ${abs} */\n${relevant}`;
    if (cssLines.length > 30_000) break;
  }

  return `URL: ${pageUrl}\n\n<HEAD>\n${head}\n</HEAD>\n\n<INLINE_STYLES>\n${inlineStyles}\n</INLINE_STYLES>\n\n<STYLESHEET_EXCERPTS>\n${cssLines.slice(0, 30_000)}\n</STYLESHEET_EXCERPTS>`;
}

const BRAND_SYSTEM = [
  'Du bestimmst das visuelle Branding einer Firma aus HTML-/CSS-Auszügen ihrer Startseite.',
  'Gib NUR gültiges JSON zurück: { "colors": string[], "fontFamily": string|null }.',
  '- colors: 1–3 echte MARKENFARBEN als #rrggbb, primärste zuerst (die Hauptakzentfarbe der Marke).',
  '- Quellen in dieser Priorität: <meta name="theme-color">, CSS-Variablen wie --primary/--brand/--accent,',
  '  die dominante Akzent-/Button-/Link-Farbe. Bevorzuge gesättigte Marken­farben.',
  '- IGNORIEREN: Grautöne, Weiß, Schwarz, Drittanbieter-Buttons (Google #4285f4, Facebook #1877f2 etc.),',
  '  Fehler-/Erfolgs-Rot/Grün, generische Framework-Defaults.',
  '- fontFamily: die Marken-Schriftart (Überschriften/Brand-Font), KEINE generische (sans-serif, Arial,',
  '  Helvetica, system-ui, Roboto, Segoe UI) und KEINE Icon-Font. Wenn unklar: null.',
  '- Wenn nichts Belastbares erkennbar ist: { "colors": [], "fontFamily": null }.',
].join('\n');

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Leitet die offizielle Firmen-Domain aus dem Stellentext ab (Haiku, Weltwissen), oder null.
 *  So funktioniert „Im Branding der Firma" automatisch — ohne dass der Nutzer eine URL tippt. */
export async function deriveCompanyDomain(jobText: string, ai: AIProvider): Promise<string | null> {
  if (!jobText?.trim()) return null;
  try {
    const res = await ai.complete({
      model: modelFor('analyze', 'free'),
      system:
        'Du nennst die offizielle Website-Domain der AUSSCHREIBENDEN Firma aus einem Stellentext. ' +
        'Gib NUR JSON: {"domain": string|null}. domain = nur der Host, z. B. "lidl.de" (kein https, kein Pfad, ' +
        'kein Jobportal wie indeed/stepstone). Nur bei hoher Sicherheit (bekannte Firma); sonst null.',
      messages: [{ role: 'user', content: jobText.slice(0, 12_000) }],
      cacheBreakpoints: [0],
      maxTokens: 60,
    });
    const m = /\{[\s\S]*\}/.exec(res.text);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as { domain?: unknown };
    const domain = typeof parsed.domain === 'string' ? parsed.domain.trim().toLowerCase() : '';
    const clean = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (clean.length < 4 || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) return null;
    if (/indeed|stepstone|linkedin|xing|arbeitsagentur|google|facebook/.test(clean)) return null;
    return clean;
  } catch {
    return null;
  }
}

/** Identifiziert den Namen der ausschreibenden Firma aus dem Stellentext (Haiku), oder null. */
export async function identifyCompanyName(jobText: string, ai: AIProvider): Promise<string | null> {
  if (!jobText?.trim()) return null;
  try {
    const res = await ai.complete({
      model: modelFor('analyze', 'free'),
      system:
        'Nenne den Namen der AUSSCHREIBENDEN Firma (des Arbeitgebers) aus dem Stellentext. ' +
        'Gib NUR JSON {"name": string|null}. Kein Jobportal/Recruiter/Personaldienstleister; die echte ' +
        'einstellende Firma/Marke. Wenn nicht eindeutig: null.',
      messages: [{ role: 'user', content: jobText.slice(0, 14_000) }],
      cacheBreakpoints: [0],
      maxTokens: 40,
    });
    const m = /\{[\s\S]*\}/.exec(res.text);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as { name?: unknown };
    const name = typeof parsed.name === 'string' ? parsed.name.trim() : '';
    return name.length >= 2 ? name : null;
  } catch {
    return null;
  }
}

const SEARCH_EXCLUDE =
  /(wikipedia|wikidata|linkedin|indeed|stepstone|xing|kununu|glassdoor|bloomberg|dnb\.com|northdata|crunchbase|facebook|instagram|youtube|twitter|x\.com|pinterest|tiktok|handelsregister|companieshouse)/i;

/** Findet die offizielle Firmen-Website per Web-Suche über **Bright Data** (SERP via brd_json) —
 *  robuster als Domain-Raten. Liefert die Origin (homepage) des ersten „echten" Treffers, oder null. */
export async function searchCompanyWebsite(name: string): Promise<string | null> {
  const token = process.env.BRIGHTDATA_API_TOKEN;
  const zone = process.env.BRIGHTDATA_ZONE ?? 'web_unlocker1';
  if (!token || !name?.trim()) return null;
  try {
    const q = encodeURIComponent(name);
    const res = await fetch('https://api.brightdata.com/request', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        zone,
        url: `https://www.google.com/search?q=${q}&brd_json=1`,
        format: 'raw',
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    let json: { organic?: Array<{ link?: string; url?: string }> };
    try {
      json = JSON.parse(await res.text()) as typeof json;
    } catch {
      return null;
    }
    for (const item of json.organic ?? []) {
      const u = item.link ?? item.url ?? '';
      if (!u) continue;
      try {
        const parsed = new URL(u);
        if (SEARCH_EXCLUDE.test(parsed.hostname)) continue;
        return `${parsed.protocol}//${parsed.host}/`;
      } catch {
        /* skip */
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Robuste Firmen-Brand-Auflösung: explizite URL → Firmenname identifizieren → Web-Suche nach der
 * offiziellen Website → (Fallback) Haiku-Domain-Rate → scrapen + Farben/Font extrahieren. Tolerant.
 */
export async function resolveCompanyBrand(opts: {
  jobText: string;
  companyUrl?: string;
  ai: AIProvider;
}): Promise<Brand | null> {
  if (opts.companyUrl?.trim()) {
    return fetchCompanyBrand(opts.companyUrl, opts.ai);
  }
  const name = await identifyCompanyName(opts.jobText, opts.ai);
  let url = name ? await searchCompanyWebsite(name) : null;
  if (!url) url = await deriveCompanyDomain(opts.jobText, opts.ai);
  if (!url) return null;
  return fetchCompanyBrand(url, opts.ai);
}

/** Holt die Firmen-Website und lässt ein billiges Modell das Brand-Kit extrahieren, oder null. */
export async function fetchCompanyBrand(rawUrl: string, ai: AIProvider): Promise<Brand | null> {
  const target = rawUrl?.trim();
  if (!target) return null;
  const html = await getText(target, 2_500_000);
  if (!html) return null;

  const pageUrl = /^https?:\/\//i.test(target) ? target : `https://${target}`;
  const evidence = await collectEvidence(pageUrl, html);

  try {
    const res = await ai.complete({
      model: modelFor('analyze', 'free'), // billig (Haiku) — keine ID hartcodiert
      system: BRAND_SYSTEM,
      messages: [{ role: 'user', content: evidence.slice(0, 60_000) }],
      cacheBreakpoints: [0],
      maxTokens: 400,
    });
    const start = res.text.indexOf('{');
    const end = res.text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    const parsed = JSON.parse(res.text.slice(start, end + 1)) as {
      colors?: unknown;
      fontFamily?: unknown;
    };
    const colors = Array.isArray(parsed.colors)
      ? parsed.colors
          .map((c) => (typeof c === 'string' ? c.trim().toLowerCase() : ''))
          .filter((c) => HEX_RE.test(c))
          .slice(0, 4)
      : [];
    const fontFamily =
      typeof parsed.fontFamily === 'string' && parsed.fontFamily.trim()
        ? parsed.fontFamily.trim()
        : undefined;
    if (colors.length === 0 && !fontFamily) return null;
    return { colors, fontFamily, ink: undefined };
  } catch {
    return null;
  }
}
