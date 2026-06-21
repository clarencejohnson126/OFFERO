import { parseProfileUpdate } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

export async function GET(req: Request) {
  try {
    const { userId } = await authenticate(req);
    const { profileService } = getServerContainer();
    await profileService.ensureInitialized(userId); // legt profile+wallet lazy an
    return ok(await profileService.get(userId));
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const { userId } = await authenticate(req);
    const patch = parseProfileUpdate(await req.json());
    const { profileService } = getServerContainer();
    await profileService.ensureInitialized(userId);
    return ok(await profileService.update(userId, patch));
  } catch (e) {
    return handleError(e);
  }
}
