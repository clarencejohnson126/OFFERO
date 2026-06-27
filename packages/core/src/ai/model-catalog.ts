import type { ModelId, Tier } from '../domain/enums';
import type { TaskKind } from './tasks';

// Die EINZIGE Stelle mit konkreten Modell-IDs (Constitution Art. IV.3). Tier-Wechsel = Datenänderung.
export const MODELS = {
  opus: 'claude-opus-4-8',
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5',
} as const;

// Default: Haiku für Analyse (schnell/günstig), Sonnet für plan/write (Qualität+Speed-Balance).
// Opus ist explizites Premium-Upgrade für plus/pro — nicht der Standard.
export const DEFAULT_MODELS: Record<TaskKind, ModelId> = {
  ingest: MODELS.haiku,
  analyze: MODELS.haiku,
  plan: MODELS.sonnet,
  write: MODELS.sonnet,
  refine: MODELS.sonnet,
};

// Tier-Overrides. Fehlt ein Eintrag → DEFAULT (Sonnet).
export const MODEL_CATALOG: Partial<Record<Tier, Partial<Record<TaskKind, ModelId>>>> = {
  // plus/pro: Opus für plan+write als echtes Qualitäts-Upgrade (sichtbarer Unterschied bei
  // komplexen Profilen und langen Stellenbeschreibungen).
  plus: { plan: MODELS.opus, write: MODELS.opus, refine: MODELS.opus },
  pro: { plan: MODELS.opus, write: MODELS.opus, refine: MODELS.opus },
};

// Preise pro 1M Tokens (USD), inkl. Cache-Read (~0,1×). Quelle: ai-pipeline.md / unit-economics.md.
// Hier zentral, weil modell-ID-spezifisch (gehört zur Routing-Config, nicht in den Feature-Code).
export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
  cachedInputPerMTok: number;
}
export const MODEL_PRICING: Record<ModelId, ModelPricing> = {
  [MODELS.opus]: { inputPerMTok: 5, outputPerMTok: 25, cachedInputPerMTok: 0.5 },
  [MODELS.sonnet]: { inputPerMTok: 3, outputPerMTok: 15, cachedInputPerMTok: 0.3 },
  [MODELS.haiku]: { inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1 },
};
const DEFAULT_PRICING: ModelPricing = { inputPerMTok: 5, outputPerMTok: 25, cachedInputPerMTok: 0.5 };

export function pricingFor(model: ModelId): ModelPricing {
  return MODEL_PRICING[model] ?? DEFAULT_PRICING;
}
