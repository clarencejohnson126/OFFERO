import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { publicEnv, serverEnv } from './env';

// Service-Role-Client: umgeht RLS. NUR serverseitig (server-only-Marker), nie im Client-Bundle.
// Trägt u. a. den öffentlichen Tenant-Lesepfad (mit explizitem Status-Filter) und die RPCs.
let cached: SupabaseClient | null = null;

export function supabaseService(): SupabaseClient {
  if (!cached) {
    cached = createClient(publicEnv.supabaseUrl, serverEnv().serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
