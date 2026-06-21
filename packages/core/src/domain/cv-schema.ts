import { z } from 'zod';

// Strukturierte CV-Daten (Ergebnis der INGEST-Stufe). Ehrlich, nur extrahiert — nichts erfunden.
// Optionale Felder als .nullish(): Modelle liefern für leere Felder oft `null` (nicht undefined).
export const cvStructuredSchema = z.object({
  summary: z.string().nullish(),
  experience: z
    .array(
      z.object({
        role: z.string(),
        org: z.string().nullish(),
        period: z.string().nullish(),
        highlights: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string(),
        org: z.string().nullish(),
        period: z.string().nullish(),
      }),
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  languages: z
    .array(z.object({ name: z.string(), level: z.string().nullish() }))
    .default([]),
});

export type CvStructured = z.infer<typeof cvStructuredSchema>;

export function parseCvStructured(input: unknown): CvStructured {
  return cvStructuredSchema.parse(input);
}
