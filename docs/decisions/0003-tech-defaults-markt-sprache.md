# 0003 — Technische Defaults, Markt & Sprache

- **Status:** Accepted
- **Datum:** 2026-06-20
- **Kontext:** Schärfungsrunde nach ADR 0002. Festzulegen waren API-Form, Job-Orchestrierung,
  Zahlungs-Timing, Repo-Start sowie Markt/Sprache und der Umgang mit dem Namen.
- **Entscheidung:**
  1. **API-Form:** REST/JSON unter `/api/v1` als verbindlicher Client-Vertrag (mobil-sicher).
     tRPC höchstens additiv intern, nie als einziger Zugang.
  2. **Job-Orchestrierung:** in v1 **keine** — Text-Generierung läuft synchron/leichtgewichtig
     mit Fortschritts-Polling. Nur ein **Queue-Port** wird vorgesehen; Engine-Wahl erst, wenn
     Video kommt.
  3. **Zahlung:** Stripe (Web) ab Monetarisierungs-Phase; Mobile-IAP später über `PaymentProvider`-
     Port. In v1 (falls noch ohne Bezahlschranke) irrelevant.
  4. **Git-Repo:** dieser Ordner wird beim **Scaffold-Start** ein Repo (jetzt noch reine Doku-Phase).
  5. **Markt/Sprache:** Primäre **UI-Sprachen DE + EN** (sauberer i18n-Layer, kein Hardcoding).
     **Die generierten Bewerbungen sind sprach-agnostisch** — das Modell erzeugt die Website in
     jeder gewünschten Sprache (Parameter, kein separates Übersetzungssystem). Stripe
     mehrwährungsfähig (EUR + USD/GBP nach Bedarf). *(Präzisiert 2026-06-20: Ausgabesprache ist
     modellgetrieben, kein Bau-Constraint — siehe ai-pipeline.md.)*
  6. **Name:** **„Offero" bleibt Arbeitsname.** Domain-/Markenprüfung später, kein Zeitverlust jetzt.
- **Konsequenzen:**
  - (+) Mobil-sicherer, stabiler API-Vertrag von Tag 1.
  - (+) Schlankes v1 ohne Queue-Infrastruktur.
  - (+) DE+EN maximiert Reichweite früh.
  - (−) **i18n ist Pflicht ab v1** (doppelte Copy + QA): UI-Strings **und** generierte
    Bewerbungs-Inhalte müssen in der gewählten Sprache erzeugt werden.
  - (−) Mehrwährungs-Preise/rechtliche Texte (Impressum/AGB/Datenschutz) zweisprachig nötig.
- **Auswirkungen auf Docs:**
  - `tech-stack.md`: i18n-Layer (z. B. `next-intl`) + geteilte Übersetzungs-Tokens in `packages/`.
  - `ai-pipeline.md` / `generate-application`-Skill: **Ausgabesprache = nutzergewählt (DE|EN)**,
    als Constraint in PLAN/WRITE/REFINE.
  - `pricing.md`: Mehrwährung berücksichtigen.
- **Alternativen verworfen:**
  - *DE-only zuerst* → schneller, aber kleinere Reichweite; Nutzer wählte zweisprachig.
  - *EN-first* → Heimvorteil bei Bewerbungs-Tonalität verloren.
  - *Job-Queue schon in v1* → unnötige Komplexität bei kurzer Text-Generierung.
