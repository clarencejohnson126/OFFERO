import { z } from 'zod';

// Typisierte Sektionen der generierten Bewerbungs-Website (v1-spec §4, am Goldstandard
// N10 orientiert: fit, experience, roadmap=start, collaboration=modell, honest, cta …).
// content ist KEIN HTML-Blob, sondern Daten → schema-validiert + mobil wiederverwendbar.

export const brandSchema = z.object({
  ink: z.string().optional(),
  colors: z.array(z.string()).default([]),
  fontFamily: z.string().optional(),
});
export type Brand = z.infer<typeof brandSchema>;

export const heroSection = z.object({
  type: z.literal('hero'),
  name: z.string(),
  eyebrow: z.string().optional(),
  headline: z.array(z.string()).min(1),
  pitch: z.string(),
  cta: z.string().optional(),
});

export const fitSection = z.object({
  type: z.literal('fit'),
  intro: z.string().optional(),
  items: z.array(z.object({ requirement: z.string(), evidence: z.string() })),
});

export const experienceSection = z.object({
  type: z.literal('experience'),
  items: z.array(
    z.object({
      role: z.string(),
      org: z.string().optional(),
      period: z.string().optional(),
      summary: z.string(),
      highlights: z.array(z.string()).default([]),
    }),
  ),
});

export const skillsSection = z.object({
  type: z.literal('skills'),
  groups: z.array(z.object({ label: z.string(), items: z.array(z.string()) })),
});

export const educationSection = z.object({
  type: z.literal('education'),
  items: z.array(
    z.object({ degree: z.string(), org: z.string().optional(), period: z.string().optional() }),
  ),
});

// Datengesteuert (nur wenn passend):
export const roadmapSection = z.object({
  type: z.literal('roadmap'),
  phases: z.array(z.object({ when: z.string(), focus: z.string() })),
});

export const collaborationSection = z.object({
  type: z.literal('collaboration'),
  body: z.string(),
});

export const industryMatchSection = z.object({
  type: z.literal('industry_match'),
  body: z.string(),
});

// Ehrliche Einordnung sichtbar gemacht (Constitution Art. II: underpromise).
export const honestSection = z.object({
  type: z.literal('honest'),
  body: z.string(),
});

export const contactSection = z.object({
  type: z.literal('contact'),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  ctaLine: z.string().optional(),
  badge: z.boolean().default(false), // Free-Tier: dezentes "made with Offero"
});

export const sectionSchema = z.discriminatedUnion('type', [
  heroSection,
  fitSection,
  experienceSection,
  skillsSection,
  educationSection,
  roadmapSection,
  collaborationSection,
  industryMatchSection,
  honestSection,
  contactSection,
]);
export type Section = z.infer<typeof sectionSchema>;
export type SectionType = Section['type'];

export const mediaRefSchema = z.object({
  slot: z.enum(['hero_image', 'section_imagery', 'intro_video']),
  kind: z.enum(['image', 'video']),
  assetId: z.string().optional(),
  prompt: z.string().optional(),
});
export type MediaRef = z.infer<typeof mediaRefSchema>;

export const applicationContentSchema = z.object({
  /** Ausgabesprache, modellgetrieben/beliebig (ADR 0003) — kein Bau-Constraint. */
  language: z.string(),
  company: z
    .object({ name: z.string().optional(), brand: brandSchema.optional() })
    .default({}),
  sections: z.array(sectionSchema),
  media: z.array(mediaRefSchema).default([]),
});
export type ApplicationContent = z.infer<typeof applicationContentSchema>;

/** Validiert unbekannte Daten zu typisiertem ApplicationContent (vor jedem DB-Schreiben). */
export function parseContent(input: unknown): ApplicationContent {
  return applicationContentSchema.parse(input);
}
