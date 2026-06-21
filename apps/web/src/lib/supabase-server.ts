import 'server-only';

import { createClient } from '@supabase/supabase-js';

import { publicEnv, serverEnv } from './env';

// Service-Role-Client: umgeht RLS. NUR serverseitig (server-only-Marker), nie im Client-Bundle.
// Trägt u. a. den öffentlichen Tenant-Lesepfad (mit explizitem Status-Filter) und die RPCs.
// Default-Schema: offero (ADR 0006).
function makeServiceClient() {
  const env = serverEnv();
  return createClient(publicEnv.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: env.dbSchema },
  });
}

/** Konkreter Client-Typ (Schema offero) — Adapter konsumieren ihn statt des Default-SupabaseClient. */
export type DbClient = ReturnType<typeof makeServiceClient>;

let cached: DbClient | null = null;

export function supabaseService(): DbClient {
  if (!cached) {
    cached = makeServiceClient();
  }
  return cached;
}
