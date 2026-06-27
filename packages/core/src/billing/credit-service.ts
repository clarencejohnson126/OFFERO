import type { BillingRepo } from '../ports/repository';

// Mechanik (pricing.md): Generierung −1 · Feinschliff 0 · Re-Roll 3 frei, dann −1.
// Die transaktionale/idempotente Logik liegt in der DB-RPC (ADR 0006); hier nur die Intention.
export class CreditService {
  constructor(private readonly billing: BillingRepo) {}

  /** Idempotent: legt profile + wallet an, falls fehlen (lazy). */
  async ensureUser(userId: string): Promise<void> {
    await this.billing.initUser(userId);
  }

  /** Generierung: −1 Credit. refId muss deterministisch sein (Idempotenz). */
  async spendForGeneration(userId: string, refId: string) {
    return this.billing.spendCredits({ userId, reason: 'generation', refId, isReroll: false });
  }

  /** Re-Roll: erst free_rerolls, dann −1 Credit (Entscheidung in der RPC). */
  async spendForReroll(userId: string, refId: string) {
    return this.billing.spendCredits({ userId, reason: 're_roll', refId, isReroll: true });
  }

  /** Erstattung nach Pipeline-Fehler: bucht den abgezogenen Credit zurück. Idempotent über refId. */
  async refundForGeneration(userId: string, genRef: string): Promise<void> {
    await this.billing.grantCredits({
      userId,
      delta: 1,
      reason: 'refund',
      refId: `${genRef}:refund`,
    });
  }
}
