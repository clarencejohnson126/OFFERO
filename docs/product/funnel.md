# Offero — Trust-Funnel

Stand: 2026-06-21 · Entscheidung: [ADR 0009](../decisions/0009-trust-funnel.md) · Design: [ADR 0008](../decisions/0008-design-direction.md)

> **These: Value-first, nicht Druck-first.** Offeros Conversion-Maschine ist das Produkt selbst — der
> Nutzer bekommt **eine echte, fertige Bewerbungs-Website gratis**, *bevor* er zahlt. Vertrauen entsteht
> durch **Demonstration statt Behauptung**, **Kontrolle** und **Transparenz** — nie durch Dark Patterns
> (Constitution Art. II/V). Skills genutzt: `onboarding-cro`, `marketing-psychology`.

## 1. Nordstern & Aktivierung

- **Nordstern-Metrik:** **geteilte/exportierte Bewerbungen pro Woche** (Tenant-Link geteilt **oder** PDF
  exportiert). Das misst *gelieferten Wert*, nicht bloße Generierungen. (Löst den 🔲 in `vision.md`.)
- **Aha-Moment (Aktivierung):** Der Nutzer sieht seine **erste fertige, zugeschnittene Website** in der
  Vorschau — der „magische" Moment. Frühster Retention-Indikator.
- **Aktivierungs-Event (messbar):** erste `generation_version` mit `status=ready`, die der Nutzer öffnet.
- **Wert-Event (Nordstern):** erstes Teilen/Exportieren dieser Bewerbung.

## 2. Die Funnel-Stufen (Trust-Mechanik je Stufe)

| # | Stufe | Ziel | Trust-Mechanik (Psychologie) | Skill |
|---|---|---|---|---|
| 0 | **Landing** | Klick → Sign-up | **Echtes Live-Beispiel zeigen** statt behaupten (Availability, Social Proof via Goldstandard); bescheidene, ehrliche Voice (Pratfall, Liking); CTA „Erste Bewerbung gratis" (Zero-Price) | `page-cro`, `copywriting` |
| 1 | **Sign-up** | Konto (Free) | Minimale Reibung (Hick, Aktivierungsenergie); **keine Kreditkarte** (Regret-/Risk-Aversion); Free als Default; kleiner erster Schritt (Foot-in-the-Door) | `signup-flow-cro`, `form-cro` |
| 2 | **Profil / CV** | Profil befüllt | **Vertrauens- & Investitions-Moment:** KI strukturiert den CV → **du bestätigst/korrigierst** (Kontrolle, Art. I.2; IKEA-Effekt: Aufwand→Besitz; Commitment/Consistency). Offene Schleife (Zeigarnik) | `onboarding-cro` |
| 3 | **Erste Generierung** | **Aha** | Erste Website **gratis** (Free = 1 Credit aufs Haus, Zero-Price/Reziprozität); **„watch it build"** = Peak-Moment (Peak-End) + Fortschritt (Goal-Gradient); „do, don't show" | `onboarding-cro` |
| 4 | **Vorschau + Feinschliff** | zum „Ja" | **Free ist One-Shot — keine Edits/Re-Rolls** (genau das ist der erste Upgrade-Grund). **Ab Starter:** Feinschliff gratis/unbegrenzt → niemand bleibt bei einem ungeliebten Ergebnis (Regret-Aversion, Art. I.3), Re-Roll 3 frei | `onboarding-cro`, `copy-editing` |
| 5 | **Teilen / Export** | **Nordstern** | Tenant-Link / PDF / (Pro: Domain); **kein Auto-Versand** — „du entscheidest" (Kontrolle); starker Abschluss (Peak-End) | `page-cro` |
| 6 | **Upgrade** | Free → bezahlt | Gates **an erlebtem Wert**: **Free→Starter = Feinschliff/Iteration + mehr Generierungen**, Bilder=Plus, Video/Domain/Radar=Pro — nie davor; Good-Better-Best-Leiter (Anchoring); Radar als **ehrlicher** Loss-Aversion-Haken | `paywall-upgrade-cro`, `pricing-strategy` |
| 7 | **Wiederkehr / Loop** | Retention & Viral | **Radar-Signal** „deine Bewerbung wurde geöffnet" = ehrliches Re-Engagement (Zeigarnik/Loss-Aversion); jede neue Stelle = neue Bewerbung (Habit-Loop); „made with Offero"-Badge (milder Viral-Loop) | `email-sequence`, `referral-program` |

## 3. Friction-Audit (Inversion: was würde garantiert scheitern?)

Vermeiden — jeweils mit Gegenmittel:
- **Paywall vor dem Aha** → erste Website immer gratis.
- **Kreditkarte beim Sign-up** → keine Karte für Free.
- **Blank-Slate-Profil** → CV-Upload + INGEST füllt vor, leere Zustände lehren.
- **Lahme Generierung ohne Feedback** → „watch it build" mit Stufen-Fortschritt.
- **CV-Parse scheitert** → Fallback (manuelle Korrektur, klare Fehlermeldung).
- **Versand-Angst** → nie Auto-Versand; „du bestätigst" prominent.
- **Versteckte Kosten** → Credit-Verbrauch glasklar vor jeder Aktion.

## 4. Trust-Guardrails (nicht verhandelbar, Constitution Art. V)

**Verboten** im ganzen Funnel: Fake-Scarcity, Countdown-Timer ohne echten Grund, vorausgewählte bezahlte
Upsells, Confirm-Shaming („Nein, ich will keine bessere Bewerbung"), Verstecken der Gratis-Option,
irreführende Anker. **Erlaubt nur, wenn ehrlich:** echte Knappheit, echte Fristen. Defaults ethisch.
Feinschliff bleibt großzügig gratis. Stückkosten/Marge transparent (Art. V.1).

## 5. Messung

- **Nordstern:** geteilte/exportierte Bewerbungen/Woche.
- **Aktivierung:** % Sign-ups, die die erste Vorschau erreichen · Time-to-Aha · Schritte-zum-Aha.
- **Funnel-Drop-off** je Stufe (Sign-up → Profil → Generieren → Vorschau → Teilen → Upgrade).
- **Trust-Proxies:** Feinschliff-Nutzung (hoch = gut: erreichen „Ja"), Refund-/Beschwerdequote (niedrig),
  Radar-Upsell-CTR, Free→Paid-Rate *nach* Aha.
- **Instrumentierung:** Radar nutzt `page_view` (cookieless, liegt schon). App-seitige Funnel-Events
  (Sign-up/Aktivierung/Teilen) als eigener leichter Analytics-Layer — 🔲 eigener Slice, DSGVO-konform,
  cookieless wo möglich.

## 6. Bau-Anbindung

Pro Stufe wird beim Bau der passende Skill gezogen (Tabelle Spalte „Skill"); `marketing-psychology` als
Querschnitt. Reihenfolge folgt den Produkt-Slices: Profil/Aha zuerst (M3-Backend liegt, INGEST verifiziert),
dann Generierung/Vorschau (M4), dann Upgrade/Billing (M6), dann Loop/Radar (M8). A/B-Tests später via
`ab-test-setup` — erst Baseline, dann optimieren.
