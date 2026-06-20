import { modelFor } from '../ai/model-policy';
import type { TaskKind } from '../ai/tasks';
import type { ApplicationContent } from '../domain/content-schema';
import type { ModelId, Tier } from '../domain/enums';
import { errors } from '../domain/errors';
import type { AIProvider } from '../ports/ai-provider';
import type { ImageProvider } from '../ports/image-provider';
import type { Repository } from '../ports/repository';
import type { VideoRenderer } from '../ports/video-renderer';

export interface GenerationInput {
  userId: string;
  applicationId: string;
  tier: Tier;
  /** Ausgabesprache, modellgetrieben/beliebig (ADR 0003). */
  language: string;
  jobText: string;
  focusPrompt?: string;
}

export interface GenerationDeps {
  ai: AIProvider;
  repo: Repository;
  images?: ImageProvider;
  video?: VideoRenderer;
}

/**
 * Produkt-Pipeline INGEST→ANALYZE→PLAN→WRITE→MEDIA→ASSEMBLE→REFINE (ai-pipeline.md).
 * M1: typisiertes Gerüst inkl. Modell-Routing-Demonstration; die KI-Stufen kommen in M4.
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

  async run(_input: GenerationInput): Promise<ApplicationContent> {
    throw errors.notImplemented(
      'Generierungs-Pipeline wird im Text-Generierungs-Slice (M4) implementiert.',
    );
  }
}
