import { describe, expect, it } from 'vitest';

import { MODELS, modelFor } from '../src/ai';
import { CreditService, hasFeature, PLAN_CATALOG } from '../src/billing';
import type { BillingRepo } from '../src/ports/repository';
import { buildUniqueSlug, isReserved, slugify } from '../src/tenancy';

describe('Modell-Routing (keine IDs im Feature-Code)', () => {
  it('write läuft per Default auf Opus (pro)', () => {
    expect(modelFor('write', 'pro')).toBe(MODELS.opus);
  });
  it('Free-Tier schreibt auf Sonnet (Kostenoption)', () => {
    expect(modelFor('write', 'free')).toBe(MODELS.sonnet);
  });
  it('ingest ist überall Haiku', () => {
    expect(modelFor('ingest', 'pro')).toBe(MODELS.haiku);
    expect(modelFor('ingest', 'free')).toBe(MODELS.haiku);
  });
});

describe('Entitlements als Daten (nie Plan-Name fragen)', () => {
  it('Pro hat Video, Free nicht', () => {
    expect(hasFeature('pro', 'video')).toBe(true);
    expect(hasFeature('free', 'video')).toBe(false);
  });
  it('subscription-Tier ist entfernt (ADR 0012); Pro hat alle Premium-Features', () => {
    expect((PLAN_CATALOG as Record<string, unknown>).subscription).toBeUndefined();
    expect(hasFeature('pro', 'custom_domain')).toBe(true);
    expect(hasFeature('pro', 'radar')).toBe(true);
  });
  it('Free = 1 Credit, Pro = 25', () => {
    expect(PLAN_CATALOG.free.credits).toBe(1);
    expect(PLAN_CATALOG.pro.credits).toBe(25);
  });
});

describe('Tenant-Slug', () => {
  it('slugifiziert auf [a-z0-9-]', () => {
    expect(slugify('Müller & Söhne GmbH — Senior Dev!')).toMatch(/^[a-z0-9-]+$/);
  });
  it('reservierte Slugs bekommen ein Suffix', async () => {
    expect(isReserved('api')).toBe(true);
    const slug = await buildUniqueSlug('api', async () => false);
    expect(slug).not.toBe('api');
  });
  it('hängt einen nicht-erratbaren Token an (injizierbar) und würfelt bei Kollision neu', async () => {
    const slug = await buildUniqueSlug('acme', async () => false, { token: () => 'tok123' });
    expect(slug).toBe('acme-tok123');
    const seq = ['x1', 'x2'];
    let i = 0;
    const taken = new Set(['acme-x1']);
    const slug2 = await buildUniqueSlug('acme', async (s) => taken.has(s), { token: () => seq[i++] ?? 'zz' });
    expect(slug2).toBe('acme-x2');
  });
  it('echter Zufalls-Token ist nicht erratbar (Stamm + 8 Zeichen)', async () => {
    const slug = await buildUniqueSlug('acme', async () => false);
    expect(slug).toMatch(/^acme-[a-z0-9]{8}$/);
  });
});

describe('CreditService', () => {
  it('spendForGeneration bucht mit reason=generation, isReroll=false', async () => {
    const calls: Parameters<BillingRepo['spendCredits']>[0][] = [];
    const fake: BillingRepo = {
      getWallet: async () => null,
      initUser: async () => undefined,
      spendCredits: async (args) => {
        calls.push(args);
        return { balance: 4, freeRerollsRemaining: 3, charged: 1 };
      },
      grantCredits: async () => undefined,
      getLedger: async () => [],
    };
    const svc = new CreditService(fake);
    const res = await svc.spendForGeneration('u1', 'app1:gen:1');
    expect(res.charged).toBe(1);
    expect(calls[0]).toMatchObject({ reason: 'generation', isReroll: false, refId: 'app1:gen:1' });
  });
});
