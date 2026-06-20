# 0002 — MVP-Schnitt & Zielgruppe

- **Status:** ⚠️ **Teilweise abgelöst durch [ADR 0004](./0004-mvp-volle-paketleiter.md).**
  Der MVP-Schnitt „text-only" (Punkt 1) ist **überholt** — der MVP liefert die volle Paket-Leiter
  (Bilder/Video/Bezahlung) aus. Die **Zielgruppen-Entscheidung (Punkt 2: breit / jede Bewerbung)
  bleibt gültig.**
- **Datum:** 2026-06-20
- **Kontext:** Vor Code-Start mussten zwei Weichen gestellt werden: Umfang von v1 und Start-
  Zielgruppe. Beides prägt Templates, Kosten (Remotion-Sockel) und Time-to-Launch.
- **Entscheidung:**
  1. **MVP = Text-only Durchstich.** v1 umfasst: CV/Profil-Eingabe → Stellenlink + Prompt →
     **zugeschnittene Bewerbungs-Website (Text + Struktur + Story) + PDF**, Multi-Tenant-Rendering,
     Feinschliff (gratis) und Re-Roll (limitiert). **Kein** Bild/Video in v1.
     → Schnell, günstig, **sockelfrei** (kein Remotion-$100-Minimum). Bilder = spätere Phase,
     (Lite-)Video danach.
  2. **Zielgruppe = breit / jede Bewerbung.** Keine Start-Nische. Personalisierung leistet die
     Pipeline pro Stelle/Profil; das Grundprodukt bleibt allgemeingültig.
- **Konsequenzen:**
  - (+) Schnellster Weg zu einem nützlichen, testbaren Produkt; minimale Fixkosten.
  - (+) Qualität der Text-Generierung kann isoliert validiert werden (golden-eval), bevor
    Medien-Komplexität dazukommt.
  - (+) Breite Zielgruppe maximiert adressierbaren Markt.
  - (−) Templates/Tonalität müssen allgemeingültig sein → Differenzierung muss über
    Generierungs-Qualität + spätere Multimodalität kommen, nicht über Nischen-Fokus.
  - (−) Onboarding muss jeden Profiltyp robust abholen (nicht Freelancer-spezifisch annehmen).
- **Alternativen verworfen:**
  - *Volles Multimodal sofort* → Remotion-Sockel + Komplexität zu früh, langsamer Launch.
  - *Nischenstart (Freelancer/Tech)* → fokussierter, aber kleinerer Markt; Nutzer wählte Breite.
- **Folge-Auswirkungen:**
  - `docs/product/vision.md` Zielgruppen-Abschnitt aktualisiert.
  - Nischen-spezifische Bausteine (Freelancer-Framing, Bau-Branchen-Match) bleiben als
    optionale, datengesteuerte Pipeline-Module erhalten (siehe `ai-pipeline.md` / generate-application-Skill).
