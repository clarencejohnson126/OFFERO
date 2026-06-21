# Offero — Design-, UI/UX- & Flow-Strategie

Stand: 2026-06-21 · Richtungsentscheidung: [ADR 0008](../decisions/0008-design-direction.md)

## 0. Zwei Design-Welten (zentrale Erkenntnis)

| | **App-UI** (Cockpit) | **Generierter Output** (Produkt) |
|---|---|---|
| Job | Werkzeug: ruhig, vertrauenswürdig, effizient | Bühne: gebrandet, story-getrieben, „wow" |
| Ästhetik | **Editorial Premium** — zurückhaltend, der Output ist der Held | **Mutig, pro Firma anders** (N10: Magenta→Blau auf Near-Black) |
| Tech | `packages/ui`-Tokens, Tailwind/CSS, später RN | gecachtes Template, SSR/ISR aus `generation_version` |

Leitsatz (Constitution Art. II — „underpromise, bescheiden"): Das Cockpit ist still, damit die Vorschauen knallen.

## 1. Prinzipien

1. **Die Arbeit ist der Held** — Vorschau bekommt Bühne, Chrome tritt zurück.
2. **Ehrlichkeit sichtbar** — eigene `honest`-Sektion im Output; klare Credits, keine Dark Patterns (Art. V).
3. **Geführt, nicht verspielt** — pro Screen eine Hauptaktion, progressive Disclosure.
4. **Schnell zum „Ja"** — Feinschliff gratis/unbegrenzt prägt den Editor (Art. I.3).
5. **Mobil von Tag 1** — Cockpit-Stile über `packages/ui`-Tokens; generierte Sites bleiben HTML/Webview.

## 2. Customer Journey

```
Landing → Sign-up (Free) → Profil/CV (INGEST, du bestätigst) → Neue Bewerbung
(Link+Fokus+Sprache) → Generieren (−1 Cr., „watch it build") → Vorschau
→ Feinschliff/Re-Roll + Medien (paketabh.) → Teilen (slug.offero.app)/PDF/Domain → Radar
```

Schlüsselmomente: Landing zeigt ein *echtes* Live-Beispiel · Profil = Vertrauensmoment (KI strukturiert,
Nutzer korrigiert) · „Watch it build" macht den Credit gefühlt verdient · kein Auto-Versand · Radar als
ehrlicher Upsell.

## 3. Informationsarchitektur

Dashboard · Profil (CV + `cv_structured`-Editor) · Neue Bewerbung (1-Screen) · Generierungs-/Vorschau-
Workspace (Vorschau + Feinschliff + Re-Roll + Medien + Teilen) · Pakete & Billing · Einstellungen
(Datenexport & harte Löschung, Sprache DE/EN).

## 4. Generierter Output

Stabiles gecachtes Template + datengesteuerte Sektionen (`hero · fit · experience · roadmap ·
collaboration · honest · industry_match · cta`, v1-spec §4 / N10). Brand-adaptiv ab Plus. Story statt
CV-Liste, ehrlich gerahmt. Medien-Slots je Paket. Responsiv.

## 5. Architektur-Anbindung

Design-Tokens in `packages/ui` (Web + später RN) · App-UI = dünner Client gegen `/api/v1` via
`@offero/api-client` · generierte Sites = SSR/ISR aus `generation_version.content` · Komponenten in
`packages/ui` (web-first, RN-fähig).

## 6. Bau-Reihenfolge der UI

(1) Auth + Profil (nutzt den verifizierten M3-Flow: CV-Upload + INGEST-Review) → (2) Dashboard-Shell →
(3) Vorschau-Workspace zusammen mit M4 (Text-Generierung). UI wächst synchron mit den Slices.

## 7. Editorial-Premium-Tokens (Cockpit)

`packages/ui`: warmer Off-White-Canvas (`#f7f5f0`), near-black Tinte (`#0f1115`), ein Akzent (`#0030ff`),
Serif-Display (Fraunces) + Sans (Inter). Details in `packages/ui/src/tokens/`.

## Offen (🔲)

- Konkrete Komponenten-Bibliothek (Buttons/Cards/Inputs) in `packages/ui` aufbauen, sobald Screen 1 startet.
- Visuelle Identität des generierten **Templates** (Default-Stil, bevor Firmen-Branding greift) — beim
  Generierungs-Slice (M4) finalisieren, gegen `golden-eval`.
- „Watch it build" vs. sofortiges Ergebnis (UX-Detail beim Generierungs-Slice).
