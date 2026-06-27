import type { ApplicationContent } from '../domain/content-schema';
import type { ModelId } from '../domain/enums';
import type { AIMessage, AIProvider } from '../ports/ai-provider';

import type { EvalExpectations, EvalProfile } from './fixtures';
import { RUBRIC, type Verdict, parseVerdict } from './rubric';

// Der adversarische Judge (Verifier-Prinzip, docs/factory/workflows.md). Ein SEPARATER Agent
// bewertet den generierten Content gegen das Rubric — Agenten können die eigene Arbeit nicht
// neutral kritisieren, ein eigener Judge schon. Modell kommt vom Aufrufer (Opus, nie hartcodiert).

const JUDGE_SYSTEM = [
  'Du bist ein strenger, pedantischer Bewerter für Offero-Bewerbungs-Websites.',
  'Offero verkauft WIRKUNG, nicht Masse: lieber wenige herausragende als viele generische Bewerbungen.',
  'Wichtigste Regel (disqualifizierend): EHRLICHKEIT. Bewerbungen dürfen keine Fähigkeiten oder',
  'Erfahrungen erfinden oder aufblähen. KI-Zeitleiste muss sauber sein: RAG/MCP/Automatisierung',
  'seit 2024, echte Agentic-Praxis erst seit Ende 2025 — Aussagen wie „2 Jahre Agentic" sind ein Verstoß.',
  'Bewerte wohlwollungsfrei. Im Zweifel niedriger. Antworte AUSSCHLIESSLICH mit einem JSON-Objekt',
  'nach dem vorgegebenen Schema — kein Markdown, keine Erklärung außerhalb des JSON.',
].join('\n');

function rubricBlock(): string {
  return RUBRIC.map(
    (d) =>
      `- ${d.key} (${d.label}${d.critical ? ', KRITISCH/disqualifizierend' : ''}):\n` +
      `    5 = ${d.anchor5}\n` +
      `    0 = ${d.anchor0}`,
  ).join('\n');
}

function expectationsBlock(exp?: EvalExpectations): string {
  if (!exp) return '(keine zusätzlichen Erwartungen)';
  const parts: string[] = [];
  if (exp.requiredSections?.length) parts.push(`Pflicht-Sektionen: ${exp.requiredSections.join(', ')}`);
  if (exp.mustReference?.length) parts.push(`Sollte aufgreifen: ${exp.mustReference.join(', ')}`);
  if (exp.notes) parts.push(`Goldstandard-Hinweis: ${exp.notes}`);
  return parts.length ? parts.join('\n') : '(keine zusätzlichen Erwartungen)';
}

export interface JudgeInput {
  content: ApplicationContent;
  jobText: string;
  expectations?: EvalExpectations;
  /** Kandidaten-Profil (Wahrheits-Quelle) — erlaubt dem Judge, erfundene Skills/Zeiträume zu erkennen. */
  profile?: EvalProfile;
}

export interface JudgeResult {
  verdict: Verdict;
  costCents: number;
  modelUsed: ModelId;
}

/** System- und User-Nachricht des Judge — REINE Funktion, ohne IO (separat testbar). */
export interface JudgeMessages {
  system: string;
  messages: AIMessage[];
}

/**
 * Baut die Judge-Nachrichten deterministisch aus dem JudgeInput. Reine Funktion ohne Seiteneffekte,
 * damit der Ehrlichkeits-Block (Profil als Wahrheits-Quelle) ohne AIProvider getestet werden kann.
 * Das Laufzeitverhalten von runJudge bleibt unverändert — runJudge ruft genau diese Funktion auf.
 */
export function buildJudgeMessages(input: JudgeInput): JudgeMessages {
  const profileBlock = input.profile
    ? [
        '## Kandidaten-Profil (Wahrheits-Quelle für Ehrlichkeits-Check)',
        'Prüfe den generierten Content gegen dieses Profil. Jede Behauptung über Fähigkeiten, Zeiträume,',
        'Projekte oder Erfahrungen, die NICHT durch das Profil gedeckt ist, ist ein HONESTY-Verstoß.',
        '<profil>',
        JSON.stringify(input.profile),
        '</profil>',
      ].join('\n')
    : null;

  const user = [
    '## Stellenanzeige (Auszug)',
    input.jobText.slice(0, 6000),
    '',
    '## Erwartungen an den Goldstandard',
    expectationsBlock(input.expectations),
    ...(profileBlock ? ['', profileBlock] : []),
    '',
    '## Generierter Bewerbungs-Content (JSON)',
    JSON.stringify(input.content),
    '',
    '## Rubric (0–5 je Dimension)',
    rubricBlock(),
    '',
    '## Antwortformat (NUR dieses JSON)',
    JSON.stringify({
      scores: {
        honesty: 0,
        fit_evidence: 0,
        tailoring: 0,
        story_arc: 0,
        tone_underpromise: 0,
        language_quality: 0,
      },
      honestyViolations: ['wörtliches Zitat, falls etwas erfunden/aufgebläht ist'],
      notes: 'kurze Begründung (1–3 Sätze)',
    }),
  ].join('\n');

  return { system: JUDGE_SYSTEM, messages: [{ role: 'user', content: user }] };
}

/** Extrahiert das erste JSON-Objekt aus der Modellantwort (toleriert Code-Fences/Prosa). */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Judge-Antwort enthält kein JSON-Objekt');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

/** Führt den Judge aus und liefert das validierte Verdict samt Kosten. */
export async function runJudge(
  ai: AIProvider,
  model: ModelId,
  input: JudgeInput,
): Promise<JudgeResult> {
  const { system, messages } = buildJudgeMessages(input);

  const res = await ai.complete({
    model,
    system,
    messages,
    // System-Prompt + Rubric sind stabil → cachebar (ai-pipeline.md).
    cacheBreakpoints: [0],
    effort: 'high',
    temperature: 0,
    maxTokens: 1024,
  });

  const verdict = parseVerdict(extractJson(res.text));
  return { verdict, costCents: res.costCents, modelUsed: res.modelUsed };
}
