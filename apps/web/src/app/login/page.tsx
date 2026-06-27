'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { Button, Input, Label } from '@/components/ui';
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
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <div className="glow-orb -top-10 left-1/4 size-72 bg-brand/25" aria-hidden />
      <div className="glow-orb bottom-0 right-1/4 size-72 bg-brand-2/20" aria-hidden />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-[17px] font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-brand text-xs font-bold text-white">
            O
          </span>
          Offero
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient">Willkommen zurück</h1>
        <p className="mt-1.5 text-sm text-muted">Melde dich an, um weiterzuarbeiten.</p>

        <form onSubmit={onSubmit} className="glass mt-6 space-y-4 rounded-2xl p-6">
          <div>
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" type="email" autoComplete="email" required placeholder="du@beispiel.de"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pw">Passwort</Label>
            <Input id="pw" type="password" autoComplete="current-password" required
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Anmelden…' : 'Anmelden'}
            {!busy && <ArrowRight className="size-4" />}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Noch kein Konto?{' '}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Erste Bewerbung gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
