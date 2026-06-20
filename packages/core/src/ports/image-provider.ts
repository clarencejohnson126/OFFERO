import type { StorageRef } from '../domain/enums';

export type AspectRatio = '1:1' | '16:9' | '3:4' | '9:16';

export interface ImageGenRequest {
  prompt: string;
  aspectRatio?: AspectRatio;
  /** z. B. Profilfoto als Referenz. */
  referenceImageRef?: StorageRef;
  count?: number;
}

export interface GeneratedImage {
  bytes: Uint8Array;
  mimeType: string;
  meta: Record<string, unknown>;
}

export interface ImageGenResult {
  images: GeneratedImage[];
  costCents: number;
}

export interface ImageProvider {
  generate(req: ImageGenRequest): Promise<ImageGenResult>;
}
