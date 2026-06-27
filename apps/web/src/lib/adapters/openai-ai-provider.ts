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
const REQUEST_TIMEOUT_MS = 40_000; // unter Vercel maxDuration(60); hängende Anfrage → Retry statt Block
const MAX_ATTEMPTS = 4; // 1 Versuch + 3 Retries

/** Claude-Modell-ID (aus modelFor) → OpenAI-Äquivalent. Mechanisch=mini, Plan/Write=4o. */
function mapModel(model: string): string {
  return /haiku/.test(model) ? 'gpt-4o-mini' : 'gpt-4o';
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

    const data = (await this.postWithRetry(body)) as {
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

  /**
   * POST mit Robustheit: pro Versuch ein Timeout (AbortController); transiente Fehler
   * (Netzwerk-/Abort-Fehler, HTTP 429, HTTP 5xx) werden mit exponentiellem Backoff erneut versucht.
   * Genau das fehlte vorher: EIN transienter Fehler unter 8-facher Parallelität ließ eine Sektion
   * still auf null fallen — traf es den Hero, brach die ganze Generierung ("kein Hero"). 4xx (außer
   * 429) werden NICHT wiederholt (würde nicht helfen).
   */
  private async postWithRetry(body: Record<string, unknown>): Promise<unknown> {
    let lastErr: Error = new Error('OpenAI: unbekannter Fehler');
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(OPENAI_URL, {
          method: 'POST',
          headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        if (res.ok) return await res.json();
        const transient = res.status === 429 || res.status >= 500;
        const t = await res.text().catch(() => '');
        lastErr = new Error(`OpenAI ${res.status}: ${t.slice(0, 240)}`);
        if (!transient) throw lastErr; // 4xx (Auth/Validierung) → kein Retry
        // Retry-After respektieren (Sekunden), sonst exponentieller Backoff + Jitter.
        const ra = Number(res.headers.get('retry-after'));
        const backoff = Number.isFinite(ra) && ra > 0 ? ra * 1000 : 400 * 2 ** attempt + attempt * 150;
        if (attempt < MAX_ATTEMPTS - 1) await sleep(backoff);
      } catch (e) {
        // Netzwerk-/Abort-Fehler (transient) → Backoff + Retry; harte Fehler (4xx oben) re-throwen.
        lastErr = e instanceof Error ? e : new Error(String(e));
        if (lastErr.message.startsWith('OpenAI 4')) throw lastErr;
        if (attempt < MAX_ATTEMPTS - 1) await sleep(400 * 2 ** attempt + attempt * 150);
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr;
  }

  // Streaming wird von der Pipeline nicht gebraucht (nutzt nur complete()).
  // eslint-disable-next-line require-yield
  async *stream(): AsyncIterable<AIStreamChunk> {
    throw new Error('OpenAIProvider: stream() nicht unterstützt (Pipeline nutzt complete()).');
  }
}
