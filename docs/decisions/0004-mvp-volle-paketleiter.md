# 0004 — MVP = volle Paket-Leiter (löst ADR 0002 ab)

- **Status:** Accepted
- **Datum:** 2026-06-20
- **Löst ab:** [ADR 0002](./0002-mvp-scope-und-zielgruppe.md) (dort: „MVP = text-only Durchstich").
  Die Zielgruppen-Entscheidung aus 0002 (breit / jede Bewerbung) **bleibt gültig**.
- **Kontext:** ADR 0002 hatte den MVP auf Text+PDF beschränkt und Bilder/Video/Bezahlung auf Phase 4
  verschoben. Das widerspricht dem Produkt: die **Pakete sind das Produkt**. Plus verkauft KI-Bilder,
  Pro verkauft Video + Custom Domain + Radar, das Abo verkauft alle Tools. Ohne diese Tools haben die
  bezahlten Stufen am Tag 1 nichts zu verkaufen — der MVP könnte nicht monetarisieren und das
  Wertversprechen der Leiter wäre nicht testbar.
- **Entscheidung:** Der **MVP liefert die komplette Paket-Leiter funktionsfähig** aus:
  1. **Text + PDF** (Free/Starter), **KI-Bilder + Branding** (Plus), **60s-Video + Custom Domain +
     Recruiter-Radar** (Pro), **alle Tools** (Abo) — alles real, nicht nur als Flag.
  2. **Stripe-Checkout** ist Teil des MVP (Pakete + Top-ups kauf- und nutzbar).
  3. **Video startet sockelfrei** über den `FfmpegLiteRenderer`. `RemotionLambdaRenderer` ist die
     zweite Implementierung desselben `VideoRenderer`-Ports und wird **erst per Config aktiviert,
     wenn der €92/Mt-Sockel gedeckt ist** (~7 Video-Kunden). → Constitution Art. V eingehalten:
     Kostensockel erst anschalten, wenn er sich trägt.
  4. **Video bleibt an Pro/Abo gebunden** (Wert- und Kostenschutz), unabhängig vom Renderer.
  5. Eine **leichte Job-Mechanik** (Status-Tabelle + Polling, `Queue`-Port) kommt in v1, weil Video
     langlaufend ist. Schwere Engine-Wahl (Inngest/Trigger.dev) bleibt offen (war in 0003 vertagt).
- **Konsequenzen:**
  - (+) Der MVP kann ab Tag 1 monetarisieren und das volle Wertversprechen testen.
  - (+) Sockelfrei dank Lite-Video; Marge bleibt geschützt; Remotion ist ein reiner Config-Swap.
  - (+) `media_asset`, `purchase/subscription`, `page_view` werden früh echt genutzt (kein Toter-Code).
  - (−) Größerer MVP-Umfang als der text-only-Schnitt: Medien-Slice, Stripe, leichte Job-Mechanik,
    Custom Domains kommen vor.
  - (−) Gemini-Bildkosten (~€0,20/Generierung) fallen schon im MVP variabel an (kein Sockel, ok).
- **Auswirkungen auf Docs:**
  - [`v1-spec.md`](../v1-spec.md): vollständig auf die volle Paket-Leiter umgeschrieben (Scope,
    User-Flow, Sektions-Set inkl. Medien, `/api/v1` inkl. Medien/Checkout/Domain/Radar, Pipeline mit
    MEDIA, Akzeptanzkriterien, Bau-Reihenfolge).
  - [`ROADMAP.md`](../ROADMAP.md): Phasen 3/4 fallen in den MVP zusammen; Mobile bleibt eigener Track.
  - `ai-pipeline.md` / `generate-application`-Skill: MEDIA-Stufe ist im MVP aktiv.
- **Alternativen verworfen:**
  - *Text-only zuerst (ADR 0002)* → schnellerer erster Durchstich, aber bezahlte Pakete ohne Produkt;
    Nutzer-Entscheidung dagegen.
  - *Remotion-Lambda ab Tag 1* → €92/Mt Fixsockel vom Launch an, verletzt Art. V ohne Deckung.
  - *Video weglassen, nur Bilder* → Pro/Abo verlieren ihren Kern-Hook.
