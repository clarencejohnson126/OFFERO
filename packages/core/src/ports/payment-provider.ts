import type { PaymentProviderId } from '../domain/enums';

export interface CheckoutRequest {
  userId: string;
  /** Katalog-Key (Paket oder Top-up) — NICHT die Stripe-Price-ID im Aufrufer. */
  productId: string;
  successUrl: string;
  cancelUrl: string;
  idempotencyKey: string;
}
export interface CheckoutResult {
  checkoutUrl: string;
  externalId: string;
}

export type PaymentEventType =
  | 'purchase_completed'
  | 'subscription_active'
  | 'subscription_canceled'
  | 'refund';

export interface PaymentEvent {
  type: PaymentEventType;
  externalId: string;
  productId: string;
  amountCents: number;
  userId: string;
  periodEnd?: string;
  idempotencyKey: string;
}

export interface PaymentProvider {
  readonly provider: PaymentProviderId;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
  /** Verifiziert + normalisiert das Roh-Webhook auf ein PaymentEvent. */
  parseWebhook(rawBody: string, signature: string): Promise<PaymentEvent>;
}
