# Offero v1 (MVP) — Bau-Spezifikation: die komplette Paket-Leiter

Stand: 2026-06-20 · Status: **Verbindlich für den Bau** · ersetzt den „text-only"-Schnitt
(siehe [ADR 0004](./decisions/0004-mvp-volle-paketleiter.md), löst ADR 0002 ab)

> Diese Spec ist die ausführbare Übersetzung des Fundaments. **Der MVP liefert alle Pakete
> funktionsfähig aus** — Text **und** KI-Bilder **und** Video **und** Custom Domain, Branding,
> Recruiter-Radar, Bezahlung. Die Pakete *sind* das Produkt; sie müssen am Tag 1 etwas verkaufen können.
> Quellen: [`decisions/0001,0003,0004`](./decisions/), [`architecture/overview.md`](./architecture/overview.md),
> [`architecture/ai-pipeline.md`](./architecture/ai-pipeline.md), [`product/pricing.md`](./product/pricing.md),
> [`product/unit-economics.md`](./product/unit-economics.md), [`architecture/data-model.md`](./architecture/data-model.md).

---

## 1. Ziel von v1

**Ein vollständiger Durchstich über die ganze Wertleiter:** echte Stellenanzeige rein →
zugeschnittene Bewerbungs-Website (Multi-Tenant), KI-Bilder, 60s-Video, PDF, Custom Domain,
Recruiter-Radar — gestaffelt nach Paket, käuflich über Stripe, hinter `/api/v1`.

**Warum nicht text-only:** Free/Starter verkaufen Text+PDF, **Plus** verkauft KI-Bilder+Branding,
**Pro** verkauft Video+Custom Domain+Radar, das **Abo** verkauft alles. Ohne die Tools haben die
bezahlten Stufen kein Produkt. Also gehören die Tools in den MVP.

**Launch bleibt kostenfrei:** Video läuft über **FFmpeg-Lite** (€0 Lizenz, kein Minimum). Damit
gehen wir ohne Fixkosten ins Rennen und schauen, ob die App zündet. Ein stärkerer Video-Renderer
(z. B. Remotion-Lambda) ist dank `VideoRenderer`-Port jederzeit als Config-Swap nachrüstbar —
**später, falls es sich lohnt**, kein Thema für jetzt.

**Erfolgskriterium:** Output trifft den **Goldstandard** der manuell erzeugten Referenz-Bewerbungen
(`docs/factory/workflows.md` → `golden-eval`).

---

## 2. In- / Out-of-Scope

| In v1 (MVP) | Nicht in v1 (später) |
|---|---|
| Auth (Supabase, JWT) | Mobile-App (eigener Track, aber API-bereit) |
| Profil (CV-Upload + strukturierte Stammdaten) | Teams/Orgs (B2B-Mandanten) |
| Bewerbung generieren (Text, synchron) | Stärkerer Video-Renderer (Remotion o. ä.) — Port da, später bei Bedarf |
| **KI-Bilder** (Gemini 3 Pro Image) | Mobile-IAP (Port + `provider`-Feld da, Impl später) |
| **Video 60s** (FFmpeg-Lite; stumm, Golden-Era-Musik) | — |
| Feinschliff (gratis) + Re-Roll (3 frei, dann 1 Credit) | |
| Multi-Tenant-Rendering (`*.offero.app`) + **Custom Domains** | |
| PDF-Export (Headless-Chrome) | |
| **Recruiter-Radar** (cookieless, Anzeige nur Pro/Abo) | |
| Credit-Wallet + Ledger + **Paket-Enforcement/Entitlements** | |
| **Stripe-Checkout** (Web) für alle Pakete + Top-ups | |
| UI DE + EN (i18n); **Output** beliebige Sprache (modellgetrieben) | |

**Async-Hinweis:** Video ist langlaufend → eine **leichte Job-Mechanik** ist nötig (Status-Tabelle +
Polling; `Queue`-Port). Schwere Engine-Wahl (Inngest/Trigger.dev) bleibt offen; v1 nutzt
Supabase-Tabelle + Worker/Cron als simpelste Form.

---

## 3. User-Flow v1

```
1. Sign-up / Login            (Supabase Auth) → Free-Tier per Default
2. Profil anlegen             CV hochladen → KI strukturiert (INGEST) → Nutzer korrigiert
3. Paket wählen / kaufen      Free direkt; Starter/Plus/Pro/Abo via Stripe-Checkout
4. Neue Bewerbung             Stellenlink/Volltext + Fokus-Prompt + Ausgabesprache
5. Generieren                 Text-Pipeline synchron (−1 Credit) → Website-Vorschau
6. Tools (paketabhängig)      Plus: KI-Bilder · Pro/Abo: 60s-Video · alle: PDF
                              (Video läuft async mit Fortschritts-Polling)
7. Feinschliff / Re-Roll      gratis-Edits beliebig · Re-Roll 3 frei, dann 1 Credit
8. Teilen / Export            Tenant-Link (+ Custom Domain bei Pro) · PDF · Radar-Signale
                              KEIN automatischer Versand — der Nutzer entscheidet
```

Onboarding ist **profiltyp-agnostisch** (jede Branche/Bewerbung, ADR 0002→0004 breite Zielgruppe).
Feature-Verfügbarkeit pro Schritt richtet sich nach den **Entitlements** des Pakets.

---

## 4. Sektions-Set der generierten Website

Template **stabil & gecacht** (Kostenhebel). Pipeline füllt Daten; datengesteuerte Bausteine nur,
wenn sie passen. Medien erscheinen nur, wenn das Paket sie freischaltet.

**Immer:** `hero` (Name, Pitch, CTA) · `fit` (Anforderungs-Abgleich) · `experience` (priorisiert) ·
`skills` (stellenrelevant) · `education` · `contact`/`footer` (Free: dezentes „made with Offero"-Badge).

**Medien (paketabhängig):**
- `hero_image` / `section_imagery` — **KI-Bilder** (Gemini), ab **Plus**
- `intro_video` — **60s-Video** (FFmpeg-Lite; stumm, Golden-Era-Musik, Outro/CTA ab ~50s,
  Firmen-Branding), ab **Pro/Abo**
- `branding` — Firmen-Farben/Fonts aus ANALYZE angewandt, ab **Plus**

**Datengesteuert (wenn passend):** `roadmap` (Fahrplan) · `collaboration` (freie Mitarbeit/Freelancer) ·
`industry_match` (**Bau-Arbeitgeber: Bauerfahrung hervorheben** — nicht verhandelbar).

Jede Sektion ist ein typisiertes Datenobjekt in `generation_version.content` (jsonb), kein freier
HTML-Blob → mobil wiederverwendbar, schema-validiert. Medien als `media_asset` referenziert.

---

## 5. API-Vertrag `/api/v1` (verbindlich, mobil-sicher)

REST/JSON, JWT im `Authorization`-Header. Route-Handler dünn → `packages/core` (ADR 0003).
Fehler `{ error: { code, message } }`, Standard-HTTP-Codes.

### Auth · Profil
- `POST /api/v1/auth/session` — Login/Refresh-Vertrag (über Supabase Auth)
- `GET|PUT /api/v1/profile` · `POST /api/v1/profile/cv` (upload) · `POST /api/v1/profile/cv/parse` (INGEST)

### Bewerbungen
- `GET|POST /api/v1/applications` · `GET|DELETE /api/v1/applications/{id}`
- `POST /api/v1/applications/{id}/generate` — Text-Generierung (**−1 Credit**), synchron + Job-Handle
- `GET  /api/v1/applications/{id}/status` — Polling (`queued|running|ready|error`), deckt Text **und** Medien
- `POST /api/v1/applications/{id}/reroll` — Re-Roll (**3 gratis, dann −1 Credit**)
- `POST /api/v1/applications/{id}/refine` — Feinschliff (**gratis**)
- `GET  /api/v1/applications/{id}/versions`
- `POST /api/v1/applications/{id}/pdf` — PDF rendern

### Medien (Entitlement-gated)
- `POST /api/v1/applications/{id}/images` — KI-Bilder erzeugen (Gemini) — **Plus+**
- `POST /api/v1/applications/{id}/video` — 60s-Video rendern (FFmpeg-Lite, async) — **Pro/Abo**
- `GET  /api/v1/applications/{id}/media` — Asset-Liste/Status

### Auslieferung
- Wildcard `*.offero.app` → Tenant-Lookup → SSR/ISR aus `generation_version`
- `GET  /api/v1/public/{tenant_slug}` — JSON der veröffentlichten Version (Render + native)
- `POST /api/v1/applications/{id}/domain` — Custom Domain verbinden — **Pro/Abo**
- `GET  /api/v1/applications/{id}/radar` — Recruiter-Radar-Signale (Anzeige **Pro/Abo**; geloggt für alle)

### Billing (echt, mit Checkout)
- `GET  /api/v1/billing/wallet` · `GET /api/v1/billing/ledger` · `GET /api/v1/billing/plans` (Katalog)
- `POST /api/v1/billing/checkout` — Stripe-Checkout-Session (Paket **oder** Top-up)
- `POST /api/v1/billing/webhook` — Stripe-Webhook (Credits/Entitlements gutschreiben)

> **Mobile-Garantie:** jede Aktion als REST-Call abbildbar; nichts hängt an einer Server-Component.
> `provider`-Feld auf Käufen macht Apple/Google-IAP später zu Daten, nicht Umbau.

---

## 6. Generierungs-Pipeline (v1, vollständig)

Aus `ai-pipeline.md` — **inklusive MEDIA**:

| Stufe | v1 | Modell/Engine |
|---|---|---|
| INGEST | CV/Profil + Stelle strukturieren | Haiku 4.5 |
| ANALYZE | Anforderungen, Tonalität, Branding-Hints (Farben/Fonts) | Haiku 4.5 |
| PLAN | Story-Bogen, Sektionsfolge, Fahrplan | Opus 4.8 |
| WRITE | zugeschnittene, ehrliche Copy je Sektion (gecachtes Template) | Opus 4.8 |
| **MEDIA** | Bild-Prompts → **Gemini**; Video-Props → **FFmpeg-Lite** | Haiku→Gemini/FFmpeg |
| ASSEMBLE | Website aus Daten rendern + PDF | Code |
| REFINE | Feinschliff (gratis) / Re-Roll (limitiert) | Opus/Sonnet |

- **Prompt-Caching Pflicht** (Template + System-Prompt + Goldstandard).
- Modell-/Renderer-Wahl **nur** über Ports + Routing-Policy (Config) — keine hartcodierten IDs.
- `VideoRenderer` ist ein Port; MVP-Implementierung ist `FfmpegLiteRenderer` (kostenfrei). Ein
  stärkerer Renderer ließe sich später als zweite Impl einhängen. Video: **stumm, Golden-Era-Musik,
  nie Seedance.**
- **Nicht verhandelbare Constraints in jedem WRITE/REFINE:** ehrlich, KI-Zeitleiste sauber,
  **Rebelz AI nie**, underpromise, kein Auto-Versand, Bau-Match.

---

## 7. Paket- & Credit-Logik (voll funktionsfähig im MVP)

Quelle: `pricing.md`. **Alle Features sind im MVP real**, nicht nur als Flag.

### Aktionsmechanik (im `billing`-Core, transaktional gegen `credit_ledger`)
| Aktion | Verbrauch |
|---|---|
| Generierung | −1 Credit |
| Feinschliff-Edit | 0 (unbegrenzt) |
| Re-Roll | 0 für erste 3 (`free_rerolls_remaining`), danach −1 Credit |

### Pakete (Entitlements-Katalog als Config/Tabelle, **kauf- und nutzbar**)
| Paket | Preis | Credits | Tool-Entitlements |
|---|---|---|---|
| **Free** | 0 € | 1 Bewerbung + Badge | Text, PDF |
| **Starter** | 9,99 € | 5 | Text, PDF, ∞ Feinschliff, 3 Re-Rolls |
| **Plus** | 19,99 € | 12 | + **KI-Bilder**, + **Branding**, Premium-Templates |
| **Pro** | 39,99 € | 25 | + **60s-Video**, + **Custom Domain**, + **Recruiter-Radar** |
| **Job-Hunt-Abo** | 14,99 €/Mt | unbegrenzt (Fair Use) | **alle Tools**, wiederkehrend (`subscription`) |

**Top-ups:** +5 Bewerbungen 3,99 € · +1 Video 3,99 € · Custom Domain 9,99 €.

**Recruiter-Radar:** cookieless, kostet ~0 €, **für alle geloggt**, nur **Pro/Abo** angezeigt →
eingebauter Upsell („X Aufrufe — in Pro freischalten").

**Leitplanken (Constitution Art. V):** keine Dark Patterns, Feinschliff bleibt großzügig gratis,
Stückkosten transparent. **Video bleibt an Pro/Abo gebunden** (Wert + Kostenschutz), Renderer ist
Lite, solange der Remotion-Sockel nicht gedeckt ist.

### Entitlements als Daten, nicht als if-Kaskade
Plan-Katalog mappt `plan → { credits, free_rerolls, features[] }`. Feature-Gates fragen
**Entitlements** ab (`features.includes('video')`), nie den Plan-Namen. Tier-Wechsel = Datenänderung.

---

## 8. Berührte Daten (aus `data-model.md`)

`profile` · `application` · `generation_version` · `media_asset` (**image/video/pdf**, renderer
`gemini|ffmpeg_lite|remotion|headless_pdf`) · `credit_wallet` + `credit_ledger` ·
`purchase`/`subscription` (**Stripe real**, `provider`-Feld für späteres IAP) · `page_view`
(Radar, cookieless, Anzeige Pro/Abo).

RLS pro `user_id`/Tenant. PII in EU. `job_text` möglichst transient.

---

## 9. Akzeptanzkriterien (Definition of Done für v1)

1. Registrierung, Profil mit CV anlegen, CV strukturiert vorgeschlagen.
2. Echte Stellen-URL/-Text → zugeschnittene Website, die den **Goldstandard** trifft.
3. Credits korrekt: Generierung −1, Feinschliff 0, 4. Re-Roll −1 — alles im `credit_ledger`
   nachvollziehbar (transaktional, keine Doppelbuchung).
4. **Plus** erzeugt KI-Bilder; **Pro/Abo** rendert ein 60s-Video (FFmpeg-Lite, stumm, Golden-Era);
   Feature-Gates greifen exakt nach Entitlements.
5. **Stripe-Checkout** funktioniert: Paket-/Top-up-Kauf schreibt Credits/Entitlements über Webhook.
6. Website unter `slug.offero.app` öffentlich; **Custom Domain** (Pro) verbindbar; PDF inhaltsgleich.
7. **Recruiter-Radar** loggt cookieless für alle, zeigt nur Pro/Abo; Free/Starter sehen Upsell.
8. Output in gewählter Sprache, ehrlich, underpromise; **kein** Rebelz-AI-Vorkommen; Bau-Match aktiv
   (golden-eval prüft 6+8).
9. Jede Aktion über `/api/v1` ausführbar (kein Server-Component-Zwang) — Mobile-Checkliste grün.
10. `core` ohne Next/React/`window`; Modell-/Renderer-IDs nur in der Routing-Config; Video läuft
    über den `VideoRenderer`-Port (MVP-Impl FFmpeg-Lite), sodass ein Renderer-Tausch später
    Config-Sache bleibt.

---

## 10. Bau-Reihenfolge (für den Scaffold-Agenten)

1. **Repo + Monorepo:** `git init`; pnpm + Turborepo; `packages/{core,api-client,ui,config}`,
   `apps/web`, `infra/`. Ports in `core`: `AIProvider`, `ImageProvider`, `VideoRenderer`
   (MVP-Impl FFmpeg-Lite), `PaymentProvider` (Stripe), `Repository`, `Storage`, `Queue`.
2. **Supabase (EU)** + Migrationen aus `data-model.md`; RLS; Buckets (cv, photo, image, video, pdf).
3. **Auth + Profil-Slice:** Sign-up/Login, Profil, CV-Upload + `parse` (INGEST).
4. **Text-Generierungs-Slice (Kern):** `generate` mit INGEST→…→ASSEMBLE, gecachtes Template,
   Routing-Policy, `generation_version`, **1 Credit** buchen.
5. **Wallet/Ledger + Refine/Re-Roll** (transaktional, §7).
6. **Billing/Checkout:** Plan-Katalog + Entitlements, Stripe-Checkout + Webhook, Top-ups.
7. **Medien-Slice:** KI-Bilder (Gemini, Plus+) und Video (FFmpeg-Lite, Pro/Abo) **async** über
   Status-Tabelle/Queue-Port; Feature-Gates an Entitlements.
8. **Auslieferung:** Multi-Tenant-Rendering + Custom Domains; Recruiter-Radar (`page_view`).
9. **golden-eval + cost-guard** als erste Fabrik-ADWs (Qualität & Marge schützen).

An jedem Meilenstein: ADRs/Docs aktualisieren, Akzeptanzkriterien §9 prüfen.

---

## 11. Offen (🔲, Umsetzungsdetail — beim Bau entscheiden)

- Feinschliff als eigene Subversion vs. In-Place-Update.
- Job-Mechanik fürs Video: Supabase-Tabelle+Cron/Worker vs. Inngest/Trigger.dev (Engine offen,
  `Queue`-Port fix).
- Rendering-Strategie Tenant-Seiten: SSR vs. ISR vs. statisch + Edge.
- Genauer Fair-Use-Deckel beim Abo; Einführungspreise zum Launch.
- Goldstandard-Inputs/-Outputs für `golden-eval` zusammenstellen.
- Custom-Domain-Mechanik: Vercel-Domain-API vs. Reverse-Proxy.
- Stärkeren Video-Renderer (Remotion o. ä.) evaluieren — **nur falls** die App läuft und es sich lohnt.
