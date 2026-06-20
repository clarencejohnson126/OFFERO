---
name: generate-application
description: >
  Erzeugt eine maßgeschneiderte Bewerbungs-Website (Offero-Produkt-Pipeline) aus Profil +
  Stellenanzeige. Use when building, prototyping, or testing the core generation flow.
  Spiegelt die Stufen aus docs/architecture/ai-pipeline.md.
---

# Skill: generate-application

> **Status: Gerüst.** Dieses Skill formalisiert die Produkt-Generierungs-Pipeline für die
> Entwicklung/Prototyping. Es ist die ausführbare Form von `docs/architecture/ai-pipeline.md`.
> Solange es keinen App-Code gibt, dient es als strukturierte Anleitung für manuelle/agentische
> Generierungsläufe.

## Eingaben

- `profile` — strukturierte Bewerber-Stammdaten (CV, Skills, Abschlüsse, Foto, Tool-Stack).
- `job` — Stellenlink **oder** Volltext der Anzeige.
- `prompt` — kurze Nutzer-Intention/Schwerpunkt.
- `language` — Ausgabesprache `de` | `en` (v1 zweisprachig, ADR 0003). Steuert die Sprache der
  kompletten generierten Bewerbung, nicht nur der UI.
- `tier` — bestimmt Modell-Routing & enthaltene Tools (Bilder/Video).

## Stufen (siehe ai-pipeline.md für Modell-Routing)

1. **INGEST** [Haiku] — Profil + Stelle in strukturierte Form bringen.
2. **ANALYZE** [Haiku] — Anforderungen, Tonalität, Branding-Hints der Firma extrahieren.
3. **PLAN** [Opus] — Story-Bogen, Sektionsfolge, **Fahrplan** (erste Tage/Wochen/Monate),
   Abschnitt zu Formen der Zusammenarbeit (freie Mitarbeit/Freelancer) — wo passend.
4. **WRITE** [Opus, gecachtes Template] — zugeschnittene, **ehrliche** Copy je Sektion.
5. **MEDIA** [optional] — Bild-Prompts → Gemini; Video → Remotion-Lambda **oder** FFmpeg-Lite
   (Sockel-Strategie, siehe unit-economics.md).
6. **ASSEMBLE** [Code] — Website aus Daten rendern (+ PDF).
7. **REFINE** — Feinschliff-Edits (gratis) / Re-Roll (limitiert).

## Nicht verhandelbare Constraints (in JEDEM WRITE/REFINE-Call)

- **Ehrlich:** keine falschen Fähigkeits-Claims. KI-Zeitleiste sauber (RAG/MCP/Automatisierung
  seit 2024, Agentic erst Ende 2025).
- **Rebelz AI / rebelzai.com:** niemals erwähnen, zeigen, verlinken.
- **Tonalität:** underpromise, bescheiden, nicht prahlerisch.
- **Kein Auto-Versand:** Output ist Vorschlag; Nutzer bestätigt.
- Bei **bau-/baunahen Arbeitgebern**: Bauerfahrung als Branchen-Match hervorheben (Ausnahme zur
  Default-Knappheit).

## Qualitätsmaßstab

Goldstandard = die manuell erzeugten Referenz-Bewerbungen. Änderungen am Skill/Prompt gegen
`golden-eval` (siehe `docs/factory/workflows.md`) prüfen.

## Offen (🔲)

- Template-/Goldstandard-Dateien hier referenzieren, sobald Code existiert.
- Konkrete Prompt-Bausteine je Stufe versionieren.
