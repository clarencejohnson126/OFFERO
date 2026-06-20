import type { Profile } from '../domain/entities';
import { errors } from '../domain/errors';
import type { Repository } from '../ports/repository';

export class ProfileService {
  constructor(private readonly repo: Repository) {}

  /** Lazy-Init: profile + wallet anlegen, falls fehlen (kein auth-Trigger, ADR 0006). */
  async ensureInitialized(userId: string): Promise<void> {
    await this.repo.billing.initUser(userId);
  }

  async get(userId: string): Promise<Profile> {
    const profile = await this.repo.profiles.get(userId);
    if (!profile) throw errors.notFound('Profil nicht gefunden');
    return profile;
  }

  async update(userId: string, patch: Partial<Omit<Profile, 'userId'>>): Promise<Profile> {
    return this.repo.profiles.upsert(userId, patch);
  }
}
