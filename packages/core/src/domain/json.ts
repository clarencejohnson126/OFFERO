/** JSON-Wert (für jsonb-Spalten). Framework-neutral. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
