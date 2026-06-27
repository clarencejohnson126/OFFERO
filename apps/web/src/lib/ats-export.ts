import type { ApplicationContent, Section } from '@offero/core';

// ATS-saubere Exporte (Task #34, ADR 0012 §1/§6).
//
// Die Website ist das Produkt — dieses PDF/DOCX ist die leise ATS-Kompatibilitäts-Beilage.
// Bewusst SCHLICHT und parse-freundlich gehalten, damit Bewerber-Tracking-Systeme den Text
// sauber lesen: EINE Spalte, Standard-Überschriften, echter selektierbarer Text, Standard-Font
// (Helvetica/Arial). KEINE Tabellen, KEINE Bilder/Icons, KEINE Mehrspaltigkeit, KEINE Textboxen.
//
// Reine Funktionen ohne Seiteneffekte: buildAtsPdf() / buildAtsDocx(). Beide arbeiten nur auf dem
// validierten ApplicationContent. Es werden niemals Fähigkeiten erfunden — nur, was im Content steht.

// Standard-Sektions-Überschriften (DE). Von den Section-Typen abgebildet.
const HEADINGS: Partial<Record<Section['type'], string>> = {
  fit: 'PROFIL',
  experience: 'BERUFSERFAHRUNG',
  skills: 'FÄHIGKEITEN',
  education: 'AUSBILDUNG',
  projects: 'PROJEKTE',
};

interface AtsBlock {
  /** Überschrift einer Standard-Sektion (KONTAKT, PROFIL …) oder undefined für Fließtext. */
  heading?: string;
  /** Einzelne Textzeilen (jede für sich ein realer, parsebarer String). */
  lines: AtsLine[];
}

interface AtsLine {
  text: string;
  /** Hervorgehoben (fett) — z. B. der Bewerbername oder ein Rollen-/Arbeitgeber-Titel. */
  bold?: boolean;
  /** Größe in pt (Default Fließtext). */
  size?: number;
  /** Eingerückt (z. B. Bullet/Highlight unter einer Position). */
  indent?: boolean;
}

// ── Content → flaches, einspaltiges ATS-Modell ───────────────────────────────────────────────

function findSection<T extends Section['type']>(
  content: ApplicationContent,
  type: T,
): Extract<Section, { type: T }> | undefined {
  return content.sections.find((s) => s.type === type) as
    | Extract<Section, { type: T }>
    | undefined;
}

/** Bewerbername aus dem Hero. */
function candidateName(content: ApplicationContent): string {
  const hero = findSection(content, 'hero');
  return hero?.name?.trim() || 'Bewerbung';
}

/**
 * Baut die KONTAKT-Zeilen: Name + E-Mail immer ganz oben. Telefon/Ort nur, wenn
 * meta.showContactDetails (Default AUS — PII-Schutz, opt-in). E-Mail bleibt stets erlaubt.
 */
function buildContactLines(content: ApplicationContent, websiteUrl?: string): AtsLine[] {
  const name = candidateName(content);
  const hero = findSection(content, 'hero');
  const contact = findSection(content, 'contact');
  const showDetails = content.meta?.showContactDetails === true;

  const lines: AtsLine[] = [{ text: name, bold: true, size: 20 }];

  // Rolle (z. B. "Lead AI Engineer") als dezente Unterzeile, falls vorhanden.
  if (hero?.role?.trim()) lines.push({ text: hero.role.trim(), size: 11 });

  const contactBits: string[] = [];
  if (contact?.email?.trim()) contactBits.push(contact.email.trim());
  if (showDetails && contact?.phone?.trim()) contactBits.push(contact.phone.trim());
  if (showDetails && contact?.location?.trim()) contactBits.push(contact.location.trim());
  if (contactBits.length > 0) lines.push({ text: contactBits.join('  ·  '), size: 10 });

  // Bewerbungs-Website-Link zuerst (das Produkt — HR soll klicken).
  if (websiteUrl?.trim()) {
    lines.push({ text: `Bewerbungs-Website: ${websiteUrl.trim()}`, size: 10, bold: true });
  }

  // Weitere Profil-Links (LinkedIn, Portfolio …) als reiner Text — keine Buttons/Icons.
  for (const link of contact?.links ?? []) {
    if (link?.url?.trim()) {
      const label = link.label?.trim() ? `${link.label.trim()}: ` : '';
      lines.push({ text: `${label}${link.url.trim()}`, size: 10 });
    }
  }
  return lines;
}

/** Kurzer PROFIL-Block aus der recruiterSummary (10-Sekunden-Antwort), falls vorhanden. */
function buildProfileBlock(content: ApplicationContent): AtsBlock | null {
  const rs = content.recruiterSummary;
  if (!rs) return null;
  const lines: AtsLine[] = [];
  if (rs.headline?.trim()) lines.push({ text: rs.headline.trim() });
  for (const p of rs.points ?? []) {
    if (p?.trim()) lines.push({ text: `• ${p.trim()}`, indent: true });
  }
  if (lines.length === 0) return null;
  return { heading: 'PROFIL', lines };
}

function fitBlock(s: Extract<Section, { type: 'fit' }>): AtsBlock {
  const lines: AtsLine[] = [];
  if (s.intro?.trim()) lines.push({ text: s.intro.trim() });
  for (const item of s.items) {
    if (item.requirement?.trim()) lines.push({ text: item.requirement.trim(), bold: true });
    if (item.evidence?.trim()) lines.push({ text: item.evidence.trim(), indent: true });
  }
  return { heading: HEADINGS.fit, lines };
}

function experienceBlock(s: Extract<Section, { type: 'experience' }>): AtsBlock {
  const lines: AtsLine[] = [];
  for (const item of s.items) {
    // Rolle / Arbeitgeber / Zeitraum bleiben zusammen (ein zusammenhängender Eintrag).
    const titleBits = [item.role?.trim(), item.org?.trim()].filter(Boolean);
    if (titleBits.length > 0) lines.push({ text: titleBits.join(' — '), bold: true });
    if (item.period?.trim()) lines.push({ text: item.period.trim(), size: 9 });
    if (item.summary?.trim()) lines.push({ text: item.summary.trim() });
    for (const h of item.highlights ?? []) {
      if (h?.trim()) lines.push({ text: `• ${h.trim()}`, indent: true });
    }
  }
  return { heading: HEADINGS.experience, lines };
}

function skillsBlock(s: Extract<Section, { type: 'skills' }>): AtsBlock {
  const lines: AtsLine[] = [];
  for (const g of s.groups) {
    const items = (g.items ?? []).map((i) => i.trim()).filter(Boolean);
    if (items.length === 0) continue;
    const label = g.label?.trim() ? `${g.label.trim()}: ` : '';
    lines.push({ text: `${label}${items.join(', ')}` });
  }
  return { heading: HEADINGS.skills, lines };
}

function educationBlock(s: Extract<Section, { type: 'education' }>): AtsBlock {
  const lines: AtsLine[] = [];
  for (const item of s.items) {
    const titleBits = [item.degree?.trim(), item.org?.trim()].filter(Boolean);
    if (titleBits.length > 0) lines.push({ text: titleBits.join(' — '), bold: true });
    if (item.period?.trim()) lines.push({ text: item.period.trim(), size: 9 });
  }
  return { heading: HEADINGS.education, lines };
}

function projectsBlock(s: Extract<Section, { type: 'projects' }>): AtsBlock {
  const lines: AtsLine[] = [];
  if (s.intro?.trim()) lines.push({ text: s.intro.trim() });
  for (const item of s.items) {
    if (item.name?.trim()) lines.push({ text: item.name.trim(), bold: true });
    if (item.description?.trim()) lines.push({ text: item.description.trim(), indent: true });
    if (item.url?.trim()) lines.push({ text: item.url.trim(), indent: true, size: 9 });
  }
  return { heading: HEADINGS.projects, lines };
}

/**
 * Wandelt den Content in eine flache, einspaltige Block-Liste: KONTAKT zuerst, dann PROFIL
 * (aus recruiterSummary), danach die inhaltlichen Sektionen in der Reihenfolge des Contents.
 */
export function buildAtsModel(content: ApplicationContent, websiteUrl?: string): AtsBlock[] {
  const blocks: AtsBlock[] = [];

  // KONTAKT — Name + E-Mail + Website-Link ganz oben.
  blocks.push({ heading: 'KONTAKT', lines: buildContactLines(content, websiteUrl) });

  // PROFIL aus recruiterSummary (kurz), falls vorhanden.
  const profile = buildProfileBlock(content);
  if (profile) blocks.push(profile);

  for (const section of content.sections) {
    switch (section.type) {
      case 'fit':
        // Nur als PROFIL, wenn nicht schon eine recruiterSummary die Überschrift belegt.
        blocks.push({ ...fitBlock(section), heading: profile ? 'EIGNUNG' : HEADINGS.fit });
        break;
      case 'experience':
        blocks.push(experienceBlock(section));
        break;
      case 'skills':
        blocks.push(skillsBlock(section));
        break;
      case 'education':
        blocks.push(educationBlock(section));
        break;
      case 'projects':
        blocks.push(projectsBlock(section));
        break;
      default:
        // hero/contact bereits oben verarbeitet; roadmap/collaboration/industry_match/honest
        // sind Website-Dramaturgie und werden im ATS-Dokument bewusst weggelassen.
        break;
    }
  }

  return blocks;
}

// ── PDF (pdf-lib) ─────────────────────────────────────────────────────────────────────────────

/** ATS-sauberes PDF: einspaltig, Helvetica, echter selektierbarer Text, keine Bilder/Tabellen. */
export async function buildAtsPdf(content: ApplicationContent, websiteUrl?: string): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const doc = await PDFDocument.create();
  doc.setTitle(`${candidateName(content)} — Bewerbung`);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 595.28; // A4 in pt
  const PAGE_H = 841.89;
  const MARGIN = 56;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const BODY_SIZE = 10.5;
  const HEADING_SIZE = 12;
  const LINE_GAP = 4;
  const ink = rgb(0.1, 0.1, 0.1);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };

  // Bricht Text an Wort-Grenzen auf die verfügbare Breite um (echter Fließtext, keine Box).
  const wrap = (text: string, f: typeof font, size: number, maxW: number): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let line = '';
    for (const w of words) {
      const cand = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(cand, size) <= maxW || !line) {
        line = cand;
      } else {
        out.push(line);
        line = w;
      }
    }
    if (line) out.push(line);
    return out.length > 0 ? out : [''];
  };

  // pdf-lib/WinAnsi kann manche Unicode-Zeichen nicht kodieren → harmlos ersetzen.
  const sanitize = (t: string): string =>
    t
      .replace(/[‘’‚]/g, "'")
      .replace(/[“”„]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/•/g, '-')
      .replace(/[\u00a0\u2007\u202f]/g, ' ')
      .replace(/[…]/g, '...');

  const drawLine = (l: AtsLine) => {
    const f = l.bold ? fontBold : font;
    const size = l.size ?? BODY_SIZE;
    const indent = l.indent ? 12 : 0;
    const maxW = CONTENT_W - indent;
    for (const piece of wrap(sanitize(l.text), f, size, maxW)) {
      if (y < MARGIN + size) newPage();
      page.drawText(piece, { x: MARGIN + indent, y: y - size, size, font: f, color: ink });
      y -= size + LINE_GAP;
    }
  };

  const blocks = buildAtsModel(content, websiteUrl);
  blocks.forEach((block, idx) => {
    if (block.heading) {
      y -= idx === 0 ? 0 : 10;
      if (y < MARGIN + HEADING_SIZE) newPage();
      page.drawText(sanitize(block.heading), {
        x: MARGIN,
        y: y - HEADING_SIZE,
        size: HEADING_SIZE,
        font: fontBold,
        color: ink,
      });
      y -= HEADING_SIZE + LINE_GAP + 2;
    }
    for (const line of block.lines) drawLine(line);
  });

  return doc.save();
}

// ── DOCX (docx) ───────────────────────────────────────────────────────────────────────────────

/** ATS-sauberes DOCX: einspaltig, Arial, Standard-Überschriften, keine Tabellen/Bilder/Textboxen. */
export async function buildAtsDocx(content: ApplicationContent, websiteUrl?: string): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

  const paragraphs: InstanceType<typeof Paragraph>[] = [];
  const FONT = 'Arial';

  const para = (line: AtsLine) =>
    new Paragraph({
      spacing: { after: 60 },
      indent: line.indent ? { left: 240 } : undefined,
      children: [
        new TextRun({
          text: line.text,
          bold: line.bold === true,
          font: FONT,
          // pt → half-points
          size: Math.round((line.size ?? 10.5) * 2),
        }),
      ],
    });

  const blocks = buildAtsModel(content, websiteUrl);
  for (const block of blocks) {
    if (block.heading) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: block.heading, bold: true, font: FONT, size: 24 })],
        }),
      );
    }
    for (const line of block.lines) paragraphs.push(para(line));
  }

  const docx = new Document({
    creator: 'Offero',
    title: `${candidateName(content)} — Bewerbung`,
    sections: [{ properties: {}, children: paragraphs }],
  });

  // toBuffer() liefert in Node ein Buffer; in Uint8Array normalisieren.
  const buffer = await Packer.toBuffer(docx);
  return new Uint8Array(buffer);
}
