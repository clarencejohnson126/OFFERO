// Echte Fortschritts-Events für den Live-Ladebalken (kein Fake-Timer). Eigenes Modul, damit
// pipeline.ts und steps.ts den Typ teilen können, ohne sich zirkulär zu importieren.

export interface GenerationProgress {
  stage: 'fetch_job' | 'fetch_brand' | 'analyze' | 'plan' | 'write' | 'assemble';
  /** Bei 'write': fertig geschriebene Sektionen / Gesamtzahl (echter Fortschritt). */
  current?: number;
  total?: number;
}

export type OnProgress = (p: GenerationProgress) => void;
