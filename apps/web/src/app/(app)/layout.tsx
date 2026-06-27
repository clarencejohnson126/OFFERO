'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';

import { cn } from '@/lib/cn';
import { supabaseBrowser } from '@/lib/supabase-browser';

// Katalog-Sidebar (McMaster-Ethos): grau, blaue Links, UPPERCASE-Section-Header, aktiver Eintrag
// fett + oranger Links-Border. Backend/Auth-Logik unverändert — nur das Shell-Layout ist neu.
const navSections = [
  {
    title: 'Bewerbung',
    items: [
      { href: '/dashboard', label: 'Übersicht' },
      { href: '/new', label: 'Neue Bewerbung' },
    ],
  },
  {
    title: 'Konto',
    items: [{ href: '/profile', label: 'Profil' }],
  },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const sb = supabaseBrowser();
    void sb.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/login');
        return;
      }
      setEmail(data.session.user.email ?? null);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace('/login');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.replace('/login');
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    router.push('/new');
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="size-5 animate-spin rounded-full border-2 border-line border-t-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg">
      {/* Top-Leiste: olive + oranger 3px-Top-Border */}
      <header className="border-t-[3px] border-t-[#c98a2b] bg-[#3a3f33] text-white">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-3.5 py-2">
          <Link href="/dashboard" className="text-[19px] font-bold tracking-tight whitespace-nowrap text-white hover:no-underline">
            OFFER<span className="text-[#e6a23c]">O</span>
          </Link>
          <form onSubmit={onSearch} className="flex flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Stellenanzeige oder Stichwort eingeben…"
              className="flex-1 border border-[#888] border-r-0 bg-white px-2.5 py-1.5 text-[13px] text-fg placeholder:text-faint focus:outline-none"
            />
            <button
              type="submit"
              className="cursor-pointer border border-brand-line bg-brand px-4 font-bold text-white hover:bg-[#c5811f]"
            >
              Suchen
            </button>
          </form>
          <span className="hidden text-[12px] whitespace-nowrap text-[#dfe2d8] sm:inline">
            {email ? <span className="text-[#dfe2d8]">{email}</span> : null}
            {' · '}
            <button onClick={logout} type="button" className="cursor-pointer text-white hover:underline">
              Abmelden
            </button>
          </span>
        </div>
      </header>

      {/* Breadcrumb-Subbar */}
      <div className="border-b border-[#c9c6bd] bg-[#eceae4] text-[12px] text-muted">
        <div className="mx-auto max-w-[1180px] px-3.5 py-1.5">
          Start &rsaquo; <span className="font-medium text-fg">{breadcrumbFor(pathname)}</span>
        </div>
      </div>

      {/* Sidebar + Main */}
      <div className="mx-auto flex max-w-[1180px] items-start">
        <nav className="w-[212px] flex-none border-r border-line bg-bg-soft py-2.5 pb-10">
          {navSections.map((sec) => (
            <div key={sec.title}>
              <h4 className="mt-3.5 mb-1 px-3 pb-0.5 text-[11px] font-normal tracking-wider text-faint uppercase border-b border-[#ddd9cf] mx-3">
                {sec.title}
              </h4>
              <ul className="m-0 list-none p-0">
                {sec.items.map((it) => {
                  const active = pathname === it.href;
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          'block py-[3px] pr-3 text-[12.5px] hover:bg-[#e7e4db] hover:no-underline',
                          active
                            ? 'border-l-[3px] border-l-[#c98a2b] bg-[#e1ddd0] pl-[15px] font-bold text-fg'
                            : 'pl-[18px] text-link',
                        )}
                      >
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <main className="min-w-0 flex-1 px-5.5 py-4 pb-14">{children}</main>
      </div>
    </div>
  );
}

function breadcrumbFor(pathname: string): string {
  if (pathname.startsWith('/new')) return 'Neue Bewerbung';
  if (pathname.startsWith('/profile')) return 'Profil';
  return 'Übersicht';
}
