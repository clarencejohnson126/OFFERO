import 'server-only';

import { supabaseService } from './supabase-server';

// Composition Root: der EINZIGE Ort, der konkrete Adapter kennt und in die core-Services injiziert.
// M1: liefert die Supabase-Clients. Ab M3/M4 werden hier instanziiert und zurückgegeben:
//   - SupabaseRepository (Repository-Port)  · SupabaseStorage (Storage-Port)
//   - ClaudeAIProvider (AIProvider) · GeminiImageProvider (ImageProvider)
//   - FfmpegLiteRenderer (VideoRenderer) · StripeProvider (PaymentProvider) · SupabaseQueue (Queue)
// und daraus ApplicationService/ProfileService/GenerationPipeline gebaut.

export function getServerContainer() {
  const supabase = supabaseService();
  return { supabase };
}
