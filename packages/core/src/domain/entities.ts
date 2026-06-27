import type { ApplicationContent } from './content-schema';
import type {
  ApplicationStatus,
  GenerationKind,
  LedgerReason,
  MediaStatus,
  MediaType,
  PaymentProviderId,
  PurchaseStatus,
  RendererId,
  StorageRef,
  SubscriptionStatus,
  Tier,
} from './enums';
import type { Json } from './json';

// Domänen-Entities (camelCase). Der Supabase-Adapter mappt von/zu den snake_case-DB-Zeilen.

export interface Profile {
  userId: string;
  displayName: string | null;
  contact: Json;
  cvRaw: StorageRef | null;
  cvStructured: Json | null;
  photo: StorageRef | null;
  toolStack: Json;
  languages: Json;
}

export interface Application {
  id: string;
  userId: string;
  tenantSlug: string;
  jobUrl: string | null;
  jobText: string | null;
  company: Json;
  status: ApplicationStatus;
  currentVersionId: string | null;
  customDomain: string | null;
  /** Rendering-Variante (Template-ID, siehe TEMPLATE_CATALOG). Default 'aurora'. */
  template: string;
  createdAt: string;
}

export interface GenerationVersion {
  id: string;
  applicationId: string;
  kind: GenerationKind;
  content: ApplicationContent;
  modelUsed: string | null;
  costCents: number;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  versionId: string;
  userId: string;
  type: MediaType;
  storageRef: StorageRef | null;
  renderer: RendererId;
  costCents: number;
  meta: Json;
  status: MediaStatus;
  createdAt: string;
}

export interface CreditWallet {
  userId: string;
  balance: number;
  freeRerollsRemaining: number;
  plan: Tier;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  delta: number;
  reason: LedgerReason;
  refId: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  provider: PaymentProviderId;
  externalId: string;
  product: string;
  amountCents: number;
  status: PurchaseStatus;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  provider: PaymentProviderId;
  externalId: string;
  product: string;
  status: SubscriptionStatus;
  periodEnd: string | null;
  createdAt: string;
}

export interface PageView {
  id: string;
  applicationId: string;
  ts: string;
  coarseSignal: Json;
}
