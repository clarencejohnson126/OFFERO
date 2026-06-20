// Abstands- und Radius-Tokens (unitless; Web → px/rem, Mobile → dp).
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  full: 9999,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
