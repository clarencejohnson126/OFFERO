// @offero/config/eslint — geteilte Flat-Config-Bausteine.
// `base` für alle TS-Pakete; `coreGuard` erzwingt die Framework-Neutralität von
// packages/core (Mobile-Strategie, Constitution Art. IV.2) zur Lint-Zeit.
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Gemeinsame Ignores (Build-Artefakte). */
export const ignores = {
  ignores: [
    '**/dist/**',
    '**/.next/**',
    '**/.turbo/**',
    '**/node_modules/**',
    '**/*.config.*',
    '**/next-env.d.ts', // von Next.js generiert (Triple-Slash-Refs) — nicht linten.
    '**/database.types.ts', // von Supabase generiert — nicht linten.
  ],
};

/** Basis: JS + TS empfohlen, Node-Globals, sinnvolle Lockerungen für einen Scaffold. */
export const base = tseslint.config(
  ignores,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
);

/**
 * Mobile-Guard für packages/core: kein React/Next, keine Browser-Globals.
 * Macht das Anti-Pattern aus docs/architecture/mobile-strategy.md zum Lint-Fehler.
 */
export const coreGuard = [
  {
    files: ['**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'core ist framework-neutral — kein react im Kern.' },
            { name: 'react-dom', message: 'core ist framework-neutral — kein react-dom im Kern.' },
            { name: 'server-only', message: 'core kennt keine Next.js-Marker.' },
          ],
          patterns: [
            { group: ['next', 'next/*'], message: 'core darf nicht von Next.js abhängen (API-first, mobil-migrierbar).' },
            { group: ['react/*', 'react-dom/*'], message: 'core ist framework-neutral.' },
            { group: ['@supabase/*'], message: 'core spricht Infra nur über Ports an — kein Supabase-SDK im Kern.' },
            { group: ['stripe', 'stripe/*'], message: 'core spricht Zahlung nur über PaymentProvider-Port an.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Keine Browser-Globals im core (mobile-strategy.md).' },
        { name: 'document', message: 'Keine Browser-Globals im core (mobile-strategy.md).' },
        { name: 'localStorage', message: 'Keine Browser-Globals im core.' },
      ],
    },
  },
];

export default base;
