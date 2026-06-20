import { notImplemented } from '@/app/api/v1/_lib/responses';

// Öffentliche, veröffentlichte Version eines Tenants (Service-Role + Status-Filter, kein JWT). M8.
export function GET() {
  return notImplemented('Öffentliche Tenant-Auslieferung kommt in M8.');
}
