import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { publicEnv } from './env';

// Anon-Client (RLS aktiv). Für token-gebundene Reads im Namen des Nutzers.
export function supabaseAnon(accessToken?: string): SupabaseClient {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}
