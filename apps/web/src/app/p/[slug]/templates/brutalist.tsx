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

/* ───────────────────────────── helpers ───────────────────────────── */

type Of<T extends Section['type']> = Extract<Section, { type: T }>;

function rootVars(p: Palette): React.CSSProperties {
  return {
    ['--accent' as string]: p.primary,
    ['--accent-2' as string]: p.secondary,
    ['--grad' as string]: p.grad,
  } as React.CSSProperties;
}

/* ───────────────────────────── template ──────────────────────────── */

export function BrutalistTemplate({ content }: TemplateProps) {
  const p = palette(content);
  const hero = pick(content, 'hero');
  const contact = pick(content, 'contact');
  const body = bodySections(content);
  const company = content.company.name?.trim();

  // Trust-System (ADR 0012) — alle optional, nur rendern wenn vorhanden.
  const summary = content.recruiterSummary;
  const summaryPoints = summary ? summary.points.slice(0, 3) : [];
  const selfIntro = content.selfIntro;
  const proofLinks = (content.proofLinks ?? []).filter((l) => URLRE.test(l.url));
  const integrity = content.integrity;
  const showIntegrity = !!integrity && integrity.visible !== false && !!integrity.statement.trim();
  const { images, video } = splitMedia(content);

  // Quick-Nav: max 5 Sprung-Chips auf die Body-Sektionen (In-Page-Anker).
  const navChips = body.slice(0, 5);

  // marquee source: hero chips, falling back to section labels
  const marqueeItems =
    hero && hero.chips.length
      ? hero.chips
      : body.map((s) => SECTION_LABEL[s.type]);
  const marqueeLoop =
    marqueeItems.length > 0
      ? [...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems]
      : [];

  return (
    <div className="br-root" style={rootVars(p)}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500;700&display=swap');

        .br-root {
          --ink: #050505;
          --paper: #f4f4f0;
          --line: 4px;
          background: var(--paper);
          color: var(--ink);
          font-family: 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.45;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        .br-root *,
        .br-root *::before,
        .br-root *::after { box-sizing: border-box; }

        .br-wrap { max-width: 1180px; margin: 0 auto; padding: 0 22px; }

        /* ── TOPBAR ── */
        .br-topbar {
          border-bottom: var(--line) solid var(--ink);
          background: var(--ink);
          color: var(--paper);
        }
        .br-topbar-in {
          max-width: 1180px; margin: 0 auto; padding: 12px 22px;
          display: flex; justify-content: space-between; align-items: center;
          gap: 16px; flex-wrap: wrap;
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: 0.06em;
          font-size: 13px;
        }
        .br-topbar-tag {
          background: var(--accent); color: var(--ink);
          padding: 4px 10px; border: var(--line) solid var(--paper);
        }
        .br-topbar-co { opacity: 0.92; }

        /* ── MARQUEE ── */
        .br-marquee {
          background: var(--accent);
          color: var(--ink);
          border-bottom: var(--line) solid var(--ink);
          overflow: hidden; white-space: nowrap;
          padding: 9px 0;
        }
        .br-marquee-track {
          display: inline-block;
          animation: br-scroll 34s linear infinite;
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: 0.04em;
          font-size: 15px;
        }
        .br-marquee-item { padding: 0 8px; }
        .br-marquee-dot { padding: 0 6px; }
        @keyframes br-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* ── HERO ── */
        .br-hero {
          border-bottom: var(--line) solid var(--ink);
          background:
            linear-gradient(0deg, rgba(0,0,0,0.04), rgba(0,0,0,0.04)),
            var(--paper);
          position: relative;
        }
        .br-hero-block {
          position: absolute; top: 0; right: 0; bottom: 0;
          width: 34%;
          background: var(--grad);
          border-left: var(--line) solid var(--ink);
          z-index: 0;
        }
        .br-hero-in {
          position: relative; z-index: 1;
          padding: 56px 22px 64px;
          max-width: 1180px; margin: 0 auto;
        }
        .br-eyebrow {
          display: inline-block;
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: 0.08em;
          font-size: 13px;
          background: var(--ink); color: var(--paper);
          padding: 6px 12px; margin-bottom: 22px;
        }
        .br-name {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase;
          font-size: clamp(34px, 6.4vw, 86px);
          line-height: 0.92; letter-spacing: -0.01em;
          margin: 0 0 6px;
          max-width: 16ch;
        }
        .br-name .br-hl { display: block; }
        .br-name .br-hl-mark {
          background: var(--accent);
          box-shadow: 8px 8px 0 var(--ink);
          padding: 0 0.12em; margin: 0.06em 0;
        }
        .br-role {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: 0.02em;
          font-size: clamp(16px, 2.4vw, 26px);
          margin: 16px 0 0;
        }
        .br-pitch {
          font-size: clamp(16px, 1.7vw, 20px);
          max-width: 44ch; margin: 22px 0 0;
          font-weight: 500;
        }
        .br-chips {
          display: flex; flex-wrap: wrap; gap: 12px;
          margin: 30px 0 0; list-style: none; padding: 0;
        }
        .br-chip {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: 0.03em;
          font-size: 12px;
          background: var(--paper); color: var(--ink);
          border: var(--line) solid var(--ink);
          box-shadow: 5px 5px 0 var(--ink);
          padding: 8px 12px;
        }
        .br-cta-pill {
          display: inline-block; margin-top: 30px;
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: 0.04em;
          font-size: 15px;
          background: var(--ink); color: var(--paper);
          border: var(--line) solid var(--ink);
          box-shadow: 6px 6px 0 var(--accent);
          padding: 14px 22px;
        }

        /* ── SECTIONS ── */
        .br-section {
          border-bottom: var(--line) solid var(--ink);
          padding: 54px 0;
        }
        .br-section:nth-of-type(even) { background: #ececff00; }
        .br-head {
          display: flex; align-items: baseline; gap: 14px;
          margin: 0 0 30px; flex-wrap: wrap;
        }
        .br-head-no {
          font-family: 'Archivo Black', Arial, sans-serif;
          font-size: clamp(18px, 2vw, 26px);
          background: var(--accent); color: var(--ink);
          border: var(--line) solid var(--ink);
          padding: 4px 12px;
          box-shadow: 5px 5px 0 var(--ink);
        }
        .br-head-title {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: -0.005em;
          font-size: clamp(26px, 4.4vw, 52px);
          line-height: 0.95; margin: 0;
        }
        .br-intro {
          font-size: clamp(15px, 1.5vw, 19px);
          max-width: 60ch; margin: 0 0 28px; font-weight: 500;
        }

        /* generic card */
        .br-card {
          background: var(--paper);
          border: var(--line) solid var(--ink);
          box-shadow: 8px 8px 0 var(--ink);
          padding: 22px;
        }
        .br-grid {
          display: grid; gap: 22px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        /* fit */
        .br-fit-req {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 14px; letter-spacing: 0.02em;
          margin: 0 0 8px;
          border-bottom: var(--line) solid var(--ink);
          padding-bottom: 8px;
        }
        .br-fit-ev { margin: 12px 0 0; font-weight: 500; }

        /* experience */
        .br-xp { display: grid; gap: 22px; }
        .br-xp-card {
          background: var(--paper);
          border: var(--line) solid var(--ink);
          box-shadow: 8px 8px 0 var(--accent);
          padding: 22px;
        }
        .br-xp-top {
          display: flex; justify-content: space-between;
          gap: 14px; flex-wrap: wrap; align-items: baseline;
          border-bottom: var(--line) solid var(--ink);
          padding-bottom: 12px; margin-bottom: 12px;
        }
        .br-xp-role {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: clamp(17px, 2vw, 23px);
          margin: 0;
        }
        .br-xp-org { font-weight: 700; }
        .br-xp-period {
          font-family: 'Archivo Black', Arial, sans-serif;
          font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;
          background: var(--ink); color: var(--paper);
          padding: 5px 10px; white-space: nowrap;
        }
        .br-xp-sum { margin: 0 0 14px; font-weight: 500; }
        .br-hls { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
        .br-hl-item {
          position: relative; padding-left: 26px; font-weight: 500;
        }
        .br-hl-item::before {
          content: '▌'; position: absolute; left: 0; top: 0;
          color: var(--accent); font-weight: 900;
        }

        /* skills */
        .br-skill-group { }
        .br-skill-label {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 14px; letter-spacing: 0.03em;
          margin: 0 0 14px; border-bottom: var(--line) solid var(--ink);
          padding-bottom: 8px;
        }
        .br-skill-items { display: flex; flex-wrap: wrap; gap: 10px; list-style: none; padding: 0; margin: 0; }
        .br-skill-tag {
          font-family: 'Space Grotesk', sans-serif; font-weight: 700;
          font-size: 13px;
          background: var(--accent); color: var(--ink);
          border: var(--line) solid var(--ink);
          padding: 6px 10px;
        }

        /* education */
        .br-edu { display: grid; gap: 16px; }
        .br-edu-card {
          display: flex; justify-content: space-between; gap: 14px;
          flex-wrap: wrap; align-items: baseline;
          background: var(--paper);
          border: var(--line) solid var(--ink);
          box-shadow: 6px 6px 0 var(--ink);
          padding: 18px 20px;
        }
        .br-edu-deg {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: clamp(15px, 1.8vw, 20px); margin: 0;
        }
        .br-edu-org { font-weight: 700; margin-top: 4px; }
        .br-edu-period {
          font-family: 'Archivo Black', Arial, sans-serif;
          font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;
          white-space: nowrap;
        }

        /* projects */
        .br-proj-card {
          background: var(--paper);
          border: var(--line) solid var(--ink);
          box-shadow: 8px 8px 0 var(--ink);
          padding: 22px; display: flex; flex-direction: column;
        }
        .br-proj-top {
          display: flex; justify-content: space-between; gap: 12px;
          align-items: baseline; margin-bottom: 12px;
        }
        .br-proj-name {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: clamp(16px, 1.9vw, 21px); margin: 0;
        }
        .br-proj-tag {
          font-family: 'Archivo Black', Arial, sans-serif;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
          background: var(--accent); color: var(--ink);
          border: 3px solid var(--ink); padding: 3px 8px; white-space: nowrap;
        }
        .br-proj-desc { font-weight: 500; margin: 0 0 14px; }
        .br-proj-link {
          margin-top: auto;
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 12px; letter-spacing: 0.03em;
          color: var(--ink);
          border-bottom: var(--line) solid var(--accent);
          text-decoration: none; align-self: flex-start;
        }

        /* roadmap */
        .br-road { display: grid; gap: 0; }
        .br-road-row {
          display: grid; grid-template-columns: minmax(120px, 200px) 1fr;
          border: var(--line) solid var(--ink);
          border-bottom: none;
        }
        .br-road-row:last-child { border-bottom: var(--line) solid var(--ink); }
        .br-road-when {
          background: var(--ink); color: var(--paper);
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 14px; letter-spacing: 0.03em;
          padding: 18px 18px; display: flex; align-items: center;
        }
        .br-road-focus { padding: 18px 20px; font-weight: 500; display: flex; align-items: center; }

        /* prose blocks (collaboration / industry_match / honest) */
        .br-prose-card {
          background: var(--ink); color: var(--paper);
          border: var(--line) solid var(--ink);
          box-shadow: 10px 10px 0 var(--accent);
          padding: 30px;
        }
        .br-prose-card.br-honest {
          background: var(--paper); color: var(--ink);
          box-shadow: 10px 10px 0 var(--ink);
        }
        .br-prose-body {
          font-size: clamp(16px, 1.7vw, 21px); font-weight: 500;
          margin: 0; max-width: 66ch;
        }

        /* ── CONTACT ── */
        .br-contact {
          background: var(--grad);
          border-top: var(--line) solid var(--ink);
          color: var(--ink);
          padding: 64px 0 70px;
        }
        .br-contact-cta {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: -0.005em;
          font-size: clamp(28px, 5vw, 60px); line-height: 0.95;
          margin: 0 0 28px; max-width: 18ch;
        }
        .br-contact-grid {
          display: grid; gap: 14px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          margin-bottom: 26px;
        }
        .br-contact-item {
          background: var(--paper); color: var(--ink);
          border: var(--line) solid var(--ink);
          box-shadow: 6px 6px 0 var(--ink);
          padding: 14px 16px;
        }
        .br-contact-item a { color: var(--ink); }
        .br-ci-label {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;
          display: block; margin-bottom: 6px; opacity: 0.7;
        }
        .br-ci-val { font-weight: 700; word-break: break-word; }
        .br-links { display: flex; flex-wrap: wrap; gap: 14px; list-style: none; padding: 0; margin: 0 0 26px; }
        .br-link {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 13px; letter-spacing: 0.03em;
          background: var(--ink); color: var(--paper);
          border: var(--line) solid var(--ink);
          box-shadow: 5px 5px 0 var(--paper);
          padding: 12px 16px; text-decoration: none;
        }
        .br-badge {
          display: inline-block;
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em;
          background: var(--paper); color: var(--ink);
          border: var(--line) solid var(--ink);
          padding: 8px 12px;
        }

        a { color: inherit; }

        /* ── TRUST-SYSTEM (ADR 0012) ── */

        /* recruiter summary — 10-Sekunden-Antwort direkt unter dem Hero */
        .br-summary {
          border-bottom: var(--line) solid var(--ink);
          background: var(--ink); color: var(--paper);
          padding: 40px 0;
        }
        .br-summary-tag {
          display: inline-block;
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: 0.06em;
          font-size: 11px;
          background: var(--accent); color: var(--ink);
          border: var(--line) solid var(--paper);
          padding: 6px 10px; margin-bottom: 18px;
        }
        .br-summary-head {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: -0.005em;
          font-size: clamp(22px, 3.4vw, 40px); line-height: 0.98;
          margin: 0; max-width: 24ch;
        }
        .br-summary-points {
          list-style: none; margin: 24px 0 0; padding: 0;
          display: grid; gap: 14px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .br-summary-point {
          position: relative; padding-left: 26px; font-weight: 500;
          font-size: clamp(14px, 1.4vw, 17px);
        }
        .br-summary-point::before {
          content: '▌'; position: absolute; left: 0; top: 0;
          color: var(--accent); font-weight: 900;
        }

        /* quick-nav: schmale Reihe aus Sprung-Chips */
        .br-quicknav {
          border-bottom: var(--line) solid var(--ink);
          background: var(--accent); color: var(--ink);
          padding: 12px 0;
        }
        .br-quicknav-row {
          display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
        }
        .br-quicknav-label {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 11px; letter-spacing: 0.06em;
          opacity: 0.75; margin-right: 4px;
        }
        .br-quicknav-chip {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; letter-spacing: 0.03em;
          font-size: 11px;
          background: var(--paper); color: var(--ink);
          border: 3px solid var(--ink);
          padding: 6px 10px; text-decoration: none;
        }

        /* self-intro — „Lerne mich kennen" */
        .br-intro-media { background: var(--paper); }
        .br-intro-frame {
          border: var(--line) solid var(--ink);
          box-shadow: 8px 8px 0 var(--accent);
          background: var(--ink);
          max-width: 760px;
        }
        .br-intro-frame video { display: block; width: 100%; height: auto; }
        .br-intro-frame audio { display: block; width: 100%; padding: 18px; }
        .br-intro-caption {
          font-weight: 500; margin: 18px 0 0; max-width: 60ch;
        }
        .br-intro-transcript {
          margin: 18px 0 0; max-width: 66ch;
        }
        .br-intro-transcript summary {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 12px; letter-spacing: 0.04em;
          cursor: pointer; padding: 4px 0;
        }
        .br-intro-transcript p {
          margin: 12px 0 0; font-weight: 500; white-space: pre-wrap;
        }

        /* media gallery */
        .br-gallery {
          display: grid; gap: 22px;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }
        .br-gallery-fig {
          margin: 0;
          border: var(--line) solid var(--ink);
          box-shadow: 8px 8px 0 var(--ink);
          background: var(--paper);
        }
        .br-gallery-fig img { display: block; width: 100%; height: auto; }
        .br-gallery-cap {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 11px; letter-spacing: 0.04em;
          padding: 8px 10px; border-top: var(--line) solid var(--ink);
        }
        .br-media-video {
          margin-top: 22px;
          border: var(--line) solid var(--ink);
          box-shadow: 8px 8px 0 var(--accent);
          background: var(--ink);
          max-width: 760px;
        }
        .br-media-video video { display: block; width: 100%; height: auto; }

        /* proof links — Belege */
        .br-proofs { display: grid; gap: 16px; }
        .br-proof {
          display: block; text-decoration: none;
          background: var(--paper); color: var(--ink);
          border: var(--line) solid var(--ink);
          box-shadow: 6px 6px 0 var(--ink);
          padding: 16px 18px;
        }
        .br-proof-label {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: clamp(14px, 1.6vw, 18px);
          letter-spacing: 0.02em; margin: 0;
        }
        .br-proof-claim { font-weight: 500; margin: 8px 0 0; }
        .br-proof-host {
          display: inline-block; margin-top: 10px;
          font-family: 'Archivo Black', Arial, sans-serif;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
          border-bottom: 3px solid var(--accent);
        }

        /* integrity badge — klein, ehrlich, nicht laut */
        .br-integrity {
          border-top: var(--line) solid var(--ink);
          background: var(--paper); color: var(--ink);
          padding: 18px 0;
        }
        .br-integrity-line {
          display: flex; align-items: baseline; gap: 12px;
          flex-wrap: wrap;
        }
        .br-integrity-tag {
          font-family: 'Archivo Black', Arial, sans-serif;
          text-transform: uppercase; font-size: 10px; letter-spacing: 0.06em;
          background: var(--ink); color: var(--paper);
          padding: 5px 9px; white-space: nowrap;
        }
        .br-integrity-text {
          font-size: 13px; font-weight: 500; margin: 0; opacity: 0.85;
          max-width: 80ch;
        }

        @media (max-width: 720px) {
          .br-hero-block { display: none; }
          .br-name .br-hl-mark { box-shadow: 5px 5px 0 var(--ink); }
          .br-road-row { grid-template-columns: 1fr; }
          .br-road-when { border-bottom: var(--line) solid var(--ink); }
        }
      `}</style>

      {/* TOPBAR */}
      <div className="br-topbar">
        <div className="br-topbar-in">
          <span className="br-topbar-tag">Bewerbung</span>
          {company ? <span className="br-topbar-co">→ {company}</span> : null}
        </div>
      </div>

      {/* MARQUEE */}
      {marqueeLoop.length > 0 ? (
        <div className="br-marquee" aria-hidden="true">
          <span className="br-marquee-track">
            {marqueeLoop.map((item, i) => (
              <span key={i}>
                <span className="br-marquee-item">{item}</span>
                <span className="br-marquee-dot">✦</span>
              </span>
            ))}
          </span>
        </div>
      ) : null}

      {/* HERO */}
      {hero ? (
        <header className="br-hero">
          <div className="br-hero-block" aria-hidden="true" />
          <div className="br-hero-in">
            {hero.eyebrow ? <span className="br-eyebrow">{hero.eyebrow}</span> : null}
            <h1 className="br-name">
              {hero.headline.length > 0
                ? hero.headline.map((line, i) => (
                    <span className="br-hl" key={i}>
                      <span className="br-hl-mark">{line}</span>
                    </span>
                  ))
                : <span className="br-hl"><span className="br-hl-mark">{hero.name}</span></span>}
            </h1>
            {hero.role ? <p className="br-role">{hero.role}</p> : null}
            <p className="br-pitch">{hero.pitch}</p>
            {hero.chips.length > 0 ? (
              <ul className="br-chips">
                {hero.chips.map((c, i) => (
                  <li className="br-chip" key={i}>
                    {c}
                  </li>
                ))}
              </ul>
            ) : null}
            {hero.cta ? <span className="br-cta-pill">{hero.cta}</span> : null}
          </div>
        </header>
      ) : null}

      {/* INTEGRITY — kleine, ehrliche Zeile direkt unter dem Hero */}
      {showIntegrity ? (
        <div className="br-integrity">
          <div className="br-wrap">
            <div className="br-integrity-line">
              <span className="br-integrity-tag">Mit KI · Inhalt real</span>
              <p className="br-integrity-text">{integrity!.statement}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* RECRUITER SUMMARY — 10-Sekunden-Antwort */}
      {summary ? (
        <section className="br-summary" aria-label="Kurzfassung">
          <div className="br-wrap">
            <span className="br-summary-tag">10-Sekunden-Antwort</span>
            <h2 className="br-summary-head">{summary.headline}</h2>
            {summaryPoints.length > 0 ? (
              <ul className="br-summary-points">
                {summaryPoints.map((pt, i) => (
                  <li className="br-summary-point" key={i}>
                    {pt}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* QUICK-NAV — Sprung-Chips */}
      {navChips.length > 0 ? (
        <nav className="br-quicknav" aria-label="Schnellnavigation">
          <div className="br-wrap br-quicknav-row">
            <span className="br-quicknav-label">Springe zu</span>
            {navChips.map((s, i) => (
              <a className="br-quicknav-chip" href={`#sec-${s.type}`} key={i}>
                {SECTION_LABEL[s.type]}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      {/* SELF-INTRO — „Lerne mich kennen" */}
      {selfIntro && URLRE.test(selfIntro.url) ? (
        <section className="br-section br-intro-media" aria-label="Lerne mich kennen">
          <div className="br-wrap">
            <div className="br-head">
              <span className="br-head-no">★</span>
              <h2 className="br-head-title">Lerne mich kennen</h2>
            </div>
            <div className="br-intro-frame">
              {selfIntro.kind === 'video' ? (
                <video
                  controls
                  preload="metadata"
                  playsInline
                  poster={selfIntro.posterUrl}
                >
                  <source
                    src={selfIntro.url}
                    type={selfIntro.mimeType || undefined}
                  />
                </video>
              ) : (
                <audio controls preload="metadata">
                  <source
                    src={selfIntro.url}
                    type={selfIntro.mimeType || undefined}
                  />
                </audio>
              )}
            </div>
            {selfIntro.caption ? (
              <p className="br-intro-caption">{selfIntro.caption}</p>
            ) : null}
            {selfIntro.transcript ? (
              <details className="br-intro-transcript">
                <summary>Transkript</summary>
                <p>{selfIntro.transcript}</p>
              </details>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* BODY SECTIONS */}
      {body.map((s, idx) => {
        const no = String(idx + 1).padStart(2, '0');
        return (
          <SectionHead key={idx} no={no} title={SECTION_LABEL[s.type]} anchorId={`sec-${s.type}`}>
            {renderSection(s)}
          </SectionHead>
        );
      })}

      {/* MEDIA — Galerie + optionales eingebettetes Video */}
      {images.length > 0 || video ? (
        <section className="br-section" aria-label="Eindrücke">
          <div className="br-wrap">
            <div className="br-head">
              <span className="br-head-no">✦</span>
              <h2 className="br-head-title">Eindrücke</h2>
            </div>
            {images.length > 0 ? (
              <div className="br-gallery">
                {images.map((m, i) => (
                  <figure className="br-gallery-fig" key={i}>
                    <img src={m.url} alt={m.alt || m.caption || ''} loading="lazy" />
                    {m.caption ? (
                      <figcaption className="br-gallery-cap">{m.caption}</figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : null}
            {video ? (
              <div className="br-media-video">
                <video controls preload="metadata" playsInline>
                  <source src={video.url} type={video.mimeType || undefined} />
                </video>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* PROOF LINKS — Belege */}
      {proofLinks.length > 0 ? (
        <section className="br-section" aria-label="Belege">
          <div className="br-wrap">
            <div className="br-head">
              <span className="br-head-no">⌖</span>
              <h2 className="br-head-title">Belege</h2>
            </div>
            <div className="br-proofs">
              {proofLinks.map((l, i) => (
                <a
                  className="br-proof"
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={i}
                >
                  <p className="br-proof-label">{l.label || host(l.url)}</p>
                  {l.claim ? <p className="br-proof-claim">{l.claim}</p> : null}
                  <span className="br-proof-host">{host(l.url)} →</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* CONTACT */}
      {contact ? (
        <footer className="br-contact">
          <div className="br-wrap">
            <h2 className="br-contact-cta">
              {contact.ctaLine ? contact.ctaLine : 'Lass uns reden.'}
            </h2>

            <div className="br-contact-grid">
              {contact.email && EMAIL.test(contact.email) ? (
                <div className="br-contact-item">
                  <span className="br-ci-label">E-Mail</span>
                  <span className="br-ci-val">
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </span>
                </div>
              ) : null}
              {contact.phone ? (
                <div className="br-contact-item">
                  <span className="br-ci-label">Telefon</span>
                  <span className="br-ci-val">{contact.phone}</span>
                </div>
              ) : null}
              {contact.location ? (
                <div className="br-contact-item">
                  <span className="br-ci-label">Standort</span>
                  <span className="br-ci-val">{contact.location}</span>
                </div>
              ) : null}
            </div>

            {contact.links.length > 0 ? (
              <ul className="br-links">
                {contact.links.map((l, i) =>
                  URLRE.test(l.url) ? (
                    <li key={i}>
                      <a className="br-link" href={l.url}>
                        {l.label || host(l.url)}
                      </a>
                    </li>
                  ) : null,
                )}
              </ul>
            ) : null}

            {contact.badge ? (
              <span className="br-badge">Erstellt mit Offero</span>
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}

/* ───────────────────────── sub components ────────────────────────── */

function SectionHead({
  no,
  title,
  children,
  anchorId,
}: {
  no: string;
  title: string;
  children: React.ReactNode;
  anchorId?: string;
}) {
  return (
    <section className="br-section" id={anchorId}>
      <div className="br-wrap">
        <div className="br-head">
          <span className="br-head-no">{no}</span>
          <h2 className="br-head-title">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function renderSection(s: Section): React.ReactNode {
  switch (s.type) {
    case 'fit':
      return <FitBlock s={s as Of<'fit'>} />;
    case 'experience':
      return <ExperienceBlock s={s as Of<'experience'>} />;
    case 'skills':
      return <SkillsBlock s={s as Of<'skills'>} />;
    case 'education':
      return <EducationBlock s={s as Of<'education'>} />;
    case 'projects':
      return <ProjectsBlock s={s as Of<'projects'>} />;
    case 'roadmap':
      return <RoadmapBlock s={s as Of<'roadmap'>} />;
    case 'collaboration':
      return <ProseBlock body={(s as Of<'collaboration'>).body} />;
    case 'industry_match':
      return <ProseBlock body={(s as Of<'industry_match'>).body} />;
    case 'honest':
      return <ProseBlock body={(s as Of<'honest'>).body} honest />;
    default:
      return null;
  }
}

function FitBlock({ s }: { s: Of<'fit'> }) {
  return (
    <>
      {s.intro ? <p className="br-intro">{s.intro}</p> : null}
      <div className="br-grid">
        {s.items.map((it, i) => (
          <div className="br-card" key={i}>
            <p className="br-fit-req">{it.requirement}</p>
            <p className="br-fit-ev">{it.evidence}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function ExperienceBlock({ s }: { s: Of<'experience'> }) {
  return (
    <div className="br-xp">
      {s.items.map((it, i) => (
        <article className="br-xp-card" key={i}>
          <div className="br-xp-top">
            <h3 className="br-xp-role">
              {it.role}
              {it.org ? <span className="br-xp-org"> · {it.org}</span> : null}
            </h3>
            {it.period ? <span className="br-xp-period">{it.period}</span> : null}
          </div>
          <p className="br-xp-sum">{it.summary}</p>
          {it.highlights.length > 0 ? (
            <ul className="br-hls">
              {it.highlights.map((h, j) => (
                <li className="br-hl-item" key={j}>
                  {h}
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function SkillsBlock({ s }: { s: Of<'skills'> }) {
  return (
    <div className="br-grid">
      {s.groups.map((g, i) => (
        <div className="br-card br-skill-group" key={i}>
          <p className="br-skill-label">{g.label}</p>
          {g.items.length > 0 ? (
            <ul className="br-skill-items">
              {g.items.map((it, j) => (
                <li className="br-skill-tag" key={j}>
                  {it}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function EducationBlock({ s }: { s: Of<'education'> }) {
  return (
    <div className="br-edu">
      {s.items.map((it, i) => (
        <div className="br-edu-card" key={i}>
          <div>
            <h3 className="br-edu-deg">{it.degree}</h3>
            {it.org ? <div className="br-edu-org">{it.org}</div> : null}
          </div>
          {it.period ? <span className="br-edu-period">{it.period}</span> : null}
        </div>
      ))}
    </div>
  );
}

function ProjectsBlock({ s }: { s: Of<'projects'> }) {
  return (
    <>
      {s.intro ? <p className="br-intro">{s.intro}</p> : null}
      <div className="br-grid">
        {s.items.map((it, i) => (
          <article className="br-proj-card" key={i}>
            <div className="br-proj-top">
              <h3 className="br-proj-name">{it.name}</h3>
              {it.tag ? <span className="br-proj-tag">{it.tag}</span> : null}
            </div>
            <p className="br-proj-desc">{it.description}</p>
            {it.url && URLRE.test(it.url) ? (
              <a className="br-proj-link" href={it.url}>
                {host(it.url)} →
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </>
  );
}

function RoadmapBlock({ s }: { s: Of<'roadmap'> }) {
  return (
    <div className="br-road">
      {s.phases.map((ph, i) => (
        <div className="br-road-row" key={i}>
          <div className="br-road-when">{ph.when}</div>
          <div className="br-road-focus">{ph.focus}</div>
        </div>
      ))}
    </div>
  );
}

function ProseBlock({ body, honest }: { body: string; honest?: boolean }) {
  return (
    <div className={honest ? 'br-prose-card br-honest' : 'br-prose-card'}>
      <p className="br-prose-body">{body}</p>
    </div>
  );
}
