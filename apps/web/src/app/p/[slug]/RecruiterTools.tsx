'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';

// Template-agnostische, zurückhaltende Recruiter-Werkzeuge auf der öffentlichen Bewerbungs-Seite
// (ADR 0012 §5/§7): (1) transparenter, cookieless View-Ping an /r/[slug] inkl. Verweildauer;
// (2) grounded „Frag mich"-Q&A, das AUSSCHLIESSLICH aus dem echten Material antwortet (POST .../ask).
// Schwebend unten rechts, eingeklappt by default — kein Overload, eigene Inline-Styles (themen-neutral).

export function RecruiterTools({ applicationId, slug }: { applicationId: string; slug: string }) {
  const startedAt = useRef<number>(0);
  const durationSent = useRef<boolean>(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Transparenter View-Ping: einmal beim Laden, Verweildauer beim Verlassen/Verbergen (best effort).
  useEffect(() => {
    startedAt.current = Date.now();
    durationSent.current = false;
    void fetch(`/r/${encodeURIComponent(slug)}`, { method: 'GET', cache: 'no-store' }).catch(() => {});
    // Dedupe-Garantie: HÖCHSTENS EIN Verweildauer-Beacon pro Seitenaufruf. Mehrfaches
    // Verbergen/Anzeigen (visibilitychange feuert mehrfach) darf NICHT mehrere duration-Zeilen
    // erzeugen, sonst verfälschen Teil-Dauern desselben Besuchs den Mittelwert (analytics-Route).
    // Wir senden die GESAMTE sichtbare Dauer seit Laden — beim ersten hidden bzw. pagehide.
    const sendDuration = () => {
      if (durationSent.current) return;
      const d = Date.now() - startedAt.current;
      if (d < 1000) return;
      durationSent.current = true; // sofort sperren — auch wenn der Versand fehlschlägt, kein zweiter Beacon
      const beaconUrl = `/r/${encodeURIComponent(slug)}?d=${Math.min(d, 1_800_000)}`;
      // sendBeacon ist der zuverlässige Weg beim Entladen; Fallback auf keepalive-fetch.
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          if (navigator.sendBeacon(beaconUrl)) return;
        } catch {
          // Fällt unten auf fetch zurück.
        }
      }
      void fetch(beaconUrl, { method: 'GET', cache: 'no-store', keepalive: true }).catch(() => {});
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') sendDuration();
    };
    // pagehide deckt echtes Entladen/Navigation ab (auch wenn visibilitychange ausbleibt, z. B. iOS-BFCache).
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', sendDuration);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', sendDuration);
    };
  }, [slug]);

  async function ask(e: FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setAnswer(null);
    try {
      const res = await fetch(`/api/v1/applications/${applicationId}/ask`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: { message?: string } };
      setAnswer(data.answer ?? data.error?.message ?? 'Im Moment nicht verfügbar.');
    } catch {
      setAnswer('Im Moment nicht verfügbar.');
    } finally {
      setBusy(false);
    }
  }

  const panel: React.CSSProperties = {
    position: 'fixed',
    right: 16,
    bottom: 16,
    zIndex: 2147483000,
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  };

  if (!open) {
    return (
      <div style={panel}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            cursor: 'pointer',
            border: '1px solid rgba(0,0,0,0.15)',
            background: '#111',
            color: '#fff',
            borderRadius: 999,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
          }}
        >
          Diese Bewerbung fragen
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...panel, width: 320, maxWidth: 'calc(100vw - 32px)' }}>
      <div
        style={{
          background: '#fff',
          color: '#1a1a1a',
          border: '1px solid rgba(0,0,0,0.15)',
          borderRadius: 12,
          boxShadow: '0 10px 40px rgba(0,0,0,0.28)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#111',
            color: '#fff',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>Frag diese Bewerbung</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Schließen"
            style={{ cursor: 'pointer', background: 'transparent', border: 0, color: '#fff', fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 12 }}>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#666' }}>
            Antworten stammen ausschließlich aus dem Bewerbungs-Material — nichts wird erfunden.
          </p>
          <form onSubmit={ask} style={{ display: 'flex', gap: 6 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={400}
              placeholder="z. B. Erfahrung mit Kubernetes?"
              style={{
                flex: 1,
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
              }}
            />
            <button
              type="submit"
              disabled={busy}
              style={{
                cursor: busy ? 'default' : 'pointer',
                border: 0,
                background: '#111',
                color: '#fff',
                borderRadius: 8,
                padding: '0 12px',
                fontSize: 13,
                fontWeight: 600,
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? '…' : 'Fragen'}
            </button>
          </form>
          {answer && (
            <p
              style={{
                margin: '10px 0 0',
                fontSize: 13,
                lineHeight: 1.5,
                color: '#1a1a1a',
                background: '#f5f5f4',
                border: '1px solid #e7e5e4',
                borderRadius: 8,
                padding: '8px 10px',
              }}
            >
              {answer}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
