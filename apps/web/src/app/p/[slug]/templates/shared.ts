import type { ApplicationContent, MediaRef, Section } from '@offero/core';

// Geteilte Helfer für ALLE Render-Templates. Jedes Template leitet seine Akzente aus dem
// Firmen-Branding (company.brand.colors) ab → so respektieren alle Layouts das Branding.

export interface TemplateProps {
  content: ApplicationContent;
}

export interface Palette {
  /** Primäre Markenfarbe (oder Default). */
  primary: string;
  /** Zweite Markenfarbe / abgeleiteter Ton. */
  secondary: string;
  /** Linearer Verlauf primary→secondary. */
  grad: string;
}

export const HEX = /^#([0-9a-fA-F]{6})$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const URLRE = /^https?:\/\/[^\s]+$/i;

export function host(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
}

/** Relative Luminanz 0..1 (Weiß/Schwarz-Filter fürs Branding). */
export function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Hellt/dunkelt eine Hex-Farbe (amt in -1..1) — für abgeleitete Zweittöne. */
export function shade(hex: string, amt: number): string {
  if (!HEX.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = amt < 0 ? c * (1 + amt) : c + (255 - c) * amt;
    return Math.max(0, Math.min(255, Math.round(v)));
  });
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// Neutraler Default-Akzent (schlicht), wenn KEIN Firmen-Branding gewählt wurde: ein ruhiges
// Slate, das auf hellen wie dunklen Templates funktioniert — kein lautes Magenta mehr.
export const NEUTRAL_PRIMARY = '#64748b';
export const NEUTRAL_SECONDARY = '#475569';

/**
 * Akzent-Palette aus dem Firmen-Branding; verwirft zu dunkle/zu helle Töne (Weiß/Schwarz).
 * Ohne Branding → schlichtes, neutrales Slate. Der Zweitton wird aus dem Primärton abgeleitet,
 * falls die Firma nur eine Farbe hat → harmonischer Verlauf.
 */
export function palette(content: ApplicationContent): Palette {
  const cols = (content.company.brand?.colors ?? []).filter(
    (c) => HEX.test(c) && lum(c) > 0.12 && lum(c) < 0.9,
  );
  const primary = cols[0] ?? NEUTRAL_PRIMARY;
  const secondary = cols[1] ?? (cols[0] ? shade(primary, -0.35) : NEUTRAL_SECONDARY);
  return { primary, secondary, grad: `linear-gradient(120deg, ${primary}, ${secondary})` };
}

/** Sektion eines bestimmten Typs herausziehen (typsicher). */
export function pick<T extends Section['type']>(
  content: ApplicationContent,
  type: T,
): Extract<Section, { type: T }> | undefined {
  return content.sections.find((s): s is Extract<Section, { type: T }> => s.type === type);
}

/** Alle „Body"-Sektionen (ohne hero/contact) in Plan-Reihenfolge. */
export function bodySections(content: ApplicationContent): Section[] {
  return content.sections.filter((s) => s.type !== 'hero' && s.type !== 'contact');
}

/** Nutzer-Medien (content.media) in Galerie-Bilder + optionales eingebettetes Video aufteilen.
 *  content.selfIntro (echtes Selbst-Intro) ist DAVON getrennt und wird direkt gelesen. */
export function splitMedia(content: ApplicationContent): { images: MediaRef[]; video?: MediaRef } {
  const withUrl = (content.media ?? []).filter((m) => typeof m.url === 'string' && m.url.length > 0);
  const video = withUrl.find((m) => m.kind === 'video');
  const images = withUrl.filter((m) => m.kind === 'image').slice(0, 12);
  return { images, video };
}

/** Lesbarer Titel je Sektionstyp (für Überschriften). */
export const SECTION_LABEL: Record<Section['type'], string> = {
  hero: 'Intro',
  fit: 'Passung',
  experience: 'Stationen',
  skills: 'Fähigkeiten',
  education: 'Ausbildung',
  projects: 'Projekte',
  roadmap: 'Fahrplan',
  collaboration: 'Zusammenarbeit',
  industry_match: 'Beitrag',
  honest: 'Ehrlich',
  contact: 'Kontakt',
};
