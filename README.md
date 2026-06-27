# Offero

> **Maßgeschneiderte Bewerbungs-Websites — eine pro Stelle, in Minuten generiert.**
> Aus dem manuellen Bewerbungs-Website-Ablauf wird ein Produkt: Nutzer lädt CV hoch / schreibt
> Prompt + Stellenlink → Offero generiert eine auf die Anzeige zugeschnittene Website
> (+ optional PDF, KI-Bilder, 60-Sekunden-Video).

Arbeitsname: **Offero** (für jetzt). Stand: 2026-06-23.

---

## Was hier liegt

Ein **pnpm/turbo-Monorepo** mit einer lauffähigen Next.js-App und framework-neutraler
Domänenlogik im `core`-Paket. Die Doktrin (erst Fabrik & Prinzipien, dann Feature) steht in
[`CONSTITUTION.md`](./CONSTITUTION.md) und [`CLAUDE.md`](./CLAUDE.md).

```
OFFERO/
├── README.md / CLAUDE.md / CONSTITUTION.md / AGENTS.md  ← Doktrin & Arbeitsanweisungen
├── apps/
│   └── web/                ← Next.js (App Router) — UI + versionierte /api/v1-HTTP-API
├── packages/
│   ├── core/               ← framework-neutrale Domänenlogik (kein next/react/DOM)
│   ├── api-client/         ← typisierter HTTP-Client gegen /api/v1 (Web + später Mobile)
│   ├── ui/                 ← geteilte UI-Bausteine
│   └── config/             ← geteilte tsconfig/eslint/prettier-Presets
├── infra/
│   └── supabase/           ← Postgres-Migrations (0001–0004), Storage, config.toml
├── docs/                   ← Produkt, Architektur, ADRs, Software-Fabrik (ADWs)
├── scripts/                ← u. a. golden-eval (`pnpm eval`)
└── .claude/                ← projektspezifische Skills & Agenten
```

> Hinweis: Ordner wie `offero-landing/`, `offero-product/`, `concepts/`, `design-refs/`,
> `direction-mockups/` und `more-nutrition-clone/` sind Prototypen/Design-Referenzen und nicht
> Teil des App-Monorepos.

## Architektur in Kürze

- **`packages/core`** trägt die gesamte Geschäftslogik, framework-neutral und damit Mobile-ready:
  - `ai/` — Modell-Routing (Catalog + Policy + Tasks); **keine** Modell-IDs außerhalb dieser Schicht.
  - `generation/` — Generierungs-Pipeline (Ingest → Steps → Pipeline) mit Fortschritts-Events.
  - `job-extraction/` — Stellenanzeige aus URL/HTML lesen, über eine Adapter-Registry (Browser-Fallback für Cloudflare-Seiten wie Indeed).
  - `domain/` — Entities, Enums, Zod-Schemas (CV, Profil, Content, Templates), Fehler.
  - `services/` — Application- & Profile-Service als Orchestrierung über den Ports.
  - `billing/` — Credit-Service, Entitlements, Plan-Katalog.
  - `media/` — Orchestrierung für KI-Bilder & Video (Ports stehen, Impl. teils noch offen, s. u.).
  - `ports/` — Interfaces für Repository, Storage, Queue, AI-/Image-/Payment-Provider, Video-Renderer.
  - `tenancy/`, `eval/` — Multi-Tenant-Slugs bzw. Golden-Eval-Rubrik/Judge.
- **`apps/web`** ist **ein** Client: UI-Routen (`/`, `/login`, `/signup`, Dashboard/`new`/`profile`
  unter `(app)`, öffentliche Bewerbungsseiten unter `/p/[slug]`) plus die HTTP-API unter
  `/api/v1`. Die Adapter (Supabase-Repository/-Storage, Claude-Provider) liegen in
  `apps/web/src/lib/adapters` und werden in `core` injiziert.
- **`/api/v1`** deckt u. a. ab: Applications (CRUD, `generate`, `generate-stream` per Streaming,
  `refine`, `reroll`, `status`, `domain`, `images`, `media`, `pdf`, `video`, `radar`), Profile/CV,
  Billing (Plans, Wallet, Ledger, Checkout, Webhook), `public/[slug]`, `health`.

## Stand der Bausteine

Wired & lauffähig:
- Monorepo (pnpm + turbo), `core`-Domänenlogik, Ports/Adapter-Schicht.
- Auth, Profil & CV-Upload/-Parsing, Application-Anlage.
- Textgenerierungs-Pipeline inkl. Streaming an die UI; öffentliche `/p/[slug]`-Seiten aus der DB.
- Supabase-Migrations 0001–0004 (Schema, Storage, Template, User-Documents).

In Arbeit / teilweise:
- **Medien:** KI-Bilder & Video — Ports definiert, `MediaService`-Methoden noch `notImplemented`.
- **Billing/Stripe:** Credit-Logik & Plan-Katalog vorhanden; Payment-Provider/Checkout/Webhook
  als Port + Endpunkte angelegt, Stripe-Anbindung noch nicht fertig.
- **PDF / Radar:** Endpunkte vorhanden, Reifegrad variiert.

Offene Architektur-Entscheidungen sind in den Docs mit **🔲 TO DECIDE** markiert.

## Lokal entwickeln

Voraussetzungen: Node ≥ 20.9 (siehe `.nvmrc`), `pnpm@9` (`packageManager`-Feld), Supabase-Projekt.

```bash
pnpm install
cp .env.example .env.local   # Supabase-, Anthropic- u. a. Keys eintragen
pnpm dev                     # turbo run dev — startet apps/web (Next.js)
```

Weitere Skripte (Root `package.json`): `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`,
`pnpm format`, sowie `pnpm eval` (Golden-Eval in `scripts/golden-eval`).

Supabase-Schema: Migrations liegen in `infra/supabase/migrations/`; Details in
[`infra/supabase/README.md`](./infra/supabase/README.md).

## Schnelleinstieg für eine neue Session

1. [`CLAUDE.md`](./CLAUDE.md) — Doktrin & Arbeitsweise in diesem Repo.
2. [`CONSTITUTION.md`](./CONSTITUTION.md) — die nicht verhandelbaren Prinzipien.
3. [`docs/product/vision.md`](./docs/product/vision.md) und
   [`docs/architecture/overview.md`](./docs/architecture/overview.md) für Produkt & Architektur.
4. [`docs/architecture/ai-pipeline.md`](./docs/architecture/ai-pipeline.md) für Modell-Routing
   und die Generierungs-Pipeline.
