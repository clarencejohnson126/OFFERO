import type { ModelId } from '../domain/enums';

/** Minimale Abort-Schnittstelle (kein DOM/Node-Lib im Kern nötig). */
export interface AbortLike {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: () => void): void;
}

export type AIRole = 'system' | 'user' | 'assistant';
export interface AIMessage {
  role: AIRole;
  content: string;
}
export type AIEffort = 'low' | 'medium' | 'high';

export interface AICompletionRequest {
  /** Kommt aus modelFor() — NIE hartcodiert im Aufrufer. */
  model: ModelId;
  /** Template + nicht-verhandelbare Constraints; per cacheBreakpoints cachebar (Pflicht). */
  system: string;
  messages: AIMessage[];
  /** Indizes der zu cachenden Prefix-Blöcke (Prompt-Caching, ai-pipeline.md). */
  cacheBreakpoints?: number[];
  effort?: AIEffort;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortLike;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
}
export interface AICompletionResult {
  text: string;
  usage: AIUsage;
  /** Observability/Kostenzuordnung pro Tenant (Constitution Art. IV.5). */
  costCents: number;
  modelUsed: ModelId;
}
export interface AIStreamChunk {
  delta: string;
  done: boolean;
}

export interface AIProvider {
  complete(req: AICompletionRequest): Promise<AICompletionResult>;
  stream(req: AICompletionRequest): AsyncIterable<AIStreamChunk>;
}
