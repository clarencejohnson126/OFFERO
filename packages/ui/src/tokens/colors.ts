// App-UI-Tokens (Cockpit) — Richtung "Editorial Premium" (ADR 0008): warmes Off-White,
// near-black Tinte, EIN selbstbewusster Akzent. Bewusst ruhig, damit die generierten
// Vorschauen knallen. Der generierte OUTPUT bekommt seine Firmen-Palette pro Generierung
// (content.company.brand) — das hier ist NUR die Werkzeug-Oberfläche.
export const colors = {
  ink: '#0f1115', // Headlines/Text, leicht warmes Near-Black
  surface: '#f7f5f0', // warmer Off-White-Canvas
  surfaceRaised: '#ffffff', // Karten/erhöhte Flächen
  text: '#0f1115',
  textMuted: '#6b6760', // warmes Grau
  border: '#e7e2d8',
  accent: '#0030ff', // ein einziger, selbstbewusster Akzent
  state: {
    success: '#1f7a4d',
    warning: '#b4690e',
    danger: '#c0392b',
    info: '#0030ff',
  },
} as const;

export type Colors = typeof colors;
