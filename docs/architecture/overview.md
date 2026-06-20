# Architektur-Überblick

Stand: 2026-06-20 · Status: Zielbild, im Detail noch zu schärfen (🔲)

## Leitprinzipien (aus Constitution Art. IV)

1. **API-first** — alle Geschäftslogik hinter versionierter HTTP/JSON-API.
2. **Mobile-migrierbar** — Domänenlogik framework-neutral in `packages/core`.
3. **Extensibel** — Modelle/Engines/Zahlung hinter Adaptern, keine hartcodierten IDs.
4. **Multi-Tenant** — Seiten aus Daten gerendert, kein Repo/Deploy pro Bewerbung.

## High-Level-Bild

```
                 ┌──────────────────────────────────────────────┐
   Clients       │  apps/web (Next.js)   apps/mobile (Expo, später)│
                 └───────────────┬──────────────────┬─────────────┘
                                 │  (HTTP/JSON, versioned API)
                 ┌───────────────▼──────────────────▼─────────────┐
   API-Layer     │  Next.js Route Handlers  /api/v1/*  (oder eigener│
                 │  API-Service) — dünn, ruft nur core auf          │
                 └───────────────┬──────────────────────────────────┘
                 ┌───────────────▼──────────────────────────────────┐
   Domänenkern   │  packages/core  (framework-neutral, TypeScript)   │
                 │   ├─ generation/   Bewerbungs-Pipeline-Orchestrierung│
                 │   ├─ ai/           Modell-Routing (Adapter)        │
                 │   ├─ media/        Bild- & Video-Adapter           │
                 │   ├─ billing/      Credits, Pakete, Stripe-Adapter │
                 │   ├─ tenancy/      Subdomain/Tenant-Logik          │
                 │   └─ domain/       Typen, Entities, Validierung    │
                 └───────────────┬──────────────────────────────────┘
                 ┌───────────────▼──────────────────────────────────┐
   Infra/Extern  │ Supabase (Postgres+Storage+Auth, EU) · Claude ·   │
                 │ Gemini · Remotion Lambda · Stripe · Vercel        │
                 └──────────────────────────────────────────────────┘
```

## Render-Pfade für generierte Bewerbungs-Sites

- **Tenant-Seiten** werden **aus der DB gerendert** (Wildcard-Subdomain `*.offero.app` →
  Lookup Tenant/Bewerbung → SSR/ISR). Kein Git-Deploy pro Bewerbung.
- **PDF** ist gleichwertiger First-Class-Output (Headless-Chrome-Render der gleichen Seite).
- **Custom Domains** (Pro) via Vercel-Domain-API oder Reverse-Proxy.

## Schichten-Disziplin (kritisch für Mobile)

- **Route Handler bleiben dünn:** Auth-Check, Input-Validierung, Aufruf an `core`, Antwort.
  Keine Geschäftsregeln im Handler.
- **`core` kennt kein Next.js, kein React, kein `window`.** Reines TypeScript + Ports
  (Interfaces) zu Infrastruktur. Dadurch nutzt die spätere Mobile-App exakt denselben Kern
  über denselben API-Client.
- **`packages/api-client`** (generiert oder handgepflegt) wird von Web **und** Mobile geteilt.

## Asynchrone Jobs

Generierung (Text → Bilder → Video) ist mehrstufig und teils langlaufend (Video).
→ **Job-Queue** (🔲 TO DECIDE: Supabase-Queue / Inngest / Trigger.dev / Vercel-Cron+Tabelle).
Clients pollen Status oder bekommen Realtime-Updates (Supabase Realtime). Wichtig fürs Mobile:
Status muss über die API abfragbar sein, nicht nur via Server-Component-Stream.

## Sicherheit & Mandantentrennung

- **Row Level Security** in Supabase pro Tenant/Nutzer.
- Service-Keys nur serverseitig; Clients nutzen den Anon-Key + RLS.
- KI-/Render-Kosten pro Tenant gemessen (Constitution Art. IV.5).
- Keine destruktiven Automationen in Produktion (Art. IV.4).

## Offene Architektur-Entscheidungen (🔲)

- API: Next.js Route Handlers vs. separater API-Service (tRPC? REST? — REST/JSON ist
  mobil-freundlicher, tRPC bindet an TS-Clients).
- Job-Orchestrierung (s. o.).
- Rendering-Strategie der Tenant-Seiten (SSR vs. ISR vs. statisch + Edge).
