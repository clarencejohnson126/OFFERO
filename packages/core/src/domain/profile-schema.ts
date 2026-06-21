import { z } from 'zod';

import type { Json } from './json';

// Geteiltes Validierungs-Schema für Profil-Updates (Web & Mobile nutzen dasselbe).
const jsonValue: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValue),
    z.record(z.string(), jsonValue),
  ]),
);

export const profileUpdateSchema = z
  .object({
    displayName: z.string().max(200).nullable().optional(),
    contact: jsonValue.optional(),
    toolStack: z.array(jsonValue).optional(),
    languages: z.array(jsonValue).optional(),
  })
  .strict();

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export function parseProfileUpdate(input: unknown): ProfileUpdate {
  return profileUpdateSchema.parse(input);
}
