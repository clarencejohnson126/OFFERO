import { createClient } from '@supabase/supabase-js';

import { OFFERO_SCHEMA, publicEnv } from './env';

// Anon-Client (RLS aktiv). Für token-gebundene Reads im Namen des Nutzers. Default-Schema: offero.
export function supabaseAnon(accessToken?: string) {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: OFFERO_SCHEMA },
    global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
  });
}
