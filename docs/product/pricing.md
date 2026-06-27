# Preis- & Credit-Modell

Stand: 2026-06-20 · Status: **Arbeitsstand, im Detail noch zu finalisieren (🔲)**

> Quelle der Margen/Stückkosten: [`unit-economics.md`](./unit-economics.md). Hier stehen die
> Pakete, die Mechanik der Verbrauchseinheiten und die Logik dahinter.

## Grundeinheit: „Generierung", nicht „Website"

Eine **Generierung** = eine frisch erzeugte Bewerbung (Website-Grundgerüst + Text). Das war die
zentrale Korrektur gegenüber dem Ur-Modell („12 € für eine Website" — zu teuer empfunden):
Pakete enthalten **mehrere** Generierungen, und Add-on-Tools (Bilder, Video, Branding) erhöhen
den Wert/Preis stufenweise.

## Drei-Stufen-Aktionsmodell (löst das „gefällt nicht"-Problem)

| Aktion | Kosten für den Nutzer | Warum |
|---|---|---|
| **Generierung** | 1 Credit | Erzeugt eine neue Bewerbung |
| **Feinschliff-Edit** | **gratis, unbegrenzt** | Kleine Änderungen (Text, Reihenfolge, Ton) — der Weg zum „Ja", kostet uns nur einen Mini-Text-Call |
| **Re-Roll** (komplett neu würfeln) | **3 gratis, danach 1 Credit** | Voll neue Variante; limitiert, weil teurer |

So erreicht der Nutzer immer ein Ergebnis, das ihm gefällt, ohne sich „abgezockt" zu fühlen.

> **Free ist die Ausnahme:** eine **One-Shot-Kostprobe** — genau *eine* Generierung, **keine** Feinschliff-Edits
> und **keine** Re-Rolls. Das Drei-Stufen-Modell (gratis Feinschliff, 3 Re-Rolls) gilt **ab Starter**. So
> bleibt Art. I.3 gewahrt (im bezahlten Kontext kosten Edits keine Extra-Credits) und Iteration wird der
> erste, ehrliche Upgrade-Grund (ADR 0009).

## Pakete — Credit-Pakete (Einmalkauf, NICHT verfallend solange das Konto besteht), ADR 0012

> **Abo gestrichen (ADR 0012):** kein wiederkehrendes „Job-Hunt-Abo" mehr. Jobsuche ist schubweise;
> Credit-Pakete passen besser und sind selbst ein milder Retention-Hebel (gespeicherter Wert hält das
> Konto). Klare Einmal-/EUR-Preise, **kein** Auto-Renew, **keine** Wochenpreise (Anti-Dark-Pattern, Art. V.3).

| Paket | Preis (Einmal) | Enthalten | Kern-Hook |
|---|---|---|---|
| **Free** | 0 € | **1 Bewerbung, One-Shot** — kein Feinschliff, kein Re-Roll (dezenter Badge) | Einstieg, Akquise |
| **Starter** | **9,99 €** | 5 Bewerbungen · PDF+DOCX · ∞ Feinschliff · 3 Re-Rolls | bezahlbarer Einstieg |
| **Plus** | **19,99 €** | 12 · + KI-Bilder · + Firmen-Branding · Premium-Templates | visuelle Aufwertung |
| **Pro** | **39,99 €** | 25 · + 60s-Video · + Custom Domain · + transparente View-Analytics | das volle Erlebnis |
| **Institutions-Lizenz** | auf Anfrage | Credit-Pool/Seats für Bootcamps/Hochschulen (B2B2C) | Distributions-Moat |

**Top-ups** (à la carte): +5 Bewerbungen 3,99 € · +1 Video 3,99 € · Custom Domain 9,99 €.
**Credits verfallen nicht**, solange das Konto besteht.

## Premium-Hook: transparente View-Analytics (umbenannt von „Recruiter-Radar", ADR 0012)

Zeigt dem Bewerber **transparent**, ob/wann/wie lange seine Seite angesehen wurde („geöffnet, 40 s,
Sektion Projekte") — Trust statt heimliches Tracking (Recruiter blocken Spy-Tools).
- **Kostet uns ~0 €** (ein Logging-Eintrag pro Aufruf, cookieless, keine IP/UA-Rohdaten).
- Wird für **alle** geloggt, im Detail ab **Pro** angezeigt → eingebauter Upsell. Speist den
  **Outcome-Daten-Moat** (ADR 0012).

## Offene Preis-Entscheidungen (🔲)

- Genaue EUR-Paketpreise final gegen Stückkosten ([`unit-economics.md`](./unit-economics.md)), v. a. Video-Sockel.
- Institutions-Lizenz: Seats vs. Credit-Pool (→ ADR im GTM-Slice, Task #40).
- Einführungs-/Pilotpreise zum Launch?
- Mobile: In-App-Käufe (Apple/Google nehmen 15–30 %) vs. Käufe nur über die Web-App lenken?
  → siehe [`../architecture/mobile-strategy.md`](../architecture/mobile-strategy.md).
- Video an Pro binden bleibt fix, solange der Remotion-Sockel (€92/Mt) nicht gedeckt ist.

## Leitplanken (aus der Constitution)

- Keine Dark Patterns beim Credit-Verbrauch (Art. V.3).
- Feinschliff bleibt gratis & großzügig (Art. I.3).
- Premium-Hooks müssen für uns ~kostenlos sein (Art. I.4).
