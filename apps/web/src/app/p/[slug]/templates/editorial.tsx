import type { Section } from '@offero/core';
import {
  type TemplateProps,
  type Palette,
  palette,
  pick,
  bodySections,
  splitMedia,
  host,
  EMAIL,
  URLRE,
  SECTION_LABEL,
} from './shared';

// Editorial — LIGHT EDITORIAL / MAGAZINE render-template.
// Cream long-read, large Fraunces serif display, hairline rules, drop-caps, reading column.
// Server component: no hooks, no handlers. Brand shows through via var(--accent)/var(--accent-2).

type Of<T extends Section['type']> = Extract<Section, { type: T }>;

export function EditorialTemplate({ content }: TemplateProps) {
  const p: Palette = palette(content);
  const hero = pick(content, 'hero');
  const contact = pick(content, 'contact');
  const body = bodySections(content);
  const company = content.company.name;

  // ── Trust-System (ADR 0012) ──
  const summary = content.recruiterSummary;
  const summaryPoints = summary ? summary.points.slice(0, 3) : [];
  const selfIntro = content.selfIntro;
  const proofLinks = (content.proofLinks ?? []).filter((l) => URLRE.test(l.url));
  const integrity = content.integrity;
  const showIntegrity = integrity != null && integrity.visible !== false;
  const { images, video } = splitMedia(content);
  // Quick-Nav: bis zu 5 Sprung-Chips zu den Body-Sektionen (anchors unten).
  const navChips = body.slice(0, 5).map((s) => ({ type: s.type, label: SECTION_LABEL[s.type] }));

  const rootStyle = {
    ['--accent']: p.primary,
    ['--accent-2']: p.secondary,
    ['--grad']: p.grad,
  } as React.CSSProperties;

  return (
    <div className="ed-root" style={rootStyle} lang={content.language}>
      <style>{CSS}</style>

      <article className="ed-paper">
        {/* ───────────────── HERO / OPENER ───────────────── */}
        {hero ? (
          <header className="ed-hero">
            {hero.eyebrow ? <p className="ed-eyebrow">{hero.eyebrow}</p> : null}
            <h1 className="ed-display">
              {hero.headline.map((line, i) => (
                <span className="ed-display-line" key={i}>
                  {line}
                </span>
              ))}
            </h1>

            <p className="ed-byline">
              <span className="ed-byline-name">{hero.name}</span>
              {hero.role ? <span className="ed-byline-sep"> · </span> : null}
              {hero.role ? <span className="ed-byline-role">{hero.role}</span> : null}
              {company ? <span className="ed-byline-sep"> für </span> : null}
              {company ? <span className="ed-byline-co">{company}</span> : null}
            </p>

            <p className="ed-standfirst">{hero.pitch}</p>

            {hero.chips.length > 0 ? (
              <ul className="ed-chips">
                {hero.chips.map((c, i) => (
                  <li className="ed-chip" key={i}>
                    {c}
                  </li>
                ))}
              </ul>
            ) : null}

            {hero.cta ? <p className="ed-hero-cta">{hero.cta}</p> : null}

            {showIntegrity ? <p className="ed-integrity">{integrity!.statement}</p> : null}
          </header>
        ) : null}

        {/* ───────────────── RECRUITER SUMMARY (10-Sekunden-Antwort) ───────────────── */}
        {summary ? (
          <aside className="ed-summary" aria-label="Kurzfassung">
            <span className="ed-summary-tag">Die Kurzfassung</span>
            <p className="ed-summary-headline">{summary.headline}</p>
            {summaryPoints.length > 0 ? (
              <ul className="ed-summary-points">
                {summaryPoints.map((pt, i) => (
                  <li className="ed-summary-point" key={i}>
                    {pt}
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
        ) : null}

        {/* ───────────────── QUICK-NAV (Sprung-Chips) ───────────────── */}
        {navChips.length > 0 ? (
          <nav className="ed-quicknav" aria-label="Schnellnavigation">
            {navChips.map((c, i) => (
              <a className="ed-quicknav-chip" href={`#sec-${c.type}`} key={`${c.type}-${i}`}>
                {c.label}
              </a>
            ))}
          </nav>
        ) : null}

        {/* ───────────────── BODY SECTIONS ───────────────── */}
        {body.map((s, idx) => (
          <section className="ed-section" id={`sec-${s.type}`} key={`${s.type}-${idx}`}>
            <SectionLabel type={s.type} />
            <SectionBody section={s} />
          </section>
        ))}

        {/* ───────────────── SELF-INTRO (Lerne mich kennen) ───────────────── */}
        {selfIntro && URLRE.test(selfIntro.url) ? (
          <section className="ed-section ed-selfintro">
            <div className="ed-label-wrap">
              <span className="ed-label">Lerne mich kennen</span>
            </div>
            {selfIntro.kind === 'video' ? (
              <video
                className="ed-selfintro-media"
                controls
                preload="metadata"
                playsInline
                poster={selfIntro.posterUrl}
              >
                <source src={selfIntro.url} type={selfIntro.mimeType || undefined} />
              </video>
            ) : (
              <audio className="ed-selfintro-audio" controls preload="metadata">
                <source src={selfIntro.url} type={selfIntro.mimeType || undefined} />
              </audio>
            )}
            {selfIntro.caption ? <p className="ed-selfintro-caption">{selfIntro.caption}</p> : null}
            {selfIntro.transcript ? (
              <details className="ed-selfintro-transcript">
                <summary className="ed-selfintro-transcript-summary">Transkript</summary>
                <p className="ed-selfintro-transcript-body">{selfIntro.transcript}</p>
              </details>
            ) : null}
          </section>
        ) : null}

        {/* ───────────────── PROOF LINKS (Belege) ───────────────── */}
        {proofLinks.length > 0 ? (
          <section className="ed-section ed-proof">
            <div className="ed-label-wrap">
              <span className="ed-label">Belege</span>
            </div>
            <ul className="ed-proof-list">
              {proofLinks.map((l, i) => (
                <li className="ed-proof-item" key={i}>
                  <a
                    className="ed-link ed-proof-link"
                    href={l.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="ed-proof-label">{l.label}</span>
                    <span className="ed-proof-host">{host(l.url)}</span>
                  </a>
                  {l.claim ? <span className="ed-proof-claim">{l.claim}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ───────────────── MEDIA (Galerie + Video) ───────────────── */}
        {images.length > 0 || video ? (
          <section className="ed-section ed-media">
            <div className="ed-label-wrap">
              <span className="ed-label">Eindrücke</span>
            </div>
            {images.length > 0 ? (
              <ul className="ed-gallery">
                {images.map((img, i) => (
                  <li className="ed-gallery-item" key={img.assetId ?? img.url ?? i}>
                    <img
                      className="ed-gallery-img"
                      src={img.url}
                      alt={img.alt ?? img.caption ?? ''}
                      loading="lazy"
                    />
                    {img.caption ? <figcaption className="ed-gallery-cap">{img.caption}</figcaption> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {video ? (
              <video className="ed-media-video" controls preload="metadata" playsInline>
                <source src={video.url} type={video.mimeType} />
              </video>
            ) : null}
          </section>
        ) : null}

        {/* ───────────────── CONTACT / COLOPHON ───────────────── */}
        {contact ? (
          <footer className="ed-section ed-contact">
            <SectionLabel type="contact" />
            {contact.ctaLine ? <p className="ed-contact-cta">{contact.ctaLine}</p> : null}

            <dl className="ed-contact-grid">
              {contact.email && EMAIL.test(contact.email) ? (
                <div className="ed-contact-row">
                  <dt className="ed-contact-key">E-Mail</dt>
                  <dd className="ed-contact-val">
                    <a className="ed-link" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {contact.phone ? (
                <div className="ed-contact-row">
                  <dt className="ed-contact-key">Telefon</dt>
                  <dd className="ed-contact-val">{contact.phone}</dd>
                </div>
              ) : null}
              {contact.location ? (
                <div className="ed-contact-row">
                  <dt className="ed-contact-key">Standort</dt>
                  <dd className="ed-contact-val">{contact.location}</dd>
                </div>
              ) : null}
            </dl>

            {contact.links.length > 0 ? (
              <ul className="ed-links">
                {contact.links.map((l, i) =>
                  URLRE.test(l.url) ? (
                    <li className="ed-links-item" key={i}>
                      <a className="ed-link" href={l.url} rel="noopener noreferrer" target="_blank">
                        <span className="ed-links-label">{l.label}</span>
                        <span className="ed-links-host">{host(l.url)}</span>
                      </a>
                    </li>
                  ) : (
                    <li className="ed-links-item ed-links-item--plain" key={i}>
                      <span className="ed-links-label">{l.label}</span>
                    </li>
                  ),
                )}
              </ul>
            ) : null}

            {contact.badge ? (
              <p className="ed-colophon">Erstellt mit Offero</p>
            ) : null}
          </footer>
        ) : null}
      </article>
    </div>
  );
}

/* ───────────────────────── section label ───────────────────────── */

function SectionLabel({ type }: { type: Section['type'] }) {
  return (
    <div className="ed-label-wrap">
      <span className="ed-label">{SECTION_LABEL[type]}</span>
    </div>
  );
}

/* ───────────────────────── section bodies ───────────────────────── */

function SectionBody({ section }: { section: Section }) {
  switch (section.type) {
    case 'fit':
      return <FitBody s={section as Of<'fit'>} />;
    case 'experience':
      return <ExperienceBody s={section as Of<'experience'>} />;
    case 'skills':
      return <SkillsBody s={section as Of<'skills'>} />;
    case 'education':
      return <EducationBody s={section as Of<'education'>} />;
    case 'projects':
      return <ProjectsBody s={section as Of<'projects'>} />;
    case 'roadmap':
      return <RoadmapBody s={section as Of<'roadmap'>} />;
    case 'collaboration':
      return <ProseBody body={(section as Of<'collaboration'>).body} />;
    case 'industry_match':
      return <ProseBody body={(section as Of<'industry_match'>).body} />;
    case 'honest':
      return <ProseBody body={(section as Of<'honest'>).body} />;
    default:
      return null;
  }
}

/** Long-read prose with drop-cap on the first paragraph (honest/collaboration/industry_match). */
function ProseBody({ body }: { body: string }) {
  const paras = body
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  const blocks = paras.length > 0 ? paras : [body];
  return (
    <div className="ed-prose">
      {blocks.map((para, i) => (
        <p className={i === 0 ? 'ed-para ed-para--dropcap' : 'ed-para'} key={i}>
          {para}
        </p>
      ))}
    </div>
  );
}

function FitBody({ s }: { s: Of<'fit'> }) {
  return (
    <div className="ed-fit">
      {s.intro ? <p className="ed-section-intro">{s.intro}</p> : null}
      <dl className="ed-fit-list">
        {s.items.map((it, i) => (
          <div className="ed-fit-row" key={i}>
            <dt className="ed-fit-req">{it.requirement}</dt>
            <dd className="ed-fit-ev">{it.evidence}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ExperienceBody({ s }: { s: Of<'experience'> }) {
  return (
    <ol className="ed-timeline">
      {s.items.map((it, i) => (
        <li className="ed-station" key={i}>
          <div className="ed-station-head">
            <h3 className="ed-station-role">{it.role}</h3>
            {it.org ? <span className="ed-station-org">{it.org}</span> : null}
            {it.period ? <span className="ed-station-period">{it.period}</span> : null}
          </div>
          <p className="ed-station-summary">{it.summary}</p>
          {it.highlights.length > 0 ? (
            <ul className="ed-station-highlights">
              {it.highlights.map((h, j) => (
                <li className="ed-station-hl" key={j}>
                  {h}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function SkillsBody({ s }: { s: Of<'skills'> }) {
  return (
    <div className="ed-skills">
      {s.groups.map((g, i) => (
        <div className="ed-skill-group" key={i}>
          <h3 className="ed-skill-label">{g.label}</h3>
          <ul className="ed-skill-items">
            {g.items.map((it, j) => (
              <li className="ed-skill-item" key={j}>
                {it}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EducationBody({ s }: { s: Of<'education'> }) {
  return (
    <ul className="ed-edu">
      {s.items.map((it, i) => (
        <li className="ed-edu-item" key={i}>
          <span className="ed-edu-degree">{it.degree}</span>
          <span className="ed-edu-meta">
            {it.org ? <span className="ed-edu-org">{it.org}</span> : null}
            {it.org && it.period ? <span className="ed-edu-dot"> · </span> : null}
            {it.period ? <span className="ed-edu-period">{it.period}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ProjectsBody({ s }: { s: Of<'projects'> }) {
  return (
    <div className="ed-projects">
      {s.intro ? <p className="ed-section-intro">{s.intro}</p> : null}
      <ul className="ed-project-list">
        {s.items.map((it, i) => (
          <li className="ed-project" key={i}>
            <div className="ed-project-head">
              <h3 className="ed-project-name">{it.name}</h3>
              {it.tag ? <span className="ed-project-tag">{it.tag}</span> : null}
            </div>
            <p className="ed-project-desc">{it.description}</p>
            {it.url && URLRE.test(it.url) ? (
              <a className="ed-link ed-project-link" href={it.url} rel="noopener noreferrer" target="_blank">
                {host(it.url)}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoadmapBody({ s }: { s: Of<'roadmap'> }) {
  return (
    <ol className="ed-roadmap">
      {s.phases.map((ph, i) => (
        <li className="ed-phase" key={i}>
          <span className="ed-phase-when">{ph.when}</span>
          <span className="ed-phase-focus">{ph.focus}</span>
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────────── styles ───────────────────────── */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Spectral:ital,wght@0,400;0,500;1,400&display=swap');

.ed-root {
  --ink: #15130f;
  --paper: #faf8f3;
  --paper-2: #f3efe5;
  --muted: #6b6457;
  --hair: #ddd5c6;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Spectral', Georgia, 'Times New Roman', serif;
  font-size: 18px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.ed-root * { box-sizing: border-box; }

.ed-paper {
  max-width: 760px;
  margin: 0 auto;
  padding: clamp(40px, 7vw, 96px) clamp(20px, 6vw, 48px) 120px;
}

/* ── hero ── */
.ed-hero { padding-bottom: clamp(40px, 6vw, 72px); }

.ed-eyebrow {
  margin: 0 0 22px;
  font-family: 'Spectral', Georgia, serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--accent);
}

.ed-display {
  margin: 0;
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: clamp(40px, 8.5vw, 76px);
  line-height: 1.02;
  letter-spacing: -0.018em;
  font-optical-sizing: auto;
}
.ed-display-line { display: block; }

.ed-byline {
  margin: 28px 0 0;
  font-size: 15px;
  color: var(--muted);
  font-style: italic;
}
.ed-byline-name { font-style: normal; font-weight: 500; color: var(--ink); }
.ed-byline-co { font-style: normal; color: var(--accent); }
.ed-byline-sep { font-style: normal; }

.ed-standfirst {
  margin: 26px 0 0;
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 400;
  font-size: clamp(20px, 3.2vw, 25px);
  line-height: 1.45;
  color: #2c2820;
  max-width: 38ch;
}

.ed-chips {
  list-style: none;
  margin: 34px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
}
.ed-chip {
  font-size: 12.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 5px 12px;
  border: 1px solid var(--hair);
  border-radius: 100px;
  color: var(--muted);
}
.ed-hero-cta {
  margin: 30px 0 0;
  font-style: italic;
  color: var(--accent);
  font-size: 16px;
}

/* ── section scaffold ── */
.ed-section {
  padding-top: clamp(40px, 6vw, 64px);
  margin-top: clamp(40px, 6vw, 64px);
  border-top: 1px solid var(--hair);
}
.ed-label-wrap { margin-bottom: 30px; }
.ed-label {
  font-family: 'Spectral', Georgia, serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--accent);
  display: inline-block;
  position: relative;
  padding-left: 26px;
}
.ed-label::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 18px;
  height: 1px;
  background: var(--accent);
}

.ed-section-intro {
  margin: 0 0 26px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 19px;
  font-style: italic;
  color: #2c2820;
  max-width: 46ch;
}

/* ── prose / drop-cap ── */
.ed-prose { max-width: 60ch; }
.ed-para { margin: 0 0 1.1em; }
.ed-para:last-child { margin-bottom: 0; }
.ed-para--dropcap::first-letter {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 600;
  font-size: 3.6em;
  line-height: 0.8;
  float: left;
  padding: 0.06em 0.1em 0 0;
  color: var(--accent);
}

/* ── fit (two-column req / evidence) ── */
.ed-fit-list { margin: 0; padding: 0; }
.ed-fit-row {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.3fr);
  gap: 18px 36px;
  padding: 22px 0;
  border-bottom: 1px solid var(--hair);
}
.ed-fit-row:first-child { padding-top: 0; }
.ed-fit-row:last-child { border-bottom: 0; padding-bottom: 0; }
.ed-fit-req {
  margin: 0;
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: 18px;
  line-height: 1.35;
  color: var(--ink);
}
.ed-fit-ev { margin: 0; color: #36322a; }

/* ── experience timeline ── */
.ed-timeline { list-style: none; margin: 0; padding: 0; }
.ed-station {
  position: relative;
  padding: 0 0 34px 28px;
  border-left: 1px solid var(--hair);
}
.ed-station:last-child { padding-bottom: 0; }
.ed-station::before {
  content: '';
  position: absolute;
  left: -4.5px;
  top: 7px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
}
.ed-station-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 12px;
  margin-bottom: 8px;
}
.ed-station-role {
  margin: 0;
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: 21px;
  line-height: 1.2;
}
.ed-station-org { color: var(--accent); font-size: 15px; }
.ed-station-period {
  margin-left: auto;
  font-size: 12.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--muted);
  white-space: nowrap;
}
.ed-station-summary { margin: 0; color: #36322a; max-width: 58ch; }
.ed-station-highlights {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}
.ed-station-hl {
  position: relative;
  padding-left: 20px;
  margin-bottom: 7px;
  font-size: 16px;
  color: #454036;
}
.ed-station-hl::before {
  content: '—';
  position: absolute;
  left: 0;
  color: var(--accent);
}

/* ── skills ── */
.ed-skills {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 28px 36px;
}
.ed-skill-label {
  margin: 0 0 12px;
  font-family: 'Spectral', Georgia, serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--hair);
}
.ed-skill-items { list-style: none; margin: 0; padding: 0; }
.ed-skill-item {
  padding: 4px 0;
  font-size: 16.5px;
  color: #36322a;
}

/* ── education ── */
.ed-edu { list-style: none; margin: 0; padding: 0; }
.ed-edu-item {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px 18px;
  padding: 16px 0;
  border-bottom: 1px solid var(--hair);
}
.ed-edu-item:first-child { padding-top: 0; }
.ed-edu-item:last-child { border-bottom: 0; padding-bottom: 0; }
.ed-edu-degree {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: 18px;
}
.ed-edu-meta { color: var(--muted); font-size: 15px; }
.ed-edu-org { color: var(--accent); }

/* ── projects ── */
.ed-project-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ed-project {
  padding: 24px 0;
  border-bottom: 1px solid var(--hair);
}
.ed-project:first-child { padding-top: 0; }
.ed-project:last-child { border-bottom: 0; padding-bottom: 0; }
.ed-project-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 14px;
  margin-bottom: 8px;
}
.ed-project-name {
  margin: 0;
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: 21px;
}
.ed-project-tag {
  font-size: 11.5px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 100px;
  padding: 3px 10px;
}
.ed-project-desc { margin: 0; color: #36322a; max-width: 58ch; }
.ed-project-link { display: inline-block; margin-top: 10px; font-size: 14px; }

/* ── roadmap ── */
.ed-roadmap { list-style: none; margin: 0; padding: 0; }
.ed-phase {
  display: grid;
  grid-template-columns: minmax(120px, 0.5fr) minmax(0, 1.5fr);
  gap: 20px 32px;
  padding: 18px 0;
  border-bottom: 1px solid var(--hair);
  align-items: baseline;
}
.ed-phase:first-child { padding-top: 0; }
.ed-phase:last-child { border-bottom: 0; padding-bottom: 0; }
.ed-phase-when {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: 17px;
  color: var(--accent);
}
.ed-phase-focus { color: #36322a; }

/* ── contact ── */
.ed-contact-cta {
  margin: 0 0 28px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: clamp(22px, 3.6vw, 28px);
  font-weight: 500;
  line-height: 1.3;
  max-width: 30ch;
}
.ed-contact-grid { margin: 0 0 24px; }
.ed-contact-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 18px;
  padding: 12px 0;
  border-bottom: 1px solid var(--hair);
}
.ed-contact-key {
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}
.ed-contact-val { margin: 0; }

.ed-links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
}
.ed-links-item {
  border: 1px solid var(--hair);
  border-radius: 4px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: border-color 0.15s ease;
}
.ed-links-item:hover { border-color: var(--accent); }
.ed-links-item--plain { opacity: 0.7; }
.ed-links-label {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: 15px;
}
.ed-links-host { font-size: 12px; color: var(--muted); }

.ed-link {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  transition: border-color 0.15s ease;
}
.ed-link:hover { border-bottom-color: var(--accent); }
.ed-links-item .ed-link, .ed-links .ed-link { border-bottom: 0; }

.ed-colophon {
  margin: 40px 0 0;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
  opacity: 0.7;
}

/* ── trust: integrity line ── */
.ed-integrity {
  margin: 28px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--hair);
  font-style: italic;
  font-size: 14px;
  color: var(--muted);
  max-width: 56ch;
}

/* ── trust: recruiter summary (10-Sekunden-Antwort) ── */
.ed-summary {
  margin-top: clamp(32px, 5vw, 48px);
  padding: clamp(22px, 3.5vw, 32px) clamp(22px, 3.5vw, 34px);
  background: var(--paper-2);
  border: 1px solid var(--hair);
  border-radius: 6px;
}
.ed-summary-tag {
  display: inline-block;
  font-family: 'Spectral', Georgia, serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 14px;
}
.ed-summary-headline {
  margin: 0;
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: clamp(20px, 3vw, 24px);
  line-height: 1.32;
  color: var(--ink);
  max-width: 42ch;
}
.ed-summary-points {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
}
.ed-summary-point {
  position: relative;
  padding-left: 22px;
  margin-bottom: 9px;
  font-size: 16.5px;
  color: #36322a;
}
.ed-summary-point:last-child { margin-bottom: 0; }
.ed-summary-point::before {
  content: '—';
  position: absolute;
  left: 0;
  color: var(--accent);
}

/* ── trust: quick-nav (Sprung-Chips) ── */
.ed-quicknav {
  margin-top: clamp(24px, 3.5vw, 34px);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
}
.ed-quicknav-chip {
  font-family: 'Spectral', Georgia, serif;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 14px;
  border: 1px solid var(--hair);
  border-radius: 100px;
  color: var(--muted);
  text-decoration: none;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.ed-quicknav-chip:hover { border-color: var(--accent); color: var(--accent); }

/* ── trust: self-intro ── */
.ed-selfintro-media {
  display: block;
  width: 100%;
  border-radius: 6px;
  background: #15130f;
}
.ed-selfintro-audio { width: 100%; }
.ed-selfintro-caption {
  margin: 14px 0 0;
  font-style: italic;
  font-size: 15px;
  color: var(--muted);
}
.ed-selfintro-transcript { margin-top: 18px; }
.ed-selfintro-transcript-summary {
  cursor: pointer;
  font-family: 'Spectral', Georgia, serif;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
}
.ed-selfintro-transcript-body {
  margin: 14px 0 0;
  color: #36322a;
  max-width: 60ch;
  white-space: pre-line;
}

/* ── trust: proof links (Belege) ── */
.ed-proof-list { list-style: none; margin: 0; padding: 0; }
.ed-proof-item {
  padding: 18px 0;
  border-bottom: 1px solid var(--hair);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ed-proof-item:first-child { padding-top: 0; }
.ed-proof-item:last-child { border-bottom: 0; padding-bottom: 0; }
.ed-proof-link {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 12px;
  border-bottom: 0;
}
.ed-proof-label {
  font-family: 'Fraunces', Georgia, serif;
  font-weight: 500;
  font-size: 18px;
}
.ed-proof-host { font-size: 13px; color: var(--muted); }
.ed-proof-claim { font-size: 15px; color: #36322a; font-style: italic; }

/* ── trust: media gallery ── */
.ed-gallery {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 18px;
}
.ed-gallery-item { margin: 0; }
.ed-gallery-img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 4px;
  border: 1px solid var(--hair);
}
.ed-gallery-cap {
  margin: 8px 0 0;
  font-size: 13px;
  font-style: italic;
  color: var(--muted);
}
.ed-media-video {
  display: block;
  width: 100%;
  margin-top: 24px;
  border-radius: 6px;
  background: #15130f;
}

@media (max-width: 560px) {
  .ed-fit-row { grid-template-columns: 1fr; gap: 6px; }
  .ed-phase { grid-template-columns: 1fr; gap: 4px; }
  .ed-contact-row { grid-template-columns: 1fr; gap: 4px; }
  .ed-station-period { margin-left: 0; }
}
`;
