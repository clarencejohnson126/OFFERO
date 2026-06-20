# Offero — Arbeitsanweisung für Claude (Repo-Doktrin)

> Diese Datei steuert, wie Claude in **diesem** Repo arbeitet. Sie ergänzt die globale
> `~/.claude/CLAUDE.md` (Five Pillars of Agentic Engineering). Bei Konflikt gewinnt die
> [`CONSTITUTION.md`](./CONSTITUTION.md) dieses Projekts.

Stand: 2026-06-20 · Arbeitsname: **Offero**

---

## 0. Was Offero ist (in einem Satz)

Ein SaaS, der pro Stellenanzeige eine maßgeschneiderte Bewerbungs-Website generiert
(+ optional PDF, KI-Bilder, 60s-Video), verkauft in Paketen/Credits — mit dem Ziel,
**später ohne Bruch als Mobile-App** weiterleben zu können.

## 1. Operating-Doktrin (aus den Five Pillars, auf Offero angewandt)

1. **Fabrik vor Feature.** Wir bauen nicht „die App", wir bauen das System, das die App baut.
   Jede wiederkehrende Arbeit (Generierung, Test, Deploy, Regressionsfix) ist ein
   AI-Developer-Workflow (ADW) in `docs/factory/`, kein Einmal-Prompt.
2. **Extensibel by default.** Modelle, Prompts, Tools, Bild-/Video-Engines ändern sich
   wöchentlich. Alles hinter Adaptern/Plugin-Punkten. **Keine** hartcodierten Modell-IDs,
   keine kaskadierenden if-Ketten, keine monolithische Glue-Logik. Open to extension,
   closed to modification.
3. **API-first — und damit Mobile-ready.** Die gesamte Geschäftslogik lebt hinter einer
   versionierten HTTP/JSON-API und in einem framework-neutralen `core`-Paket. Die Web-UI
   ist nur **ein** Client. Eine spätere React-Native-App ist ein **zweiter** Client gegen
   dieselbe API. Siehe [`docs/architecture/mobile-strategy.md`](./docs/architecture/mobile-strategy.md).
4. **Tokconomics vor Always-on.** Erst Wert pro Token beweisen, dann erst Cron/AFK/24-7.
   Kein Dauerbetrieb, bevor sich der jeweilige Kostensockel (z. B. Remotion $100/Mt) trägt.
5. **Agentic Access, sicher.** Agenten bekommen API/CLI-Zugriff auf alles, was wir sonst
   manuell klicken — **aber nie** destruktiven Produktionszugriff (kein DROP, kein Volume-Nuke,
   kein Force-Push auf main). Siehe Constitution §Technik.

## 2. Wie wir in diesem Repo arbeiten

- **Bevor ein Feature gebaut wird, frage:** Ist die richtige Arbeitseinheit ein
  *Prompt-Template + Workflow* statt einer Code-Änderung? Sollte ein Teil ein
  domänenspezialisierter Agent statt eines generischen Prompts sein?
- **Entscheidungen werden festgehalten** als ADR in `docs/decisions/` (Format: siehe Ordner).
  Architektur-relevante Weichen nie nur im Chat — immer als ADR.
- **Offene Punkte** stehen in den Docs als `🔲 TO DECIDE` und werden in Besprechungen geklärt.
- **Quelle der Wahrheit für Kosten/Preise:** `docs/product/unit-economics.md` und
  `docs/product/pricing.md`. Zahlen nie im Code duplizieren — referenzieren.

## 3. Tech-Leitplanken (Kurzform — Details in `docs/architecture/`)

- **Stack:** Next.js (App Router) auf Vercel · Supabase (Postgres + Storage + Auth, EU-Region)
  · Claude (Text) · Gemini (Bild) · Remotion Lambda (Video) · Stripe (Zahlung).
- **Monorepo** mit `packages/core` (Domänenlogik, Typen, API-Client — framework-neutral),
  `apps/web` (Next.js), später `apps/mobile` (Expo/React Native). Geschäftslogik **nie**
  nur in React-Server-Components verstecken — immer im `core`-Paket, damit Mobile sie teilt.
- **KI-Modelle nur über die Routing-Schicht** (`packages/core/ai`), nie direkt im Feature-Code.
  Standard heute: Opus 4.8 für die Haupt-Generierung (Qualitätsparität), Haiku 4.5 für
  mechanische Sub-Schritte, Sonnet 4.6 als Kostenoption. Siehe `docs/architecture/ai-pipeline.md`.
- **Multi-Tenant:** Wildcard-Subdomains, Seiten aus DB gerendert — **kein** Repo/Deploy pro
  Bewerbung (das war der manuelle Alt-Weg).

## 4. Harte Verbote (siehe Constitution für die volle Liste)

- **Rebelz AI / rebelzai.com NIEMALS** zeigen, verlinken, erwähnen — nirgends.
- **Keine unehrlichen Fähigkeits-Claims** in generierten Bewerbungen (KI-Zeitleiste sauber:
  RAG/MCP/Automatisierung seit 2024, Agentic erst Ende 2025).
- **Kein Auto-Versand** von Bewerbungen ohne Nutzer-Review (Produkt-Default = Mensch bestätigt).
- **Keine Modell-IDs hartcodiert**, kein Provider-Lock ohne Adapter.

## 5. Verweise

| Thema | Datei |
|---|---|
| Unverrückbare Prinzipien | [`CONSTITUTION.md`](./CONSTITUTION.md) |
| Produktvision/Positionierung | [`docs/product/vision.md`](./docs/product/vision.md) |
| Preise & Credits | [`docs/product/pricing.md`](./docs/product/pricing.md) |
| Unit Economics | [`docs/product/unit-economics.md`](./docs/product/unit-economics.md) |
| Architektur | [`docs/architecture/overview.md`](./docs/architecture/overview.md) |
| Mobile-Strategie | [`docs/architecture/mobile-strategy.md`](./docs/architecture/mobile-strategy.md) |
| KI-Pipeline & Modell-Routing | [`docs/architecture/ai-pipeline.md`](./docs/architecture/ai-pipeline.md) |
| Software-Fabrik (ADWs) | [`docs/factory/`](./docs/factory/) |
