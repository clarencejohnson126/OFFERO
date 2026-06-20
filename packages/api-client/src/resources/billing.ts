import type { CreditWallet, LedgerEntry, PlanDef } from '@offero/core';

import type { RequestFn } from '../client';

export class BillingResource {
  constructor(private readonly request: RequestFn) {}

  plans(): Promise<{ plans: PlanDef[] }> {
    return this.request('GET', '/api/v1/billing/plans');
  }

  wallet(): Promise<CreditWallet> {
    return this.request('GET', '/api/v1/billing/wallet');
  }

  ledger(): Promise<{ entries: LedgerEntry[] }> {
    return this.request('GET', '/api/v1/billing/ledger');
  }

  checkout(productId: string): Promise<{ checkoutUrl: string }> {
    return this.request('POST', '/api/v1/billing/checkout', { productId });
  }
}
