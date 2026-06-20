# Offero

> **Maßgeschneiderte Bewerbungs-Websites — eine pro Stelle, in Minuten generiert.**
> Aus dem manuellen Bewerbungs-Website-Ablauf wird ein Produkt: Nutzer lädt CV hoch / schreibt
> Prompt + Stellenlink → Offero generiert eine auf die Anzeige zugeschnittene Website
> (+ optional PDF, KI-Bilder, 60-Sekunden-Video).

Arbeitsname: **Offero** (für jetzt). Stand: 2026-06-20.

---

## Was hier liegt

Dieser Ordner ist das **Fundament** des Vorhabens — noch kein Code, sondern die durchdachte
Grundlage, auf der wir die App bauen. Erst Fabrik & Prinzipien, dann Feature (siehe
[`CONSTITUTION.md`](./CONSTITUTION.md)).

```
OFFERO/
├── README.md              ← du bist hier
├── CLAUDE.md              ← Arbeitsanweisung für Claude in diesem Repo (Doktrin, Verweise)
├── CONSTITUTION.md        ← unverrückbare Prinzipien (Produkt · Technik · Recht/Ethik)
├── docs/
│   ├── product/
│   │   ├── vision.md          ← Positionierung, Zielgruppe, Wertversprechen
│   │   ├── pricing.md         ← Preis- & Credit-Modell (Free/Starter/Plus/Pro/Abo)
│   │   └── unit-economics.md  ← Stückkosten, Remotion-Sockel, Margen, Szenarien
│   ├── architecture/
│   │   ├── overview.md        ← Multi-Tenant-Systemüberblick
│   │   ├── tech-stack.md      ← Stack + Begründung (Web zuerst, Mobile-ready)
│   │   ├── data-model.md      ← DB-Schema: Tenants, Generierungen, Credits, Edits
│   │   ├── ai-pipeline.md     ← Modell-Routing (Opus/Sonnet/Haiku) + Generierungs-Pipeline
│   │   └── mobile-strategy.md ← wie die App von Tag 1 mobil-migrierbar bleibt
│   ├── decisions/         ← ADRs (Architecture Decision Records)
│   └── factory/           ← die „Software-Fabrik": ADWs, die das Produkt bauen
├── .claude/
│   ├── skills/            ← projektspezifische Skills (Generierungs-Pipeline etc.)
│   └── agents/            ← domänenspezialisierte Agenten
└── assets/                ← Infografiken, Referenzen
```

## Schnelleinstieg für eine neue Session

1. Lies [`CLAUDE.md`](./CLAUDE.md) — Doktrin & Arbeitsweise in diesem Repo.
2. Lies [`CONSTITUTION.md`](./CONSTITUTION.md) — die nicht verhandelbaren Prinzipien.
3. Lies [`docs/product/vision.md`](./docs/product/vision.md) und
   [`docs/architecture/overview.md`](./docs/architecture/overview.md) für den Stand.
4. Offene Entscheidungen sind in den Docs mit **🔲 TO DECIDE** markiert.

## Status

**Phase 0 — Fundament.** Wir definieren Produkt, Architektur und Prinzipien.
Noch kein Anwendungscode. Nächster Schritt: gemeinsame Besprechung → MVP-Schnitt festlegen.
