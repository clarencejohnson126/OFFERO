'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser-Client (persistSession) für Auth. JWT geht als Bearer an /api/v1 (mobil-sicher).
let client: SupabaseClient | null = null;

export function supabaseBrowser(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      { auth: { persistSession: true, autoRefreshToken: true } },
    );
  }
  return client;
}
