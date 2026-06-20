// Zentraler, typisierter Env-Zugriff. publicEnv ist client-sicher (NEXT_PUBLIC_*);
// serverEnv() liest Secrets und darf nur serverseitig aufgerufen werden.

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  rootDomain: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'offero.app',
};

export interface ServerEnv {
  serviceRoleKey: string;
  /** Offero-Tabellen liegen mit Präfix im public-Schema (geteiltes Projekt, ADR 0006). */
  tablePrefix: string;
  anthropicApiKey: string;
  geminiApiKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
}

export function serverEnv(): ServerEnv {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt (.env.local).');
  }
  return {
    serviceRoleKey,
    tablePrefix: process.env.OFFERO_TABLE_PREFIX ?? 'offero_',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  };
}
