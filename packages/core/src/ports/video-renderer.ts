import type { JobStatus, RendererId } from '../domain/enums';

// Spec ist DATEN (entspricht dem Goldstandard video-props.json), kein Renderer-Detail.
// MVP-Impl: FfmpegLiteRenderer (stumm, Golden-Era-Musik, nie Seedance). Remotion später, gleicher Port.
export interface VideoScene {
  imageRef?: string;
  imagePrompt?: string;
  caption?: string;
  durationSec: number;
}
export interface VideoBranding {
  colors: string[];
  fontFamily?: string;
}
export interface VideoOutro {
  ctaText: string;
  atSec: number;
}

export interface VideoRenderSpec {
  slug: string;
  durationSec: number;
  fps?: number;
  scenes: VideoScene[];
  music?: { trackId: string };
  branding?: VideoBranding;
  outro?: VideoOutro;
}

export interface VideoRenderHandle {
  jobId: string;
  renderer: RendererId;
}
export interface RenderStatus {
  status: JobStatus;
  storageRef?: string;
  error?: string;
}

export interface VideoRenderer {
  /** async: gibt ein Handle zurück (langlaufend, über Queue/Polling), nicht die Bytes. */
  render(spec: VideoRenderSpec): Promise<VideoRenderHandle>;
  status(handle: VideoRenderHandle): Promise<RenderStatus>;
}
