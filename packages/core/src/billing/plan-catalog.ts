import type { Tier } from '../domain/enums';

// Entitlements als DATEN (ADR 0006). Feature-Gates fragen features, NIE den Plan-Namen.
export type Feature =
  | 'text'
  | 'pdf'
  | 'unlimited_refine'
  | 'images'
  | 'branding'
  | 'premium_templates'
  | 'video'
  | 'custom_domain'
  | 'radar';

export interface PlanDef {
  id: Tier;
  /** Anzeige-Fallback. Geld-Wahrheit = Stripe-Price-IDs. Quelle: docs/product/pricing.md. */
  priceCents: number;
  recurring: boolean;
  credits: number | 'unlimited';
  freeRerolls: number;
  features: readonly Feature[];
}

const STARTER_FEATURES = ['text', 'pdf', 'unlimited_refine'] as const;
const PLUS_FEATURES = [...STARTER_FEATURES, 'images', 'branding', 'premium_templates'] as const;
const PRO_FEATURES = [...PLUS_FEATURES, 'video', 'custom_domain', 'radar'] as const;

export const PLAN_CATALOG: Record<Tier, PlanDef> = {
  // Free = One-Shot-Kostprobe: 1 Generierung, KEINE Edits, KEINE Re-Rolls (kein unlimited_refine,
  // freeRerolls 0). Iteration ist der erste Upgrade-Grund (ADR 0009 / pricing.md).
  free: { id: 'free', priceCents: 0, recurring: false, credits: 1, freeRerolls: 0, features: ['text', 'pdf'] },
  starter: { id: 'starter', priceCents: 999, recurring: false, credits: 5, freeRerolls: 3, features: STARTER_FEATURES },
  plus: { id: 'plus', priceCents: 1999, recurring: false, credits: 12, freeRerolls: 3, features: PLUS_FEATURES },
  pro: { id: 'pro', priceCents: 3999, recurring: false, credits: 25, freeRerolls: 3, features: PRO_FEATURES },
  subscription: {
    id: 'subscription',
    priceCents: 1499,
    recurring: true,
    credits: 'unlimited',
    freeRerolls: Number.POSITIVE_INFINITY,
    features: PRO_FEATURES,
  },
};

export function hasFeature(plan: Tier, f: Feature): boolean {
  return PLAN_CATALOG[plan].features.includes(f);
}

export function featuresFor(plan: Tier): readonly Feature[] {
  return PLAN_CATALOG[plan].features;
}

export function planDef(plan: Tier): PlanDef {
  return PLAN_CATALOG[plan];
}
