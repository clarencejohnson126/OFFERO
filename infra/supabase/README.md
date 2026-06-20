# Supabase-Infra (Offero)

Quelle der Wahrheit für das Datenbank-Schema. Konkrete Entscheidungen: [ADR 0006](../../docs/decisions/0006-schema-konventionen.md).

## Projekt

- Ref: `nlvlwrhayrvberdyjgjx` · URL: `https://nlvlwrhayrvberdyjgjx.supabase.co`
- EU-Region (vom Nutzer freigegebenes Dummy-Projekt; teilt sich `public` mit einer Alt-App).
- Offero-Objekte: Präfix **`offero_`** im `public`-Schema. Alt-App-Objekte werden **nicht** angefasst.

## Migrationen (in Reihenfolge, Quelle der Wahrheit)

| Datei | Inhalt |
|---|---|
| `0001_offero_schema.sql` | Tabellen, Indizes, RLS aktiviert |
| `0002_offero_storage.sql` | Buckets (`offero-cv/photo/image/video/pdf`) + Storage-Policies |
| `0003_offero_rls_and_functions.sql` | RLS-Policies + RPCs (`offero_init_user/spend_credits/grant_credits`) |
| `0004_offero_function_grants.sql` | RPCs auf service-role-only härten |
| `0005_offero_fix_spend_credits.sql` | Fix: mehrdeutige Spaltenreferenz in `offero_spend_credits` |

Angewandt über die **Supabase-MCP** (`apply_migration`). Fix-Forward: neue Migration statt Historie umschreiben.
Typen regenerieren: `mcp__supabase__generate_typescript_types` → `apps/web/src/lib/database.types.ts`.

## Agentic Access

- Projekt-gebundener MCP im Repo: [`.mcp.json`](../../.mcp.json) (`supabase-offero`, gepinnt auf das
  Projekt-Ref; PAT via `SUPABASE_ACCESS_TOKEN`-Env, kein Secret in der Datei). Aktiviert sich beim
  nächsten Session-Start.

## ⚠️ Offener Punkt: Runtime-Keys passen (noch) nicht zum Projekt

Die vom Nutzer gelieferten `sb_publishable_-H2rq5z…` / `sb_secret_…` gehören laut Supabase-Fehler
**zu einem anderen Projekt** als `nlvlwrhayrvberdyjgjx` (dessen echter publishable Key ist
`sb_publishable_YBy4q…`). Das Schema liegt in `nlvlwrhayrvberdyjgjx`; die App-`.env.local` braucht
die **zum Schema-Projekt passenden** Keys. Vor M3 (Auth/Profil) klären: entweder dieses Projekt
nutzen (passende Keys liefern) oder das Schema ins Schlüssel-Projekt umziehen (Migrationen erneut anwenden).

## Sicherheitsbefund (Alt-App, nicht Offero)

`get_advisors(security)` meldet u. a. 7 Alt-App-Tabellen mit **deaktiviertem RLS**
(`mvp_business_profile`, `mvp_uploads`, `mvp_conversations`, `mvp_messages`, `mvp_tax_runs`,
`mvp_usage`, `mvp_subscriptions`) — mit dem Anon-Key voll exponiert. Gehört der Alt-App; von Offero
**nicht** verändert. Sollte der Projekt-Eigentümer prüfen.
