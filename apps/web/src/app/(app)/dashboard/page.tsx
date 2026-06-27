'use client';

import { ArrowRight, Check, FileText, Gift, Plus, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge, Button } from '@/components/ui';
import { api } from '@/lib/api';

const featureLabels: Record<string, string> = {
  text: 'Text & Struktur',
  pdf: 'PDF-Export',
  unlimited_refine: 'Unbegrenzter Feinschliff',
  images: 'KI-Bilder',
  branding: 'Firmen-Branding',
  premium_templates: 'Premium-Templates',
  video: '60-Sekunden-Video',
  custom_domain: 'Eigene Domain',
  radar: 'Recruiter-Radar',
};

const recommended = 'plus';

interface Plan {
  id: string;
  priceCents: number;
  credits: number | 'unlimited';
  features: string[];
}

interface AppRow {
  id: string;
  tenantSlug: string;
  status: string;
  company: { name?: string } | null;
}

const statusLabel: Record<string, string> = {
  draft: 'Entwurf',
  generating: 'generiert…',
  ready: 'fertig',
  shared: 'geteilt',
  archived: 'archiviert',
};

export default function DashboardPage() {
  const [hasCv, setHasCv] = useState<boolean | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [views, setViews] = useState<Record<string, number>>({});

  useEffect(() => {
    api
      .getProfile()
      .then((p) => setHasCv(Boolean((p as { cvStructured: unknown }).cvStructured)))
      .catch(() => setHasCv(false));
    api.plans().then((r) => setPlans((r as { plans: Plan[] }).plans ?? [])).catch(() => {});
    api
      .listApplications()
      .then((r) => setApps((r as { applications: AppRow[] }).applications ?? []))
      .catch(() => {});
  }, []);

  // Transparente View-Analytics je veröffentlichter Bewerbung (ADR 0012 §7).
  useEffect(() => {
    for (const a of apps) {
      if (a.status !== 'ready' && a.status !== 'shared') continue;
      api
        .getAnalytics(a.id)
        .then((r) => {
          const d = r as { views?: number };
          setViews((v) => ({ ...v, [a.id]: d.views ?? 0 }));
        })
        .catch(() => {});
    }
  }, [apps]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-fg">Übersicht</h1>
          <p className="mt-1.5 text-sm text-muted">Deine Bewerbungen und dein Plan.</p>
        </div>
        <Link href="/new">
          <Button>
            <Plus className="size-4" /> Neue Bewerbung
          </Button>
        </Link>
      </div>

      {/* Stat-Tiles */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Gift, label: 'Gratis-Generierung', value: '1', sub: 'verfügbar' },
          { icon: Zap, label: 'Aktueller Plan', value: 'Free', sub: 'Text & PDF' },
          { icon: FileText, label: 'Bewerbungen', value: String(apps.length), sub: 'erstellt' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-faint uppercase">
              <s.icon className="size-3.5 text-brand" /> {s.label}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-fg">{s.value}</span>
              <span className="text-sm text-muted">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Onboarding / Ready Hero */}
      <div className="relative mt-6 overflow-hidden rounded-md border border-brand-line bg-brand-soft p-7">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand border border-brand-line">
            <Sparkles className="size-6" />
          </div>
          <div className="flex-1">
            {hasCv ? (
              <>
                <h3 className="text-base font-semibold text-fg">Bereit für deine nächste Bewerbung</h3>
                <p className="mt-1 text-sm text-muted">
                  Dein Profil steht — füg eine Stellenanzeige ein und generiere deine Bewerbungs-Website.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-base font-semibold text-fg">Starte mit deinem Profil</h3>
                <p className="mt-1 max-w-lg text-sm text-muted">
                  Lade deinen Lebenslauf hoch — die KI strukturiert ihn, du bestätigst. Danach erstellst du
                  deine erste Bewerbung gratis.
                </p>
              </>
            )}
          </div>
          {hasCv ? (
            <Link href="/new">
              <Button>
                Neue Bewerbung <ArrowRight className="size-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/profile">
              <Button>
                Profil einrichten <ArrowRight className="size-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Bewerbungs-Liste */}
      {apps.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight text-fg">Deine Bewerbungen</h2>
          <div className="mt-4 grid gap-3">
            {apps.map((a) => (
              <div
                key={a.id}
                className="glass flex items-center justify-between gap-4 rounded-xl px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">
                    {a.company?.name ?? a.tenantSlug}
                  </p>
                  <p className="font-mono text-xs text-faint">/p/{a.tenantSlug}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {(a.status === 'ready' || a.status === 'shared') && views[a.id] !== undefined && (
                    <span className="text-xs text-faint" title="Seitenaufrufe">
                      👁 {views[a.id]}
                    </span>
                  )}
                  <span className="text-xs text-muted">{statusLabel[a.status] ?? a.status}</span>
                  {(a.status === 'ready' || a.status === 'shared') && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void api.downloadExport(a.id, 'pdf', `${a.tenantSlug}-ats.pdf`)}
                      >
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void api.downloadExport(a.id, 'docx', `${a.tenantSlug}-ats.docx`)}
                      >
                        DOCX
                      </Button>
                      <Link href={`/p/${a.tenantSlug}`} target="_blank">
                        <Button size="sm" variant="secondary">
                          Ansehen <ArrowRight className="size-3.5" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pakete */}
      <div className="mt-14">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-fg">Pakete</h2>
          <span className="text-sm text-muted">Bezahle pro Bewerbung — oder im Abo.</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => {
            const isRec = p.id === recommended;
            return (
              <div
                key={p.id}
                className={cnCard(isRec)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize text-fg">{p.id}</span>
                  {p.id === 'free' && <Badge>Dein Plan</Badge>}
                  {isRec && (
                    <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Beliebt
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight text-fg">
                    {p.priceCents === 0 ? '0 €' : `${(p.priceCents / 100).toFixed(2)} €`}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {p.credits === 'unlimited' ? 'unbegrenzte Generierungen' : `${p.credits} Generierungen`}
                </p>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-fg-soft">
                      <span className="grid size-4 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                        <Check className="size-3" />
                      </span>
                      {featureLabels[f] ?? f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function cnCard(isRec: boolean): string {
  return [
    'relative flex flex-col overflow-hidden rounded-md border bg-bg p-6',
    isRec ? 'border-brand-line bg-brand-soft' : 'border-line',
  ].join(' ');
}
