import 'server-only';

import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
  AIStreamChunk,
} from '@offero/core';

// Alternativer Text-Provider hinter DEMSELBEN AIProvider-Port wie ClaudeAIProvider/ClaudeCliProvider
// (Constitution Art. IV.2: extensibel, kein Provider-Lock). Nutzt OpenAI Chat Completions per REST —
// bewusst OHNE zusätzliche SDK-Abhängigkeit (kein neuer Build-/Install-Schritt auf Vercel).
//
// Aktivierung: AI_BACKEND=openai. Stopgap, wenn das Anthropic-API-Budget erschöpft ist; der
// Produktionsstandard bleibt Claude (AI_BACKEND=api) — Umschalten ist eine reine Env-Änderung.
// Die Prompts/Goldstandard-Regeln sind auf Claude getunt; OpenAI liefert funktionalen, aber nicht
// 1:1 deckungsgleichen Output. Die Pipeline ruft nur complete() (kein stream()).

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

/** Claude-Modell-ID (aus modelFor) → OpenAI-Äquivalent. Mechanisch=mini, Plan/Write=4o. */
function mapModel(model: string): string {
  return /haiku/.test(model) ? 'gpt-4o-mini' : 'gpt-4o';
}

// Grobe Preis-Schätzung (USD pro 1M Tokens) nur für Observability/Kostenzuordnung (Stopgap).
const PRICING: Record<string, { in: number; out: number }> = {
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'gpt-4o': { in: 2.5, out: 10 },
};

export class OpenAIProvider implements AIProvider {
  constructor(private readonly apiKey: string) {}

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const model = mapModel(req.model);
    const body: Record<string, unknown> = {
      model,
      max_tokens: req.maxTokens ?? 4096,
      messages: [
        { role: 'system', content: req.system },
        ...req.messages.map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
    };
    // Sampling nur wenn gesetzt (Q&A nutzt temperature 0). thinking/effort/cache_control sind
    // Anthropic-spezifisch und entfallen hier; das robuste extractJson im Aufrufer fängt Format-Slips.
    if (req.temperature !== undefined) body.temperature = req.temperature;

    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`OpenAI ${res.status}: ${t.slice(0, 240)}`);
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? '';
    const usage = {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      cachedInputTokens: 0,
    };
    const p = PRICING[model] ?? { in: 2.5, out: 10 };
    const cents = ((usage.inputTokens * p.in + usage.outputTokens * p.out) / 1_000_000) * 100;
    return { text, usage, costCents: Math.round(cents * 1000) / 1000, modelUsed: model };
  }

  // Streaming wird von der Pipeline nicht gebraucht (nutzt nur complete()).
  // eslint-disable-next-line require-yield
  async *stream(): AsyncIterable<AIStreamChunk> {
    throw new Error('OpenAIProvider: stream() nicht unterstützt (Pipeline nutzt complete()).');
  }
}
