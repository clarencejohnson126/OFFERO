# golden-eval — Qualitäts-/Regressions-Gate für die Produkt-Generierung

> Fabrik-ADW (Pillar 2). Schützt Offeros Kernversprechen: **Qualität schlägt Volumen** und
> **Ehrlichkeit** (Constitution Art. I/II). Verhindert, dass ein Modell- oder Prompt-Wechsel die
> Bewerbungsqualität heimlich senkt.

## Was es tut

Für jede Fixture (Profil + Stellenanzeige):

1. fährt die **echte** `GenerationPipeline` (ANALYZE→PLAN→WRITE→ASSEMBLE),
2. lässt einen **separaten, adversarischen Judge** (Opus) den Content gegen das Rubric bewerten,
3. bildet eine **Scorecard** und **GATEt**: Exit 0 = PASS, 1 = FAIL, 2 = Setup-Fehler.

Die Qualitätsdefinition (Rubric, Judge, Gate) lebt framework-neutral in `@offero/core/eval` —
dieser Ordner ist nur der ausführende Harness (Provider + Fixture-Repo + Runner).

## Rubric (0–5 je Dimension)

| Dimension | Gewicht | kritisch |
|---|---|---|
| `honesty` (keine erfundenen Claims, saubere KI-Zeitleiste) | 3 | **ja — disqualifizierend** |
| `fit_evidence` (Anforderung ↔ echter Beleg) | 2 | nein |
| `tailoring` (auf die Stelle zugeschnitten) | 2 | nein |
| `story_arc` (Bogen wie Goldstandard) | 1.5 | nein |
| `tone_underpromise` (bescheiden) | 1.5 | nein |
| `language_quality` | 1 | nein |

Gate-Defaults (in `core/eval/scorecard.ts` änderbar): `minOverall 3.8`, `honestyFloor 3`,
`regressionTolerance 0.2`. Baseline = letzter **PASS** im `ledger.json`.

## Ausführen

```bash
pnpm install                       # einmalig (zieht tsx + @anthropic-ai/sdk)
ANTHROPIC_API_KEY=sk-… pnpm eval   # alle Fixtures
ANTHROPIC_API_KEY=sk-… pnpm eval -- --only=frontend-acme-2026
```

Artefakte: `out/<timestamp>.json` (vollständige Scorecard, gitignored), `ledger.json`
(Score-Historie + Baseline, committet — keine PII).

## Fixtures

- `fixtures/sample-frontend.json` — **synthetisches** Beispiel (keine PII), committet.
- **Echter Goldstandard** (N10-MaibornWolff u. a.) liegt außerhalb des Repos und enthält PII:
  `~/Desktop/Automated Applications/bewerbungen/` (siehe `docs/factory/workflows.md`). Daraus
  kuratierte Cases als `fixtures/*.private.json` ablegen — die sind per `.gitignore` ausgeschlossen.

Format: `{ "cases": [ EvalCase ] }` (Typ `EvalCase` in `@offero/core/eval`).

## Als Merge-Gate (migrate-model)

Vor jedem Modell-/Prompt-Wechsel laufen lassen; nicht-Null-Exit blockt den Merge. So wird
`migrate-model` (Backlog) abgesichert. CI-Einbau: Schritt `pnpm eval` mit gesetztem Secret.
