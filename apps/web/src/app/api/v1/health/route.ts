import { ok } from '@/app/api/v1/_lib/responses';

export function GET() {
  return ok({ status: 'ok', service: 'offero-api', version: 'v1' });
}
