import type { Application, ApplicationStatus, GenerationVersion, Json } from '@offero/core';

import type { RequestFn } from '../client';

export interface CreateApplicationBody {
  jobUrl?: string;
  jobText?: string;
  titleHint?: string;
  /** Rendering-Variante (Template-ID, siehe TEMPLATE_CATALOG). */
  template?: string;
  company?: Json;
}

/** GET /api/v1/applications/:id/status — Polling-Antwort. */
export interface ApplicationStatusResponse {
  status: ApplicationStatus;
  currentVersionId: string | null;
}

export class ApplicationsResource {
  constructor(private readonly request: RequestFn) {}

  async list(): Promise<Application[]> {
    const { applications } = await this.request<{ applications: Application[] }>(
      'GET',
      '/api/v1/applications',
    );
    return applications;
  }

  async get(id: string): Promise<{ application: Application; version: GenerationVersion | null }> {
    return this.request('GET', `/api/v1/applications/${id}`);
  }

  async create(body: CreateApplicationBody): Promise<Application> {
    const { application } = await this.request<{ application: Application }>(
      'POST',
      '/api/v1/applications',
      body,
    );
    return application;
  }

  async remove(id: string): Promise<{ ok: true }> {
    return this.request('DELETE', `/api/v1/applications/${id}`);
  }

  async generate(id: string): Promise<{ application: Application; version: GenerationVersion }> {
    return this.request('POST', `/api/v1/applications/${id}/generate`);
  }

  async status(id: string): Promise<ApplicationStatusResponse> {
    return this.request('GET', `/api/v1/applications/${id}/status`);
  }
}
