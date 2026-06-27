# GTM-Konzept: Institutions-Partnerschaften (Distributions-Moat)

Stand: 2026-06-24 · Status: Konzept (ADR 0012 §3/§7, Task #40) · Quelle der Recherche:
Markt-/Trend-Recherche Juni 2026 („Empfehlungen schlagen Portale", Rezi Enterprise / Kaplan).

> **Warum:** Offene Portale sind geflutet (~11.000 Bewerbungen/Min; Recruiter starten mit
> Empfehlungen, „RARELY" mit Portal-Bewerbern). Eine maßgeschneiderte Website nützt nur, wenn sie
> den Menschen erreicht, der sie liest. **Institutionen sind der empfehlungsreiche, aufwand-
> signalisierende Kanal, der noch funktioniert** — und der durable Vertriebs-Moat, den ein reines
> B2C-Tool nicht hat. Er löst zugleich das **Netzwerk-Defizit** genau unserer Junior-ICP.

## Zielpartner
- **Bootcamps / Coding-Schulen** (Web/Data/AI/Design) — starkes Eigeninteresse, Absolventen schnell
  zu platzieren; messen sich an der Platzierungsquote.
- **Hochschulen / FHs — Career Services**, Studiengänge mit Praxis-/Abschlussphase.
- **Umschulung / Weiterbildung / Outplacement** (auch Arbeitsagentur-/Bildungsgutschein-nah).
- **Quereinsteiger-Programme** (Kreativ/Tech/Marketing — unsere ICP).

## Werteversprechen je Partner
- **Bessere Platzierungsquote** ihrer Absolvent:innen (das KPI, an dem sie gemessen werden).
- **Weniger Betreuungsaufwand:** jede:r Absolvent:in erstellt in Minuten eine zugeschnittene,
  ehrliche Bewerbungs-Website + ATS-saubere Mappe statt stundenlanger 1:1-Bewerbungscoachings.
- **Markensicher & ehrlich:** kein Auto-Versand, keine erfundenen Skills, EU-Daten — ein Tool, das
  der Ruf der Institution riskieren darf (siehe „wasserdicht" unten).
- **Sichtbarkeit:** „Made with Offero" + die Beispiele der Kohorte als sanfter Viral-Loop.

## Lizenz-/Preismodell (🔲 final: Seats vs. Credit-Pool → ADR im GTM-Slice)
- **Credit-Pool** je Kohorte (z. B. 50 Absolvent:innen × N Bewerbungen) als B2B2C-Einmal-/Jahreslizenz,
  **nicht verfallend** im Vertragszeitraum.
- Optional **Seats** (pro aktivem Lernenden) für laufende Programme.
- Pilot: **kostenlose/rabattierte erste Kohorte** gegen Fallstudie + Platzierungs-Daten (füttert den
  Outcome-Daten-Moat, ADR 0012 §7).

## Onboarding
1. Co-gebrandete Landing/Einladung je Partner (Kohorten-Code).
2. Lernende registrieren sich → Credits aus dem Pool → erstellen ihre Website + Mappe.
3. Career-Service-Sicht (später): Übersicht „wer hat schon eine Bewerbung erstellt/geteilt" — **nur
   aggregiert/zustimmungsbasiert**, keine Überwachung.

## Voraussetzung: die App muss „wasserdicht" sein (Gate vor Outreach)
Eine Institution riskiert ihren Ruf nicht mit halbgarer Software. **Wasserdicht = jeden roten Punkt
der Analyse geschlossen** (= die Eintrittskarte):
- Robuste Verarbeitung beliebiger CV-Formate + EN/DE ohne Halluzination (Task #37).
- ATS-saubere PDF/DOCX, die nachweislich parst (Task #34 + Parse-Audit).
- PII-Sicherheit: nicht-erratbare URLs, noindex, Kontakt opt-in (Task #35).
- Ehrliche Ausgabe, keine erfundenen Skills (Constitution + Trust-System, #36).
- Zuverlässigkeit: Generierung bricht nicht, „watch it build" zeigt nie „broken".

## Sequenzierung
**Erst** der Wasserdicht-Kern (Produkt), **dann** Institutions-Outreach (high-touch, langsam, durable).
Reihenfolge bewusst: Kern-Exzellenz vor Vertriebs-Skalierung.

## Erste Schritte (wenn Kern steht)
1. 3–5 Pilot-Partner in DACH ansprechen (1 Bootcamp, 1 Hochschul-Career-Service, 1 Umschulung).
2. Pilot-Kohorte gratis, Fallstudie + Platzierungs-/Outcome-Daten einsammeln.
3. Aus den Pilot-Daten das Standard-Lizenzmodell + die Career-Service-Sicht ableiten.
