# Die Software-Fabrik — ADWs für Offero

Stand: 2026-06-20

> Pillar 2: **Fabrik vor Feature.** Wir bauen das System, das Offero baut. Wiederkehrende Arbeit
> wird zu AI-Developer-Workflows (ADWs = Agenten + Code), nicht zu Einmal-Prompts. Diese Datei
> listet die Fabrik-Workflows — getrennt von der **Produkt**-Pipeline (die der Endnutzer auslöst,
> siehe `../architecture/ai-pipeline.md`).

## Zwei Ebenen nicht verwechseln

| Ebene | Wer löst aus | Beispiel |
|---|---|---|
| **Produkt-Pipeline** | Endnutzer | „Generiere meine Bewerbung für Stelle X" |
| **Fabrik-ADWs** | wir/Entwicklung | „Bau das Feature, teste es, deploye es" |

## Geplante Fabrik-ADWs (Backlog)

1. **`scaffold`** — neues Paket/Modul anlegen (core-Modul, Adapter, Route) nach den
   Schichtenregeln; erzwingt „Logik in core, nicht in Route".
2. **`plan→build→test→review`** — Feature-Workflow: Plan-Prompt → Plan-Review → Implementierung
   → Tests → Code-Review-Agent → PR. Verhindert Direkt-zum-Feature.
3. **`golden-eval`** — Regressions-/Qualitätssicherung der **Produkt**-Generierung: ein Satz
   echter Stellenanzeigen + Goldstandard-Erwartungen; ein Judge-Agent bewertet jede
   Modell-/Prompt-Änderung gegen die Referenzqualität (die Opus-4.8-Bewerbungen). **Kritisch**,
   damit ein Modellwechsel die Qualität nicht heimlich senkt.
4. **`cost-guard`** — misst Token-/Render-Kosten pro Generierung, alarmiert bei Drift gegen
   `unit-economics.md`.
5. **`brand-extract`** — aus einer Firmen-URL Farben/Fonts/Tonalität ziehen (heute manuell via
   browser-harness; als ADW kapseln).
6. **`migrate-model`** — Modell-/Prompt-Migration mit `golden-eval` als Gate.

## Verifier-Prinzip

Qualitätskritische Workflows (Generierung, Modellwechsel) bekommen einen **adversarischen
Verifier/Judge** vor dem Merge/Release. Kein „sieht gut aus" ohne Gegenprüfung gegen den
Goldstandard.

## Goldstandard-Referenz

Die bisher manuell erzeugten Bewerbungs-Websites (N10-Maibornwolff u. a.) sind der Qualitäts-
und Stil-Maßstab. `golden-eval` hält diese Erwartung fest.

**Referenz-Quelle (außerhalb des Repos, enthält PII — nicht committen):**
`~/Desktop/Automated Applications/bewerbungen/` — je Bewerbung `site/index.html` (Story-Website),
`media-spec.json` (Palette + 4 Bild-Prompts), `video-props.json` (Headline/Beats/Brand, 1800f@30fps).
Inputs: `~/Desktop/Automated Applications/{profile.md, job-volltexte/}`. Goldstandard u. a.
`N10-maibornwolff-lead-ai-engineer`, `C1-anthropic-applied-ai-architect`. Für `golden-eval` werden
hieraus kuratierte (anonymisierte) Input/Erwartungs-Paare gezogen, sobald M4 startet.

## Status

- ✅ **`golden-eval` implementiert** (ADR 0010). Engine: `packages/core/src/eval/` (Rubric, Judge,
  Gate). Runner: `scripts/golden-eval/` — Aufruf `ANTHROPIC_API_KEY=… pnpm eval`. Synthetische
  Beispiel-Fixture committet; echter (PII-)Goldstandard wird als `fixtures/*.private.json` eingehängt.
- ⬜ Als Nächstes: **`cost-guard`** (der Runner summiert bereits Kosten/Lauf → Andockpunkt), dann
  `scaffold` und der `plan→build→test→review`-Feature-Workflow.
