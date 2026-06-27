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

/**
 * Swiss / International Typographic Style render template.
 * Light ground, black text, neutral grotesque, strict hairline grid,
 * numbered sections in the brand accent. Server component only — no hooks,
 * no client interactivity. All branding flows through CSS custom properties.
 */
export function SwissTemplate({ content }: TemplateProps) {
  const p: Palette = palette(content);
  const hero = pick(content, 'hero');
  const contact = pick(content, 'contact');
  const body = bodySections(content);
  const companyName = content.company.name ?? '';

  // Trust-System (ADR 0012) — alle optional, nur rendern wenn vorhanden.
  const summary = content.recruiterSummary;
  const summaryPoints = summary?.points.slice(0, 3) ?? [];
  const selfIntro = content.selfIntro;
  const proofLinks = (content.proofLinks ?? []).filter((l) => URLRE.test(l.url));
  const integrity = content.integrity;
  const showIntegrity = !!integrity && integrity.visible !== false && integrity.statement.length > 0;
  const { images, video } = splitMedia(content);
  const hasMedia = images.length > 0 || !!video;

  // Quick-Nav-Chips: nur Sektionen, die wir tatsächlich ankern (max 5).
  const navChips = body.slice(0, 5).map((s) => ({ type: s.type, label: SECTION_LABEL[s.type] }));

  const rootStyle = {
    ['--accent']: p.primary,
    ['--accent-2']: p.secondary,
    ['--grad']: p.grad,
  } as React.CSSProperties;

  // Numbering only counts the body sections (hero is the masthead, contact is the footer).
  const num = (i: number): string => String(i + 1).padStart(2, '0');

  return (
    <div className="sw-root" style={rootStyle} lang={content.language}>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.sw-root {
  --ink: #111111;
  --ground: #ffffff;
  --panel: #fbfbfb;
  --rule: #e3e3e3;
  --rule-strong: #111111;
  --muted: #6b6b6b;
  --max: 1180px;
  --gutter: 28px;
  background: var(--ground);
  color: var(--ink);
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-feature-settings: 'tnum' 1, 'cv01' 1;
  letter-spacing: -0.003em;
}
.sw-root * { box-sizing: border-box; }

.sw-wrap {
  max-width: var(--max);
  margin: 0 auto;
  padding: 0 var(--gutter);
}

/* ---------- Masthead ---------- */
.sw-masthead {
  border-bottom: 2px solid var(--rule-strong);
  padding-top: 34px;
}
.sw-mast-top {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  gap: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--rule);
}
.sw-mast-name {
  font-size: clamp(22px, 3.4vw, 34px);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.05;
}
.sw-mast-meta {
  text-align: right;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 600;
  line-height: 1.7;
}
.sw-mast-meta .sw-accentword { color: var(--accent); }

.sw-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  padding: 56px 0 60px;
}
.sw-hero-grid {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 48px;
  align-items: start;
}
.sw-eyebrow {
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--accent);
  margin: 0 0 22px;
  display: inline-block;
  border-top: 2px solid var(--accent);
  padding-top: 8px;
}
.sw-headline {
  margin: 0;
  font-size: clamp(34px, 6vw, 68px);
  line-height: 1.02;
  font-weight: 800;
  letter-spacing: -0.035em;
}
.sw-headline span { display: block; }
.sw-role {
  margin: 22px 0 0;
  font-size: clamp(16px, 1.8vw, 20px);
  font-weight: 600;
  color: var(--ink);
}
.sw-role::before {
  content: '';
  display: inline-block;
  width: 26px;
  height: 2px;
  background: var(--accent);
  vertical-align: middle;
  margin-right: 12px;
}
.sw-pitch {
  margin: 0;
  font-size: 17px;
  line-height: 1.62;
  color: #2a2a2a;
  max-width: 42ch;
}
.sw-pitch-block { border-top: 1px solid var(--rule); padding-top: 20px; }
.sw-chips {
  list-style: none;
  margin: 26px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 8px;
}
.sw-chips li {
  font-size: 12px;
  letter-spacing: 0.02em;
  font-weight: 500;
  color: var(--ink);
  border: 1px solid var(--rule);
  padding: 6px 11px;
  border-radius: 2px;
}
.sw-cta {
  display: inline-block;
  margin-top: 30px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent);
  border-bottom: 2px solid var(--accent);
  padding-bottom: 3px;
}

/* ---------- Section scaffold ---------- */
.sw-section {
  border-top: 1px solid var(--rule);
  padding: 52px 0;
}
.sw-sec-head {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 48px;
  align-items: baseline;
  margin-bottom: 34px;
}
.sw-sec-num {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.sw-sec-title {
  margin: 8px 0 0;
  font-size: clamp(24px, 3.2vw, 36px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.05;
}
.sw-sec-intro {
  margin: 0;
  font-size: 15px;
  line-height: 1.62;
  color: var(--muted);
  align-self: end;
}
.sw-sec-body { display: block; }

/* offset content into the right-weighted column so the grid reads */
.sw-indent {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 48px;
}
.sw-indent > .sw-indent-main { grid-column: 1 / 2; }

/* ---------- Fit table ---------- */
.sw-fit {
  border-top: 2px solid var(--rule-strong);
}
.sw-fit-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 32px;
  padding: 20px 0;
  border-bottom: 1px solid var(--rule);
}
.sw-fit-req {
  font-weight: 600;
  font-size: 15px;
  line-height: 1.45;
}
.sw-fit-req::before {
  content: counter(sw-fit, decimal-leading-zero) '  ';
  color: var(--accent);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  margin-right: 6px;
}
.sw-fit { counter-reset: sw-fit; }
.sw-fit-row { counter-increment: sw-fit; }
.sw-fit-ev {
  font-size: 15px;
  line-height: 1.55;
  color: #2a2a2a;
}

/* ---------- Experience ---------- */
.sw-exp { border-top: 2px solid var(--rule-strong); }
.sw-exp-item {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 32px;
  padding: 28px 0;
  border-bottom: 1px solid var(--rule);
}
.sw-exp-meta { }
.sw-exp-role { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; margin: 0; }
.sw-exp-org { font-size: 14px; color: var(--accent); font-weight: 600; margin: 4px 0 0; }
.sw-exp-period {
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 600;
  margin: 8px 0 0;
}
.sw-exp-summary { margin: 0; font-size: 15px; line-height: 1.6; color: #2a2a2a; }
.sw-exp-highlights {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
}
.sw-exp-highlights li {
  position: relative;
  padding-left: 20px;
  font-size: 14px;
  line-height: 1.55;
  margin-top: 7px;
}
.sw-exp-highlights li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  width: 9px;
  height: 1px;
  background: var(--accent);
}

/* ---------- Skills ---------- */
.sw-skills {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--rule);
  border: 1px solid var(--rule);
}
.sw-skill-group {
  background: var(--ground);
  padding: 22px 22px 26px;
}
.sw-skill-label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  margin: 0 0 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--accent);
  display: inline-block;
}
.sw-skill-items { list-style: none; margin: 0; padding: 0; }
.sw-skill-items li {
  font-size: 14px;
  line-height: 1.5;
  padding: 4px 0;
  color: #2a2a2a;
}

/* ---------- Education ---------- */
.sw-edu { border-top: 2px solid var(--rule-strong); }
.sw-edu-row {
  display: grid;
  grid-template-columns: 1fr 1.4fr auto;
  gap: 24px;
  align-items: baseline;
  padding: 18px 0;
  border-bottom: 1px solid var(--rule);
}
.sw-edu-degree { font-weight: 600; font-size: 15px; }
.sw-edu-org { font-size: 14px; color: #2a2a2a; }
.sw-edu-period {
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

/* ---------- Projects ---------- */
.sw-projects {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  background: var(--rule);
  border: 1px solid var(--rule);
}
.sw-project {
  background: var(--ground);
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.sw-project-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}
.sw-project-name { font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
.sw-project-tag {
  font-size: 11px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
}
.sw-project-desc { font-size: 14px; line-height: 1.55; color: #2a2a2a; margin: 0; }
.sw-project-url {
  margin-top: 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  border-bottom: 1px solid var(--accent);
  align-self: flex-start;
  padding-bottom: 2px;
}

/* ---------- Roadmap ---------- */
.sw-roadmap {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  border-top: 2px solid var(--rule-strong);
}
.sw-phase {
  padding: 26px 24px 26px 0;
  border-right: 1px solid var(--rule);
  counter-increment: sw-phase;
}
.sw-roadmap { counter-reset: sw-phase; }
.sw-phase:last-child { border-right: 0; }
.sw-phase-num {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.sw-phase-num::before {
  content: counter(sw-phase, decimal-leading-zero);
}
.sw-phase-when {
  margin: 12px 0 8px;
  font-size: 12px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink);
}
.sw-phase-focus { font-size: 15px; line-height: 1.55; color: #2a2a2a; margin: 0; }

/* ---------- Prose blocks (collaboration / industry_match / honest) ---------- */
.sw-prose {
  font-size: 18px;
  line-height: 1.62;
  color: #1c1c1c;
  max-width: 60ch;
  font-weight: 400;
}
.sw-prose.sw-prose-quote {
  border-left: 2px solid var(--accent);
  padding-left: 26px;
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

/* ---------- Contact ---------- */
.sw-contact {
  border-top: 2px solid var(--rule-strong);
  padding: 60px 0 80px;
  margin-top: 8px;
}
.sw-contact-grid {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 48px;
  align-items: start;
}
.sw-contact-cta {
  font-size: clamp(24px, 3.4vw, 38px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.08;
  margin: 0;
  max-width: 16ch;
}
.sw-contact-cta .sw-dot { color: var(--accent); }
.sw-contact-details { display: grid; gap: 0; }
.sw-cd-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 18px;
  align-items: baseline;
  padding: 13px 0;
  border-bottom: 1px solid var(--rule);
}
.sw-cd-key {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--muted);
}
.sw-cd-val { font-size: 15px; font-weight: 500; }
.sw-cd-val a { color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--accent); padding-bottom: 1px; }
.sw-links {
  list-style: none;
  margin: 20px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  grid-column: 1 / -1;
}
.sw-links a {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--ink);
  border: 1px solid var(--rule-strong);
  padding: 8px 13px;
  text-decoration: none;
  border-radius: 2px;
}
.sw-badge {
  margin-top: 40px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 600;
}
.sw-badge span { color: var(--accent); }

/* ---------- Trust-System (ADR 0012) ---------- */

/* 10-Sekunden-Antwort + Quick-Nav */
.sw-tldr {
  border-top: 2px solid var(--rule-strong);
  border-bottom: 1px solid var(--rule);
  padding: 30px 0 26px;
}
.sw-tldr-grid {
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: 48px;
  align-items: start;
}
.sw-tldr-kicker {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--accent);
  margin: 0 0 12px;
}
.sw-tldr-head {
  margin: 0;
  font-size: clamp(19px, 2.4vw, 26px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  max-width: 30ch;
}
.sw-tldr-points {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sw-tldr-points li {
  position: relative;
  padding-left: 22px;
  font-size: 14px;
  line-height: 1.5;
  color: #2a2a2a;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--rule);
  margin-bottom: 10px;
}
.sw-tldr-points li:last-child { border-bottom: 0; margin-bottom: 0; padding-bottom: 0; }
.sw-tldr-points li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  width: 11px;
  height: 2px;
  background: var(--accent);
}
.sw-quicknav {
  list-style: none;
  margin: 22px 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.sw-quicknav a {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink);
  border: 1px solid var(--rule-strong);
  padding: 7px 12px;
  text-decoration: none;
  border-radius: 2px;
}

/* Self-Intro */
.sw-intro-media {
  display: block;
  width: 100%;
  max-width: 760px;
  background: #000;
  border: 1px solid var(--rule);
}
.sw-intro-audio { width: 100%; max-width: 560px; display: block; }
.sw-intro-transcript {
  margin: 18px 0 0;
  font-size: 15px;
  line-height: 1.62;
  color: #2a2a2a;
  max-width: 60ch;
  border-left: 2px solid var(--rule);
  padding-left: 20px;
  white-space: pre-line;
}
.sw-intro-caption {
  margin: 12px 0 0;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--muted);
}

/* Media-Galerie */
.sw-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--rule);
  border: 1px solid var(--rule);
}
.sw-gallery figure { margin: 0; background: var(--ground); }
.sw-gallery img {
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}
.sw-gallery figcaption {
  font-size: 11px;
  letter-spacing: 0.03em;
  color: var(--muted);
  padding: 8px 10px;
}
.sw-media-video {
  display: block;
  width: 100%;
  max-width: 760px;
  margin-top: 24px;
  background: #000;
  border: 1px solid var(--rule);
}

/* Belege / Nachweise */
.sw-proof { border-top: 2px solid var(--rule-strong); }
.sw-proof-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  align-items: baseline;
  padding: 18px 0;
  border-bottom: 1px solid var(--rule);
}
.sw-proof-claim {
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--muted);
  min-width: 8ch;
}
.sw-proof-link {
  font-size: 15px;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid var(--accent);
  padding-bottom: 1px;
  word-break: break-word;
}

/* Integritäts-Zeile */
.sw-integrity {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 30px;
  padding-top: 18px;
  border-top: 1px solid var(--rule);
  font-size: 12px;
  line-height: 1.55;
  color: var(--muted);
  max-width: 64ch;
}
.sw-integrity-tag {
  flex: none;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--accent);
}

@media (max-width: 820px) {
  .sw-tldr-grid { grid-template-columns: 1fr; gap: 22px; }
  .sw-gallery { grid-template-columns: 1fr 1fr; }
  .sw-proof-row { grid-template-columns: 1fr; gap: 6px; }
  .sw-hero-grid,
  .sw-sec-head,
  .sw-indent,
  .sw-contact-grid { grid-template-columns: 1fr; gap: 22px; }
  .sw-skills,
  .sw-projects { grid-template-columns: 1fr; }
  .sw-roadmap { grid-template-columns: 1fr; }
  .sw-phase { border-right: 0; border-bottom: 1px solid var(--rule); }
  .sw-fit-row,
  .sw-exp-item { grid-template-columns: 1fr; gap: 10px; }
  .sw-edu-row { grid-template-columns: 1fr; }
  .sw-edu-period { text-align: left; }
  .sw-mast-top { grid-template-columns: 1fr; }
  .sw-mast-meta { text-align: left; }
}
`}</style>

      {/* ====================== MASTHEAD ====================== */}
      <header className="sw-masthead">
        <div className="sw-wrap">
          <div className="sw-mast-top">
            <h1 className="sw-mast-name">{hero?.name ?? content.company.name ?? 'Bewerbung'}</h1>
            <div className="sw-mast-meta">
              {hero?.role ? <div>{hero.role}</div> : null}
              {companyName ? (
                <div>
                  <span className="sw-accentword">→</span> {companyName}
                </div>
              ) : null}
              <div>Bewerbung</div>
            </div>
          </div>
        </div>

        {/* ====================== HERO ====================== */}
        {hero ? (
          <div className="sw-wrap">
            <section className="sw-hero">
              <div className="sw-hero-grid">
                <div>
                  {hero.eyebrow ? <p className="sw-eyebrow">{hero.eyebrow}</p> : null}
                  <h2 className="sw-headline">
                    {hero.headline.map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </h2>
                  {hero.role ? <p className="sw-role">{hero.role}</p> : null}
                  {hero.cta ? <a className="sw-cta">{hero.cta}</a> : null}
                </div>
                <div className="sw-pitch-block">
                  <p className="sw-pitch">{hero.pitch}</p>
                  {hero.chips.length > 0 ? (
                    <ul className="sw-chips">
                      {hero.chips.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </header>

      {/* ====================== BODY SECTIONS ====================== */}
      <main className="sw-wrap">
        {/* 10-Sekunden-Antwort + Quick-Nav (Recruiter skimmen zuerst) */}
        {summary || navChips.length > 0 ? (
          <section className="sw-tldr">
            <div className="sw-tldr-grid">
              <div>
                {summary ? (
                  <>
                    <p className="sw-tldr-kicker">In 10 Sekunden</p>
                    <h2 className="sw-tldr-head">{summary.headline}</h2>
                  </>
                ) : null}
                {navChips.length > 0 ? (
                  <ul className="sw-quicknav">
                    {navChips.map((c, i) => (
                      <li key={i}>
                        <a href={`#sec-${c.type}`}>{c.label}</a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {summaryPoints.length > 0 ? (
                <ul className="sw-tldr-points">
                  {summaryPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}

        {body.map((s, i) => (
          <SwissSection key={i} section={s} num={num(i)} />
        ))}

        {/* ====================== SELF-INTRO (echtes, selbst aufgenommenes Intro) ====================== */}
        {selfIntro && selfIntro.url ? (
          <section className="sw-section" id="sec-selfintro">
            <div className="sw-sec-head">
              <div>
                <div className="sw-sec-num">{num(body.length)}</div>
                <h3 className="sw-sec-title">Lerne mich kennen</h3>
              </div>
            </div>
            {selfIntro.kind === 'video' ? (
              <video
                className="sw-intro-media"
                controls
                preload="metadata"
                playsInline
                poster={selfIntro.posterUrl}
              >
                <source
                  src={selfIntro.url}
                  {...(selfIntro.mimeType ? { type: selfIntro.mimeType } : {})}
                />
              </video>
            ) : (
              <audio className="sw-intro-audio" controls preload="metadata">
                <source
                  src={selfIntro.url}
                  {...(selfIntro.mimeType ? { type: selfIntro.mimeType } : {})}
                />
              </audio>
            )}
            {selfIntro.transcript ? (
              <p className="sw-intro-transcript">{selfIntro.transcript}</p>
            ) : null}
            {selfIntro.caption ? <p className="sw-intro-caption">{selfIntro.caption}</p> : null}
          </section>
        ) : null}

        {/* ====================== MEDIEN (Nutzer-Bilder + Video) ====================== */}
        {hasMedia ? (
          <section className="sw-section" id="sec-media">
            <div className="sw-sec-head">
              <div>
                <div className="sw-sec-num">{num(body.length + 1)}</div>
                <h3 className="sw-sec-title">Eindrücke</h3>
              </div>
            </div>
            {images.length > 0 ? (
              <div className="sw-gallery">
                {images.map((img, i) =>
                  img.url ? (
                    <figure key={i}>
                      <img src={img.url} alt={img.alt ?? img.caption ?? ''} loading="lazy" />
                      {img.caption ? <figcaption>{img.caption}</figcaption> : null}
                    </figure>
                  ) : null,
                )}
              </div>
            ) : null}
            {video && video.url ? (
              <video className="sw-media-video" controls preload="metadata" playsInline>
                <source
                  src={video.url}
                  {...(video.mimeType ? { type: video.mimeType } : {})}
                />
              </video>
            ) : null}
          </section>
        ) : null}

        {/* ====================== BELEGE / NACHWEISE ====================== */}
        {proofLinks.length > 0 ? (
          <section className="sw-section" id="sec-proof">
            <div className="sw-sec-head">
              <div>
                <div className="sw-sec-num">{num(body.length + 2)}</div>
                <h3 className="sw-sec-title">Belege</h3>
              </div>
              <p className="sw-sec-intro">Nachprüfbar — aus „vertrau mir" wird „prüf mich".</p>
            </div>
            <div className="sw-proof">
              {proofLinks.map((l, i) => (
                <div className="sw-proof-row" key={i}>
                  <span className="sw-proof-claim">{l.claim ?? 'Beleg'}</span>
                  <a
                    className="sw-proof-link"
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {l.label || host(l.url)}
                  </a>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* ====================== CONTACT ====================== */}
        {contact ? (
          <section className="sw-contact">
            <div className="sw-contact-grid">
              <div>
                <p className="sw-contact-cta">
                  {contact.ctaLine ?? 'Lassen Sie uns sprechen'}
                  <span className="sw-dot">.</span>
                </p>
                <p className="sw-badge">
                  {SECTION_LABEL.contact} <span>/</span>{' '}
                  {companyName ? companyName : 'Offero'}
                </p>
              </div>
              <div className="sw-contact-details">
                {contact.email && EMAIL.test(contact.email) ? (
                  <div className="sw-cd-row">
                    <span className="sw-cd-key">E-Mail</span>
                    <span className="sw-cd-val">
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </span>
                  </div>
                ) : null}
                {contact.phone ? (
                  <div className="sw-cd-row">
                    <span className="sw-cd-key">Telefon</span>
                    <span className="sw-cd-val">{contact.phone}</span>
                  </div>
                ) : null}
                {contact.location ? (
                  <div className="sw-cd-row">
                    <span className="sw-cd-key">Standort</span>
                    <span className="sw-cd-val">{contact.location}</span>
                  </div>
                ) : null}
                {contact.links.length > 0 ? (
                  <ul className="sw-links">
                    {contact.links.map((l, i) =>
                      URLRE.test(l.url) ? (
                        <li key={i}>
                          <a href={l.url} rel="noreferrer noopener" target="_blank">
                            {l.label || host(l.url)}
                          </a>
                        </li>
                      ) : null,
                    )}
                  </ul>
                ) : null}
              </div>
            </div>
            {/* Ehrliche KI-Integritäts-Zeile (ADR 0012) — dezent, am Fuß. */}
            {showIntegrity && integrity ? (
              <p className="sw-integrity">
                <span className="sw-integrity-tag">Transparenz</span>
                <span>{integrity.statement}</span>
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Integritäts-Zeile auch ohne Kontakt-Sektion zeigen. */}
        {!contact && showIntegrity && integrity ? (
          <section className="sw-contact">
            <p className="sw-integrity" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
              <span className="sw-integrity-tag">Transparenz</span>
              <span>{integrity.statement}</span>
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}

/* ============================================================
   Per-section renderer — narrows the discriminated union.
   ============================================================ */
function SwissSection({ section, num }: { section: Section; num: string }) {
  const label = SECTION_LABEL[section.type];

  // Shared head (number + title + optional intro).
  function Head({ intro }: { intro?: string }) {
    return (
      <div className="sw-sec-head">
        <div>
          <div className="sw-sec-num">{num}</div>
          <h3 className="sw-sec-title">{label}</h3>
        </div>
        {intro ? <p className="sw-sec-intro">{intro}</p> : null}
      </div>
    );
  }

  switch (section.type) {
    case 'fit': {
      const s = section as Extract<Section, { type: 'fit' }>;
      return (
        <section className="sw-section" id={`sec-${section.type}`}>
          <Head intro={s.intro} />
          <div className="sw-fit">
            {s.items.map((it, i) => (
              <div className="sw-fit-row" key={i}>
                <div className="sw-fit-req">{it.requirement}</div>
                <div className="sw-fit-ev">{it.evidence}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'experience': {
      const s = section as Extract<Section, { type: 'experience' }>;
      return (
        <section className="sw-section" id={`sec-${section.type}`}>
          <Head />
          <div className="sw-exp">
            {s.items.map((it, i) => (
              <div className="sw-exp-item" key={i}>
                <div className="sw-exp-meta">
                  <p className="sw-exp-role">{it.role}</p>
                  {it.org ? <p className="sw-exp-org">{it.org}</p> : null}
                  {it.period ? <p className="sw-exp-period">{it.period}</p> : null}
                </div>
                <div>
                  <p className="sw-exp-summary">{it.summary}</p>
                  {it.highlights.length > 0 ? (
                    <ul className="sw-exp-highlights">
                      {it.highlights.map((h, j) => (
                        <li key={j}>{h}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'skills': {
      const s = section as Extract<Section, { type: 'skills' }>;
      return (
        <section className="sw-section" id={`sec-${section.type}`}>
          <Head />
          <div className="sw-skills">
            {s.groups.map((g, i) => (
              <div className="sw-skill-group" key={i}>
                <p className="sw-skill-label">{g.label}</p>
                <ul className="sw-skill-items">
                  {g.items.map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'education': {
      const s = section as Extract<Section, { type: 'education' }>;
      return (
        <section className="sw-section" id={`sec-${section.type}`}>
          <Head />
          <div className="sw-edu">
            {s.items.map((it, i) => (
              <div className="sw-edu-row" key={i}>
                <span className="sw-edu-degree">{it.degree}</span>
                <span className="sw-edu-org">{it.org ?? ''}</span>
                <span className="sw-edu-period">{it.period ?? ''}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'projects': {
      const s = section as Extract<Section, { type: 'projects' }>;
      return (
        <section className="sw-section" id={`sec-${section.type}`}>
          <Head intro={s.intro} />
          <div className="sw-projects">
            {s.items.map((it, i) => (
              <div className="sw-project" key={i}>
                <div className="sw-project-top">
                  <span className="sw-project-name">{it.name}</span>
                  {it.tag ? <span className="sw-project-tag">{it.tag}</span> : null}
                </div>
                <p className="sw-project-desc">{it.description}</p>
                {it.url && URLRE.test(it.url) ? (
                  <a
                    className="sw-project-url"
                    href={it.url}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    {host(it.url)}
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'roadmap': {
      const s = section as Extract<Section, { type: 'roadmap' }>;
      return (
        <section className="sw-section" id={`sec-${section.type}`}>
          <Head />
          <div className="sw-roadmap">
            {s.phases.map((ph, i) => (
              <div className="sw-phase" key={i}>
                <div className="sw-phase-num" />
                <p className="sw-phase-when">{ph.when}</p>
                <p className="sw-phase-focus">{ph.focus}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case 'collaboration': {
      const s = section as Extract<Section, { type: 'collaboration' }>;
      return (
        <section className="sw-section" id={`sec-${section.type}`}>
          <Head />
          <div className="sw-indent">
            <div className="sw-indent-main">
              <p className="sw-prose sw-prose-quote">{s.body}</p>
            </div>
          </div>
        </section>
      );
    }

    case 'industry_match': {
      const s = section as Extract<Section, { type: 'industry_match' }>;
      return (
        <section className="sw-section" id={`sec-${section.type}`}>
          <Head />
          <div className="sw-indent">
            <div className="sw-indent-main">
              <p className="sw-prose">{s.body}</p>
            </div>
          </div>
        </section>
      );
    }

    case 'honest': {
      const s = section as Extract<Section, { type: 'honest' }>;
      return (
        <section className="sw-section" id={`sec-${section.type}`}>
          <Head />
          <div className="sw-indent">
            <div className="sw-indent-main">
              <p className="sw-prose sw-prose-quote">{s.body}</p>
            </div>
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}
