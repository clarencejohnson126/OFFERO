# KI-Pipeline & Modell-Routing

Stand: 2026-06-20

> Modelle ändern sich wöchentlich. Deshalb: **niemals Modell-IDs hartcodieren** — alles über
> die Routing-Schicht `packages/core/ai` (Port `AIProvider` + Routing-Policy). Constitution Art. IV.3.

## Qualitäts-Grundsatz

Die Bewerbungs-Websites, deren Qualität als Maßstab gilt, wurden mit **Claude Opus 4.8** erzeugt.
Für Qualitätsparität in Produktion ist Opus 4.8 die Standardwahl für die **Haupt-Generierung**.
Der Aufpreis gegenüber Sonnet ist mit **~€0,08/Generierung** vernachlässigbar (Text ist der
kleinste variable Kostenblock).

## Modell-Routing (Standard-Policy)

| Aufgabe | Modell | Begründung |
|---|---|---|
| **Haupt-Generierung** (zugeschnittene Copy, Struktur, Story, Fit-Abgleich) | **Opus 4.8** (`claude-opus-4-8`) | Qualitätsparität; adaptive thinking, `effort: high` für nuancierte Stellen |
| **Mechanische Sub-Schritte** (Stellenanzeige → strukturierte Anforderungen parsen, Slug, Tags, Metadaten, Radar-Zusammenfassungen) | **Haiku 4.5** (`claude-haiku-4-5`) | billig, schnell, reicht völlig |
| **Kostenoption / Free- & High-Volume-Tier** | **Sonnet 4.6** (`claude-sonnet-4-6`) | Template trägt die Qualität; spart bei Masse |

> Die Policy ist **konfigurierbar pro Tier/Feature**, nicht im Code verdrahtet. Ein Tier-Wechsel
> (z. B. Free → Sonnet, Pro → Opus) ist eine Config-Änderung.

## Der größte Kostenhebel: Prompt-Caching

Das **Template + System-Prompt + Goldstandard** sind über *alle* Nutzer identisch und stabil.
→ Einmal cachen, dann **~0,1× pro Read** (90 % günstiger). Das macht Opus erst richtig billig.
**Pflicht**, nicht Kür. Pro Generierung variiert nur der kleine nutzerspezifische Teil
(Profil + Stellenanzeige).

## Generierungs-Pipeline (mehrstufig)

```
1. INGEST     CV/Profil + Stellenlink + Prompt → strukturieren        [Haiku]
2. ANALYZE    Stellenanzeige → Anforderungen, Tonalität, Branding-Hints [Haiku]
3. PLAN       Story-Bogen + Sektionsfolge + Fahrplan festlegen          [Opus]
4. WRITE      zugeschnittene Copy je Sektion (gecachtes Template)       [Opus]
5. MEDIA      (optional) Bild-Prompts → Gemini; Video-Props → Renderer  [Haiku→Gemini/Remotion]
6. ASSEMBLE   Website aus Daten rendern (+ PDF)                         [Code]
7. REFINE     Feinschliff-Edits (gratis) / Re-Roll (limitiert)          [Opus/Sonnet]
```

Jede Stufe ist ein Schritt in einem **ADW** (siehe `docs/factory/`), kein Monolith-Prompt.
Stufen 1/2/5 sind günstig (Haiku), 3/4 sind die Qualitätsstufen (Opus).

## Adapter-Form (Skizze, framework-neutral)

```ts
// packages/core/ai/provider.ts
export interface AIProvider {
  complete(req: AICompletionRequest): Promise<AICompletionResult>; // streaming-fähig
}
// Routing-Policy wählt Modell pro TaskKind + Tier — KEINE IDs im Feature-Code.
export type TaskKind = 'ingest'|'analyze'|'plan'|'write'|'refine';
export function modelFor(task: TaskKind, tier: Tier): ModelId; // aus Config
```

## Ausgabesprache — modellgetrieben, beliebig

Die **Sprache des generierten Inhalts** ist kein Bau-Constraint, sondern ein **Parameter**:
das Modell erzeugt die komplette Bewerbungs-Website in **jeder** gewünschten Sprache
(folgt der Nutzerwahl bzw. der Sprache der Stellenanzeige). Kein separates Übersetzungs-System
nötig — die Generierung schreibt direkt zielsprachlich. Tonalitäts-/Ehrlichkeits-Constraints
gelten sprachunabhängig.

Die **App-UI** (Editor/Dashboard) braucht dadurch keine aufwändige i18n-Pflicht: DE+EN als
primäre UI-Sprachen genügen, Strings sauber über einen i18n-Layer halten (kein Hardcoding),
aber der generierte Output ist davon entkoppelt und mehrsprachig.

## Verbote (Constitution)

- Keine hartcodierten Modell-IDs außerhalb der Routing-Config.
- Kein Provider-Lock ohne Adapter.
- Generierter Inhalt bleibt ehrlich (KI-Zeitleiste, kein Rebelz AI) — als nicht verhandelbare
  System-Prompt-Constraints in jedem WRITE/REFINE-Call.

## Kosten-Referenz

Claude (pro 1M Tokens): Opus 4.8 $5/$25 · Sonnet 4.6 $3/$15 · Haiku 4.5 $1/$5. Caching-Read ~0,1×.
Stand prüfen vor Launch. Details: [`../product/unit-economics.md`](../product/unit-economics.md).
