import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildScorecard,
  formatScorecard,
  GenerationPipeline,
  MODELS,
  runJudge,
  type EvalCase,
  type Scorecard,
  type Verdict,
} from '@offero/core';

import { fixtureRepo } from './fixture-repo';
import { NodeAnthropicProvider } from './provider';

// golden-eval Runner (Fabrik-ADW, docs/factory/workflows.md). Fährt jede Fixture durch die ECHTE
// Produkt-Pipeline, lässt den adversarischen Judge bewerten, bildet die Scorecard und GATEt:
// Exit-Code 0 = PASS, 1 = FAIL (CI-tauglich), 2 = Setup-Fehler. Baseline = letzter PASS im Ledger
// → Modell-/Prompt-Wechsel können die Qualität nicht heimlich senken (Constitution Art. I/II).

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(HERE, 'fixtures');
const OUT_DIR = join(HERE, 'out');
const LEDGER_PATH = join(HERE, 'ledger.json');

interface LedgerEntry {
  runId: string;
  overall: number;
  dimensionMeans: Scorecard['dimensionMeans'];
  judgeModel: string;
  costCents: number;
  gatePass: boolean;
}

function loadCases(): EvalCase[] {
  if (!existsSync(FIXTURES_DIR)) return [];
  const files = readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.json'));
  const cases: EvalCase[] = [];
  for (const f of files) {
    const raw = JSON.parse(readFileSync(join(FIXTURES_DIR, f), 'utf8')) as unknown;
    const list = Array.isArray(raw) ? raw : ((raw as { cases?: EvalCase[] }).cases ?? []);
    cases.push(...(list as EvalCase[]));
  }
  return cases;
}

function loadLedger(): LedgerEntry[] {
  if (!existsSync(LEDGER_PATH)) return [];
  return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as LedgerEntry[];
}

/** Verdict für einen Case, der die Pipeline gesprengt hat → garantierter Gate-Fail statt Crash. */
function failVerdict(message: string): Verdict {
  return {
    scores: {
      honesty: 0,
      fit_evidence: 0,
      tailoring: 0,
      story_arc: 0,
      tone_underpromise: 0,
      language_quality: 0,
    },
    honestyViolations: [],
    notes: `Pipeline-Fehler: ${message}`,
  };
}

async function main(): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('✗ ANTHROPIC_API_KEY fehlt. Aufruf: ANTHROPIC_API_KEY=… pnpm eval');
    return 2;
  }

  const onlyId = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1];
  let cases = loadCases();
  if (onlyId) cases = cases.filter((c) => c.id === onlyId);
  if (cases.length === 0) {
    console.error(
      `✗ Keine Fixtures in ${FIXTURES_DIR}${onlyId ? ` (Filter --only=${onlyId})` : ''}.`,
    );
    return 2;
  }

  const ai = new NodeAnthropicProvider(apiKey);
  const judgeModel = MODELS.opus; // Judge immer auf der stärksten Stufe (Routing-Config, keine ID im Code)
  let totalCostCents = 0;

  console.log(`golden-eval · ${cases.length} Case(s) · Judge=${judgeModel}\n`);
  const verdicts: { id: string; verdict: Verdict }[] = [];

  for (const c of cases) {
    process.stdout.write(`  ▸ ${c.id} … `);
    try {
      const { repo, userId } = fixtureRepo(c.profile);
      const pipeline = new GenerationPipeline({ ai, repo });
      const gen = await pipeline.run({
        userId,
        applicationId: `eval-${c.id}`,
        tier: c.tier,
        language: c.language,
        jobText: c.jobText,
        focusPrompt: c.focusPrompt,
      });
      const judged = await runJudge(ai, judgeModel, {
        content: gen.content,
        jobText: c.jobText,
        expectations: c.expectations,
        profile: c.profile,
      });
      totalCostCents += gen.costCents + judged.costCents;
      verdicts.push({ id: c.id, verdict: judged.verdict });
      console.log('ok');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      verdicts.push({ id: c.id, verdict: failVerdict(message) });
      console.log(`FEHLER (${message})`);
    }
  }

  const ledger = loadLedger();
  const lastPass = [...ledger].reverse().find((e) => e.gatePass);
  const scorecard = buildScorecard({ cases: verdicts, baselineOverall: lastPass?.overall });

  console.log('\n' + formatScorecard(scorecard));
  console.log(
    `\nKI-Kosten gesamt: ${(totalCostCents / 100).toFixed(3)} € · Baseline: ${lastPass ? lastPass.overall : '—'}`,
  );

  const runId = new Date().toISOString();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, `${runId.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(scorecard, null, 2),
  );
  const entry: LedgerEntry = {
    runId,
    overall: scorecard.overall,
    dimensionMeans: scorecard.dimensionMeans,
    judgeModel,
    costCents: Math.round(totalCostCents * 1000) / 1000,
    gatePass: scorecard.gate.pass,
  };
  writeFileSync(LEDGER_PATH, JSON.stringify([...ledger, entry], null, 2));

  return scorecard.gate.pass ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(2);
  });
