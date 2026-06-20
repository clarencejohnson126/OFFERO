import type { ModelId, Tier } from '../domain/enums';
import type { TaskKind } from './tasks';

// Die EINZIGE Stelle mit konkreten Modell-IDs (Constitution Art. IV.3). Tier-Wechsel = Datenänderung.
export const MODELS = {
  opus: 'claude-opus-4-8',
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5',
} as const;

// Default: günstige Sub-Schritte auf Haiku, Qualitätsstufen auf Opus (ai-pipeline.md).
export const DEFAULT_MODELS: Record<TaskKind, ModelId> = {
  ingest: MODELS.haiku,
  analyze: MODELS.haiku,
  plan: MODELS.opus,
  write: MODELS.opus,
  refine: MODELS.opus,
};

// Tier-Overrides (Kostenoption für Free/High-Volume auf Sonnet). Fehlt ein Eintrag → DEFAULT.
export const MODEL_CATALOG: Partial<Record<Tier, Partial<Record<TaskKind, ModelId>>>> = {
  free: {
    ingest: MODELS.haiku,
    analyze: MODELS.haiku,
    plan: MODELS.sonnet,
    write: MODELS.sonnet,
    refine: MODELS.sonnet,
  },
  starter: { refine: MODELS.sonnet },
  // plus | pro | subscription nutzen DEFAULT_MODELS (Opus für plan/write/refine).
};
