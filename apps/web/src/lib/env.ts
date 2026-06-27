// Zentraler, typisierter Env-Zugriff. publicEnv ist client-sicher (NEXT_PUBLIC_*);
// serverEnv() liest Secrets und darf nur serverseitig aufgerufen werden.

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'offero.app',
};

/** Dediziertes Postgres-Schema für alle Offero-Objekte (getrennt von der Alt-App, ADR 0006). */
export const OFFERO_SCHEMA = process.env.SUPABASE_DB_SCHEMA ?? 'offero';

export interface ServerEnv {
  serviceRoleKey: string;
  dbSchema: string;
  anthropicApiKey: string;
  /**
   * KI-Text-Backend (Constitution Art. IV.2: extensibel, kein Provider-Lock):
   * 'api' (Anthropic-API, Produktionsstandard) · 'cli' (lokale claude-CLI/Subscription, nur lokal) ·
   * 'openai' (OpenAI als Stopgap, wenn Anthropic-Budget fehlt). Umschalten = reine Env-Änderung.
   */
  aiBackend: 'api' | 'cli' | 'openai';
  openaiApiKey: string;
  geminiApiKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

export function serverEnv(): ServerEnv {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt (.env.local).');
  }
  const backend = process.env.AI_BACKEND;
  return {
    serviceRoleKey,
    dbSchema: OFFERO_SCHEMA,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    aiBackend: backend === 'cli' ? 'cli' : backend === 'openai' ? 'openai' : 'api',
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  };
}
