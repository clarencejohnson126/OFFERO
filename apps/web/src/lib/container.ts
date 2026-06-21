import 'server-only';

import { ProfileService } from '@offero/core';

import { ClaudeAIProvider } from './adapters/claude-ai-provider';
import { SupabaseRepository } from './adapters/supabase-repository';
import { SupabaseStorage } from './adapters/supabase-storage';
import { serverEnv } from './env';
import { supabaseService } from './supabase-server';

// Composition Root: der EINZIGE Ort, der konkrete Adapter kennt und in die core-Services injiziert.
// M3: SupabaseRepository (Profil+Billing) + SupabaseStorage + ClaudeAIProvider (Text) + ProfileService.
// Ab M4 kommen GeminiImageProvider/FfmpegLiteRenderer/StripeProvider/Queue dazu.
function build() {
  const supabase = supabaseService();
  const env = serverEnv();
  const repo = new SupabaseRepository(supabase);
  const storage = new SupabaseStorage(supabase);
  const profileService = new ProfileService(repo);
  const aiText = env.anthropicApiKey ? new ClaudeAIProvider(env.anthropicApiKey) : null;
  return { supabase, repo, storage, profileService, aiText };
}

let container: ReturnType<typeof build> | null = null;

export function getServerContainer() {
  if (!container) {
    container = build();
  }
  return container;
}
