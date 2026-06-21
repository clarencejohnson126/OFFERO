'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { supabaseBrowser } from '@/lib/supabase-browser';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { data, error: err } = await supabaseBrowser().auth.signUp({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.session) {
      router.push('/dashboard');
    } else {
      setConfirmSent(true); // E-Mail-Bestätigung aktiv
    }
  }

  if (confirmSent) {
    return (
      <main className="container-narrow page">
        <Link href="/" className="brand" style={{ display: 'inline-block', marginBottom: 'var(--sp-6)' }}>
          offero
        </Link>
        <h1 style={{ fontSize: '2rem' }}>Fast geschafft</h1>
        <p className="notice">
          Wir haben dir eine Bestätigungs-Mail an <strong>{email}</strong> geschickt. Bestätige sie, dann
          kannst du dich anmelden.
        </p>
        <p className="muted" style={{ marginTop: 'var(--sp-4)' }}>
          <Link href="/login">Zur Anmeldung</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="container-narrow page">
      <Link href="/" className="brand" style={{ display: 'inline-block', marginBottom: 'var(--sp-6)' }}>
        offero
      </Link>
      <h1 style={{ fontSize: '2rem' }}>Erste Bewerbung gratis</h1>
      <p className="muted">Konto anlegen — keine Kreditkarte, du bestätigst alles selbst.</p>

      <form className="card stack" onSubmit={onSubmit} style={{ marginTop: 'var(--sp-5)' }}>
        <div>
          <label className="label" htmlFor="email">E-Mail</label>
          <input id="email" className="input" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="pw">Passwort</label>
          <input id="pw" className="input" type="password" autoComplete="new-password" required minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className="muted" style={{ fontSize: '0.82rem' }}>Mindestens 8 Zeichen.</span>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy} type="submit">
          {busy ? 'Konto wird angelegt…' : 'Kostenlos starten'}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
        Schon ein Konto? <Link href="/login">Anmelden</Link>
      </p>
    </main>
  );
}
