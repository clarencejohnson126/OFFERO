// Typografie-Tokens (plattform-neutral).
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;

export type Typography = typeof typography;
