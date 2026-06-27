import 'server-only';

import { ApplicationService, GenerationPipeline, ProfileService } from '@offero/core';

import { ClaudeAIProvider } from './adapters/claude-ai-provider';
import { ClaudeCliProvider } from './adapters/claude-cli-provider';
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
  // KI-Backend wählbar: 'cli' = lokale claude-CLI auf der Subscription (Test, keine API-Token),
  // 'api' = Anthropic-API-Key (Produktion). Siehe AI_BACKEND in .env.local.
  const aiText =
    env.aiBackend === 'cli'
      ? new ClaudeCliProvider()
      : env.anthropicApiKey
        ? new ClaudeAIProvider(env.anthropicApiKey)
        : null;
  const pipeline = aiText ? new GenerationPipeline({ ai: aiText, repo }) : undefined;
  const applicationService = new ApplicationService(repo, pipeline);
  return { supabase, repo, storage, profileService, applicationService, aiText };
}

let container: ReturnType<typeof build> | null = null;

export function getServerContainer() {
  if (!container) {
    container = build();
  }
  return container;
}
