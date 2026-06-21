'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

import { supabaseBrowser } from '@/lib/supabase-browser';

// Authentifizierte Shell: client-seitiger Auth-Gate (redirect → /login) + Editorial-Nav.
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    void sb.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.replace('/login');
  }

  if (!ready) {
    return (
      <main className="container page">
        <p className="muted">Lädt…</p>
      </main>
    );
  }

  return (
    <div>
      <nav className="nav">
        <div className="container">
          <Link href="/dashboard" className="brand">offero</Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/profile">Profil</Link>
            <button className="btn btn-ghost" onClick={logout} type="button">Abmelden</button>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
