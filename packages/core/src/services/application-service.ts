import { CreditService } from '../billing/credit-service';
import type { Application } from '../domain/entities';
import { errors } from '../domain/errors';
import type { Json } from '../domain/json';
import type { Repository } from '../ports/repository';
import { buildUniqueSlug } from '../tenancy/slug';

export interface CreateApplicationInput {
  jobUrl?: string;
  jobText?: string;
  /** z. B. "Firma Rolle" — Basis für den Tenant-Slug. */
  titleHint?: string;
  company?: Json;
}

export class ApplicationService {
  private readonly credits: CreditService;

  constructor(private readonly repo: Repository) {
    this.credits = new CreditService(repo.billing);
  }

  async list(userId: string): Promise<Application[]> {
    return this.repo.applications.listByUser(userId);
  }

  async get(userId: string, id: string): Promise<Application> {
    const app = await this.repo.applications.get(id);
    if (!app || app.userId !== userId) throw errors.notFound('Bewerbung nicht gefunden');
    return app;
  }

  async create(userId: string, input: CreateApplicationInput): Promise<Application> {
    await this.credits.ensureUser(userId);
    const base = input.titleHint ?? input.jobUrl ?? 'bewerbung';
    const slug = await buildUniqueSlug(
      base,
      async (candidate) => (await this.repo.applications.getBySlug(candidate)) !== null,
    );
    return this.repo.applications.create({
      userId,
      tenantSlug: slug,
      jobUrl: input.jobUrl ?? null,
      jobText: input.jobText ?? null,
      company: input.company ?? {},
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id); // Ownership-Check
    await this.repo.applications.delete(id);
  }

  /** Text-Generierung (−1 Credit) kommt in M4. */
  async generate(): Promise<never> {
    throw errors.notImplemented('Text-Generierung kommt in M4.');
  }
}
