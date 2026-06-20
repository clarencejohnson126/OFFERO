import type { Json } from '../domain/json';

// MVP-Impl: Supabase-Tabelle + Polling/Cron (claim via FOR UPDATE SKIP LOCKED).
// Engine-Wahl (Inngest/Trigger.dev) bleibt offen; nur dieser Port ist fix (ADR 0004).
export type JobKind = 'video_render' | 'image_gen' | 'pdf_render';

export interface EnqueueJob {
  kind: JobKind;
  payload: Json;
  /** Idempotenz-Schlüssel. */
  refId: string;
}

export interface QueuedJob {
  jobId: string;
  kind: JobKind;
  payload: Json;
  refId: string;
  attempts: number;
}

export interface Queue {
  enqueue(job: EnqueueJob): Promise<{ jobId: string }>;
  claim(kind: JobKind, limit: number): Promise<QueuedJob[]>;
  complete(jobId: string, result: Json): Promise<void>;
  fail(jobId: string, error: string): Promise<void>;
}
