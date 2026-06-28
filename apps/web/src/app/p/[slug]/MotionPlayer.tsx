import { Player } from '@remotion/player';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Remotion-Motion-Intro: NUR React, läuft live im Browser über @remotion/player (kein Server-Rendering,
// kein Chrome/FFmpeg, kein VPS). Wird ausschließlich client-seitig geladen (dynamic ssr:false in
// MotionIntro.tsx) — daher landet weder remotion noch der Player im Server-Bundle.

// type (kein interface): so ist es zu Record<string, unknown> zuweisbar — Remotion-Player-Constraint.
export type MotionIntroProps = {
  name: string;
  role?: string;
  eyebrow?: string;
  pitch?: string;
  chips: string[];
  primary: string;
  secondary: string;
};

const FPS = 30;
const DURATION = 15 * FPS; // 450 Frames ≈ 15s

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

function IntroComp({ name, role, eyebrow, pitch, chips, primary, secondary }: MotionIntroProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = (start: number, dy = 24) => ({
    opacity: interpolate(frame, [start, start + 16], [0, 1], clamp),
    transform: `translateY(${interpolate(frame, [start, start + 16], [dy, 0], clamp)}px)`,
  });
  const bgX = interpolate(frame, [0, DURATION], [38, 64]); // sanfter Lichtdrift

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${primary}, ${secondary})`,
        color: '#fff',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 55% at ${bgX}% 22%, rgba(255,255,255,0.18), transparent 70%)`,
        }}
      />
      <AbsoluteFill style={{ padding: 88, justifyContent: 'center' }}>
        {eyebrow ? (
          <div
            style={{
              ...appear(6),
              textTransform: 'uppercase',
              letterSpacing: 3,
              fontSize: 22,
              opacity: 0.85,
              marginBottom: 14,
            }}
          >
            {eyebrow}
          </div>
        ) : null}
        <div style={{ ...appear(14), fontSize: 78, fontWeight: 800, lineHeight: 1.05, maxWidth: 1040 }}>
          {name}
        </div>
        {role ? (
          <div style={{ ...appear(30), fontSize: 32, fontWeight: 500, opacity: 0.92, marginTop: 14 }}>
            {role}
          </div>
        ) : null}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 38 }}>
          {chips.slice(0, 5).map((c, i) => {
            const s = spring({ frame: frame - (90 + i * 7), fps, config: { damping: 16 } });
            return (
              <div
                key={i}
                style={{
                  opacity: s,
                  transform: `scale(${0.85 + s * 0.15})`,
                  border: '1px solid rgba(255,255,255,0.45)',
                  borderRadius: 100,
                  padding: '9px 18px',
                  fontSize: 21,
                }}
              >
                {c}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {pitch ? (
        <div
          style={{
            position: 'absolute',
            bottom: 72,
            left: 88,
            right: 88,
            fontSize: 26,
            lineHeight: 1.4,
            maxWidth: 1040,
            opacity: interpolate(frame, [300, 322], [0, 0.92], clamp),
            transform: `translateY(${interpolate(frame, [300, 322], [16, 0], clamp)}px)`,
          }}
        >
          {pitch}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

export default function MotionPlayer(props: MotionIntroProps) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 12px 44px rgba(0,0,0,0.28)' }}>
      <Player
        component={IntroComp}
        inputProps={props}
        durationInFrames={DURATION}
        fps={FPS}
        compositionWidth={1280}
        compositionHeight={720}
        style={{ width: '100%' }}
        controls
        autoPlay
        loop
      />
    </div>
  );
}
