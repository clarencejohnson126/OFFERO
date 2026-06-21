import 'server-only';

import {
  type ApplicationRepo,
  type BillingRepo,
  type GenerationVersionRepo,
  type LedgerReason,
  type MediaRepo,
  type Profile,
  type ProfileRepo,
  type RadarRepo,
  type Repository,
  errors,
} from '@offero/core';

import type { DbClient } from '../supabase-server';
import { profilePatchToRow, rowToLedger, rowToProfile, rowToWallet } from './mappers';

const notImpl = (what: string): never => {
  throw errors.notImplemented(`${what} kommt in M4+.`);
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

// Stubs bis M4 (Generierung/Medien/Radar).
const applicationsStub: ApplicationRepo = {
  create: () => notImpl('applications.create'),
  get: () => notImpl('applications.get'),
  getBySlug: () => notImpl('applications.getBySlug'),
  listByUser: () => notImpl('applications.listByUser'),
  setStatus: () => notImpl('applications.setStatus'),
  setCurrentVersion: () => notImpl('applications.setCurrentVersion'),
  clearJobText: () => notImpl('applications.clearJobText'),
  delete: () => notImpl('applications.delete'),
};

const versionsStub: GenerationVersionRepo = {
  create: () => notImpl('versions.create'),
  get: () => notImpl('versions.get'),
  listByApplication: () => notImpl('versions.listByApplication'),
  updateContent: () => notImpl('versions.updateContent'),
  appendEdit: () => notImpl('versions.appendEdit'),
};

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
  readonly applications = applicationsStub;
  readonly versions = versionsStub;
  readonly media = mediaStub;
  readonly radar = radarStub;

  constructor(db: DbClient) {
    this.profiles = new SupabaseProfileRepo(db);
    this.billing = new SupabaseBillingRepo(db);
  }
}
