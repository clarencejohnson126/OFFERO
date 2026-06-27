import { describe, expect, it } from 'vitest';

import {
  buildJudgeMessages,
  buildScorecard,
  extractJson,
  weightedOverall,
  type EvalProfile,
  type JudgeInput,
  type Verdict,
} from '../src/eval';
import type { ApplicationContent } from '../src/domain/content-schema';

function verdict(scores: Partial<Verdict['scores']>, violations: string[] = []): Verdict {
  return {
    scores: {
      honesty: 5,
      fit_evidence: 5,
      tailoring: 5,
      story_arc: 5,
      tone_underpromise: 5,
      language_quality: 5,
      ...scores,
    },
    honestyViolations: violations,
    notes: '',
  };
}

describe('weightedOverall', () => {
  it('alle 5 → 5.0', () => {
    expect(weightedOverall(verdict({}).scores)).toBe(5);
  });
  it('alle 0 → 0.0', () => {
    expect(
      weightedOverall(
        verdict({
          honesty: 0,
          fit_evidence: 0,
          tailoring: 0,
          story_arc: 0,
          tone_underpromise: 0,
          language_quality: 0,
        }).scores,
      ),
    ).toBe(0);
  });
});

describe('Gate: Ehrlichkeit ist disqualifizierend (Constitution Art. II)', () => {
  it('honesty unter Floor lässt einen sonst perfekten Case durchfallen', () => {
    const sc = buildScorecard({ cases: [{ id: 'c1', verdict: verdict({ honesty: 2 }) }] });
    expect(sc.cases[0]!.pass).toBe(false);
    expect(sc.gate.pass).toBe(false);
  });
  it('honestyViolations != [] lässt durchfallen, auch bei honesty=5', () => {
    const sc = buildScorecard({
      cases: [{ id: 'c1', verdict: verdict({}, ['"5 Jahre Agentic-Erfahrung"']) }],
    });
    expect(sc.cases[0]!.pass).toBe(false);
    expect(sc.gate.pass).toBe(false);
  });
});

describe('Gate: Threshold & Regression', () => {
  it('hochwertige Suite besteht', () => {
    const sc = buildScorecard({
      cases: [
        { id: 'a', verdict: verdict({}) },
        { id: 'b', verdict: verdict({ language_quality: 4 }) },
      ],
    });
    expect(sc.gate.pass).toBe(true);
    expect(sc.overall).toBeGreaterThanOrEqual(3.8);
  });

  it('mittelmäßige Suite fällt unter Threshold durch', () => {
    const sc = buildScorecard({
      cases: [{ id: 'a', verdict: verdict({ fit_evidence: 3, tailoring: 3, story_arc: 3, language_quality: 3, tone_underpromise: 3, honesty: 3 }) }],
    });
    // overall 3.0 < 3.8
    expect(sc.gate.pass).toBe(false);
    expect(sc.gate.reasons.join(' ')).toContain('Mindestwert');
  });

  it('Regression ggü. Baseline schlägt an, auch wenn Threshold erfüllt', () => {
    const sc = buildScorecard({
      cases: [{ id: 'a', verdict: verdict({ language_quality: 4, story_arc: 4, tailoring: 4 }) }],
      baselineOverall: 5.0,
    });
    expect(sc.gate.reasons.join(' ')).toContain('Regression');
    expect(sc.gate.pass).toBe(false);
  });
});

describe('buildJudgeMessages — Profil landet im Ehrlichkeits-Block', () => {
  // Minimaler, typgültiger Content — buildJudgeMessages validiert nicht, serialisiert nur.
  const content: ApplicationContent = {
    language: 'de',
    company: { name: 'MaibornWolff' },
    sections: [],
    media: [],
    proofLinks: [],
    meta: { market: 'dach', noindex: true, showContactDetails: false },
  };

  // Eindeutiger Profil-Marker, der nirgends sonst im Prompt vorkommt.
  const profile: EvalProfile = {
    displayName: 'Wahrheitsanker-9173',
    cvStructured: null,
    contact: { email: 'anker@example.com' },
  };

  it('serialisiert das übergebene Profil in den User-Prompt (Wahrheits-Quelle)', () => {
    const input: JudgeInput = { content, jobText: 'Stelle: KI-Engineer', profile };
    const { messages } = buildJudgeMessages(input);
    const user = messages[0]!.content;

    // Der gesamte Profil-JSON-Block muss eingebettet sein …
    expect(user).toContain(JSON.stringify(profile));
    // … und der eindeutige Profil-Wert auffindbar (Regression gegen verschluckte Übergabe).
    expect(user).toContain('Wahrheitsanker-9173');
    // Der Ehrlichkeits-Rahmen umschließt das Profil.
    expect(user).toContain('Kandidaten-Profil (Wahrheits-Quelle für Ehrlichkeits-Check)');
    expect(user).toContain('<profil>');
  });

  it('lässt den Profil-Block weg, wenn kein Profil übergeben wird', () => {
    const input: JudgeInput = { content, jobText: 'Stelle: KI-Engineer' };
    const { messages } = buildJudgeMessages(input);
    const user = messages[0]!.content;
    expect(user).not.toContain('<profil>');
    expect(user).not.toContain('Wahrheitsanker-9173');
  });
});

describe('extractJson — robust gegen Code-Fences/Prosa', () => {
  it('liest JSON aus ```json-Block', () => {
    const out = extractJson('Hier:\n```json\n{"a":1}\n```\nDanke') as { a: number };
    expect(out.a).toBe(1);
  });
  it('liest nacktes JSON', () => {
    expect((extractJson('{"b":2}') as { b: number }).b).toBe(2);
  });
  it('wirft ohne JSON', () => {
    expect(() => extractJson('kein json hier')).toThrow();
  });
});
