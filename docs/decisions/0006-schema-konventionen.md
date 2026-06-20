# 0006 — Supabase-Schema-Konventionen (geteiltes Projekt, RLS, RPCs)

- **Status:** Accepted
- **Datum:** 2026-06-21
- **Kontext:** Das bereitgestellte Supabase-Projekt (EU, vom Nutzer freigegeben) ist **nicht leer** —
  es enthält bereits das Schema einer Alt-App (Steuer-/Buchhaltung: `profiles`, `purchases`,
  `subscriptions`, `businesses`, `transactions`, `mvp_*` …). Offero musste sauber, kollisionsfrei
  und **nicht-destruktiv** danebengelegt werden. Außerdem waren die Detailfragen aus `v1-spec.md` §11
  (Enums, User-Init, Idempotenz, öffentlicher Lesepfad, Radar) zu entscheiden.
- **Entscheidung:**
  1. **Namensraum per Präfix:** alle Offero-Tabellen/Funktionen heißen `offero_*` im **public**-Schema
     (kein eigenes Postgres-Schema, weil PostgREST standardmäßig nur `public` exponiert und so die
     gelieferten API-Keys ohne Sonder-Konfiguration funktionieren). Alt-App-Objekte werden **nicht**
     angefasst.
  2. **Enums als Text + CHECK** statt Postgres-`ENUM` (migrationsfreundlich, „offen für Erweiterung").
  3. **Identität:** FKs auf `auth.users(id)` (kein eigenes `users`). **Kein** globaler
     `auth.users`-Trigger (würde die Alt-App berühren). Stattdessen **lazy, idempotentes**
     `offero_init_user(uuid)` (legt `offero_profile` + `offero_credit_wallet` mit balance=1/rerolls=3 an),
     aufgerufen beim ersten authentifizierten Offero-Request.
  4. **Geld/Credits transaktional & idempotent:** `offero_spend_credits` (`SECURITY DEFINER`,
     `FOR UPDATE`, Re-Roll-Sonderlogik) und `offero_grant_credits`; Doppelbuchungs-Sperre über
     Unique-Index `(user_id, reason, ref_id)` auf `offero_credit_ledger`. Wallet/Ledger sind
     **nur** über diese RPCs schreibbar; RPCs sind **service-role-only** (Server-Pfad).
  5. **RLS überall an, Default deny.** Auth-Clients sehen nur eigene Zeilen
     (`user_id = (select auth.uid())`). Datenzugriff läuft primär serverseitig via Service-Role;
     Policies sind Defense-in-Depth.
  6. **Öffentlicher Tenant-Lesepfad** (`/api/v1/public/{slug}`, `*.offero.app`) läuft **serverseitig
     mit Service-Role** + explizitem Status-Filter (`status in ('ready','shared')`) — RLS bleibt scharf,
     kein `draft`-Leak.
  7. **Recruiter-Radar** wird **serverseitig** geloggt (Pixel/Endpoint via Service-Role); `offero_page_view`
     hat **bewusst keine** Client-Policy (RLS-an-ohne-Policy = deny-all). Anzeige nur Pro/Abo.
  8. **Entitlements als Code-Konstante** (`packages/core/src/billing/plan-catalog.ts`), nicht als
     DB-Tabelle; per-User-Zustand (`plan`, `balance`) in `offero_credit_wallet`. Stripe-Price-IDs
     bleiben die Geld-Wahrheit.
  9. **Migrationen** als versionierte SQL in `infra/supabase/migrations/` (Quelle der Wahrheit),
     angewandt über die Supabase-MCP. Fix-Forward (neue Migration), keine Historie umschreiben.
- **Konsequenzen:**
  - (+) Sofort lauffähig auf dem geteilten Projekt, keine Kollision, nicht-destruktiv.
  - (+) Mobile-sicher: alle Schreibpfade serverseitig; Funktionen service-role-only.
  - (−) `public`-Schema teilt sich Namensraum mit der Alt-App (mit Präfix entschärft). Ein späterer
    Umzug in ein dediziertes Projekt/Schema ist möglich (Migrationen sind reusable).
  - (−) Generierte DB-Typen (`apps/web/src/lib/database.types.ts`) enthalten auch Alt-App-Tabellen
    (Rauschen, aber harmlos).
- **Sicherheitsbefund (nicht Offero):** Die Alt-App-Tabellen `mvp_*` (7 Stück) haben **RLS deaktiviert**
  und sind mit dem Anon-Key voll les-/schreibbar — dem Nutzer gemeldet, von Offero **nicht** verändert.
- **Verifikation:** RPC-Logik (init/spend/Idempotenz/INSUFFICIENT_CREDITS/Free-Reroll) und RLS
  (Fremdzugriff blockiert, Direkt-Schreibzugriff blockiert) gegen die echte DB geprüft
  (`apps/web/scripts/verify-schema.mjs` + In-DB-Selbsttests).
- **Offen (🔲, später):** dediziertes Projekt/Schema bei Skalierung; Subscription-„unlimited" im
  Spend-Pfad (M6); Top-up-Persistenz (M4/M6).
