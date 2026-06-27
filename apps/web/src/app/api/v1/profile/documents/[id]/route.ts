import { type StorageBucket, errors } from '@offero/core';

import { authenticate } from '@/app/api/v1/_lib/auth';
import { handleError, ok } from '@/app/api/v1/_lib/responses';
import { getServerContainer } from '@/lib/container';

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/v1/profile/documents/:id — eine Unterlage löschen (Storage + Datensatz).
export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { userId } = await authenticate(req);
    const { id } = await ctx.params;
    const { supabase, storage } = getServerContainer();

    const { data: row, error } = await supabase
      .from('user_document')
      .select('id, user_id, bucket, path')
      .eq('id', id)
      .maybeSingle();
    if (error) throw errors.internal(error.message);
    if (!row || row.user_id !== userId) throw errors.notFound('Unterlage nicht gefunden');

    await storage
      .remove({ bucket: row.bucket as StorageBucket, path: row.path as string })
      .catch(() => undefined);
    const { error: delErr } = await supabase.from('user_document').delete().eq('id', id);
    if (delErr) throw errors.internal(delErr.message);

    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
