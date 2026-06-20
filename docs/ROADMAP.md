# Roadmap & offene Entscheidungen

Stand: 2026-06-20 · dient als **Agenda** für unsere Fundament-Besprechung.

## Phasen

- **Phase 0 — Fundament (jetzt):** Produkt, Architektur, Prinzipien dokumentiert. ✅
- **Phase 1 — MVP-Schnitt festlegen:** ✅ entschieden — **MVP = volle Paket-Leiter** (ADR 0004),
  konkretisiert in [`v1-spec.md`](./v1-spec.md).
- **Phase 2 — Scaffold:** Monorepo, `core`, API-Skelett `/api/v1`, Supabase-Schema, Auth.
- **Phase 3 — Produkt-Pipeline (MVP-Kern):** Text-Generierung end-to-end + Feinschliff/Re-Roll +
  Multi-Tenant-Rendering + PDF + **KI-Bilder (Gemini)** + **60s-Video (FFmpeg-Lite)**.
- **Phase 4 — Monetarisierung (Teil des MVP):** Stripe-Checkout, Pakete/Credits/Entitlements,
  Custom Domains, Recruiter-Radar.
- **Phase 5 — Härtung & Launch.** Danach (nur falls die App läuft): stärkerer Video-Renderer und
  Mobile-Migration als eigene Tracks.

> Hinweis (ADR 0004): die frühere Phasen-3/4-Trennung (Text zuerst, Tools später) ist aufgehoben —
> **Bilder, Video und Bezahlung gehören in den MVP**. Video läuft kostenfrei via FFmpeg-Lite; wir
> gehen damit ins Rennen und sehen erst, ob die App ein Hit wird, bevor wir in stärkere Renderer investieren.

## Entscheidungen

**Erledigt (ADR 0001/0002/0003):**
- ✅ **Fundament:** Monorepo, API-first REST/JSON, Mobile-ready, Adapter-Ports, Supabase EU.
- ✅ **MVP-Schnitt:** ~~Text-only zuerst~~ → **volle Paket-Leiter im MVP** (Text, Bilder, Video,
  Bezahlung); sockelfrei via FFmpeg-Lite-Video (ADR 0004 löst 0002-MVP-Schnitt ab).
- ✅ **Zielgruppe:** breit / jede Bewerbung.
- ✅ **API-Form:** REST `/api/v1` als Vertrag; tRPC höchstens additiv.
- ✅ **Job-Orchestrierung:** in v1 keine; nur Queue-Port vorsehen.
- ✅ **Mobile-Zahlung:** später über `PaymentProvider`-Port.
- ✅ **Markt/Sprache:** v1 zweisprachig DE + EN (i18n ab Tag 1, Stripe mehrwährungsfähig).
- ✅ **Name:** „Offero" bleibt Arbeitsname; Verfügbarkeitsprüfung später.
- ✅ **Git-Repo:** wird beim Scaffold-Start angelegt.

**Damit ist die Fundament-Entscheidungsphase abgeschlossen.** Nächste offene Punkte sind
Umsetzungs-Detailfragen (s. u.), keine Grundsatzweichen mehr.

## Offen für Phase 1/2 (Umsetzungsdetail)

- ✅ **v1-Feature-Liste festgelegt** in [`v1-spec.md`](./v1-spec.md) (Scope, User-Flow, Sektions-Set,
  `/api/v1`-Vertrag, Paket-/Credit-Enforcement, Akzeptanzkriterien, Bau-Reihenfolge).
- Goldstandard-Inputs/-Outputs für `golden-eval` zusammenstellen.
- Supabase-Projekt (EU) + Schema-Migrationen aus `data-model.md`.
- Remotion-Lizenz-Grenzfall klären (erst relevant ab Video-Phase).

## Sofort sinnvoll, sobald wir starten

- `golden-eval` + `cost-guard` als erste Fabrik-ADWs (schützen Qualität & Marge).
- Remotion-Lizenz-Grenzfall mit Remotion klären (Free-eligibility solo vs. Automator-Pflicht).
- Live-Check der KI-/Gemini-/Remotion-Preise.
