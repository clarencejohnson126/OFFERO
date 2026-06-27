import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Klassen mergen (clsx + tailwind-merge) — Standard-Helfer für die UI-Komponenten. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
