import type { StorageBucket, StorageRef } from '../domain/enums';

export interface Storage {
  upload(
    bucket: StorageBucket,
    path: string,
    bytes: Uint8Array,
    contentType: string,
  ): Promise<StorageRef>;
  createSignedUrl(ref: StorageRef, expiresInSec: number): Promise<string>;
  /** Öffentliche URL für Assets in public-read Buckets (image/video/pdf). Kennt das Bucket-Mapping. */
  publicUrl(ref: StorageRef): string;
  download(ref: StorageRef): Promise<Uint8Array>;
  /** Harte Löschung (DSGVO, Constitution Art. III). */
  remove(ref: StorageRef): Promise<void>;
}
