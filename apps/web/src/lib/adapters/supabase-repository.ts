import 'server-only';

import {
  type Application,
  type ApplicationContent,
  type ApplicationRepo,
  type ApplicationStatus,
  type BillingRepo,
  type GenerationKind,
  type GenerationVersion,
  type GenerationVersionRepo,
  type Json,
  type LedgerReason,
  type MediaRepo,
  type Profile,
  type ProfileRepo,
  type RadarRepo,
  type Repository,
  errors,
} from '@offero/core';

import type { DbClient } from '../supabase-server';
import {
  profilePatchToRow,
  rowToApplication,
  rowToLedger,
  rowToProfile,
  rowToVersion,
  rowToWallet,
} from './mappers';

type Row = Record<string, unknown>;

const notImpl = (what: string): never => {
  throw errors.notImplemented(`${what} kommt in M7+.`);
};

class SupabaseProfileRepo implements ProfileRepo {
  constructor(private readonly db: DbClient) {}

  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await this.db.from('profile').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw errors.internal(error.message);
    return data ? rowToProfile(data) : null;
  }

  async upsert(userId: string, patch: Partial<Omit<Profile, 'userId'>>): Promise<Profile> {
    const row = profilePatchToRow(userId, patch);
    const { data, error } = await this.db
      .from('profile')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw errors.internal(error.message);
    return rowToProfile(data);
  }
}

class SupabaseBillingRepo implements BillingRepo {
  constructor(private readonly db: DbClient) {}

  async getWallet(userId: string) {
    const { data, error } = await this.db.from('credit_wallet').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw errors.internal(error.message);
    return data ? rowToWallet(data) : null;
  }

  async initUser(userId: string): Promise<void> {
    const { error } = await this.db.rpc('init_user', { p_user_id: userId });
    if (error) throw errors.internal(error.message);
  }

  async spendCredits(args: { userId: string; reason: LedgerReason; refId: string; isReroll: boolean }) {
    const { data, error } = await this.db.rpc('spend_credits', {
      p_user_id: args.userId,
      p_reason: args.reason,
      p_ref_id: args.refId,
      p_is_reroll: args.isReroll,
    });
    if (error) {
      if (error.message.includes('INSUFFICIENT_CREDITS')) throw errors.insufficientCredits();
      if (error.message.includes('WALLET_NOT_FOUND')) throw errors.walletNotFound();
      throw errors.internal(error.message);
    }
    const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;
    return {
      balance: Number(row.balance ?? 0),
      freeRerollsRemaining: Number(row.free_rerolls_remaining ?? 0),
      charged: Number(row.charged ?? 0),
    };
  }

  async grantCredits(args: {
    userId: string;
    delta: number;
    reason: LedgerReason;
    refId: string;
    plan?: string;
    freeRerolls?: number;
  }): Promise<void> {
    const { error } = await this.db.rpc('grant_credits', {
      p_user_id: args.userId,
      p_delta: args.delta,
      p_reason: args.reason,
      p_ref_id: args.refId,
      p_plan: args.plan ?? null,
      p_free_rerolls: args.freeRerolls ?? null,
    });
    if (error) throw errors.internal(error.message);
  }

  async getLedger(userId: string, limit: number) {
    const { data, error } = await this.db
      .from('credit_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw errors.internal(error.message);
    return (data ?? []).map(rowToLedger);
  }
}

class SupabaseApplicationRepo implements ApplicationRepo {
  constructor(private readonly db: DbClient) {}

  async create(input: {
    userId: string;
    tenantSlug: string;
    jobUrl?: string | null;
    jobText?: string | null;
    company?: Json;
    template?: string;
  }): Promise<Application> {
    const row: Row = {
      user_id: input.userId,
      tenant_slug: input.tenantSlug,
      job_url: input.jobUrl ?? null,
      job_text: input.jobText ?? null,
      company: input.company ?? {},
      template: input.template ?? 'aurora',
    };
    const { data, error } = await this.db.from('application').insert(row).select().single();
    if (error) throw errors.internal(error.message);
    return rowToApplication(data);
  }

  async get(id: string): Promise<Application | null> {
    const { data, error } = await this.db.from('application').select('*').eq('id', id).maybeSingle();
    if (error) throw errors.internal(error.message);
    return data ? rowToApplication(data) : null;
  }

  async getBySlug(slug: string): Promise<Application | null> {
    const { data, error } = await this.db
      .from('application')
      .select('*')
      .eq('tenant_slug', slug)
      .maybeSingle();
    if (error) throw errors.internal(error.message);
    return data ? rowToApplication(data) : null;
  }

  async listByUser(userId: string): Promise<Application[]> {
    const { data, error } = await this.db
      .from('application')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw errors.internal(error.message);
    return (data ?? []).map(rowToApplication);
  }

  async setStatus(id: string, status: ApplicationStatus): Promise<void> {
    const { error } = await this.db.from('application').update({ status }).eq('id', id);
    if (error) throw errors.internal(error.message);
  }

  async setCurrentVersion(id: string, versionId: string): Promise<void> {
    const { error } = await this.db
      .from('application')
      .update({ current_version_id: versionId })
      .eq('id', id);
    if (error) throw errors.internal(error.message);
  }

  async clearJobText(id: string): Promise<void> {
    const { error } = await this.db.from('application').update({ job_text: null }).eq('id', id);
    if (error) throw errors.internal(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('application').delete().eq('id', id);
    if (error) throw errors.internal(error.message);
  }
}

class SupabaseGenerationVersionRepo implements GenerationVersionRepo {
  constructor(private readonly db: DbClient) {}

  async create(input: {
    applicationId: string;
    kind: GenerationKind;
    content: ApplicationContent;
    modelUsed?: string | null;
    costCents?: number;
  }): Promise<GenerationVersion> {
    const row: Row = {
      application_id: input.applicationId,
      kind: input.kind,
      content: input.content as unknown as Json,
      model_used: input.modelUsed ?? null,
      cost_cents: Math.round(input.costCents ?? 0),
    };
    const { data, error } = await this.db.from('generation_version').insert(row).select().single();
    if (error) throw errors.internal(error.message);
    return rowToVersion(data);
  }

  async get(id: string): Promise<GenerationVersion | null> {
    const { data, error } = await this.db
      .from('generation_version')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw errors.internal(error.message);
    return data ? rowToVersion(data) : null;
  }

  async listByApplication(applicationId: string): Promise<GenerationVersion[]> {
    const { data, error } = await this.db
      .from('generation_version')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });
    if (error) throw errors.internal(error.message);
    return (data ?? []).map(rowToVersion);
  }

  async updateContent(id: string, content: ApplicationContent): Promise<GenerationVersion> {
    const { data, error } = await this.db
      .from('generation_version')
      .update({ content: content as unknown as Json })
      .eq('id', id)
      .select()
      .single();
    if (error) throw errors.internal(error.message);
    return rowToVersion(data);
  }

  async appendEdit(input: { versionId: string; userId: string; patch: Json }): Promise<void> {
    const row: Row = { version_id: input.versionId, user_id: input.userId, patch: input.patch };
    const { error } = await this.db.from('edit_log').insert(row);
    if (error) throw errors.internal(error.message);
  }
}

// Stubs bis Medien-/Radar-Slice (M7/M8).
const mediaStub: MediaRepo = {
  create: () => notImpl('media.create'),
  listByVersion: () => notImpl('media.listByVersion'),
  setStatus: () => notImpl('media.setStatus'),
};

const radarStub: RadarRepo = {
  log: () => notImpl('radar.log'),
  summary: () => notImpl('radar.summary'),
};

export class SupabaseRepository implements Repository {
  readonly profiles: ProfileRepo;
  readonly billing: BillingRepo;
  readonly applications: ApplicationRepo;
  readonly versions: GenerationVersionRepo;
  readonly media = mediaStub;
  readonly radar = radarStub;

  constructor(db: DbClient) {
    this.profiles = new SupabaseProfileRepo(db);
    this.billing = new SupabaseBillingRepo(db);
    this.applications = new SupabaseApplicationRepo(db);
    this.versions = new SupabaseGenerationVersionRepo(db);
  }
}
