import { createRequest, type OfferoClientOptions } from './client';
import { ApplicationsResource } from './resources/applications';
import { BillingResource } from './resources/billing';
import { ProfileResource } from './resources/profile';

/** Ein Client, den Web & Mobile teilen. Alle Aktionen sind /api/v1-Calls (mobil-sicher). */
export class OfferoClient {
  readonly profile: ProfileResource;
  readonly applications: ApplicationsResource;
  readonly billing: BillingResource;

  constructor(opts: OfferoClientOptions) {
    const request = createRequest(opts);
    this.profile = new ProfileResource(request);
    this.applications = new ApplicationsResource(request);
    this.billing = new BillingResource(request);
  }
}
