import 'server-only';

import { ProfileService } from '@offero/core';

import { SupabaseRepository } from './adapters/supabase-repository';
import { SupabaseStorage } from './adapters/supabase-storage';
import { supabaseService } from './supabase-server';

// Composition Root: der EINZIGE Ort, der konkrete Adapter kennt und in die core-Services injiziert.
// M3: SupabaseRepository (Profil+Billing) + SupabaseStorage + ProfileService.
// Ab M4 kommen hier ClaudeAIProvider/GeminiImageProvider/FfmpegLiteRenderer/StripeProvider/Queue dazu.
function build() {
  const supabase = supabaseService();
  const repo = new SupabaseRepository(supabase);
  const storage = new SupabaseStorage(supabase);
  const profileService = new ProfileService(repo);
  return { supabase, repo, storage, profileService };
}

let container: ReturnType<typeof build> | null = null;

export function getServerContainer() {
  if (!container) {
    container = build();
  }
  return container;
}
