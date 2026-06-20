// Konstante Unions statt Postgres-Enums (offen für Erweiterung, ADR 0006).
// In der DB als Text + CHECK gespiegelt.

export const TIERS = ['free', 'starter', 'plus', 'pro', 'subscription'] as const;
export type Tier = (typeof TIERS)[number];

export type ApplicationStatus = 'draft' | 'generating' | 'ready' | 'shared' | 'archived';
export type GenerationKind = 'generation' | 're_roll';
export type MediaType = 'image' | 'video' | 'pdf';
export type RendererId = 'gemini' | 'remotion' | 'ffmpeg_lite' | 'headless_pdf';
export type MediaStatus = 'queued' | 'running' | 'ready' | 'error';
export type JobStatus = 'queued' | 'running' | 'ready' | 'error';
export type LedgerReason =
  | 'purchase'
  | 'generation'
  | 're_roll'
  | 'subscription_grant'
  | 'refund';
export type PaymentProviderId = 'stripe' | 'apple_iap' | 'google_iap';
export type PurchaseStatus = 'pending' | 'completed' | 'refunded' | 'failed';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';

/** Modell-IDs sind absichtlich offen (string) — konkrete IDs leben NUR in der Routing-Config. */
export type ModelId = string;

// Storage-Referenzen (hier definiert, damit Ports davon abhängen, nicht umgekehrt).
export type StorageBucket = 'cv' | 'photo' | 'image' | 'video' | 'pdf';
export interface StorageRef {
  bucket: StorageBucket;
  path: string;
}
