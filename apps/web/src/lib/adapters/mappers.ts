import type {
  Application,
  ApplicationContent,
  ApplicationStatus,
  CreditWallet,
  GenerationKind,
  GenerationVersion,
  LedgerEntry,
  LedgerReason,
  Profile,
  StorageRef,
  Tier,
} from '@offero/core';
import type { Json } from '@offero/core';

// DB-Zeilen (snake_case) ↔ Domänen-Entities (camelCase). Der Adapter ist die einzige Stelle,
// die das Mapping kennt; core bleibt DB-agnostisch.

type Row = Record<string, unknown>;

export function rowToProfile(r: Row): Profile {
  return {
    userId: r.user_id as string,
    displayName: (r.display_name as string | null) ?? null,
    contact: (r.contact as Json) ?? {},
    cvRaw: (r.cv_raw as StorageRef | null) ?? null,
    cvStructured: (r.cv_structured as Json | null) ?? null,
    photo: (r.photo as StorageRef | null) ?? null,
    toolStack: (r.tool_stack as Json) ?? [],
    languages: (r.languages as Json) ?? [],
  };
}

export function profilePatchToRow(
  userId: string,
  patch: Partial<Omit<Profile, 'userId'>>,
): Row {
  const row: Row = { user_id: userId, updated_at: new Date().toISOString() };
  if (patch.displayName !== undefined) row.display_name = patch.displayName;
  if (patch.contact !== undefined) row.contact = patch.contact;
  if (patch.cvRaw !== undefined) row.cv_raw = patch.cvRaw;
  if (patch.cvStructured !== undefined) row.cv_structured = patch.cvStructured;
  if (patch.photo !== undefined) row.photo = patch.photo;
  if (patch.toolStack !== undefined) row.tool_stack = patch.toolStack;
  if (patch.languages !== undefined) row.languages = patch.languages;
  return row;
}

export function rowToWallet(r: Row): CreditWallet {
  return {
    userId: r.user_id as string,
    balance: Number(r.balance ?? 0),
    freeRerollsRemaining: Number(r.free_rerolls_remaining ?? 0),
    plan: (r.plan as Tier) ?? 'free',
  };
}

export function rowToLedger(r: Row): LedgerEntry {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    delta: Number(r.delta ?? 0),
    reason: r.reason as LedgerReason,
    refId: r.ref_id as string,
    createdAt: r.created_at as string,
  };
}

export function rowToApplication(r: Row): Application {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    tenantSlug: r.tenant_slug as string,
    jobUrl: (r.job_url as string | null) ?? null,
    jobText: (r.job_text as string | null) ?? null,
    company: (r.company as Json) ?? {},
    status: r.status as ApplicationStatus,
    currentVersionId: (r.current_version_id as string | null) ?? null,
    customDomain: (r.custom_domain as string | null) ?? null,
    template: (r.template as string | null) ?? 'aurora',
    createdAt: r.created_at as string,
  };
}

export function rowToVersion(r: Row): GenerationVersion {
  return {
    id: r.id as string,
    applicationId: r.application_id as string,
    kind: r.kind as GenerationKind,
    // content wurde beim Schreiben schema-validiert (parseContent) → Cast beim Lesen.
    content: r.content as ApplicationContent,
    modelUsed: (r.model_used as string | null) ?? null,
    costCents: Number(r.cost_cents ?? 0),
    createdAt: r.created_at as string,
  };
}
