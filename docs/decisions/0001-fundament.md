# 0001 — Fundament: Monorepo, API-first, Mobile-ready

- **Status:** Accepted
- **Datum:** 2026-06-20
- **Kontext:** Offero startet als Web-SaaS, muss aber laut Nutzer-Vorgabe später ohne Bruch als
  Mobile-App migrierbar sein. Gleichzeitig gilt die Five-Pillars-Doktrin (Fabrik vor Feature,
  extensibel, API-first).
- **Entscheidung:**
  1. **Monorepo** (pnpm-Workspaces + Turborepo) mit `apps/web`, später `apps/mobile`, und
     geteilten `packages/core | api-client | ui`.
  2. **Domänenlogik framework-neutral in `packages/core`** — kein Next/React/DOM im Kern.
  3. **API-first, REST/JSON unter `/api/v1/*`** als gemeinsamer Vertrag aller Clients.
  4. **Adapter-Ports** für AI, Image, Video, Payment, Storage/Repository — keine hartcodierten
     Provider/Modell-IDs.
  5. **Supabase (EU)** für DB/Auth/Storage; **JWT-Auth** (web- & mobiltauglich).
  6. **Multi-Tenant via Wildcard-Subdomains**, Seiten aus DB gerendert — kein Deploy pro Bewerbung.
- **Konsequenzen:**
  - (+) Mobile-Migration = neuer Client, kein Neubau.
  - (+) Modelle/Engines/Zahlung austauschbar; folgt Constitution Art. IV.
  - (−) Mehr Anfangsdisziplin (Schichtentrennung, kein „schnell in die RSC schreiben").
  - (−) Monorepo-Tooling-Overhead am Anfang.
- **Alternativen verworfen:**
  - *Reine Next.js-App mit Server-Actions* → bricht Mobile-Wiederverwendung.
  - *tRPC als einzige API* → nicht-TS/native Clients erschwert; REST bleibt der mobil-sichere
    gemeinsame Nenner (tRPC höchstens additiv für Web-DX).
  - *Repo/Deploy pro Bewerbung* (alter manueller Weg) → skaliert nicht, ersetzt durch
    DB-Multi-Tenant.
