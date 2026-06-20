import { createClient } from '@supabase/supabase-js';

import { errors } from '@offero/core';

import { publicEnv } from '@/lib/env';

export interface AuthContext {
  userId: string;
  token: string;
}

/**
 * Bearer-first Auth (mobil-sicher): liest zuerst `Authorization: Bearer <jwt>`.
 * Ein Cookie-Fallback kommt im Auth-Slice (M3); Mobile schickt nur den Header.
 */
export async function authenticate(req: Request): Promise<AuthContext> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    throw errors.unauthorized('Kein Bearer-Token im Authorization-Header.');
  }

  const supabase = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw errors.unauthorized('Ungültiges oder abgelaufenes Token.');
  }
  return { userId: data.user.id, token };
}
