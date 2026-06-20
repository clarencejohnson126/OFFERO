// Plattform-neutrale Farb-Tokens (Hex). Kein CSS, kein React — Web rendert via
// Tailwind/CSS, Mobile via RN-StyleSheet. Die generierten Bewerbungs-Sites bekommen
// ihre Firmen-Palette pro Generierung (content.company.brand); dies sind die App-UI-Tokens.
export const colors = {
  ink: '#0a0d14',
  surface: '#ffffff',
  surfaceMuted: '#f6f7f9',
  text: '#0a0d14',
  textMuted: '#6b7280',
  border: '#e5e7eb',
  brand: {
    primary: '#0030ff',
    accent: '#e6007e',
  },
  state: {
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0030ff',
  },
} as const;

export type Colors = typeof colors;
