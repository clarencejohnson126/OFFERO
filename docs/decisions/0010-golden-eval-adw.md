# ADR 0010 — golden-eval als erste Fabrik-ADW (Qualitäts-/Regressions-Gate)

Status: akzeptiert · 2026-06-22

## Kontext

Offeros Kernversprechen ist **Qualität schlägt Volumen** und **Ehrlichkeit** (Constitution
Art. I/II). Die Produkt-Generierung hängt an Modellen und Prompts, die sich wöchentlich ändern
(Pillar 3). Ohne automatische Messung senkt ein Modell-/Prompt-/Effort-Wechsel die Qualität
unbemerkt — besonders gefährlich bei Ehrlichkeit (erfundene Claims sind disqualifizierend).
`docs/factory/workflows.md` priorisiert `golden-eval` deshalb als erste Fabrik-ADW.

## Entscheidung

1. **Qualitätsdefinition gehört in `core`.** Rubric, Judge und Gate-Logik leben framework-neutral
   unter `packages/core/src/eval/` (`@offero/core/eval`) — sie sind Domänenwissen, kein Skript-Detail,
   und damit auch für Mobile/CI wiederverwendbar (Pillar 3, mobile-strategy.md).
2. **Adversarischer Verifier.** Ein **separater** Judge-Agent (Opus, über die Routing-Config, keine
   ID im Code) bewertet den generierten Content gegen ein gewichtetes 6-Dimensionen-Rubric. Der
   Generator bewertet sich nie selbst (optimistische Verzerrung).
3. **Ehrlichkeit ist ein Hard-Gate.** `honesty` ist kritisch: Unterschreiten des Floors oder ein
   einziger `honestyViolation` lässt den Case disqualifizieren — nicht nur Punktabzug (Art. II.1).
4. **Gate mit Baseline.** Das Gate prüft absoluten Threshold **und** Regression gegen den letzten
   PASS im `ledger.json`. Exit-Code 0/1/2 → CI- und Merge-Gate-tauglich (`migrate-model`).
5. **Harness getrennt von Engine.** `scripts/golden-eval/` ist nur der Runner (Node-AIProvider ohne
   `server-only`, In-Memory-Fixture-Repo, Orchestrator). Aufruf: `pnpm eval`.
6. **PII-Trennung.** Committet wird nur eine **synthetische** Beispiel-Fixture. Der echte
   Goldstandard (N10-MaibornWolff u. a.) liegt außerhalb des Repos und wird als
   `fixtures/*.private.json` eingehängt (per `.gitignore` ausgeschlossen, Art. III/DSGVO).

## Konsequenzen

- **Positiv:** Modell-/Prompt-Wechsel sind messbar abgesichert; Qualitäts- und Ehrlichkeitsdrift
  wird vor dem Merge sichtbar. Erste echte Fabrik-Schicht steht (Pillar 2).
- **Kosten:** Jeder Lauf kostet echte KI-Tokens (Generierung + Judge). Der Runner summiert die
  Kosten pro Lauf — Vorarbeit für die zweite ADW `cost-guard`.
- **Offen:** Gate-Schwellen (`minOverall 3.8` etc.) sind erste Schätzwerte und werden kalibriert,
  sobald reale Goldstandard-Fixtures eingehängt sind. CI-Integration (`pnpm eval` mit Secret) folgt.

## Alternativen

- *Manuelles Sichten* — verworfen: skaliert nicht, „sieht gut aus" ist kein Gate (Verifier-Prinzip).
- *Eval in apps/web* — verworfen: bräche die Mobile-Wiederverwendbarkeit (Logik muss in `core`).
- *Eigenes Eval-Paket* — vorerst verworfen: Engine in `core` + Runner in `scripts/` ist leichter.
