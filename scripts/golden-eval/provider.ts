import Anthropic from '@anthropic-ai/sdk';

import {
  type AICompletionRequest,
  type AICompletionResult,
  type AIProvider,
  type AIStreamChunk,
  pricingFor,
} from '@offero/core';

// Skript-lokaler Zwilling von apps/web/.../claude-ai-provider.ts (das hat `import 'server-only'`
// und läuft NICHT außerhalb von Next). Gleiche AIProvider-Schnittstelle, gleiche Kostenlogik
// (pricingFor aus core), damit golden-eval mit demselben Verhalten misst wie die Produktion.

const NO_SAMPLING = (m: string) => /claude-(opus-4-(7|8)|fable-5)/.test(m);
const SUPPORTS_EFFORT = (m: string) => /claude-(opus-4-(5|6|7|8)|sonnet-4-6|fable-5)/.test(m);
const SUPPORTS_ADAPTIVE = (m: string) => /claude-(opus-4-(6|7|8)|sonnet-4-6|fable-5)/.test(m);

export class NodeAnthropicProvider implements AIProvider {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  private buildBody(req: AICompletionRequest): Anthropic.MessageCreateParamsNonStreaming {
    const system = req.cacheBreakpoints?.length
      ? [{ type: 'text', text: req.system, cache_control: { type: 'ephemeral' } }]
      : req.system;
    const body: Record<string, unknown> = {
      model: req.model,
      max_tokens: req.maxTokens ?? 4096,
      system,
      messages: req.messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    };
    if (SUPPORTS_ADAPTIVE(req.model)) body.thinking = { type: 'adaptive' };
    if (req.effort && SUPPORTS_EFFORT(req.model)) body.output_config = { effort: req.effort };
    if (req.temperature !== undefined && !NO_SAMPLING(req.model))
      body.temperature = req.temperature;
    return body as unknown as Anthropic.MessageCreateParamsNonStreaming;
  }

  private cost(model: string, usage: AICompletionResult['usage']): number {
    const p = pricingFor(model);
    const uncachedIn = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
    const dollars =
      (uncachedIn * p.inputPerMTok +
        usage.cachedInputTokens * p.cachedInputPerMTok +
        usage.outputTokens * p.outputPerMTok) /
      1_000_000;
    return Math.round(dollars * 100 * 1000) / 1000; // Cents, 3 Nachkommastellen
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const res = await this.client.messages.create(this.buildBody(req));
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const u = res.usage as unknown as Record<string, number>;
    const usage = {
      inputTokens: u.input_tokens ?? 0,
      outputTokens: u.output_tokens ?? 0,
      cachedInputTokens: u.cache_read_input_tokens ?? 0,
    };
    return { text, usage, costCents: this.cost(res.model, usage), modelUsed: res.model };
  }

  async *stream(req: AICompletionRequest): AsyncIterable<AIStreamChunk> {
    const body = this.buildBody(req) as unknown as Parameters<
      typeof this.client.messages.stream
    >[0];
    const stream = this.client.messages.stream(body);
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { delta: event.delta.text, done: false };
      }
    }
    yield { delta: '', done: true };
  }
}
