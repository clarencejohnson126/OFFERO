import type { Tier } from '../domain/enums';
import { DomainError } from '../domain/errors';
import { type Feature, hasFeature } from './plan-catalog';

/** Erzwingt ein Feature serverseitig — Gate liegt im Kern, nicht in der UI (mobile-safe). */
export function assertFeature(plan: Tier, feature: Feature): void {
  if (!hasFeature(plan, feature)) {
    throw new DomainError(
      'FEATURE_NOT_ENABLED',
      `Feature "${feature}" ist im Paket "${plan}" nicht enthalten.`,
      403,
    );
  }
}
