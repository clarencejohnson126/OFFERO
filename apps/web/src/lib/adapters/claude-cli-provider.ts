import 'server-only';

import { spawn } from 'node:child_process';

import type {
  AICompletionRequest,
  AICompletionResult,
  AIProvider,
  AIStreamChunk,
} from '@offero/core';

// TEST-Backend: routet die Claude-Aufrufe der App über die lokale `claude`-CLI (Headless `-p`),
// die auf der CLAUDE-SUBSCRIPTION läuft — verbraucht KEINE API-Token (kein Anthropic-API-Spend).
// Produktion nutzt weiter den ClaudeAIProvider (API-Key). Umschalten per Env AI_BACKEND=cli|api.
// Trade-offs (nur Test): etwas langsamer (Prozess-Spawn) und Claude-Codes Default-Scaffolding im
// Kontext; für reine JSON-Completions in Ordnung (der Aufrufer extrahiert das JSON ohnehin).

const BLOCKED_TOOLS = 'Bash,Read,Write,Edit,WebFetch,WebSearch,Glob,Grep,Task,NotebookEdit,TodoWrite';

/** Voll-Modell-ID → CLI-Alias. */
function aliasFor(model: string): string {
  if (/haiku/.test(model)) return 'haiku';
  if (/sonnet/.test(model)) return 'sonnet';
  return 'opus'; // opus + fable → stärkstes verfügbares
}

export class ClaudeCliProvider implements AIProvider {
  constructor(private readonly bin = 'claude') {}

  async complete(req: AICompletionRequest): Promise<AICompletionResult> {
    const user = req.messages.map((m) => m.content).join('\n\n');
    const args = [
      '-p',
      '--system-prompt',
      req.system,
      '--model',
      aliasFor(req.model),
      '--output-format',
      'json',
      '--disallowed-tools',
      BLOCKED_TOOLS,
    ];
    const stdout = await this.run(args, user);

    let parsed: { result?: unknown; usage?: Record<string, number>; is_error?: boolean };
    try {
      parsed = JSON.parse(stdout) as typeof parsed;
    } catch {
      throw new Error('claude-CLI: Antwort ist kein JSON.');
    }
    if (parsed.is_error) throw new Error('claude-CLI meldete einen Fehler.');
    const text = typeof parsed.result === 'string' ? parsed.result : '';
    const u = parsed.usage ?? {};
    return {
      text,
      usage: {
        inputTokens: Number(u.input_tokens ?? 0),
        outputTokens: Number(u.output_tokens ?? 0),
        cachedInputTokens: Number(u.cache_read_input_tokens ?? 0),
      },
      costCents: 0, // Subscription — kein API-Kostenanfall
      modelUsed: req.model,
    };
  }

  // Streaming wird vom Test-Backend nicht gebraucht (Pipeline nutzt nur complete()).
  // eslint-disable-next-line require-yield
  async *stream(): AsyncIterable<AIStreamChunk> {
    throw new Error('ClaudeCliProvider: stream() nicht unterstützt (Test-Backend).');
  }

  /** Spawnt `claude` mit dem User-Prompt über stdin (umgeht ARG_MAX bei langen Prompts). */
  private run(args: string[], stdin: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // ANTHROPIC_API_KEY aus der Child-Env entfernen, sonst nimmt die CLI den (gecappten) API-Key
      // statt der claude.ai-Subscription. Die Subscription-Credentials liegen separat (~/.claude).
      const env = { ...process.env };
      delete env.ANTHROPIC_API_KEY;
      delete env.ANTHROPIC_AUTH_TOKEN;
      const child = spawn(this.bin, args, { stdio: ['pipe', 'pipe', 'pipe'], env });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('claude-CLI Timeout (120s).'));
      }, 120_000);
      child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
      child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
      child.on('error', (e) => {
        clearTimeout(timer);
        reject(e);
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(stdout);
        else reject(new Error(`claude-CLI exit ${code}: ${stderr.slice(0, 240)}`));
      });
      child.stdin.write(stdin);
      child.stdin.end();
    });
  }
}
