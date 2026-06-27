# Produktvision & Positionierung

Stand: 2026-06-20

## Problem

Bewerbende konkurrieren mit standardisierten PDFs, die in ATS-Stapeln untergehen. Wer auffallen
will, braucht etwas Maßgeschneidertes — aber eine individuelle Website pro Stelle zu bauen ist
für die meisten zu aufwändig.

## Lösung

**Offero** generiert pro Stellenanzeige eine eigene, auf die Anzeige zugeschnittene
**Bewerbungs-Website** (das **Hauptprodukt**): greift das Branding des Arbeitgebers auf, mappt das
Profil des Bewerbers Punkt für Punkt auf die Anforderungen, erzählt eine Geschichte statt einer Liste.
Ein bewusst schlichtes, **ATS-sauberes PDF + DOCX** läuft als **stille Kompatibilitäts-Beilage** daneben
(passiert das Volumen-/Roboter-Tor und treibt den Klick zur Website — es ist *nicht* das Produkt).
Optional: echtes Selbst-Intro-Video/Audio, verifizierbare Beweis-Links, KI-Bilder.

> **Strategiewechsel 2026-06-24 ([ADR 0012](../decisions/0012-strategiewechsel-path-a.md)):** Path A —
> enge, ehrliche Nische statt „jede Bewerbung"; Website-primär; **kein Abo** (Credit-Pakete);
> Trust-System gegen KI-Ablehnung; Moat über Outcome-Daten + Institutions-Distribution + Trust.
> Diese Datei ist nachgezogen; bei Konflikt ist ADR 0012 maßgeblich.

**Kernschleife:** CV hochladen / Profil anlegen → Stellenlink + kurzer Prompt → Generierung →
Feinschliff → teilen (eigene Subdomain) oder als PDF/DOCX exportieren.

## Wertversprechen

- **Auffallen statt einreihen:** eine echte Website schlägt das 200ste PDF.
- **In Minuten, nicht Stunden:** der manuelle Ablauf, der bisher ein Experte pro Bewerbung
  gemacht hat, als Self-Service.
- **Ehrlich & überzeugend:** maßgeschneidertes, wahrheitsgemäßes Framing (siehe Constitution
  Art. II), keine generischen Floskeln.

## Zielgruppe — ENG (2026-06-24, ADR 0012; ersetzt ADR 0002 „breit")

**Primär-ICP:** Bewerber:innen für Rollen, bei denen ein **Hiring Manager einen Tiefen-Read** macht
(Eng, Design, PM, Marketing, Analyst), **Junior-bis-Mid, kreativ/tech-affin** — die Segmente, die eine
persönliche Website *öffnen und schätzen*. **DACH-first** mit echter Lokalisierung (Bewerbungsmappe,
du/Sie, Foto on/off, DIN-5008-nah). **High-Intent-Moment** (wer sich *jetzt* bewirbt), nicht der
Identitätsseiten-Pfleger. Anti-Volume/Spray. Dazu eine **institutionelle B2B2C-Schicht** (Bootcamps,
Hochschulen, Career-Services) als Distributions-Moat.

**Konsequenzen (bewusst):**
- **Templates & Tonalität bleiben flexibel**, aber Default-Ansprache + Beispiele zielen auf die enge
  ICP. Personalisierung leistet die Generierung pro Stelle/Profil.
- **Differenzierung kommt über das Trust-System** (ehrlicher KI-Disclaimer, echtes Selbst-Intro,
  Beweis-Links, grounded „Frag-mich"-Q&A) + **Outcome-/View-Analytics-Moat**, nicht über eine
  Multimodalitäts-Show. Verkauf führt mit der **Website**, nie mit „maßgeschneidertem Anschreiben"
  (in DACH dank StepStone gratis).
- **Onboarding** holt jeden Profiltyp ab (CV-Upload + frei beschreibbares Profil).

## Differenzierung

- Nicht „noch ein CV-Builder": Output ist eine **lebendige, gebrandete Website mit Story**,
  nicht ein Template-PDF.
- **Trust-System** gegen KI-Ablehnung: ehrlicher Integritäts-Badge, echtes Selbst-Intro-Video/Audio,
  **verifizierbare Beweis-Links**, grounded „Frag-mich"-Q&A (nie erfunden).
- **Transparente View-Analytics** (statt heimliches „Recruiter-Radar"): „deine Seite wurde geöffnet,
  40 s angesehen" — Trust statt Tracking, füttert zugleich den Outcome-Daten-Moat.

## Nordstern-Metrik — ENTSCHIEDEN (ADR 0009)

**Geteilte/exportierte Bewerbungen pro Woche** (echte Nutzung, nicht nur Generierungen). Festgelegt im
Trust-Funnel: [`funnel.md`](./funnel.md) · [ADR 0009](../decisions/0009-trust-funnel.md).

## Was Offero (vorerst) NICHT ist

- Kein Job-Board, kein Scraper von Stellenportalen (AGB-/Sperr-Risiko — bewusst verworfen).
- Kein Auto-Apply-Bot: der Mensch bestätigt immer (Constitution Art. I.2).
