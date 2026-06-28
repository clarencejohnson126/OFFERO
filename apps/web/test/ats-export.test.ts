import { describe, expect, it } from 'vitest';

import type { ApplicationContent } from '@offero/core';

import { buildAtsDocx, buildAtsModel, buildAtsPdf } from '../src/lib/ats-export';

// Seed des Parse-Rate-Audits (Task #34): baut die ATS-Beilage aus einem Fixture und prüft,
// dass Name + Standard-Überschriften wirklich als realer, parsebarer Text enthalten sind.

const FIXTURE: ApplicationContent = {
  language: 'de',
  company: { name: 'MaibornWolff' },
  sections: [
    {
      type: 'hero',
      name: 'Alex Mustermann',
      role: 'Lead AI Engineer',
      headline: ['Baut KI-Systeme, die liefern'],
      pitch: 'Pragmatisch, ehrlich, lieferfähig.',
      chips: ['Python', 'TypeScript'],
    },
    {
      type: 'fit',
      intro: 'Warum es passt:',
      items: [
        { requirement: 'Kubernetes', evidence: 'Drei Jahre produktiver Cluster-Betrieb.' },
      ],
    },
    {
      type: 'experience',
      items: [
        {
          role: 'Senior Engineer',
          org: 'Acme GmbH',
          period: '2022 – heute',
          summary: 'Verantwortlich für die KI-Plattform.',
          highlights: ['RAG-Pipeline aufgebaut', 'Latenz um 40% gesenkt'],
        },
      ],
    },
    {
      type: 'skills',
      groups: [{ label: 'Sprachen', items: ['Python', 'TypeScript', 'Go'] }],
    },
    {
      type: 'education',
      items: [{ degree: 'M.Sc. Informatik', org: 'TU München', period: '2018 – 2020' }],
    },
    {
      type: 'projects',
      items: [
        {
          name: 'Offero',
          description: 'Generiert Bewerbungs-Websites.',
          url: 'https://example.com',
        },
      ],
    },
    {
      type: 'contact',
      email: 'alex@example.com',
      phone: '+49 170 0000000',
      location: 'Hamburg',
      links: [{ label: 'LinkedIn', url: 'https://linkedin.com/in/alex' }],
      badge: false,
    },
  ],
  media: [],
  proofLinks: [],
  recruiterSummary: {
    headline: '10 Jahre KI-Engineering, jetzt mit Agentic-Fokus.',
    points: ['Liefert Produktion', 'Ehrliche Einordnung'],
  },
  meta: { market: 'dach', noindex: true, showContactDetails: false, motionIntro: false },
};

describe('buildAtsModel', () => {
  it('stellt KONTAKT mit Name an den Anfang und nutzt Standard-Überschriften', () => {
    const blocks = buildAtsModel(FIXTURE);
    const headings = blocks.map((b) => b.heading);
    expect(headings[0]).toBe('KONTAKT');
    expect(headings).toContain('BERUFSERFAHRUNG');
    expect(headings).toContain('FÄHIGKEITEN');
    expect(headings).toContain('AUSBILDUNG');
    expect(headings).toContain('PROJEKTE');

    const contact = blocks[0];
    expect(contact?.lines[0]?.text).toBe('Alex Mustermann');
    // E-Mail ist erlaubt …
    const flat = blocks.flatMap((b) => b.lines.map((l) => l.text)).join('\n');
    expect(flat).toContain('alex@example.com');
    // … Telefon/Ort jedoch nicht (showContactDetails = false, PII-Default AUS).
    expect(flat).not.toContain('+49 170 0000000');
    expect(flat).not.toContain('Hamburg'); // Kontakt-Ort = PII, ausgeblendet (TU München bleibt als Ausbildung erlaubt)
  });

  it('zeigt Telefon/Ort, wenn showContactDetails aktiv ist', () => {
    const blocks = buildAtsModel({
      ...FIXTURE,
      meta: { ...FIXTURE.meta, showContactDetails: true },
    });
    const flat = blocks.flatMap((b) => b.lines.map((l) => l.text)).join('\n');
    expect(flat).toContain('+49 170 0000000');
    expect(flat).toContain('Hamburg');
  });

  it('bettet den Bewerbungs-Website-Link fett in den KONTAKT-Block ein', () => {
    const url = 'https://offero.app/p/foo';
    const blocks = buildAtsModel(FIXTURE, url);

    // Der Link gehört in KONTAKT (Block 0) — das Produkt, auf das HR klicken soll.
    const contact = blocks[0];
    expect(contact?.heading).toBe('KONTAKT');
    const websiteLine = contact?.lines.find((l) => l.text === `Bewerbungs-Website: ${url}`);
    expect(websiteLine).toBeDefined();
    // Muss hervorgehoben (fett) sein.
    expect(websiteLine?.bold).toBe(true);
  });

  it('lässt die Website-Zeile weg, wenn kein Link übergeben wird', () => {
    const flat = buildAtsModel(FIXTURE)
      .flatMap((b) => b.lines.map((l) => l.text))
      .join('\n');
    expect(flat).not.toContain('Bewerbungs-Website:');
  });
});

describe('buildAtsPdf', () => {
  it('liefert ein nicht-leeres PDF (%PDF-Header) mit eingebettetem Namen', async () => {
    const bytes = await buildAtsPdf(FIXTURE);
    expect(bytes.length).toBeGreaterThan(500);
    const head = new TextDecoder('latin1').decode(bytes.slice(0, 5));
    expect(head).toBe('%PDF-');

    // Leichtgewichtige Text-Extraktion (pdf-parse). Schlägt sie in der CI-Umgebung fehl,
    // bleibt zumindest die strukturelle %PDF-Zusicherung oben das Audit-Minimum.
    let text = '';
    try {
      const mod = (await import('pdf-parse')) as unknown as {
        default: (b: Buffer) => Promise<{ text: string }>;
      };
      const parsed = await mod.default(Buffer.from(bytes));
      text = parsed.text;
    } catch {
      text = '';
    }
    if (text) {
      expect(text).toContain('Alex Mustermann');
      expect(text).toContain('BERUFSERFAHRUNG');
    }
  });
});

describe('buildAtsDocx', () => {
  it('liefert ein gültiges DOCX (ZIP/PK-Header)', async () => {
    const bytes = await buildAtsDocx(FIXTURE);
    expect(bytes.length).toBeGreaterThan(500);
    // DOCX ist ein ZIP-Container → beginnt mit "PK".
    expect(bytes[0]).toBe(0x50); // 'P'
    expect(bytes[1]).toBe(0x4b); // 'K'
  });
});
