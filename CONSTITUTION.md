# Offero — Constitution

> Die **unverrückbaren** Prinzipien dieses Vorhabens. Alles andere (Features, Preise im Detail,
> Tech-Entscheidungen) darf sich ändern — **diese** Artikel nicht, außer durch eine bewusste,
> dokumentierte Verfassungsänderung (neuer ADR mit Begründung). Bei Konflikt schlägt die
> Constitution jede andere Datei, jeden Prompt, jede Bequemlichkeit.

Version 1.0 · 2026-06-20

---

## Präambel

Offero hilft Menschen, sich mit einer ehrlichen, überzeugenden, maßgeschneiderten
Bewerbungs-Website auf eine konkrete Stelle zu bewerben. Wir verkaufen **Wirkung**, nicht
Masse. Wir bauen die Fabrik, die das Produkt baut — nicht das Produkt direkt.

---

## Artikel I — Produkt-Prinzipien

1. **Qualität schlägt Volumen.** Eine herausragende Bewerbung ist mehr wert als zehn
   generische. Der Engpass des Geschäfts ist Akquise, nicht Stückkosten — also darf
   Qualität nie für ein paar Cent geopfert werden.
2. **Der Nutzer behält die Kontrolle.** Generieren ist ein Vorschlag, kein Endprodukt.
   **Kein automatischer Versand** an Arbeitgeber ohne ausdrückliche Nutzer-Bestätigung.
3. **„Erste Version gefällt nicht" ist eingeplant.** Es gibt immer einen kostengünstigen Weg
   zum „Ja": **Feinschliff-Edits gratis & großzügig**, Re-Rolls limitiert, neue Generierung
   = Credit. Niemand zahlt für ein Ergebnis, das ihn nicht überzeugt.
4. **Premium weckt Appetit, kostet uns wenig.** Hooks, die Nutzer „Blut lecken" lassen
   (z. B. Recruiter-Radar), müssen für uns nahezu kostenlos sein.

## Artikel II — Ehrlichkeit & Inhalt (nicht verhandelbar)

1. **Keine falschen Fähigkeits- oder Erfahrungs-Claims.** Generierte Bewerbungen bleiben
   wahrheitsgemäß. KI-Zeitleiste sauber halten: RAG/MCP/Automatisierung seit 2024,
   echte Agentic-Praxis erst seit Ende 2025 — nie „2 Jahre Agentic" o. ä. (disqualifizierend).
2. **Underpromise, overdeliver.** Tonalität bescheiden, nicht prahlerisch.
3. **Rebelz AI / rebelzai.com** wird **niemals** gezeigt, verlinkt oder erwähnt — weder auf
   generierten Seiten noch in PDFs, Anschreiben, Signaturen oder Metadaten.
4. **Pilot-/Freelancer-Framing als Stärke**, nie als Notlösung — wo das Produkt solche
   Texte erzeugt.

## Artikel III — Daten, Recht & Vertrauen

1. **EU-Datenhaltung.** Nutzer-PII (Lebensläufe, Fotos, Kontaktdaten) liegen in der EU
   (Supabase EU-Region). DSGVO-konform: Export & Löschung auf Knopfdruck.
2. **Daten gehören dem Nutzer.** Wir trainieren nichts ohne ausdrückliche Zustimmung;
   Inhalte Dritter (Stellenanzeigen) werden nur transient verarbeitet.
3. **Fremdmarken respektvoll.** Wenn eine generierte Seite das Branding eines Arbeitgebers
   aufgreift, geschieht das als Bewerbungs-Kontext (faire Nutzung), nie irreführend als
   offizielle Seite dieses Arbeitgebers.
4. **Lizenz-Compliance.** Drittanbieter-Lizenzen werden eingehalten — insb. **Remotion**
   (kommerzielle „Automators"-Lizenz für prompt-to-video), bevor Video live geht.

## Artikel IV — Technik-Prinzipien

1. **API-first.** Jede Geschäftsfunktion ist über eine versionierte HTTP/JSON-API erreichbar.
   UIs sind Clients. Keine Logik, die nur in einer UI-Schicht existiert.
2. **Mobile-Migrierbarkeit ist Architektur-Pflicht, kein Nachgedanke.** Jede Entscheidung
   wird gegen die Frage geprüft: „Kann eine native Mobile-App das später ohne Umbau nutzen?"
   Domänenlogik im framework-neutralen `core`-Paket. (Siehe `docs/architecture/mobile-strategy.md`.)
3. **Extensibel: offen für Erweiterung, geschlossen für Modifikation.** Modelle, Prompts,
   Bild-/Video-Engines, Zahlungsanbieter sind **austauschbar** hinter Adaptern. Keine
   hartcodierten Modell-IDs, kein Provider-Lock.
4. **Sicherer Agentic Access.** Automatisierung darf alles, was wir manuell tun — **außer**
   destruktiven Produktionsaktionen (kein DB-DROP, kein Storage-Nuke, kein Force-Push auf main).
   Diese bleiben menschlich bestätigt.
5. **Beobachtbarkeit & Kostenkontrolle.** Jeder KI-/Render-Call ist gemessen und einem
   Tenant/Credit zugeordnet. Kein Feature geht live, dessen Stückkosten wir nicht kennen.

## Artikel V — Geschäft

1. **Stückkosten transparent, Margen bekannt.** Kein Tier ohne kalkulierte Deckungsbeitrag.
   Quelle der Wahrheit: `docs/product/unit-economics.md`.
2. **Kostensockel erst aktivieren, wenn er sich trägt.** Fixe Sockel (Remotion $100/Mt,
   später Always-on-Agenten) werden erst eingeschaltet, wenn genug zahlende Nachfrage sie deckt.
   Bis dahin sockelfreie Alternativen (z. B. Lite-Video via FFmpeg).
3. **Ehrliche Pakete.** Preise und Limits sind klar; keine Dark Patterns beim Verbrauch von
   Credits/Re-Rolls.

---

## Änderung dieser Verfassung

Ein Artikel ändert sich nur durch einen **ADR in `docs/decisions/`**, der den alten Wortlaut,
den neuen Wortlaut und die Begründung festhält, plus Erhöhung der Versionsnummer oben.
