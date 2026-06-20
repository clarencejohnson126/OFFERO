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
  it('Abo hat alle Pro-Features', () => {
    expect(hasFeature('subscription', 'custom_domain')).toBe(true);
    expect(hasFeature('subscription', 'radar')).toBe(true);
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
  it('Kollision wird mit Suffix aufgelöst', async () => {
    const taken = new Set(['acme', 'acme-1']);
    const slug = await buildUniqueSlug('acme', async (s) => taken.has(s));
    expect(slug).toBe('acme-2');
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
