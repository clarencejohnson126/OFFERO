# ADR 0012 — Strategiewechsel „Path A": enge B2C-Nische, Website-primär, kein Abo, Trust-System

Stand: 2026-06-24 · Status: **angenommen** · Supersedes/aktualisiert: ADR 0002 (Zielgruppe),
Teile von ADR 0004 (Paketleiter), ergänzt ADR 0009 (Trust-Funnel) und ADR 0011 (Free One-Shot).

## Kontext

Eine kritische Geschäftsanalyse (NotebookLM) und eine eigene Markt-/Trend-Recherche (Juni 2026,
~25 Wettbewerber + ATS-Realität + Community-Stimmung auf Reddit/X/Web) haben drei strukturelle
Wahrheiten offengelegt:

1. **B2C-Jobsuche ist strukturell Low-LTV** (schubweise, „cohort decay") → ein Abo ist das falsche
   Primärmodell; das deckelt auf ein kleines, profitables Produkt — nicht auf Venture-Scale.
2. **ATS ist kein „kill switch", aber die Positionierung war falsch.** ATS lehnen KI-Inhalte *nicht*
   automatisch ab und erkennen sie nicht (Jobscan, Mai 2026; Enhancv 2026: 92 %). Der echte Filter
   ist **Volumen + der 7-Sekunden-Blick eines Menschen**. Die Website kann die formale Bewerbung
   nicht *ersetzen*, sondern *ergänzen*.
3. **Der venture-skalierbare Hebel ist die Recruiter-/Institutions-Seite** — eine andere Firma,
   später. Jetzt: das B2C-Kernprodukt wasserdicht und defensiv machen.

Zugleich bestätigt die Recherche unseren Kern: **kein Wettbewerber generiert eine maßgeschneiderte
Website pro Stellenanzeige aus dem Job-Ad** — das White Space ist real (aber flach: Kickresume/
Standard Resume sind „eine Produktentscheidung entfernt" → Tempo zum Moat zählt).

## Entscheidung

Wir verfolgen **Path A**: eine **enge, ehrliche, recruiter-/HM-freundliche B2C-Nische**, mit
offener Tür zur Venture-Erweiterung (Recruiter-Seite) später. Konkret:

### 1. Produkt-Hierarchie (korrigiert)
- **Die Website ist das Hauptprodukt** — der Distinguishing Factor, das Wow, der Moat. Hier liegt
  die gesamte Bau- und Verkaufs-Energie.
- Das **ATS-saubere PDF + DOCX** ist eine **stille Kompatibilitäts-Schicht, kein Produkt**. Zwei
  Jobs: (a) nicht am Volumen-/Roboter-Tor rausgefiltert werden, (b) den **Klick zur Website treiben**
  (Link sichtbar). Bewusst schlichter als die Website; nie der Pitch.

### 2. Zielgruppe (ersetzt ADR 0002 „breit")
- **Primär-ICP:** Bewerber:innen für Rollen, bei denen ein **Hiring Manager einen Tiefen-Read**
  macht (Eng, Design, PM, Marketing, Analyst), Junior-bis-Mid, kreativ/tech-affin — die Segmente,
  die eine persönliche Website *öffnen und schätzen*. Der First-Line-Recruiter scannt 7 s und klickt
  meist nicht → das PDF bedient das Tor, die Website den HM.
- **DACH-first** mit echter Lokalisierung als Moat (Bewerbungsmappe: Anschreiben + tabellarischer
  Lebenslauf, du/Sie-Ton, Foto on/off, DIN-5008-nah). Deutsches Hiring ist weniger ATS-keyword-
  getrieben als US.
- **High-Intent-Moment, nicht der Identitätsseiten-Pfleger:** zahlungsbereit ist, wer sich *jetzt*
  auf eine konkrete Stelle bewirbt (schubweise). Anti-Volume/Spray: 5–10 durchdachte Bewerbungen
  schlagen 100 automatische.
- **Institutionelle B2B2C-Schicht:** Bootcamps, Hochschulen, Career-Services, Outplacement — der
  empfehlungsreiche, aufwand-signalisierende Vertriebskanal (siehe Moat/GTM).

### 3. Distribution (die make-or-break-Frage)
Geschichtet, primärer Keil = **A**:
- **A (primär):** PDF/DOCX trägt durchs Volumen-Tor *und* den Link; die Website ist der **Deep-Read
  im warmen Kontext** (Interview — „kommt 9/10 im Gespräch auf", Empfehlung, angefixter Recruiter,
  Institutions-Kanal). Wir greifen „Recruiter klicken nicht" **auf Website-Ebene** an (10-Sek-Hook +
  Trust-System), statt uns aufs PDF zurückzuziehen.
- **C (Moat, parallel):** Institutionen als durable Distribution — löst zugleich das Netzwerk-Defizit
  der Junior-ICP.
- **B (Feature):** Ein-Klick-Teilen für Empfehlung/Warm-Outreach — eingebaut, aber keine Primärwette.

### 4. Monetarisierung (ersetzt Abo aus ADR 0004)
- **Abo (Job-Hunt-Abo) gestrichen.** Es passt nicht zur schubweisen Nutzung und ist im
  abo-aversen DACH ein Nachteil.
- **Credit-Pakete als Einmalkauf, nicht verfallend solange das Konto besteht** (z. B. 5/12/25
  Bewerbungen). Das passt zur Burstiness und ist selbst ein milder Retention-Hebel (gespeicherter
  Wert hält das Konto).
- **Top-ups** à la carte (KI-Bilder, 60-s-Video, Custom Domain). **Institutions-Lizenz** (B2B2C).
- **Keine Dark Patterns** (verschärft Art. V.3): klare Einmal-/EUR-Preise, **kein** Auto-Renew,
  **keine** Wochenpreis-Verschleierung, **kein** degradierendes „Free", kein Modell-Name als
  Marketing, **keine** unbelegten Hero-Stats.

### 5. Trust-System (Antwort auf KI-Ablehnung — unser Anti-„Uncanny-Valley")
Recruiter lehnen KI ab, die sich *versteckt* und generisch ist; **radikale Ehrlichkeit +
Personalisierung** ist der Gewinn-Pfad. Bausteine auf der Website:
- **Ehrlicher Integritäts-Badge / Disclaimer:** wählbare Ton-Vorlagen (Default „selbstbewusst-
  ehrlich", Option „augenzwinkernd"), Sichtbarkeit vom Bewerber steuerbar. Sinn: *„Recherche &
  Struktur mit KI-Unterstützung; Inhalte/Erfahrung/Zahlen sind real und von mir verantwortet —
  belege ich gern im Gespräch."*
- **Selbst aufgenommenes Video/Audio** (echter Eindruck, kamerascheu → Audio + Transkript), eigener
  „Lerne mich kennen"-Block, **kein Autoplay**. Echtes Gesicht/echte Stimme schlägt KI-Video beim Trust.
- **Verifizierbare Beweis-Links pro Aussage** (GitHub, Live-Projekt, Zertifikat, Referenz) → aus
  „vertrau mir" wird „prüf mich".
- **Grounded „Frag mich"-Q&A:** Antworten **nur** aus echtem Profil/Material, mit Quelle, **nie
  erfunden** (Constitution-hart).
- **Recruiter-Respekt:** 10-Sek-Antwort above the fold, schlanke Quick-Nav (kein volles
  Inhaltsverzeichnis), Zurückhaltung (Medien opt-in/unter der Falte).

### 6. ATS-Positionierung (market-switched)
- **DACH:** leise **Hygiene** — sauberes, korrekt formatiertes PDF **+ DOCX-Fallback** (parst auf
  Workday am zuverlässigsten). Kein lautes Score-Feature.
- **US/EN:** sichtbarer, **verifizierbarer** Keyword-/Parse-Readiness-Score (nie Fake-Zahl).
- Abnahme-Gate: DIY-Parse-Test (`pdfplumber`/`PyMuPDF`/`python-docx`) als CI-Regression.

### 7. Moat (säen ab jetzt)
1. **Outcome-/View-Analytics-Daten-Flywheel** (meistgewünschtes Feature der Bewerber: „weiß nie, ob
   jemand draufschaut") → transparent, nicht-creepy → füttert outcome-getunte Generierung.
2. **Institutions-Distribution** (langsam, high-touch, durable).
3. **Trust-Marke + DACH-Lokalisierung.**
- **Recruiter-Radar wird umgebaut** zu **transparenter** View-Analytics („deine Seite wurde geöffnet,
  40 s angesehen") — Trust statt heimliches Tracking (Recruiter blocken Spy-Tools).

## Konsequenzen (bewusst)
- **Verboten/zu meiden** (ergänzt die Constitution): Auto-Submit/Spray, „undetectable"-Hilfe,
  Modell-Namen als Marketing, Fake-Stats, Drift zu Identitätsseite/Social/Career-OS-Sprawl,
  Discovery/Matching (LinkedIn/StepStone-Turf), zu viel PII auf der Seite.
- **PII-Defaults** (siehe ADR-Folge / Task #35): nicht-erratbare Slugs, `noindex`, Kontaktdaten
  opt-in, professionell-only, Foto on/off (DACH erwartet Foto, bias-bewusste Märkte nicht).
- **Verkauf führt mit der Website + Medien**, NIE mit „maßgeschneidertem Anschreiben" — das ist in
  DACH dank StepStone bereits gratis Tischware.
- Bestehende Free-Wallets mit Alt-Rerolls bleiben (ADR 0011); kein rückwirkender Daten-Cleanup nötig.

## Offene Detailpunkte (entscheide im Bau, nicht blockierend)
- Genaue EUR-Paketpreise → `pricing.md` + `unit-economics.md` (Stückkosten-Abgleich, Video-Sockel).
- Tiefe des grounded Q&A (Edge vs. on-demand) — minimal-truthful zuerst.
- Institutions-Lizenzmechanik (Seats vs. Credit-Pool) → ADR bei GTM-Slice (Task #40).
