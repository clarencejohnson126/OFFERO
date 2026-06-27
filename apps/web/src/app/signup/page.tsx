'use client';

import { ArrowRight, Check, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button, Input, Label } from '@/components/ui';
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
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    if (data.session) {
      setBusy(false);
      router.push('/dashboard');
      return;
    }
    // Konten werden in diesem Projekt automatisch bestätigt (auto_confirm_email_trigger) → es kommt
    // KEINE Bestätigungs-Mail und sie ist nicht nötig. Also direkt einloggen; nur falls das scheitert
    // (z. B. Konto existiert bereits mit anderem Passwort), einen klaren Hinweis zeigen.
    const { data: signIn, error: signErr } = await supabaseBrowser().auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (signIn.session) {
      router.push('/dashboard');
      return;
    }
    if (signErr && /invalid login/i.test(signErr.message)) {
      setError('Dieses Konto gibt es schon. Bitte melde dich an oder wähle ein anderes Passwort.');
      return;
    }
    setConfirmSent(true);
  }

  if (confirmSent) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
            <MailCheck className="size-5" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Fast geschafft</h1>
          <p className="mt-2 text-sm text-muted">
            Wir haben dir eine Bestätigungs-Mail an <span className="font-medium text-fg">{email}</span>{' '}
            geschickt. Bestätige sie, dann kannst du dich anmelden.
          </p>
          <Link href="/login" className="mt-5 inline-block text-sm font-medium text-brand hover:underline">
            Zur Anmeldung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <div className="glow-orb -top-10 left-1/4 size-72 bg-brand/25" aria-hidden />
      <div className="glow-orb bottom-0 right-1/4 size-72 bg-accent/15" aria-hidden />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-brand text-xs font-bold text-white">
            O
          </span>
          Offero
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient">Erste Bewerbung gratis</h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <Check className="size-4 text-success" /> Keine Kreditkarte · du bestätigst alles selbst
        </p>

        <form onSubmit={onSubmit} className="glass mt-6 space-y-4 rounded-2xl p-6">
          <div>
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" autoComplete="email" required placeholder="du@beispiel.de"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pw">Passwort</Label>
            <Input id="pw" type="password" autoComplete="new-password" required minLength={8}
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="mt-1.5 text-xs text-faint">Mindestens 8 Zeichen.</p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Konto wird angelegt…' : 'Kostenlos starten'}
            {!busy && <ArrowRight className="size-4" />}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Schon ein Konto?{' '}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
