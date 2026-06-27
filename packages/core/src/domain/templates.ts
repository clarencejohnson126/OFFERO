// Single Source der Render-Templates (IDs + Anzeige-Metadaten für die Auswahl-Karten).
// Die konkreten Renderer leben im Web-Client (apps/web/.../templates), die IDs hier sind die
// Wahrheit (auch der DB-CHECK auf application.template kennt genau diese IDs).

export interface TemplateMeta {
  id: string;
  name: string;
  /** Kurzcharakter für die Auswahl-Karte. */
  tagline: string;
  /** Stil-Stichworte. */
  vibe: string;
}

export const TEMPLATE_CATALOG: readonly TemplateMeta[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    tagline: 'Cineastisch & dunkel',
    vibe: 'Vollbild-Hero, Farbverlauf, Scroll-Story',
  },
  {
    id: 'editorial',
    name: 'Editorial',
    tagline: 'Magazin & hell',
    vibe: 'Serif-Headlines, mehrspaltig, redaktionell',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    tagline: 'Technisch & monospace',
    vibe: 'Dunkel, Mono-Font, Dev-/README-Look',
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    tagline: 'Laut & kontrastreich',
    vibe: 'Riesentypo, harte Farbblöcke, asymmetrisch',
  },
  {
    id: 'swiss',
    name: 'Swiss',
    tagline: 'Klar & gerastert',
    vibe: 'Hell, strenges Raster, viel Weißraum',
  },
] as const;

export const TEMPLATE_IDS: readonly string[] = TEMPLATE_CATALOG.map((t) => t.id);

export const DEFAULT_TEMPLATE = 'aurora';

export function isValidTemplate(id: string | null | undefined): boolean {
  return typeof id === 'string' && TEMPLATE_IDS.includes(id);
}
