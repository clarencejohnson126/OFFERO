# 0008 — Design-Richtung: zwei Oberflächen, Cockpit „Editorial Premium"

- **Status:** Accepted
- **Datum:** 2026-06-21
- **Kontext:** Vor dem UI-Bau war die visuelle/UX-Grundrichtung festzulegen. Offero hat zwei sehr
  verschiedene Oberflächen mit gegensätzlichen Aufgaben, die nicht gleich aussehen dürfen.
- **Entscheidung:**
  1. **Zwei getrennte Design-Welten:**
     - **App-UI (Cockpit)** — Dashboard/Editor/Billing: zurückhaltend, vertrauenswürdig, effizient.
     - **Generierter Output** — die Bewerbungs-Websites: mutig, pro Firma gebrandet, story-getrieben.
     Das Cockpit tritt bewusst zurück, damit die generierten Vorschauen die Bühne bekommen
     (Constitution Art. II: „underpromise, bescheiden").
  2. **Cockpit-Stil = „Editorial Premium"** (vom Nutzer gewählt): warmer Off-White-Canvas, near-black
     Tinte, EIN selbstbewusster Akzent, Serif-Display-Headlines + klarer Sans. Verworfen: „Clean Tech
     Minimal" (zu generisch) und „Bold Confident" (Output-Brand fürs Cockpit — Risiko prahlerisch).
  3. **Design-Tokens in `packages/ui`** treiben Web (Tailwind/CSS) und später Mobile (RN/NativeWind) —
     eine Quelle der Wahrheit (Mobile-Strategie, Constitution Art. IV.2).
  4. **Customer-Journey & IA** wie in [`docs/design/ui-ux-strategy.md`](../design/ui-ux-strategy.md):
     Landing → Sign-up → Profil/CV → Neue Bewerbung → Generieren („watch it build") → Vorschau →
     Feinschliff/Re-Roll/Medien → Teilen/Export → Radar. Kein Auto-Versand; Radar als ehrlicher Upsell.
- **Konsequenzen:**
  - (+) Klare Trennung: das Cockpit konkurriert nie mit dem Output; die Vorschauen wirken stärker.
  - (+) Tokens sind gesetzt → Screen-Bau kann direkt starten, mobil-fähig.
  - (−) Zwei Design-Sprachen zu pflegen (Cockpit-Tokens + Output-Template-Stil).
- **Umsetzung:** `packages/ui/src/tokens/{colors,typography}.ts` auf Editorial Premium gezogen.
  Komponenten-Bibliothek entsteht mit Screen 1 (Auth+Profil).
