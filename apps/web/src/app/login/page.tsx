'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { supabaseBrowser } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="container-narrow page">
      <Link href="/" className="brand" style={{ display: 'inline-block', marginBottom: 'var(--sp-6)' }}>
        offero
      </Link>
      <h1 style={{ fontSize: '2rem' }}>Willkommen zurück</h1>
      <p className="muted">Melde dich an, um an deinen Bewerbungen weiterzuarbeiten.</p>

      <form className="card stack" onSubmit={onSubmit} style={{ marginTop: 'var(--sp-5)' }}>
        <div>
          <label className="label" htmlFor="email">E-Mail</label>
          <input id="email" className="input" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Passwort</label>
          <input id="pw" className="input" type="password" autoComplete="current-password" required
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy} type="submit">
          {busy ? 'Anmelden…' : 'Anmelden'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
        Noch kein Konto? <Link href="/signup">Erste Bewerbung gratis</Link>
      </p>
    </main>
  );
}
