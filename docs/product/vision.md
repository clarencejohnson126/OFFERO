# Produktvision & Positionierung

Stand: 2026-06-20

## Problem

Bewerbende konkurrieren mit standardisierten PDFs, die in ATS-Stapeln untergehen. Wer auffallen
will, braucht etwas Maßgeschneidertes — aber eine individuelle Website pro Stelle zu bauen ist
für die meisten zu aufwändig.

## Lösung

**Offero** generiert pro Stellenanzeige eine eigene, auf die Anzeige zugeschnittene
**Bewerbungs-Website**: greift das Branding des Arbeitgebers auf, mappt das Profil des
Bewerbers Punkt für Punkt auf die Anforderungen, erzählt eine Geschichte statt einer Liste —
optional mit KI-Bildern, einem 60-Sekunden-Video und einem PDF-Export als gleichwertigem Output.

**Kernschleife:** CV hochladen / Profil anlegen → Stellenlink + kurzer Prompt → Generierung →
Feinschliff → teilen (eigene Subdomain) oder als PDF exportieren.

## Wertversprechen

- **Auffallen statt einreihen:** eine echte Website schlägt das 200ste PDF.
- **In Minuten, nicht Stunden:** der manuelle Ablauf, der bisher ein Experte pro Bewerbung
  gemacht hat, als Self-Service.
- **Ehrlich & überzeugend:** maßgeschneidertes, wahrheitsgemäßes Framing (siehe Constitution
  Art. II), keine generischen Floskeln.

## Zielgruppe — ENTSCHIEDEN: breit / jede Bewerbung (2026-06-20, ADR 0002)

Offero richtet sich **nicht** an eine einzelne Nische, sondern an **jede Person, die sich auf
eine konkrete Stelle bewirbt** — Freelancer, Fach-/Führungskräfte, Berufseinsteiger.

**Konsequenzen dieser Wahl (bewusst):**
- **Templates & Tonalität müssen allgemeingültig** sein, nicht auf einen Use Case zugeschnitten.
  Die Personalisierung leistet die Generierung pro Stelle/Profil, nicht ein nischiges Grunddesign.
- **Differenzierung kommt über Qualität + Multimodalität** (Website-Story, später Bilder/Video,
  Recruiter-Radar), nicht über eine Nischen-Positionierung.
- **Onboarding muss jeden Profiltyp abholen** (CV-Upload + frei beschreibbares Profil), statt
  Freelancer-spezifische Felder anzunehmen.
- Spezifische Profil-Logik (z. B. Freelancer-Framing, Bau-Branchen-Match) bleibt als
  **optionale, datengesteuerte Bausteine** der Pipeline erhalten — sie werden je nach Profil/Stelle
  zugeschaltet, sind aber nicht die Grundausrichtung.

## Differenzierung

- Nicht „noch ein CV-Builder": Output ist eine **lebendige, gebrandete Website mit Story**,
  nicht ein Template-PDF.
- **Recruiter-Radar** (cookieless Seitenaufruf-Signal) als Premium-Hook — zeigt, ob/wann die
  Bewerbung angeschaut wurde. Kostet uns ~0 €, weckt aber Appetit.
- **Multimodal**: Text + Bild + Video aus einer Pipeline.

## Nordstern-Metrik — ENTSCHIEDEN (ADR 0009)

**Geteilte/exportierte Bewerbungen pro Woche** (echte Nutzung, nicht nur Generierungen). Festgelegt im
Trust-Funnel: [`funnel.md`](./funnel.md) · [ADR 0009](../decisions/0009-trust-funnel.md).

## Was Offero (vorerst) NICHT ist

- Kein Job-Board, kein Scraper von Stellenportalen (AGB-/Sperr-Risiko — bewusst verworfen).
- Kein Auto-Apply-Bot: der Mensch bestätigt immer (Constitution Art. I.2).
