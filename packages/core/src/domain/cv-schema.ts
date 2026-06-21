import { z } from 'zod';

// Strukturierte CV-Daten (Ergebnis der INGEST-Stufe). Ehrlich, nur extrahiert — nichts erfunden.
export const cvStructuredSchema = z.object({
  summary: z.string().optional(),
  experience: z
    .array(
      z.object({
        role: z.string(),
        org: z.string().optional(),
        period: z.string().optional(),
        highlights: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        degree: z.string(),
        org: z.string().optional(),
        period: z.string().optional(),
      }),
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  languages: z
    .array(z.object({ name: z.string(), level: z.string().optional() }))
    .default([]),
});

export type CvStructured = z.infer<typeof cvStructuredSchema>;

export function parseCvStructured(input: unknown): CvStructured {
  return cvStructuredSchema.parse(input);
}
