# Tech-Stack & Begründung

Stand: 2026-06-20 · „Web zuerst, Mobile-ready by design"

## Monorepo-Layout (Zielbild)

```
offero/                      (eigenes Git-Repo, später)
├── apps/
│   ├── web/                 Next.js (App Router) — der erste Client
│   └── mobile/              Expo / React Native — kommt später, gleiche API
├── packages/
│   ├── core/                Domänenlogik, framework-neutral (KEIN React/Next)
│   ├── api-client/          typisierter Client, von web & mobile geteilt
│   ├── ui/                  geteilte Design-Tokens / plattform-neutrale Primitives
│   └── config/             ESLint/TS/Tailwind-Presets
└── infra/                   IaC, Supabase-Migrationen, Deploy-Skripte
```

**Warum Monorepo:** Web und Mobile teilen `core`, `api-client`, Typen und Design-Tokens —
genau das macht die spätere Mobile-Migration zu „neuer Client", nicht „Neubau".
Tooling-Vorschlag: **pnpm-Workspaces + Turborepo** (🔲 final bestätigen).

## Schichten & Wahl

| Schicht | Wahl | Warum | Austauschbar via |
|---|---|---|---|
| Frontend Web | **Next.js (App Router) auf Vercel** | SSR/ISR für Tenant-Seiten, Edge, schnelles Deploy | — |
| Mobile (später) | **Expo / React Native** | teilt `core` + `api-client`; ein Codebase iOS/Android | — |
| API | **Route Handlers `/api/v1/*` (REST/JSON)** | mobil-freundlich, client-agnostisch | Adapter zu separatem Service |
| Domänenkern | **TypeScript `packages/core`** | framework-neutral, testbar, geteilt | — |
| DB | **Supabase Postgres (EU)** | RLS, Realtime, Auth, Storage in einem; DSGVO | Repository-Ports in `core` |
| Auth | **Supabase Auth (JWT)** | funktioniert Web **und** Mobile via SDK | Adapter |
| Storage | **Supabase Storage (EU)** | CV, Fotos, generierte Assets | Adapter |
| KI-Text | **Claude** (Opus 4.8 default) | Qualitätsparität (siehe ai-pipeline.md) | **AI-Router-Adapter** |
| KI-Bild | **Gemini 3 Pro Image** | bestehende Pipeline | Media-Adapter |
| Video | **Remotion Lambda** / FFmpeg-Lite | datengetriebene Videos; Lite ohne Lizenzsockel | Video-Adapter |
| Zahlung | **Stripe** | Standard, Subscriptions, EU | **Payment-Adapter** (wichtig f. Mobile-IAP) |
| i18n | **next-intl** (Web) + geteilte Übersetzungs-Tokens in `packages/` | v1 zweisprachig DE+EN (ADR 0003); mobil teilbar | — |
| Jobs | in v1 keine; nur Queue-Port (ADR 0003) | langlaufende Render-Jobs erst mit Video | Queue-Port |

## Adapter-Pflicht (Constitution Art. IV.3)

Alles in der Spalte „austauschbar via" wird über ein **Port-Interface** in `core` angesprochen,
nie direkt. Konkret heißt das mindestens:

- `AIProvider` (text) — heute Claude; morgen evtl. mehrere.
- `ImageProvider` — heute Gemini.
- `VideoRenderer` — `RemotionLambdaRenderer` **und** `FfmpegLiteRenderer` als zwei
  Implementierungen desselben Ports (siehe unit-economics: Sockel-Strategie).
- `PaymentProvider` — `StripeProvider` (Web) und später `IapProvider` (Mobile).
- `Repository`/`Storage` — Supabase-Implementierung.

## Warum nicht …

- **Kein Repo/Deploy pro Bewerbung** (alter manueller Weg) — ersetzt durch DB-getriebenes
  Multi-Tenant-Rendering.
- **Keine Logik in React-Server-Components** — bricht Mobile-Wiederverwendung.
- **Kein tRPC als einzige API** — würde nicht-TS-Clients/native Tools erschweren; REST/JSON
  bleibt der mobil-sichere gemeinsame Nenner (tRPC optional zusätzlich für Web-DX).
