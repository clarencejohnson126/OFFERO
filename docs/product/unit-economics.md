# Unit Economics

Stand: 2026-06-20 (korrigiert nach Remotion-Preis-Check). Modell, keine Garantie.

> Infografik: [`../../assets/offero-rentabilitaet.html`](../../assets/offero-rentabilitaet.html)
> (+ `.png`). Diese Datei ist die **Quelle der Wahrheit** für die Zahlen; die Infografik
> visualisiert sie.

## Kernaussage

Der größte variable Kostenblock — der KI-Call — kostet nur Cents. Der eigentliche Engpass ist
**Akquise, nicht Stückkosten**. Aber Video bringt einen **fixen Lizenzsockel** mit, der die
Break-even-Logik prägt.

## Variable Stückkosten je Bewerbung (Vollausstattung)

| Posten | Kosten | Anmerkung |
|---|---|---|
| 4 KI-Bilder | €0,20 | Gemini 3 Pro Image |
| KI-Text | €0,15 | Sonnet 4.6 + Prompt-Caching (Opus-Option: +~€0,08, siehe ai-pipeline.md) |
| 60s-Video | €0,15 | **nur** Remotion-Lambda-Compute (vor Launch mit Remotion-Kostenrechner messen) |
| Feinschliff-Puffer | €0,13 | Edits / Re-Rolls |
| PDF-Export | €0,05 | Headless-Chrome-Render |
| Hosting/Storage | €0,02 | Multi-Tenant, marginal |
| **Summe (mit Video)** | **~€0,70** | |
| Website-only (Starter) | ~€0,25 | ohne Bilder/Video |

## Der Remotion-Sockel (wichtig!)

Offero ist ein **prompt-to-video-SaaS** → fällt unter Remotions kommerzielle
**„Automators"-Lizenz**:

- **$0,01 pro Render**, **aber $100/Monat Minimum (~€92)** — deckt 10.000 Renders/Monat.
- Das ist ein **Fixkostensockel, keine variable Stückkost**. Bis 10.000 Videos/Mt kostet jedes
  *zusätzliche* Video €0 Lizenz; darüber €0,0092/Render.
- **Achtung Grenzfall:** Solo (≤3 Personen) evtl. Free-License-eligible — aber kommerzieller
  Automation-SaaS ist Remotions kostenpflichtige Kategorie. **Konservativ mit $100-Sockel
  planen**, vor Launch direkt mit Remotion klären.

### Strategie: Sockel erst aktivieren, wenn er sich trägt (Constitution Art. V.2)

| Phase | Video-Engine | Lizenzkosten |
|---|---|---|
| **Anlauf** | **Lite-Video (FFmpeg):** Ken-Burns über die 4 Bilder + Text + Musik | **€0**, kein Sockel |
| **Schwelle** | ~7 zahlende Video-Kunden/Mt decken die €92 | — |
| **Skalierung** | volles Remotion-Lambda-Video (animiert, datengetrieben, 60s) | €92/Mt, dann €0,0092/Render >10k |

## Fixkosten

| Posten | Anlauf | Skalierung |
|---|---|---|
| Infra (Vercel + Supabase + Domains) | ~€60/Mt | bis ~€350/Mt |
| **Remotion-Lizenz (sobald Video live)** | **+€92/Mt** | +€92/Mt (+Überschreitung) |
| **Summe mit Video** | **~€150/Mt** | |

**Break-even mit Video:** ~7 Pro/Abo-Video-Kunden/Monat.

## Margen je Paket (geblendet ~76 %)

| Paket | Preis | Var. Kosten | DB* | Marge |
|---|---|---|---|---|
| Free | 0 € | €0,30 | — | Akquise |
| Starter | 9,99 € | €2,25 | €7,14 | ~72 % |
| Plus | 19,99 € | €7,40 | €11,69 | ~58 % |
| Pro | 39,99 € | €15,00 | €23,49 | ~59 % |
| Job-Hunt-Abo | 14,99 €/Mt | ~€7,50 | €6,74 | ~45 % |

\* DB = Deckungsbeitrag (Preis − var. Kosten − Stripe-Gebühr ~3 % + €0,30).

## Monats-Szenarien (ARPU €22, COGS ~€4,00/Kunde)

| Szenario | Kunden/Mt | Umsatz | − COGS | − Gebühren | − Fix (inkl. Remotion) | **Gewinn** |
|---|---|---|---|---|---|---|
| Anlauf | 50 | €1.100 | €200 | €48 | €152 | **€700** |
| Basis | 300 | €6.600 | €1.200 | €288 | €212 | **€4.900** |
| Wachstum | 1.500 | €33.000 | €6.000 | €1.440 | €450* | **€25.110** |

\* inkl. leichter Render-Überschreitung über 10k.

## Annahmen & Vorbehalte

- KI-Preise: Claude (Opus 4.8 $5/$25 · Sonnet 4.6 $3/$15 · Haiku 4.5 $1/$5 pro 1M Tokens),
  Stand aktuell — vor Launch live gegenchecken.
- Gemini-/Remotion-Compute geschätzt — **beim Bauen messen**.
- Keine Steuern, kein Marketing-CAC, keine App-Store-Steuer (15–30 % bei Mobile-IAP) enthalten.
