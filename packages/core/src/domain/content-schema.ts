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
  // default('') statt required: KI lässt name gelegentlich weg wenn kein displayName im Profil.
  name: z.string().default(''),
  /** Rolle + Firma für die Hero-Topzeile, z. B. "Lead AI Engineer" / "MaibornWolff". */
  role: z.string().optional(),
  eyebrow: z.string().optional(),
  headline: z.array(z.string()).min(1),
  pitch: z.string(),
  /** Kurze Schlagworte als Chips unter dem Hero (3–5). */
  chips: z.array(z.string()).default([]),
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

// Hervorgehobene Projekte ("schon gebaut") — nur Echtes aus dem Profil, mit optionalem Link.
export const projectsSection = z.object({
  type: z.literal('projects'),
  intro: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      url: z.string().optional(),
      tag: z.string().optional(),
    }),
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
  /** Profil-Links (Website, LinkedIn, Portfolio …) — nur echte aus dem Profil. */
  links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  badge: z.boolean().default(false), // Free-Tier: dezentes "made with Offero"
});

export const sectionSchema = z.discriminatedUnion('type', [
  heroSection,
  fitSection,
  experienceSection,
  skillsSection,
  educationSection,
  projectsSection,
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
  /** Direkte (öffentliche) URL — bei Nutzer-Uploads gesetzt; KI-Assets nutzen assetId. */
  url: z.string().optional(),
  /** Kurze Bildunterschrift (z. B. aus dem Dateinamen abgeleitet). */
  caption: z.string().optional(),
  /** Alt-Text (Barrierefreiheit) — Vision-Auswertung oder Dateiname. */
  alt: z.string().optional(),
  /** MIME-Typ (für <video><source type>). */
  mimeType: z.string().optional(),
});
export type MediaRef = z.infer<typeof mediaRefSchema>;

// ── Trust-System (ADR 0012): macht die Bewerbung gegen KI-Ablehnung robust ──────────────────

/** Ehrlicher KI-Integritäts-Disclaimer. Wählbarer Ton, vom Bewerber steuerbare Sichtbarkeit. */
export const integritySchema = z.object({
  aiAssisted: z.boolean().default(true),
  /** Ton der Aussage (Default „confident-honest"). */
  tone: z.enum(['confident', 'playful', 'minimal']).default('confident'),
  /** Der angezeigte Satz (z. B. „Recherche & Struktur mit KI-Unterstützung; Inhalte sind real…"). */
  statement: z.string(),
  visible: z.boolean().default(true),
});
export type Integrity = z.infer<typeof integritySchema>;

/** Echtes, selbst aufgenommenes Intro (Video ODER Audio) — der „Uncanny-Valley"-Gegenpol. */
export const selfIntroSchema = z.object({
  kind: z.enum(['video', 'audio']),
  url: z.string(),
  mimeType: z.string().optional(),
  posterUrl: z.string().optional(),
  /** Transkript (Barrierefreiheit + skimmbar; bei Audio Pflicht-Empfehlung). */
  transcript: z.string().optional(),
  caption: z.string().optional(),
});
export type SelfIntro = z.infer<typeof selfIntroSchema>;

/** Verifizierbarer Beleg pro Aussage — aus „vertrau mir" wird „prüf mich". */
export const proofLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
  /** Worauf sich der Beleg bezieht (Freitext, z. B. „Kubernetes-Erfahrung"). */
  claim: z.string().optional(),
});
export type ProofLink = z.infer<typeof proofLinkSchema>;

/** 10-Sekunden-Antwort above the fold (Recruiter/HM skimmen). */
export const recruiterSummarySchema = z.object({
  headline: z.string(),
  /** 3 knackige Match-Punkte. */
  points: z.array(z.string()).max(5).default([]),
});
export type RecruiterSummary = z.infer<typeof recruiterSummarySchema>;

/** Markt-/Privacy-Meta: ATS-Positionierung (DACH leise vs. intl. sichtbarer Score) + PII-Defaults. */
export const contentMetaSchema = z.object({
  market: z.enum(['dach', 'intl']).default('dach'),
  /** Öffentliche Seite nicht indexieren (PII-Schutz, Task #35). */
  noindex: z.boolean().default(true),
  /** Telefon/Adresse öffentlich zeigen — Default AUS (opt-in). E-Mail bleibt erlaubt. */
  showContactDetails: z.boolean().default(false),
});
export type ContentMeta = z.infer<typeof contentMetaSchema>;

export const applicationContentSchema = z.object({
  /** Ausgabesprache, modellgetrieben/beliebig (ADR 0003) — kein Bau-Constraint. */
  language: z.string(),
  company: z
    .object({ name: z.string().optional(), brand: brandSchema.optional() })
    .default({}),
  sections: z.array(sectionSchema),
  media: z.array(mediaRefSchema).default([]),
  // Trust-System (ADR 0012) — alle optional/defaulted → rückwärtskompatibel.
  integrity: integritySchema.optional(),
  selfIntro: selfIntroSchema.optional(),
  proofLinks: z.array(proofLinkSchema).default([]),
  recruiterSummary: recruiterSummarySchema.optional(),
  meta: contentMetaSchema.default({ market: 'dach', noindex: true, showContactDetails: false }),
});
export type ApplicationContent = z.infer<typeof applicationContentSchema>;

/** Validiert unbekannte Daten zu typisiertem ApplicationContent (vor jedem DB-Schreiben). */
export function parseContent(input: unknown): ApplicationContent {
  return applicationContentSchema.parse(input);
}
