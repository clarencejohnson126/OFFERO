import type { Profile } from '@offero/core';

import type { RequestFn } from '../client';

export class ProfileResource {
  constructor(private readonly request: RequestFn) {}

  get(): Promise<Profile> {
    return this.request('GET', '/api/v1/profile');
  }

  update(patch: Partial<Omit<Profile, 'userId'>>): Promise<Profile> {
    return this.request('PUT', '/api/v1/profile', patch);
  }
}
