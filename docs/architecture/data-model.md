# Datenmodell (Entwurf)

Stand: 2026-06-20 · Status: Entwurf (🔲 vor Implementierung finalisieren)

> Postgres (Supabase, EU) mit Row Level Security pro Nutzer/Tenant. Hier das konzeptionelle
> Modell; konkrete Migrationen kommen später in `infra/`.

## Entitäten (Überblick)

```
user ──1:N── application ──1:N── generation_version
  │              │                      └── media_asset (N)
  │              └── page_view (Recruiter-Radar)
  │
  ├──1:1── profile (CV-Daten, Foto, Tool-Stack)
  ├──1:1── credit_wallet
  └──1:N── purchase / subscription
```

## Tabellen (Kernfelder)

### `profile` — wiederverwendbare Bewerber-Stammdaten
- `user_id` (FK), `display_name`, `contact` (jsonb), `cv_raw` (Storage-Ref),
  `cv_structured` (jsonb: Stationen, Skills, Abschlüsse), `photo` (Storage-Ref),
  `tool_stack` (jsonb), `languages` (jsonb).

### `application` — eine Bewerbung = eine Stelle
- `id`, `user_id`, `tenant_slug` (Subdomain), `job_url`, `job_text` (transient/optional),
  `company` (jsonb: Name, Branding-Farben, Fonts), `status`
  (`draft|generating|ready|shared|archived`), `current_version_id`, `custom_domain` (nullable),
  `created_at`.

### `generation_version` — jede Generierung/Re-Roll ist eine Version
- `id`, `application_id`, `kind` (`generation|re_roll`), `content` (jsonb: Sektionen/Copy),
  `model_used`, `cost_cents`, `created_at`. **Feinschliff = in-place Update der aktuellen Version +
  leichter `edit_log`-Audit-Eintrag** ([ADR 0005](../decisions/0005-feinschliff-datenmodell.md)); Re-Roll = neue Version.

### `media_asset` — Bilder & Videos je Version
- `id`, `version_id`, `type` (`image|video|pdf`), `storage_ref`, `renderer`
  (`gemini|remotion|ffmpeg_lite|headless_pdf`), `cost_cents`, `meta` (jsonb).

### `credit_wallet` + `credit_ledger` — Verbrauchseinheiten
- Wallet: `user_id`, `balance`, `free_rerolls_remaining`.
- Ledger (Audit): `user_id`, `delta`, `reason`
  (`purchase|generation|re_roll|subscription_grant|refund`), `ref_id`, `created_at`.
- **Mechanik (siehe pricing.md):** Generierung −1 Credit · Feinschliff 0 · Re-Roll 0 bis 3,
  danach −1.

### `purchase` / `subscription` — Stripe (Web) / IAP (Mobile später)
- `provider` (`stripe|apple_iap|google_iap`), `external_id`, `product`, `amount_cents`,
  `status`, `period_end` (bei Abo). **Provider-Feld** macht den späteren IAP-Pfad zu Daten,
  nicht Umbau.

### `page_view` — Recruiter-Radar (cookieless)
- `application_id`, `ts`, `coarse_signal` (jsonb: grobe Region/Gerätetyp, **keine** PII,
  cookieless). Anzeige nur für Pro/Abo, geloggt für alle (Upsell).

## Datenschutz (Constitution Art. III)

- PII (`profile`, `photo`, `contact`) in EU-Region; Export & harte Löschung pro `user_id`.
- `job_text` möglichst transient (nur für die Generierung), nicht dauerhaft horten.
- `page_view` strikt cookieless & ohne personenbezogene Identifikatoren.

## Mobile-Relevanz

- Alle Tabellen sind über die API erreichbar; **kein** Feld setzt einen Web-Client voraus.
- `provider`-Feld auf Käufen ist der Haken für Apple/Google-IAP ohne Schema-Bruch.

## Umsetzungsstand (M2)

Implementiert als versionierte Migrationen in `infra/supabase/migrations/` mit Präfix **`offero_`**
im `public`-Schema (geteiltes Projekt, [ADR 0006](../decisions/0006-schema-konventionen.md)). RLS aktiv,
Credit-Logik als idempotente RPCs (`offero_spend_credits`/`offero_grant_credits`), User-Init lazy via
`offero_init_user`. Gegen die echte DB verifiziert.

## Offene Punkte (🔲)

- ~~Feinschliff als eigene Subversion vs. In-Place-Update?~~ → entschieden (ADR 0005: in-place + Edit-Log).
- Aufbewahrungsfristen je Tabelle.
- Mandanten-Modell: rein nutzerbasiert (B2C) — oder später Teams/Orgs (B2B)?
