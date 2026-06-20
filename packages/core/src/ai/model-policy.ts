import type { ModelId, Tier } from '../domain/enums';
import { DEFAULT_MODELS, MODEL_CATALOG } from './model-catalog';
import type { TaskKind } from './tasks';

/** Wählt das Modell pro Stufe & Tier aus der Config — KEINE IDs im Feature-Code. */
export function modelFor(task: TaskKind, tier: Tier): ModelId {
  return MODEL_CATALOG[tier]?.[task] ?? DEFAULT_MODELS[task];
}
