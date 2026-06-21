# Supabase-Infra (Offero)

Quelle der Wahrheit für das Datenbank-Schema. Entscheidungen: [ADR 0006](../../docs/decisions/0006-schema-konventionen.md).

## Projekt

- Ref: `nlvlwrhayrvberdyjgjx` · URL: `https://nlvlwrhayrvberdyjgjx.supabase.co`
- EU-Region (vom Nutzer freigegebenes Dummy-Projekt). Teilt sich die DB mit Alt-Apps
  (**neatlify** im `public`-Schema, `permit_watchdog`-Schema).
- **Offero liegt in einem eigenen Schema `offero`** (Tabellen ohne Präfix). Alt-Apps werden **nicht** angefasst.
- PostgREST exponiert `public,graphql_public,offero` (additiv erweitert; neatlifys `public` unberührt).
  Clients sprechen Offero über `createClient(..., { db: { schema: 'offero' } })` an.

## Migrationen (Quelle der Wahrheit)

| Datei | Inhalt |
|---|---|
| `0001_offero_schema.sql` | Schema `offero`, alle Tabellen, Indizes, RLS-Policies, RPCs (`init_user`/`spend_credits`/`grant_credits`), Grants |
| `0002_offero_storage.sql` | Buckets (`offero-cv/photo/image/video/pdf`) + Storage-Policies |

Angewandt über die **Supabase-MCP** (`apply_migration`). Fix-Forward: neue Migration statt Historie umschreiben.
Typen (nur `offero`-Schema): `GET /v1/projects/{ref}/types/typescript?included_schemas=offero` → `apps/web/src/lib/database.types.ts`.

## Verifikation

`apps/web/scripts/verify-schema.mjs` (Lauf: `node --env-file=apps/web/.env.local apps/web/scripts/verify-schema.mjs`)
— legt Test-User an, prüft init/spend/Idempotenz/INSUFFICIENT_CREDITS/Free-Reroll + RLS, räumt auf. 13/13 PASS.

## Agentic Access

Projekt-gebundener MCP im Repo: [`.mcp.json`](../../.mcp.json) (`supabase-offero`, gepinnt auf das Projekt-Ref;
PAT via `SUPABASE_ACCESS_TOKEN`-Env, kein Secret in der Datei). Aktiviert sich beim nächsten Session-Start.

## Sicherheitsbefund (Alt-App, nicht Offero)

`get_advisors(security)` meldet 7 Alt-App-Tabellen mit **deaktiviertem RLS** (`public.mvp_business_profile`,
`mvp_uploads`, `mvp_conversations`, `mvp_messages`, `mvp_tax_runs`, `mvp_usage`, `mvp_subscriptions`) — mit dem
Anon-Key voll exponiert. Gehört der Alt-App (neatlify); von Offero **nicht** verändert. Sollte der Eigentümer prüfen.
Offero selbst ist sauber (nur `offero.page_view` „RLS an, ohne Policy" — gewollt: Radar serverseitig).
