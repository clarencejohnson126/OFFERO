import type { CvStructured } from '../domain/cv-schema';
import type { Tier } from '../domain/enums';
import type { Json } from '../domain/json';

// Eingabe/Erwartungs-Paar für golden-eval. Ein Fixture beschreibt EINE Generierung end-to-end:
// Profil + Stellenanzeige + Tier/Sprache → die Pipeline erzeugt Content, der Judge bewertet ihn.
// Goldstandard-Quelle (PII, NICHT committen): siehe scripts/golden-eval/README.md.

/** Das Profil, das die Pipeline für diesen Case sieht (entspricht repo.profiles.get-Form). */
export interface EvalProfile {
  displayName: string | null;
  /** Strukturierter CV (INGEST-Ergebnis). Null = nur focusPrompt (Pipeline erlaubt das). */
  cvStructured: CvStructured | null;
  contact: { email?: string; phone?: string; location?: string };
}

export interface EvalExpectations {
  /** Optional: Sektionen, die für einen guten Treffer vorkommen MÜSSEN (Struktur-Gate). */
  requiredSections?: string[];
  /** Optional: Stichworte aus der Anzeige, die der Content aufgreifen sollte (Hinweis für den Judge). */
  mustReference?: string[];
  /** Freitext-Erwartung an den Goldstandard (fließt in den Judge-Prompt). */
  notes?: string;
}

export interface EvalCase {
  /** Stabiler Bezeichner, z. B. "frontend-acme-2026". */
  id: string;
  profile: EvalProfile;
  /** Volltext der Stellenanzeige (anonymisiert in committeten Fixtures). */
  jobText: string;
  tier: Tier;
  /** Ausgabesprache (ADR 0003). */
  language: string;
  focusPrompt?: string;
  expectations?: EvalExpectations;
  /** Optionaler Roh-Anhang für spätere Erweiterungen (z. B. Brand-Kit). */
  meta?: Json;
}

/** Laufzeit-Form des Fixture-Files: eine Liste von Cases. */
export interface EvalSuite {
  cases: EvalCase[];
}
