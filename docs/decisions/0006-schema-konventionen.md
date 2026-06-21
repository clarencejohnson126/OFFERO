# 0006 — Supabase-Schema-Konventionen (dediziertes `offero`-Schema, RLS, RPCs)

- **Status:** Accepted
- **Datum:** 2026-06-21
- **Kontext:** Das bereitgestellte Supabase-Projekt (EU, vom Nutzer freigegeben, Ref `nlvlwrhayrvberdyjgjx`)
  ist **nicht leer** — im `public`-Schema läuft eine Alt-App **„neatlify"** (u. a. `profiles`, `purchases`,
  `subscriptions`, `businesses`, `transactions`, `mvp_*`), zusätzlich existiert ein `permit_watchdog`-Schema.
  Offero musste **kollisionsfrei und nicht-destruktiv** daneben laufen, ohne neatlify zu berühren.
  Zusätzlich waren die §11-Detailfragen (Enums, User-Init, Idempotenz, öffentlicher Lesepfad, Radar) zu klären.
- **Entscheidung:**
  1. **Eigenes Postgres-Schema `offero`** für ALLE Offero-Objekte (Tabellen ohne Präfix: `offero.profile`,
     `offero.application`, …). Echte Namensraum-Trennung von neatlifys `public`. Alt-App-Objekte werden
     **nicht** angefasst.
  2. **PostgREST additiv erweitert:** `db_schema = public,graphql_public,offero` (über die Management-API).
     neatlifys `public` bleibt erhalten; `offero` wird zusätzlich exponiert. Clients sprechen das Schema über
     `createClient(..., { db: { schema: 'offero' } })` bzw. `.schema('offero')` an.
  3. **Enums als Text + CHECK** (migrationsfreundlich, „offen für Erweiterung").
  4. **Identität:** FKs auf `auth.users(id)`; **kein** globaler `auth.users`-Trigger (würde neatlify berühren).
     Stattdessen lazy, idempotentes `offero.init_user(uuid)` (legt `offero.profile` + `offero.credit_wallet`
     mit balance=1/rerolls=3 an), aufgerufen beim ersten authentifizierten Offero-Request.
  5. **Geld/Credits transaktional & idempotent:** `offero.spend_credits` (`SECURITY DEFINER`, `FOR UPDATE`,
     Re-Roll-Sonderlogik) und `offero.grant_credits`; Doppelbuchungs-Sperre über Unique-Index
     `(user_id, reason, ref_id)` auf `offero.credit_ledger`. Wallet/Ledger sind **nur** über diese RPCs
     schreibbar; RPCs sind **service-role-only**.
  6. **RLS überall an, Default deny.** Auth-Clients sehen nur eigene Zeilen (`user_id = (select auth.uid())`).
     Datenzugriff läuft primär serverseitig via Service-Role; Policies sind Defense-in-Depth.
  7. **Öffentlicher Tenant-Lesepfad** (`/api/v1/public/{slug}`, `*.offero.app`) läuft serverseitig mit
     Service-Role + Status-Filter (`status in ('ready','shared')`) — RLS bleibt scharf, kein `draft`-Leak.
  8. **Recruiter-Radar** serverseitig geloggt (Pixel/Endpoint via Service-Role); `offero.page_view` hat
     **bewusst keine** Client-Policy (RLS-an-ohne-Policy = deny-all). Anzeige nur Pro/Abo.
  9. **Entitlements als Code-Konstante** (`packages/core/src/billing/plan-catalog.ts`), per-User-Zustand in
     `offero.credit_wallet`. Stripe-Price-IDs bleiben die Geld-Wahrheit.
  10. **Migrationen** als versionierte SQL in `infra/supabase/migrations/` (`0001_offero_schema.sql`,
      `0002_offero_storage.sql`), angewandt über die Supabase-MCP. Fix-Forward, keine Historie umschreiben.
- **Konsequenzen:**
  - (+) Echte Trennung von neatlify; nicht-destruktiv; mobil-sicher (Schreibpfade serverseitig, RPCs service-role-only).
  - (+) DB-Typen (`apps/web/src/lib/database.types.ts`) enthalten **nur** das `offero`-Schema (kein Alt-App-Rauschen).
  - (−) Das `offero`-Schema musste additiv in der PostgREST-Config exponiert werden (einmaliger, additiver
    Projekt-Config-Eingriff; neatlifys `public` unberührt).
- **Sicherheitsbefund (nicht Offero):** Alt-App-Tabellen `public.mvp_*` (7) haben **RLS deaktiviert** und sind
  mit dem Anon-Key voll exponiert — dem Nutzer gemeldet, von Offero **nicht** verändert.
- **Verifikation:** RPC-Logik (init/spend/Idempotenz/INSUFFICIENT_CREDITS/Free-Reroll) und RLS (Fremdzugriff +
  Direkt-Schreibzugriff blockiert) gegen die echte DB im `offero`-Schema geprüft — 13/13 PASS end-to-end über
  den echten supabase-js-Client (`apps/web/scripts/verify-schema.mjs`).
- **Offen (🔲, später):** dediziertes eigenes Projekt bei Skalierung; Subscription-„unlimited" im Spend-Pfad (M6);
  Top-up-Persistenz (M4/M6).

> *Hinweis:* Eine erste Variante legte die Tabellen mit `offero_`-Präfix in `public` ab; auf Nutzerwunsch
> (saubere Trennung von neatlify) noch in derselben Session ins dedizierte `offero`-Schema verschoben — vor
> jeder produktiven Nutzung.
