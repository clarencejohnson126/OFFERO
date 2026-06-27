import { z } from 'zod';

// golden-eval Rubric — Offeros QUALITÄTSDEFINITION als Domänenlogik (gehört in core, nicht in ein
// Skript). Jede Dimension ist an die Constitution gebunden; ein Judge-Agent bewertet 0..5.
// Quelle der Erwartung: der Goldstandard (N10-MaibornWolff u. a., docs/factory/workflows.md).

/** Eine Bewertungsdimension mit Constitution-Bezug und Gewicht im Gesamtscore. */
export interface RubricDimension {
  key: RubricKey;
  label: string;
  /** Was eine 5 bedeutet — fließt in den Judge-Prompt, damit die Skala stabil bleibt. */
  anchor5: string;
  /** Was eine 0–1 bedeutet (Negativanker gegen wohlwollende KI-Verzerrung). */
  anchor0: string;
  weight: number;
  /** true = Verstoß ist disqualifizierend (Constitution Art. II), nicht nur Punktabzug. */
  critical: boolean;
}

export const RUBRIC_KEYS = [
  'honesty',
  'fit_evidence',
  'tailoring',
  'story_arc',
  'tone_underpromise',
  'language_quality',
] as const;
export type RubricKey = (typeof RUBRIC_KEYS)[number];

export const RUBRIC: readonly RubricDimension[] = [
  {
    key: 'honesty',
    label: 'Ehrlichkeit',
    weight: 3,
    critical: true,
    anchor5:
      'Jede Fähigkeits-/Erfahrungsaussage ist durch das Profil gedeckt. KI-Zeitleiste sauber ' +
      '(RAG/MCP/Automatisierung seit 2024, echte Agentic-Praxis erst seit Ende 2025). Keine erfundenen Titel, Zahlen oder Zeiträume.',
    anchor0:
      'Erfundene oder aufgeblähte Fähigkeiten/Erfahrungen; unbelegte Metriken; falsche KI-Zeitleiste ' +
      '(z. B. „2 Jahre Agentic"). Dies ist DISQUALIFIZIEREND (Constitution Art. II.1).',
  },
  {
    key: 'fit_evidence',
    label: 'Passung mit Beleg',
    weight: 2,
    critical: false,
    anchor5:
      'Die fit-Sektion paart jede zentrale Stellen-Anforderung mit einem KONKRETEN, profilbelegten Nachweis ' +
      '(echtes Projekt, Rolle, Ergebnis) — kein Geschwurbel.',
    anchor0: 'Anforderungen mit leeren Floskeln „beantwortet"; Belege generisch oder fehlend.',
  },
  {
    key: 'tailoring',
    label: 'Zuschnitt auf die Stelle',
    weight: 2,
    critical: false,
    anchor5:
      'Sichtbar auf genau diese Firma/Rolle zugeschnitten: konkrete Anforderungen, Domäne und Sprache der Anzeige aufgegriffen.',
    anchor0: 'Austauschbar/generisch; könnte an jede beliebige Stelle gehen.',
  },
  {
    key: 'story_arc',
    label: 'Story-Bogen & Struktur',
    weight: 1.5,
    critical: false,
    anchor5:
      'Kohärenter Bogen wie der Goldstandard (hero → fit → experience → ggf. roadmap/collaboration → honest → contact). Sektionswahl sinnvoll, keine Redundanz.',
    anchor0: 'Zusammenhangslose Sektionen, Sprünge, Wiederholungen oder fehlender roter Faden.',
  },
  {
    key: 'tone_underpromise',
    label: 'Ton: underpromise',
    weight: 1.5,
    critical: false,
    anchor5:
      'Bescheiden, glaubwürdig, overdeliver-Haltung (Constitution Art. II.2). Selbstbewusst ohne Prahlerei.',
    anchor0: 'Marktschreierisch, Superlative, Buzzword-Bingo, „Rockstar/Ninja"-Ton.',
  },
  {
    key: 'language_quality',
    label: 'Sprachqualität',
    weight: 1,
    critical: false,
    anchor5:
      'Flüssig, fehlerfrei, durchgehend in der Zielsprache. Keine KI-Floskeln/Slop, keine Platzhalter.',
    anchor0: 'Holprig, Grammatikfehler, Sprachmix, generische KI-Phrasen oder Resttemplate.',
  },
];

export const RUBRIC_BY_KEY: Record<RubricKey, RubricDimension> = Object.fromEntries(
  RUBRIC.map((d) => [d.key, d]),
) as Record<RubricKey, RubricDimension>;

/** Strukturierte Bewertung, die der Judge-Agent zurückgibt (JSON, schema-validiert). */
export const verdictSchema = z.object({
  scores: z.object({
    honesty: z.number().int().min(0).max(5),
    fit_evidence: z.number().int().min(0).max(5),
    tailoring: z.number().int().min(0).max(5),
    story_arc: z.number().int().min(0).max(5),
    tone_underpromise: z.number().int().min(0).max(5),
    language_quality: z.number().int().min(0).max(5),
  }),
  /** Wörtliche Zitate erfundener/aufgeblähter Aussagen — leer = sauber (Art. II.1). */
  honestyViolations: z.array(z.string()).default([]),
  /** Kurze Begründung des Urteils (1–3 Sätze). */
  notes: z.string().default(''),
});
export type Verdict = z.infer<typeof verdictSchema>;

export function parseVerdict(input: unknown): Verdict {
  return verdictSchema.parse(input);
}
