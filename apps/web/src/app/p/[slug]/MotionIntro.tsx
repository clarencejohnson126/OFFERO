'use client';

import dynamic from 'next/dynamic';

import type { MotionIntroProps } from './MotionPlayer';

// Lädt den Remotion-Player NUR im Browser (ssr:false) → remotion landet nicht im Server-Bundle und
// rendert nicht serverseitig. Bis er geladen ist, steht ein 16:9-Platzhalter.
const Inner = dynamic(() => import('./MotionPlayer'), {
  ssr: false,
  loading: () => (
    <div style={{ aspectRatio: '16 / 9', width: '100%', background: '#0a0d14', borderRadius: 16 }} />
  ),
});

export function MotionIntro(props: MotionIntroProps) {
  return <Inner {...props} />;
}
