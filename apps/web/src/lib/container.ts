import 'server-only';

import { ApplicationService, GenerationPipeline, ProfileService } from '@offero/core';

import { ClaudeAIProvider } from './adapters/claude-ai-provider';
import { ClaudeCliProvider } from './adapters/claude-cli-provider';
import { OpenAIProvider } from './adapters/openai-ai-provider';
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
  // KI-Text-Backend wählbar (AI_BACKEND): 'cli' = lokale claude-CLI/Subscription (nur lokal, kein
  // API-Token) · 'openai' = OpenAI-Stopgap (wenn Anthropic-Budget fehlt) · sonst 'api' = Anthropic
  // (Produktionsstandard). Alle hinter demselben AIProvider-Port — Wechsel ohne Feature-Code-Änderung.
  const aiText =
    env.aiBackend === 'cli'
      ? new ClaudeCliProvider()
      : env.aiBackend === 'openai'
        ? env.openaiApiKey
          ? new OpenAIProvider(env.openaiApiKey)
          : null
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
