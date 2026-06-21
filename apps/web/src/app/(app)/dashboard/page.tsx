'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

interface Plan {
  id: string;
  priceCents: number;
  credits: number | 'unlimited';
  features: string[];
}
interface ProfileResp {
  displayName: string | null;
  cvStructured: unknown;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileResp | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.getProfile().then((p) => setProfile(p as ProfileResp)).catch((e: unknown) =>
      setErr(e instanceof Error ? e.message : 'Fehler'),
    );
    api.plans().then((r) => setPlans((r as { plans: Plan[] }).plans ?? [])).catch(() => {});
  }, []);

  const hasCv = Boolean(profile?.cvStructured);

  return (
    <main className="container page">
      <p className="eyebrow">Dashboard</p>
      <h1>Deine Bewerbungen</h1>

      {!hasCv ? (
        <div className="card stack">
          <h3>Starte mit deinem Profil</h3>
          <p className="muted">
            Lade deinen Lebenslauf hoch — Offero strukturiert ihn, du bestätigst. Danach erstellst du
            deine erste Bewerbung (gratis).
          </p>
          <Link className="btn btn-primary" href="/profile">Profil einrichten →</Link>
        </div>
      ) : (
        <div className="card stack">
          <h3>Bereit für deine erste Bewerbung</h3>
          <p className="muted">
            Dein Profil steht. Die Bewerbungs-Generierung kommt im nächsten Schritt.
          </p>
          <button className="btn btn-primary" type="button" disabled>+ Neue Bewerbung (bald)</button>
        </div>
      )}
      {err && <p className="error">{err}</p>}

      <hr className="divider" />
      <h3>Pakete</h3>
      <div className="grid-2">
        {plans.map((p) => (
          <div className="card" key={p.id}>
            <div className="spread">
              <strong style={{ textTransform: 'capitalize' }}>{p.id}</strong>
              <span className="badge">
                {p.priceCents === 0 ? 'gratis' : `${(p.priceCents / 100).toFixed(2)} €`}
              </span>
            </div>
            <p className="muted" style={{ margin: '8px 0' }}>
              {p.credits === 'unlimited' ? 'unbegrenzt' : `${p.credits} Generierungen`}
            </p>
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {p.features.map((f) => (
                <span className="tag" key={f}>{f}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
