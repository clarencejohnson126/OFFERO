# Offero — Produkt-Flow & Stand (End-to-End)

> Stand: 2026-06-21 · Lebende Übersicht „von Anfang bis Ende". Für Entscheidungen gilt die
> [`CONSTITUTION.md`](../../CONSTITUTION.md); für den verbindlichen Scope `v1-spec.md`.
> Infografik: `concepts/media/flow-infographic.png` (Gemini 3 Pro Image generiert).

## 1. Was ist heute echt gebaut?

| Bereich | Status |
|---|---|
| Monorepo, `packages/core`, API-Skelett `/api/v1` (alle ~22 Endpunkte angelegt), Supabase-Schema (2 Migrationen), Auth | ✅ gebaut |
| Sign-up / Login (Bearer-JWT) · Profil (Stammdaten) · **CV hochladen → KI strukturiert** (INGEST/Haiku) | ✅ funktioniert (verifiziert) |
| `/billing/plans` (Paket-Katalog read-only) | ✅ |
| **Bewerbung generieren** (Job → Website), Feinschliff, Re-Roll | 🚧 Stub (501) |
| KI-Bilder (Gemini) · 60s-Video (FFmpeg-Lite) · PDF | 🚧 Stub |
| Stripe-Checkout · Webhook · Wallet/Ledger · Entitlement-Enforcement | 🚧 Stub |
| Multi-Tenant-Rendering (`slug.offero.app`) · Custom Domain · Recruiter-Radar | 🚧 Stub |

**Kurz:** Fundament + Profil-/CV-Strecke laufen. Das Herzstück (Stellenanzeige → Website) ist
ein typisiertes Gerüst (`packages/core/src/generation/pipeline.ts`); nur INGEST ist real.

## 2. UX-/Workflow-Ablauf

1. **Entdecken** — Landing → Sign-up (erste Bewerbung gratis, keine Kreditkarte).
2. **Profil (einmalig)** ✅ — CV hochladen → KI strukturiert → Nutzer bestätigt. Vertrauensmoment.
3. **Neue Bewerbung** 🚧 — Stellenanzeige (Link/Volltext) + Schwerpunkt + Sprache (DE/EN).
4. **Generieren** 🚧 — KI-Pipeline → 1 zugeschnittene Website. Kostet 1 Credit (`spend_credits`).
5. **Vorschau/Workspace** 🚧 — Feinschliff (in-place `UPDATE` + `edit_log`) oder Re-Roll (neue Version). Free = 1 Erstellung, keine Edits.
6. **Medien** 🚧 — je Paket: KI-Bilder (Gemini), 60s-Video, PDF.
7. **Ausliefern** 🚧 — live unter `slug.offero.app` (aus DB gerendert), optional Custom Domain. Nutzer versendet selbst — **kein Auto-Versand**. Recruiter-Radar zählt Aufrufe (Pro/Abo).
8. **Bezahlen** 🚧 — Pakete/Credits via Stripe; `hasFeature(plan, …)` gatet Features.

## 3. Generierungs-Pipeline (der Motor)

`INGEST [Haiku]` → `ANALYZE [Haiku]` → `PLAN [Opus]` → `WRITE [Opus]` → `MEDIA (Gemini + Video)`
→ `ASSEMBLE` → `REFINE [Opus, on demand]`. Alles hinter Ports (`AIProvider`, `ImageProvider`,
`VideoRenderer`, `PaymentProvider`, `Repository`, `Storage`, `Queue`). 1 Credit pro Generierung.

## 4. Stack

Next.js (Vercel) · Supabase (Postgres + Storage + Auth, EU) · Claude (Text) · Gemini (Bilder) ·
Remotion/FFmpeg-Lite (Video) · Stripe (Zahlung). `core` framework-neutral & mobile-ready.

## 5. Paket-Leiter

Free (1 · Text+PDF) · Starter (5 · +Feinschliff) · Plus (12 · +KI-Bilder/Branding/Templates) ·
Pro (25 · +Video/Domain/Radar) · Abo (unbegrenzt). Quelle der Wahrheit: `product/pricing.md` +
`packages/core/src/billing/plan-catalog.ts`.

## 6. 🔲 Offene Produkt-Entscheidung: Template-Auswahl

Heute: KI generiert **pro Firma gebrandet** (PLAN wählt Sektionsfolge + Palette automatisch); kein
Nutzer-Template-Picker. **Vorschlag:** kuratiertes Theme-Set zum Auswählen (z. B. Ignition /
Dossier / More-Energie / Notion-Clean / Storytelling) mit KI-Vorschlag als Default. Verbindet die
13 Design-Richtungen mit dem Produkt, ohne zu überfordern.

## 7. Was fehlt (Roadmap-Auszug)

**Phase 3 — Produkt-Pipeline (MVP-Kern, als Nächstes):** Text-Generierung end-to-end ·
`applications` CRUD/generate/status · Feinschliff + Re-Roll · Multi-Tenant-Rendering · PDF ·
KI-Bilder · 60s-Video. **Phase 4 — Monetarisierung:** Stripe-Checkout/Webhook/`grant_credits` ·
Wallet/Ledger + Entitlements · Custom Domains · Recruiter-Radar. **Phase 5 — Härtung/Launch:**
`golden-eval` + `cost-guard` ADWs, Tests, Launch.
