import type { ApplicationContent } from '../domain/content-schema';
import type {
  Application,
  CreditWallet,
  GenerationVersion,
  LedgerEntry,
  MediaAsset,
  PageView,
  Profile,
} from '../domain/entities';
import type {
  ApplicationStatus,
  GenerationKind,
  LedgerReason,
  MediaStatus,
  MediaType,
  RendererId,
  StorageRef,
  Tier,
} from '../domain/enums';
import type { Json } from '../domain/json';

export interface ProfileRepo {
  get(userId: string): Promise<Profile | null>;
  upsert(userId: string, patch: Partial<Omit<Profile, 'userId'>>): Promise<Profile>;
}

export interface ApplicationRepo {
  create(input: {
    userId: string;
    tenantSlug: string;
    jobUrl?: string | null;
    jobText?: string | null;
    company?: Json;
    template?: string;
  }): Promise<Application>;
  get(id: string): Promise<Application | null>;
  getBySlug(slug: string): Promise<Application | null>;
  listByUser(userId: string): Promise<Application[]>;
  setStatus(id: string, status: ApplicationStatus): Promise<void>;
  setCurrentVersion(id: string, versionId: string): Promise<void>;
  /** job_text nach erfolgreicher Generierung leeren (DSGVO, transient). */
  clearJobText(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface GenerationVersionRepo {
  create(input: {
    applicationId: string;
    kind: GenerationKind;
    content: ApplicationContent;
    modelUsed?: string | null;
    costCents?: number;
  }): Promise<GenerationVersion>;
  get(id: string): Promise<GenerationVersion | null>;
  listByApplication(applicationId: string): Promise<GenerationVersion[]>;
  /** Feinschliff = in-place Update der aktuellen Version (ADR 0005). */
  updateContent(id: string, content: ApplicationContent): Promise<GenerationVersion>;
  /** leichter Audit-Eintrag je Feinschliff (ADR 0005). */
  appendEdit(input: { versionId: string; userId: string; patch: Json }): Promise<void>;
}

export interface MediaRepo {
  create(input: {
    versionId: string;
    userId: string;
    type: MediaType;
    renderer: RendererId;
    meta?: Json;
  }): Promise<MediaAsset>;
  listByVersion(versionId: string): Promise<MediaAsset[]>;
  setStatus(
    id: string,
    status: MediaStatus,
    storageRef?: StorageRef,
    costCents?: number,
  ): Promise<void>;
}

export interface BillingRepo {
  getWallet(userId: string): Promise<CreditWallet | null>;
  /** Idempotent: legt profile + credit_wallet an, falls fehlen (lazy, kein auth-Trigger). */
  initUser(userId: string): Promise<void>;
  /** Atomar + idempotent über ref_id (Postgres-RPC, ADR 0006). */
  spendCredits(args: {
    userId: string;
    reason: LedgerReason;
    refId: string;
    isReroll: boolean;
  }): Promise<{ balance: number; freeRerollsRemaining: number; charged: number }>;
  grantCredits(args: {
    userId: string;
    delta: number;
    reason: LedgerReason;
    refId: string;
    plan?: Tier;
    freeRerolls?: number;
  }): Promise<void>;
  getLedger(userId: string, limit: number): Promise<LedgerEntry[]>;
}

export interface RadarRepo {
  log(applicationId: string, coarseSignal: Json): Promise<void>;
  summary(applicationId: string): Promise<{ total: number; recent: PageView[] }>;
}

/** Aggregierter Datenzugriffs-Port. Supabase-Impl lebt in apps/web/lib. */
export interface Repository {
  profiles: ProfileRepo;
  applications: ApplicationRepo;
  versions: GenerationVersionRepo;
  media: MediaRepo;
  billing: BillingRepo;
  radar: RadarRepo;
}
