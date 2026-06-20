import { PLAN_CATALOG } from '@offero/core';

import { ok } from '@/app/api/v1/_lib/responses';

// Echt: Plan-Katalog (Entitlements als Daten). Geld-Wahrheit bleibt Stripe (Price-IDs).
export function GET() {
  return ok({ plans: Object.values(PLAN_CATALOG) });
}
