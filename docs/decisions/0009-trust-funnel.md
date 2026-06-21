# 0009 — Trust-Funnel: value-first, keine Dark Patterns

- **Status:** Accepted
- **Datum:** 2026-06-21
- **Kontext:** Die Customer Journey (ADR 0008) war implizit trust-orientiert, aber nicht als gemessener
  Funnel mit klarer Aktivierungs-/Nordstern-Metrik ausgewiesen. Ziel des Nutzers: „der Nutzer soll
  Vertrauen fühlen." Frameworks: `onboarding-cro`, `marketing-psychology`.
- **Entscheidung:**
  1. **Expliziter Trust-Funnel** als gesteuertes, dokumentiertes System ([`docs/product/funnel.md`](../product/funnel.md)),
     nicht als Bauchgefühl (Fabrik vor Feature).
  2. **Value-first:** Die erste fertige Bewerbungs-Website ist **gratis** (Free-Tier), *bevor* eine
     Bezahlschranke kommt. Das Produkt-Erlebnis ist die Conversion-Maschine (Demonstration > Behauptung).
  3. **Nordstern-Metrik = geteilte/exportierte Bewerbungen pro Woche** (gelieferter Wert). Aktivierung
     (Aha) = erste fertige Website in der Vorschau.
  4. **Trust-Mechaniken** an jeder Stufe (Reziprozität/Zero-Price, IKEA/Commitment im Profil, Peak-End beim
     „watch it build", Regret-Aversion durch gratis Feinschliff, ehrliche Loss-Aversion via Radar) — alle
     ehrlich, alle aus der Constitution ableitbar.
  5. **Harte Guardrails:** keine Fake-Scarcity, keine Countdown-Timer ohne Grund, keine vorausgewählten
     bezahlten Upsells, kein Confirm-Shaming, keine versteckte Gratis-Option, kein Auto-Versand. Upgrade
     immer **an erlebtem Wert**, nie davor.
  6. **Skills pro Stufe** beim Bau ziehen (`signup-flow-cro`, `onboarding-cro`, `paywall-upgrade-cro`,
     `page-cro`, `email-sequence`, `referral-program`; `marketing-psychology` als Querschnitt).
- **Konsequenzen:**
  - (+) Vertrauen wird zum steuerbaren, messbaren System statt Zufall; passt zur Constitution.
  - (+) Nordstern endlich festgelegt → Funnel-Stufen, Metriken und spätere A/B-Tests haben ein Ziel.
  - (−) Free-Tier verschenkt eine volle (Text-)Website pro Nutzer — bewusst (Akquise ist der Engpass,
    Stückkosten Text ~Cents, Art. I.1).
  - (−) Verzicht auf kurzfristig konvertierende Dark Patterns — bewusst, schützt Marke & Vertrauen.
- **Alternativen verworfen:**
  - *Druck-/CRO-Funnel* (Scarcity, Paywall vor Wert, Confirm-Shaming) → verletzt Art. II/V, zerstört das
    Vertrauen, das Offeros Wertversprechen ist.
- **Auswirkungen:** `vision.md`-Nordstern-🔲 aufgelöst (Verweis auf diese Entscheidung).
