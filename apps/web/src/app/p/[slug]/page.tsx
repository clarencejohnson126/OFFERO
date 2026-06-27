import type { Section } from '@offero/core';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getServerContainer } from '@/lib/container';

import { RecruiterTools } from './RecruiterTools';
import { templateComponent } from './templates/registry';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

// Pro Request memoisiert (Metadata + Page teilen einen DB-Zugriff).
const loadSite = cache(async (slug: string) => {
  const { applicationService } = getServerContainer();
  return applicationService.getPublic(slug);
});

function heroOf(sections: Section[]) {
  return sections.find((s): s is Extract<Section, { type: 'hero' }> => s.type === 'hero');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await loadSite(slug);
  if (!site) return { title: 'Bewerbung nicht gefunden' };
  const hero = heroOf(site.content.sections);
  // PII-Schutz (ADR 0012 / Task #35): öffentliche Bewerbungen standardmäßig nicht indexieren.
  const noindex = site.content.meta?.noindex !== false;
  return {
    title: hero ? `${hero.name} — Bewerbung` : 'Bewerbung',
    description: hero?.pitch,
    robots: noindex ? { index: false, follow: false } : undefined,
  };
}

// Tenant-Rendering: die generierte Bewerbung als eigenständige Website (aus der DB, Service-Role).
export default async function PublicSitePage({ params }: Props) {
  const { slug } = await params;
  const site = await loadSite(slug);
  if (!site) notFound();
  const Template = templateComponent(site.application.template);
  return (
    <>
      <Template content={site.content} />
      <RecruiterTools applicationId={site.application.id} slug={slug} />
    </>
  );
}
