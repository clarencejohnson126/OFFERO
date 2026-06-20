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

## Pakete (Arbeitsstand)

| Paket | Preis | Enthalten | Kern-Hook |
|---|---|---|---|
| **Free** | 0 € | 1 Bewerbung (mit dezentem Badge), kein Bild/Video | Einstieg, Akquise |
| **Starter** | **9,99 €** | 5 Bewerbungen · PDF · ∞ Feinschliff · 3 Re-Rolls | bezahlbarer Volumeneinstieg |
| **Plus** | **19,99 €** | 12 · + KI-Bilder · + Firmen-Branding · Premium-Templates | visuelle Aufwertung |
| **Pro** | **39,99 €** | 25 · + 60s-Video · + Custom Domain · + Recruiter-Radar | das volle Erlebnis |
| **Job-Hunt-Abo** | **14,99 €/Mt** | unbegrenzt (Fair Use) · Bilder · Video · Radar — wiederkehrend | Cash-Cow für aktive Jobsuche |

**Top-ups** (Arbeitsstand): +5 Bewerbungen 3,99 € · +1 Video 3,99 € · Custom Domain 9,99 €.

## Premium-Hook: Recruiter-Radar

Cookieless Seitenaufruf-Signal: zeigt dem Bewerber, ob/wann seine Bewerbung geöffnet wurde.
- **Kostet uns ~0 €** (ein Logging-Eintrag pro Aufruf).
- Wird für **alle** geloggt, aber nur **Pro/Abo** angezeigt → eingebauter Upsell: Free/Starter
  sehen „X Aufrufe — in Pro freischalten".

## Offene Preis-Entscheidungen (🔲 für die Besprechung)

- Währung/Märkte zuerst (EUR/DE only vs. international)?
- Genauer Fair-Use-Deckel beim Abo?
- Einführungs-/Pilotpreise zum Launch?
- Mobile: In-App-Käufe (Apple/Google nehmen 15–30 %) vs. Käufe nur über die Web-App lenken?
  → siehe [`../architecture/mobile-strategy.md`](../architecture/mobile-strategy.md).
- Video an Pro/Abo binden bleibt fix, solange der Remotion-Sockel (€92/Mt) nicht gedeckt ist.

## Leitplanken (aus der Constitution)

- Keine Dark Patterns beim Credit-Verbrauch (Art. V.3).
- Feinschliff bleibt gratis & großzügig (Art. I.3).
- Premium-Hooks müssen für uns ~kostenlos sein (Art. I.4).
