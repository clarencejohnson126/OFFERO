import { modelFor } from '../ai/model-policy';
import { type CvStructured, parseCvStructured } from '../domain/cv-schema';
import type { Tier } from '../domain/enums';
import type { AIProvider } from '../ports/ai-provider';

// INGEST-Stufe (ai-pipeline.md) für den Profil-CV: Rohtext → strukturierte Daten [Haiku].
const INGEST_SYSTEM = [
  'Du strukturierst Lebenslauf-Rohtext zu sauberem JSON.',
  'Gib NUR gültiges JSON nach diesem Schema zurück (keine Erklärungen, kein Markdown-Codeblock):',
  '{ "summary": string?, "experience": [{ "role": string, "org": string?, "period": string?, "highlights": string[] }],',
  '  "education": [{ "degree": string, "org": string?, "period": string? }], "skills": string[],',
  '  "languages": [{ "name": string, "level": string? }] }',
  'Regeln: ehrlich bleiben, NICHTS erfinden — nur extrahieren, was im Text steht.',
  'Die Sprache der Werte entspricht der Sprache des CVs.',
].join('\n');

export interface IngestCvInput {
  cvText: string;
  tier: Tier;
}

/** Strukturiert CV-Rohtext über den AIProvider-Port (Modell aus der Routing-Policy). */
export async function ingestCv(ai: AIProvider, input: IngestCvInput): Promise<CvStructured> {
  const model = modelFor('ingest', input.tier);
  const result = await ai.complete({
    model,
    system: INGEST_SYSTEM,
    messages: [{ role: 'user', content: input.cvText.slice(0, 100_000) }],
    cacheBreakpoints: [0], // System-Prompt cachen (Prompt-Caching, ai-pipeline.md)
    maxTokens: 4096,
  });
  return parseCvStructured(extractJson(result.text));
}

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('Keine JSON-Struktur in der Modell-Antwort.');
  }
  return JSON.parse(text.slice(start, end + 1));
}
