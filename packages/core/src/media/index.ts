import { errors } from '../domain/errors';
import type { ImageProvider } from '../ports/image-provider';
import type { Repository } from '../ports/repository';
import type { VideoRenderer } from '../ports/video-renderer';

export interface MediaDeps {
  repo: Repository;
  images?: ImageProvider;
  video?: VideoRenderer;
}

/** Medien-Orchestrierung (KI-Bilder Plus+, Video Pro/Abo) — async über Queue. Impl in M7. */
export class MediaService {
  constructor(private readonly deps: MediaDeps) {}

  imagesAvailable(): boolean {
    return Boolean(this.deps.images);
  }

  videoAvailable(): boolean {
    return Boolean(this.deps.video);
  }

  async generateImages(): Promise<never> {
    throw errors.notImplemented('KI-Bilder kommen im Medien-Slice (M7).');
  }

  async renderVideo(): Promise<never> {
    throw errors.notImplemented('Video kommt im Medien-Slice (M7).');
  }
}
