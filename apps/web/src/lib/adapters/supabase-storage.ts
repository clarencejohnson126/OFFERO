import 'server-only';

import { type Storage, type StorageBucket, type StorageRef, errors } from '@offero/core';

import type { DbClient } from '../supabase-server';

// Physische Bucket-IDs sind offero--präfigiert (geteiltes Projekt); logische Bucket-Namen kommen aus core.
const physBucket = (b: StorageBucket) => `offero-${b}`;

export class SupabaseStorage implements Storage {
  constructor(private readonly db: DbClient) {}

  async upload(
    bucket: StorageBucket,
    path: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<StorageRef> {
    const { error } = await this.db.storage
      .from(physBucket(bucket))
      .upload(path, bytes, { contentType, upsert: true });
    if (error) throw errors.internal(error.message);
    return { bucket, path };
  }

  async createSignedUrl(ref: StorageRef, expiresInSec: number): Promise<string> {
    const { data, error } = await this.db.storage
      .from(physBucket(ref.bucket))
      .createSignedUrl(ref.path, expiresInSec);
    if (error || !data) throw errors.internal(error?.message ?? 'Signed-URL fehlgeschlagen');
    return data.signedUrl;
  }

  async remove(ref: StorageRef): Promise<void> {
    const { error } = await this.db.storage.from(physBucket(ref.bucket)).remove([ref.path]);
    if (error) throw errors.internal(error.message);
  }
}
