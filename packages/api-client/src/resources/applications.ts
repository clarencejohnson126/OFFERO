import type { Application } from '@offero/core';

import type { RequestFn } from '../client';

export interface CreateApplicationBody {
  jobUrl?: string;
  jobText?: string;
  titleHint?: string;
}

export interface JobStatusResponse {
  status: 'queued' | 'running' | 'ready' | 'error';
}

export class ApplicationsResource {
  constructor(private readonly request: RequestFn) {}

  list(): Promise<Application[]> {
    return this.request('GET', '/api/v1/applications');
  }

  get(id: string): Promise<Application> {
    return this.request('GET', `/api/v1/applications/${id}`);
  }

  create(body: CreateApplicationBody): Promise<Application> {
    return this.request('POST', '/api/v1/applications', body);
  }

  remove(id: string): Promise<void> {
    return this.request('DELETE', `/api/v1/applications/${id}`);
  }

  generate(id: string): Promise<JobStatusResponse> {
    return this.request('POST', `/api/v1/applications/${id}/generate`);
  }

  reroll(id: string): Promise<JobStatusResponse> {
    return this.request('POST', `/api/v1/applications/${id}/reroll`);
  }

  status(id: string): Promise<JobStatusResponse> {
    return this.request('GET', `/api/v1/applications/${id}/status`);
  }
}
