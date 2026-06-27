import { modelFor } from '../ai/model-policy';
import type { TaskKind } from '../ai/tasks';
import type {
  ApplicationContent,
  Brand,
  ProofLink,
  Section,
  SelfIntro,
} from '../domain/content-schema';
import { parseCvStructured } from '../domain/cv-schema';
import type { ModelId, Tier } from '../domain/enums';
import { errors } from '../domain/errors';
import type { AIProvider } from '../ports/ai-provider';
import type { ImageProvider } from '../ports/image-provider';
import type { Repository } from '../ports/repository';
import type { VideoRenderer } from '../ports/video-renderer';

import type { OnProgress } from './progress';
import {
  analyzeJob,
  planApplication,
  type ProfileForGen,
  writeApplicationParallel,
} from './steps';

export interface GenerationInput {
  userId: string;
  applicationId: string;
  tier: Tier;
  /** Ausgabesprache, modellgetrieben/beliebig (ADR 0003). */
  language: string;
  jobText: string;
  focusPrompt?: string;
  /** Optionales Firmen-Brand-Kit (gescrapte Farben/Font) — überschreibt company.brand. */
  brand?: Brand;
  /** Aggregierter Text aus hochgeladenen Unterlagen (Anschreiben/Zertifikate) — echtes Material. */
  extraMaterial?: string;
  // ── Trust-System / Meta (ADR 0012), in ASSEMBLE deterministisch angewandt ──
  /** Markt für ATS-Positionierung (DACH leise Hygiene vs. intl. sichtbarer Score). Default 'dach'. */
  market?: 'dach' | 'intl';
  /** Öffentliche Seite nicht indexieren (PII-Schutz). Default true. */
  noindex?: boolean;
  /** Telefon/Adresse öffentlich zeigen (opt-in). Default false → wird aus dem Kontakt entfernt. */
  showContactDetails?: boolean;
  /** Echtes, selbst aufgenommenes Intro (Video/Audio) — vom Aufrufer aus Uploads gebaut. */
  selfIntro?: SelfIntro;
  /** Ton des Integritäts-Badges (ADR 0012 §5). Default 'confident'. */
  integrityTone?: 'confident' | 'playful' | 'minimal';
}

export interface GenerationResult {
  content: ApplicationContent;
  modelUsed: ModelId;
  /** Summe der KI-Kosten aller Stufen (Observability, Constitution Art. IV.5). */
  costCents: number;
}


export interface GenerationDeps {
  ai: AIProvider;
  repo: Repository;
  images?: ImageProvider;
  video?: VideoRenderer;
}

/**
 * Produkt-Pipeline INGEST→ANALYZE→PLAN→WRITE→MEDIA→ASSEMBLE→REFINE (ai-pipeline.md).
 * Dieser Slice implementiert die Text-Strecke ANALYZE→PLAN→WRITE→ASSEMBLE.
 * Medien (Bilder/Video) hängen sich später über die optionalen Ports an.
 */
export class GenerationPipeline {
  constructor(private readonly deps: GenerationDeps) {}

  /** Jede Stufe wählt ihr Modell über die Routing-Policy — keine IDs hier. */
  modelForStage(stage: TaskKind, tier: Tier): ModelId {
    return modelFor(stage, tier);
  }

  hasMediaProviders(): boolean {
    return Boolean(this.deps.images);
  }

  async run(input: GenerationInput, onProgress?: OnProgress): Promise<GenerationResult> {
    const profileRow = await this.deps.repo.profiles.get(input.userId);
    // CV ist OPTIONAL: ohne Lebenslauf genügt eine kurze Selbstbeschreibung (focusPrompt).
    const cv = profileRow?.cvStructured ? parseCvStructured(profileRow.cvStructured) : null;
    if (!cv && !input.focusPrompt?.trim() && !input.extraMaterial?.trim()) {
      throw errors.validation(
        'Gib ein paar Stichworte zu dir an (Feld „Über dich"), lade einen Lebenslauf oder Unterlagen ' +
          'hoch — sonst hat die Pipeline keine Info über dich.',
      );
    }
    const contactJson = (profileRow?.contact ?? {}) as Record<string, unknown>;
    const profile: ProfileForGen = {
      displayName: profileRow?.displayName ?? null,
      cv,
      contact: {
        email: typeof contactJson.email === 'string' ? contactJson.email : undefined,
        phone: typeof contactJson.phone === 'string' ? contactJson.phone : undefined,
        location: typeof contactJson.location === 'string' ? contactJson.location : undefined,
      },
    };

    onProgress?.({ stage: 'analyze' });
    const { analysis, meta: aMeta } = await analyzeJob(this.deps.ai, {
      jobText: input.jobText,
      tier: input.tier,
    });
    // Wenn die Analyse keine erkennbaren Stellendaten enthält (keine Anforderungen, keine Rolle,
    // kein Firmenname), war der gescrapte Text unbrauchbar (Navigation/Boilerplate). → Nutzer
    // auffordern, den Anzeigentext manuell einzufügen, statt eine generische Seite zu erzeugen.
    const hasJobContent =
      (analysis.requirements?.length ?? 0) > 0 || !!analysis.role || !!analysis.companyName;
    if (!hasJobContent) {
      throw errors.validation(
        'Aus dem Link konnten wir zu wenig Text lesen — bitte den Anzeigentext direkt einfügen.',
      );
    }
    onProgress?.({ stage: 'plan' });
    const { plan, meta: pMeta } = await planApplication(this.deps.ai, {
      analysis,
      profile,
      focusPrompt: input.focusPrompt,
      extraMaterial: input.extraMaterial,
      tier: input.tier,
      language: input.language,
    });
    const { content, meta: wMeta } = await writeApplicationParallel(
      this.deps.ai,
      {
        analysis,
        plan,
        profile,
        focusPrompt: input.focusPrompt,
        extraMaterial: input.extraMaterial,
        tier: input.tier,
        language: input.language,
      },
      onProgress,
    );

    onProgress?.({ stage: 'assemble' });
    const assembled = this.assemble(content, input);
    return {
      content: assembled,
      modelUsed: wMeta.modelUsed,
      costCents: aMeta.costCents + pMeta.costCents + wMeta.costCents,
    };
  }

  /** ASSEMBLE: deterministische Schluss-Stufe (Sprache, Firmen-Brand, Free-Badge, Trust-System). */
  private assemble(content: ApplicationContent, input: GenerationInput): ApplicationContent {
    content.language = input.language;
    // Firmen-Branding (gescrapte Farben/Font) überschreibt die KI-Brand-Heuristik, wenn vorhanden.
    if (input.brand && (input.brand.colors.length > 0 || input.brand.fontFamily)) {
      content.company = { ...(content.company ?? {}), brand: input.brand };
    }
    if (input.tier === 'free') {
      for (const section of content.sections) {
        if (section.type === 'contact') section.badge = true;
      }
    }

    // ── Trust-System (ADR 0012): deterministisch, KEIN LLM → schnell, gratis, halluzinationsfrei ──
    const market = input.market ?? 'dach';
    const showContact = input.showContactDetails ?? false;
    content.meta = { market, noindex: input.noindex ?? true, showContactDetails: showContact };

    // PII-Default: Telefon/Adresse NICHT öffentlich, außer ausdrücklich freigegeben (Task #35).
    if (!showContact) {
      for (const section of content.sections) {
        if (section.type === 'contact') {
          section.phone = undefined;
          section.location = undefined;
        }
      }
    }

    // 10-Sekunden-Antwort + Beweis-Links NUR aus echtem Material ableiten (nichts erfunden).
    content.recruiterSummary = deriveRecruiterSummary(content.sections);
    content.proofLinks = deriveProofLinks(content.sections);

    // Echtes, selbst aufgenommenes Intro (vom Aufrufer aus Uploads gebaut).
    if (input.selfIntro) content.selfIntro = input.selfIntro;

    // Integritäts-Badge (ADR 0012 §5): IMMER gesetzt, deterministisch — kein LLM.
    // Sichtbarkeit steuert der Nutzer später im Editor; Default = sichtbar.
    content.integrity = buildIntegrity(input.integrityTone ?? 'confident');

    return content;
  }
}

// ── Deterministische Trust-Helfer (rein, framework-neutral) ──────────────────────────────────

const PROOF_URL = /^https?:\/\/[^\s]+$/i;

function pickSection<T extends Section['type']>(
  sections: readonly Section[],
  type: T,
): Extract<Section, { type: T }> | undefined {
  return sections.find((s): s is Extract<Section, { type: T }> => s.type === type);
}

/** 10-Sekunden-Antwort: Pitch als Headline, Top-3-Match aus der fit-Sektion (Fallback Hero-Chips). */
function deriveRecruiterSummary(sections: readonly Section[]): { headline: string; points: string[] } {
  const hero = pickSection(sections, 'hero');
  const fit = pickSection(sections, 'fit');
  const headline = hero?.pitch?.trim() || hero?.headline.join(' ').trim() || 'Warum ich passe';
  let points: string[] = [];
  if (fit && fit.items.length > 0) {
    points = fit.items.slice(0, 3).map((i) => i.requirement).filter(Boolean);
  } else if (hero && hero.chips.length > 0) {
    points = hero.chips.slice(0, 3);
  }
  return { headline, points };
}

const INTEGRITY_STATEMENTS: Record<'confident' | 'playful' | 'minimal', string> = {
  confident:
    'Recherche & Struktur mit KI-Unterstützung — Inhalte, Erfahrung und Zahlen sind real und von mir verantwortet.',
  playful: 'Ja, KI hat mitgeholfen. Nein, ich habe nichts erfunden.',
  minimal: 'KI-unterstützt · Inhalte real und verantwortet.',
};

function buildIntegrity(tone: 'confident' | 'playful' | 'minimal') {
  return { aiAssisted: true, tone, statement: INTEGRITY_STATEMENTS[tone], visible: true };
}

/** Verifizierbare Beleg-Links aus echten Profil-Links + Projekt-URLs (dedupliziert, max. 8). */
function deriveProofLinks(sections: readonly Section[]): ProofLink[] {
  const out: ProofLink[] = [];
  const seen = new Set<string>();
  const push = (label: string, url: string, claim?: string) => {
    if (!PROOF_URL.test(url) || seen.has(url)) return;
    seen.add(url);
    out.push(claim ? { label, url, claim } : { label, url });
  };
  const contact = pickSection(sections, 'contact');
  for (const l of contact?.links ?? []) push(l.label, l.url);
  const projects = pickSection(sections, 'projects');
  for (const p of projects?.items ?? []) if (p.url) push(p.name, p.url, p.name);
  return out.slice(0, 8);
}
