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

// Terminal — DARK TECHNICAL TERMINAL render-template.
// Server component: no hooks, no client directives, no event handlers.

type S<T extends Section['type']> = Extract<Section, { type: T }>;

function slug(input: string | undefined): string {
  const base = (input ?? 'company').toLowerCase().trim();
  const out = base
    .replace(/[äöü]/g, (m) => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[m] ?? m)
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return out.length > 0 ? out : 'company';
}

const RULE = '────────────────────────────────────────────────────────';

export function TerminalTemplate({ content }: TemplateProps) {
  const p: Palette = palette(content);
  const hero = pick(content, 'hero');
  const contact = pick(content, 'contact');
  const body = bodySections(content);
  const companyName = content.company.name ?? 'firma';
  const repo = slug(content.company.name);

  // Trust-System (ADR 0012) — alle optional/defaulted.
  const summary = content.recruiterSummary;
  const summaryPoints = summary ? summary.points.slice(0, 3) : [];
  const selfIntro = content.selfIntro;
  const { images, video } = splitMedia(content);
  const proofs = (content.proofLinks ?? []).filter((pl) => URLRE.test(pl.url));
  const integrity = content.integrity;
  const showIntegrity = !!integrity && integrity.visible !== false;

  // Quick-Nav: nur Sektionen, die im Body wirklich vorkommen (max 5 Sprung-Chips).
  const navTypes = body
    .map((s) => s.type)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .slice(0, 5);

  const rootStyle = {
    ['--accent']: p.primary,
    ['--accent-2']: p.secondary,
    ['--grad']: p.grad,
  } as React.CSSProperties;

  return (
    <div className="tm-root" style={rootStyle} lang={content.language}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap');

        .tm-root {
          --bg: #0a0d12;
          --bg-2: #0d1119;
          --panel: #0f141d;
          --line: #1b2230;
          --line-2: #232c3c;
          --txt: #cdd6e3;
          --dim: #7f8ba0;
          --faint: #586277;
          --green: #5ad19a;
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
          background: var(--bg);
          color: var(--txt);
          min-height: 100vh;
          line-height: 1.6;
          font-size: 14px;
          -webkit-font-smoothing: antialiased;
          letter-spacing: 0.1px;
          position: relative;
          overflow-x: hidden;
        }
        .tm-root *,
        .tm-root *::before,
        .tm-root *::after { box-sizing: border-box; }

        /* thin top accent bar */
        .tm-accentbar {
          position: fixed; top: 0; left: 0; right: 0; height: 2px;
          background: var(--grad); z-index: 50;
        }

        /* faint grid + scanlines backdrop */
        .tm-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(var(--line) 1px, transparent 1px),
            linear-gradient(90deg, var(--line) 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.18;
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 75%);
                  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 0%, transparent 75%);
        }
        .tm-scan {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: repeating-linear-gradient(
            to bottom, rgba(255,255,255,0.012) 0 1px, transparent 1px 3px);
          opacity: 0.7;
        }

        .tm-wrap {
          position: relative; z-index: 1;
          max-width: 860px; margin: 0 auto;
          padding: 0 22px 96px;
        }

        /* ── status / prompt line ── */
        .tm-status {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          padding: 14px 0 10px;
          border-bottom: 1px solid var(--line);
          color: var(--dim); font-size: 12.5px;
          position: sticky; top: 0; z-index: 20;
          background: linear-gradient(var(--bg) 70%, rgba(10,13,18,0.85));
          backdrop-filter: blur(6px);
        }
        .tm-dots { display: inline-flex; gap: 6px; margin-right: 4px; }
        .tm-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--line-2); }
        .tm-dot.r { background: #ff5f57; } .tm-dot.y { background: #febc2e; } .tm-dot.g { background: #28c840; }
        .tm-path { color: var(--dim); }
        .tm-prompt { color: var(--accent); font-weight: 700; }
        .tm-cmd { color: var(--txt); }
        .tm-cursor {
          display: inline-block; width: 8px; height: 1.05em; vertical-align: text-bottom;
          background: var(--accent); margin-left: 2px; opacity: 0.85;
        }

        /* ── hero ── */
        .tm-hero { padding: 40px 0 14px; }
        .tm-eyebrow {
          color: var(--accent); font-size: 12.5px; letter-spacing: 1.2px;
          text-transform: uppercase; margin: 0 0 14px;
        }
        .tm-eyebrow::before { content: '$ '; color: var(--faint); }
        .tm-name {
          margin: 0; font-size: clamp(30px, 6vw, 52px); font-weight: 700;
          line-height: 1.05; letter-spacing: -0.5px; color: #f1f5fb;
        }
        .tm-role {
          margin: 12px 0 0; color: var(--dim); font-size: 15px;
        }
        .tm-role b { color: var(--accent-2); font-weight: 500; }
        .tm-headline { margin: 26px 0 0; }
        .tm-headline .tm-hl {
          font-size: clamp(17px, 2.6vw, 22px); font-weight: 500;
          color: var(--txt); line-height: 1.5;
        }
        .tm-headline .tm-hl::before {
          content: '> '; color: var(--accent); font-weight: 700;
        }
        .tm-pitch {
          margin: 24px 0 0; max-width: 64ch; color: var(--dim);
          padding: 16px 18px; border-left: 2px solid var(--accent);
          background: linear-gradient(90deg, rgba(255,255,255,0.018), transparent);
          font-style: italic;
        }
        .tm-pitch::before { content: '// '; color: var(--faint); font-style: normal; }
        .tm-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0 0; }
        .tm-chip {
          font-size: 12.5px; color: var(--accent-2);
          border: 1px solid var(--line-2); border-radius: 3px;
          padding: 4px 9px; background: var(--panel);
        }
        .tm-chip::before { content: '['; color: var(--faint); }
        .tm-chip::after { content: ']'; color: var(--faint); }
        .tm-cta {
          display: inline-block; margin: 28px 0 0; font-size: 13.5px;
          color: var(--bg); background: var(--grad); font-weight: 700;
          padding: 9px 16px; border-radius: 3px; text-decoration: none;
        }
        .tm-cta::before { content: '▸ '; }

        /* ── divider ── */
        .tm-divider {
          color: var(--line-2); font-size: 13px; overflow: hidden;
          white-space: nowrap; user-select: none; margin: 8px 0; letter-spacing: 1px;
        }

        /* ── section frame ── */
        .tm-sec { padding: 34px 0 8px; }
        .tm-h {
          margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #e7edf6;
          display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
        }
        .tm-h .tm-sym { color: var(--accent); font-weight: 700; }
        .tm-h .tm-label { color: var(--dim); font-size: 12.5px; font-weight: 400; }
        .tm-intro { color: var(--dim); margin: 10px 0 18px; max-width: 64ch; }

        /* ── fit: key/value ── */
        .tm-kv { margin: 18px 0 0; }
        .tm-kvrow {
          padding: 14px 0; border-top: 1px dashed var(--line-2);
          display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: 14px 18px;
        }
        .tm-kvrow:first-child { border-top: none; }
        .tm-req { color: var(--txt); font-weight: 500; }
        .tm-req::before { content: 'req: '; color: var(--faint); font-weight: 400; }
        .tm-ev { color: var(--dim); }
        .tm-ev::before { content: '└─ '; color: var(--accent); }
        @media (max-width: 620px) {
          .tm-kvrow { grid-template-columns: 1fr; gap: 6px; }
        }

        /* ── experience: commit log ── */
        .tm-log { margin: 18px 0 0; position: relative; }
        .tm-commit {
          position: relative; padding: 0 0 26px 26px;
          border-left: 1px solid var(--line-2);
        }
        .tm-commit:last-child { border-left-color: transparent; padding-bottom: 4px; }
        .tm-commit::before {
          content: ''; position: absolute; left: -5px; top: 5px;
          width: 9px; height: 9px; border-radius: 50%;
          background: var(--accent); box-shadow: 0 0 0 3px var(--bg);
        }
        .tm-hash { color: var(--accent-2); font-size: 12px; }
        .tm-hash::before { content: 'commit '; color: var(--faint); }
        .tm-crole { margin: 4px 0 0; color: #e7edf6; font-weight: 700; font-size: 15px; }
        .tm-cmeta { color: var(--dim); font-size: 12.5px; margin: 2px 0 0; }
        .tm-cmeta .tm-at { color: var(--faint); }
        .tm-csum { color: var(--dim); margin: 10px 0 0; max-width: 64ch; }
        .tm-hl-list { list-style: none; margin: 10px 0 0; padding: 0; }
        .tm-hl-list li { color: var(--txt); padding: 2px 0 2px 20px; position: relative; font-size: 13.5px; }
        .tm-hl-list li::before {
          content: '+'; position: absolute; left: 0; color: var(--green); font-weight: 700;
        }

        /* ── skills: tag chips ── */
        .tm-skills { margin: 16px 0 0; }
        .tm-sgroup { padding: 12px 0; border-top: 1px dashed var(--line-2); }
        .tm-sgroup:first-child { border-top: none; }
        .tm-slabel { color: var(--accent-2); font-size: 12.5px; margin: 0 0 8px; }
        .tm-slabel::before { content: '## '; color: var(--faint); }
        .tm-tags { display: flex; flex-wrap: wrap; gap: 7px; }
        .tm-tag {
          font-size: 12.5px; color: var(--txt); background: var(--panel);
          border: 1px solid var(--line-2); border-radius: 3px; padding: 3px 8px;
        }
        .tm-tag::before { content: '['; color: var(--faint); }
        .tm-tag::after { content: ']'; color: var(--faint); }

        /* ── education ── */
        .tm-edu { margin: 16px 0 0; }
        .tm-edurow {
          padding: 11px 0; border-top: 1px dashed var(--line-2);
          display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap;
        }
        .tm-edurow:first-child { border-top: none; }
        .tm-edurow::before { content: '◦'; color: var(--accent); }
        .tm-degree { color: var(--txt); font-weight: 500; }
        .tm-eorg { color: var(--dim); }
        .tm-eperiod { color: var(--faint); font-size: 12.5px; margin-left: auto; }

        /* ── projects ── */
        .tm-projs { margin: 16px 0 0; display: grid; gap: 12px; }
        .tm-proj {
          border: 1px solid var(--line); border-radius: 5px; padding: 16px 17px;
          background: var(--panel);
        }
        .tm-pname {
          margin: 0; font-size: 14.5px; color: #e7edf6; font-weight: 700;
          display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
        }
        .tm-pname::before { content: '~/'; color: var(--accent); }
        .tm-ptag {
          font-size: 11px; color: var(--accent-2); border: 1px solid var(--line-2);
          border-radius: 3px; padding: 1px 6px; font-weight: 400;
        }
        .tm-pdesc { color: var(--dim); margin: 9px 0 0; max-width: 64ch; }
        .tm-purl {
          display: inline-block; margin: 10px 0 0; color: var(--accent);
          text-decoration: none; font-size: 12.5px;
          border-bottom: 1px solid var(--line-2);
        }
        .tm-purl::before { content: '↗ '; }
        .tm-purl:hover { border-bottom-color: var(--accent); }

        /* ── roadmap: checklist log ── */
        .tm-road { margin: 16px 0 0; }
        .tm-phase {
          padding: 12px 0; border-top: 1px dashed var(--line-2);
          display: grid; grid-template-columns: auto minmax(0,1fr); gap: 4px 12px;
        }
        .tm-phase:first-child { border-top: none; }
        .tm-check { color: var(--green); font-weight: 700; }
        .tm-when { color: var(--accent-2); font-size: 12.5px; }
        .tm-focus { grid-column: 2; color: var(--txt); }

        /* ── prose blocks: collaboration / industry_match / honest ── */
        .tm-prose {
          margin: 14px 0 0; color: var(--dim); max-width: 66ch;
          padding: 16px 18px; border: 1px solid var(--line); border-radius: 5px;
          background: var(--panel);
        }
        .tm-prose.honest { border-left: 2px solid var(--accent); }

        /* ── contact ── */
        .tm-contact { padding: 40px 0 0; }
        .tm-cbox {
          border: 1px solid var(--line-2); border-radius: 6px; padding: 22px 22px;
          background: linear-gradient(180deg, var(--bg-2), var(--panel));
        }
        .tm-cline { color: var(--txt); font-size: 16px; margin: 0 0 16px; }
        .tm-cline::before { content: '$ '; color: var(--accent); font-weight: 700; }
        .tm-cgrid { display: grid; gap: 8px; }
        .tm-cfield { color: var(--dim); font-size: 13.5px; }
        .tm-ckey { color: var(--faint); }
        .tm-cfield a { color: var(--accent); text-decoration: none; }
        .tm-cfield a:hover { text-decoration: underline; }
        .tm-links { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 0; }
        .tm-link {
          font-size: 12.5px; color: var(--accent); text-decoration: none;
          border: 1px solid var(--line-2); border-radius: 3px; padding: 5px 10px;
          background: var(--bg);
        }
        .tm-link::before { content: '→ '; color: var(--faint); }
        .tm-link:hover { border-color: var(--accent); }
        .tm-badge {
          margin: 22px 0 0; color: var(--faint); font-size: 11.5px;
        }
        .tm-badge::before { content: '# '; }

        .tm-eof {
          margin: 30px 0 0; color: var(--faint); font-size: 12.5px;
          text-align: center;
        }

        /* ── recruiter summary: 10s answer ── */
        .tm-summary {
          margin: 30px 0 0; border: 1px solid var(--line-2); border-radius: 6px;
          padding: 18px 19px; background: linear-gradient(180deg, var(--bg-2), var(--panel));
        }
        .tm-summary-h {
          margin: 0; color: #e7edf6; font-weight: 700; font-size: 15px;
        }
        .tm-summary-h::before { content: '>> '; color: var(--accent); font-weight: 700; }
        .tm-summary-list { list-style: none; margin: 12px 0 0; padding: 0; }
        .tm-summary-list li {
          color: var(--txt); padding: 3px 0 3px 20px; position: relative; font-size: 13.5px;
        }
        .tm-summary-list li::before {
          content: '+'; position: absolute; left: 0; color: var(--green); font-weight: 700;
        }

        /* ── quick-nav: command-like jump row ── */
        .tm-nav {
          display: flex; flex-wrap: wrap; gap: 7px; margin: 16px 0 0;
          color: var(--dim); font-size: 12.5px; align-items: center;
        }
        .tm-nav-pre { color: var(--faint); }
        .tm-nav-chip {
          color: var(--accent); text-decoration: none;
          border: 1px solid var(--line-2); border-radius: 3px; padding: 3px 9px;
          background: var(--bg);
        }
        .tm-nav-chip::before { content: '#'; color: var(--faint); }
        .tm-nav-chip:hover { border-color: var(--accent); }

        /* ── self intro: lerne mich kennen ── */
        .tm-intro-media { margin: 18px 0 0; }
        .tm-intro-media video,
        .tm-intro-media audio {
          width: 100%; max-width: 560px; border: 1px solid var(--line-2);
          border-radius: 5px; background: #000; display: block;
        }
        .tm-intro-media audio { background: var(--panel); }
        .tm-intro-cap { color: var(--dim); font-size: 12.5px; margin: 8px 0 0; }
        .tm-intro-cap::before { content: '// '; color: var(--faint); }
        .tm-intro-trans {
          margin: 12px 0 0; color: var(--dim); max-width: 66ch;
          padding: 14px 16px; border: 1px solid var(--line); border-radius: 5px;
          background: var(--panel); font-size: 13px; white-space: pre-wrap;
        }
        .tm-intro-trans .tm-trans-key { color: var(--faint); display: block; margin: 0 0 6px; }

        /* ── media gallery ── */
        .tm-gallery {
          margin: 18px 0 0; display: grid; gap: 10px;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        }
        .tm-gallery figure { margin: 0; }
        .tm-gallery img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          border: 1px solid var(--line-2); border-radius: 4px; background: var(--panel);
        }
        .tm-gallery figcaption { color: var(--faint); font-size: 11.5px; margin: 5px 0 0; }
        .tm-mediavideo {
          margin: 14px 0 0; width: 100%; border: 1px solid var(--line-2);
          border-radius: 5px; background: #000; display: block;
        }

        /* ── proof links: $ verifiable ── */
        .tm-proofs { margin: 16px 0 0; display: grid; gap: 8px; }
        .tm-proof {
          display: block; text-decoration: none; color: var(--txt);
          border: 1px solid var(--line); border-radius: 5px; padding: 12px 14px;
          background: var(--panel);
        }
        .tm-proof:hover { border-color: var(--accent); }
        .tm-proof-label { color: var(--accent); font-size: 13.5px; }
        .tm-proof-label::before { content: '$ '; color: var(--faint); font-weight: 700; }
        .tm-proof-claim { color: var(--dim); font-size: 12.5px; margin: 4px 0 0; }
        .tm-proof-claim::before { content: '└─ '; color: var(--accent); }

        /* ── integrity: comment-style note ── */
        .tm-integrity {
          margin: 22px 0 0; color: var(--faint); font-size: 12px;
          max-width: 66ch; line-height: 1.55;
        }
        .tm-integrity::before { content: '// '; color: var(--green); }
      `}</style>

      <div className="tm-accentbar" />
      <div className="tm-bg" />
      <div className="tm-scan" />

      <div className="tm-wrap">
        {/* status / prompt line */}
        <div className="tm-status">
          <span className="tm-dots">
            <span className="tm-dot r" />
            <span className="tm-dot y" />
            <span className="tm-dot g" />
          </span>
          <span className="tm-path">~/bewerbung/{repo}</span>
          <span className="tm-prompt">$</span>
          <span className="tm-cmd">cat application.md</span>
          <span className="tm-cursor" />
        </div>

        {/* HERO */}
        {hero ? (
          <header className="tm-hero">
            {hero.eyebrow ? <p className="tm-eyebrow">{hero.eyebrow}</p> : null}
            <h1 className="tm-name">{hero.name}</h1>
            {hero.role ? (
              <p className="tm-role">
                {hero.role}
                {content.company.name ? (
                  <>
                    {' '}
                    @ <b>{content.company.name}</b>
                  </>
                ) : null}
              </p>
            ) : null}
            {hero.headline.length > 0 ? (
              <div className="tm-headline">
                {hero.headline.map((line, i) => (
                  <p key={i} className="tm-hl">
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
            <p className="tm-pitch">{hero.pitch}</p>
            {hero.chips.length > 0 ? (
              <div className="tm-chips">
                {hero.chips.map((c, i) => (
                  <span key={i} className="tm-chip">
                    {c}
                  </span>
                ))}
              </div>
            ) : null}
            {hero.cta ? (
              <a className="tm-cta" href="#tm-contact">
                {hero.cta}
              </a>
            ) : null}
          </header>
        ) : null}

        {/* RECRUITER SUMMARY — 10-Sekunden-Antwort */}
        {summary ? (
          <section className="tm-summary" aria-label="Kurzfazit">
            <p className="tm-summary-h">{summary.headline}</p>
            {summaryPoints.length > 0 ? (
              <ul className="tm-summary-list">
                {summaryPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {/* QUICK-NAV — command-like jump row */}
        {navTypes.length > 0 ? (
          <nav className="tm-nav" aria-label="Schnellnavigation">
            <span className="tm-nav-pre">cd</span>
            {navTypes.map((t) => (
              <a key={t} className="tm-nav-chip" href={`#sec-${t}`}>
                {SECTION_LABEL[t]}
              </a>
            ))}
          </nav>
        ) : null}

        {/* SELF INTRO — Lerne mich kennen */}
        {selfIntro ? (
          <section className="tm-sec" aria-label="Lerne mich kennen">
            <SectionHeadRaw sym="▸" title="Lerne mich kennen" note="// echt, selbst aufgenommen" />
            <div className="tm-intro-media">
              {selfIntro.kind === 'video' ? (
                <video
                  controls
                  preload="metadata"
                  playsInline
                  poster={selfIntro.posterUrl}
                  src={selfIntro.url}
                >
                  {selfIntro.mimeType ? (
                    <source src={selfIntro.url} type={selfIntro.mimeType} />
                  ) : null}
                </video>
              ) : (
                <audio controls preload="metadata" src={selfIntro.url}>
                  {selfIntro.mimeType ? (
                    <source src={selfIntro.url} type={selfIntro.mimeType} />
                  ) : null}
                </audio>
              )}
              {selfIntro.caption ? <p className="tm-intro-cap">{selfIntro.caption}</p> : null}
              {selfIntro.transcript ? (
                <div className="tm-intro-trans">
                  <span className="tm-trans-key"># transcript</span>
                  {selfIntro.transcript}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* BODY SECTIONS */}
        {body.map((s, i) => (
          <SectionBlock key={`${s.type}-${i}`} section={s} />
        ))}

        {/* MEDIA — Nutzer-Bilder + optionales Video */}
        {images.length > 0 || video ? (
          <section className="tm-sec" aria-label="Eindrücke">
            <SectionHeadRaw sym="##" title="Eindrücke" note="ls ./media" />
            {images.length > 0 ? (
              <div className="tm-gallery">
                {images.map((m, i) => (
                  <figure key={i}>
                    <img src={m.url} alt={m.alt ?? m.caption ?? ''} loading="lazy" />
                    {m.caption ? <figcaption>{m.caption}</figcaption> : null}
                  </figure>
                ))}
              </div>
            ) : null}
            {video ? (
              <video
                className="tm-mediavideo"
                controls
                preload="metadata"
                playsInline
                src={video.url}
              >
                {video.mimeType ? <source src={video.url} type={video.mimeType} /> : null}
              </video>
            ) : null}
          </section>
        ) : null}

        {/* PROOF LINKS — Belege */}
        {proofs.length > 0 ? (
          <section className="tm-sec" aria-label="Belege">
            <SectionHeadRaw sym="$" title="Belege" note="// prüf mich" />
            <div className="tm-proofs">
              {proofs.map((pl, i) => (
                <a
                  key={i}
                  className="tm-proof"
                  href={pl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="tm-proof-label">{pl.label || host(pl.url)}</span>
                  {pl.claim ? <span className="tm-proof-claim">{pl.claim}</span> : null}
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {/* CONTACT */}
        {contact ? (
          <section className="tm-contact" id="tm-contact">
            <div className="tm-divider" aria-hidden>
              {RULE}
            </div>
            <h2 className="tm-h">
              <span className="tm-sym">$</span> {SECTION_LABEL.contact}
              <span className="tm-label">// {host('https://' + (companyName || 'kontakt'))}</span>
            </h2>
            <div className="tm-cbox">
              {contact.ctaLine ? <p className="tm-cline">{contact.ctaLine}</p> : null}
              <div className="tm-cgrid">
                {contact.email && EMAIL.test(contact.email) ? (
                  <div className="tm-cfield">
                    <span className="tm-ckey">email&nbsp;&nbsp;&nbsp;</span>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </div>
                ) : contact.email ? (
                  <div className="tm-cfield">
                    <span className="tm-ckey">email&nbsp;&nbsp;&nbsp;</span>
                    {contact.email}
                  </div>
                ) : null}
                {contact.phone ? (
                  <div className="tm-cfield">
                    <span className="tm-ckey">phone&nbsp;&nbsp;&nbsp;</span>
                    {contact.phone}
                  </div>
                ) : null}
                {contact.location ? (
                  <div className="tm-cfield">
                    <span className="tm-ckey">loc&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                    {contact.location}
                  </div>
                ) : null}
              </div>
              {contact.links.length > 0 ? (
                <div className="tm-links">
                  {contact.links.map((l, i) =>
                    URLRE.test(l.url) ? (
                      <a
                        key={i}
                        className="tm-link"
                        href={l.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {l.label || host(l.url)}
                      </a>
                    ) : (
                      <span key={i} className="tm-link">
                        {l.label || l.url}
                      </span>
                    ),
                  )}
                </div>
              ) : null}
              {contact.badge ? <p className="tm-badge">made with Offero</p> : null}
            </div>
          </section>
        ) : null}

        {/* INTEGRITY — comment-style honest note */}
        {showIntegrity && integrity ? (
          <p className="tm-integrity">{integrity.statement}</p>
        ) : null}

        <p className="tm-eof" aria-hidden>
          ── EOF ──
        </p>
      </div>
    </div>
  );
}

function SectionHead({ sym, type, note }: { sym: string; type: Section['type']; note?: string }) {
  return <SectionHeadRaw sym={sym} title={SECTION_LABEL[type]} note={note} />;
}

function SectionHeadRaw({ sym, title, note }: { sym: string; title: string; note?: string }) {
  return (
    <>
      <div className="tm-divider" aria-hidden>
        {RULE}
      </div>
      <h2 className="tm-h">
        <span className="tm-sym">{sym}</span> {title}
        {note ? <span className="tm-label">{note}</span> : null}
      </h2>
    </>
  );
}

function SectionBlock({ section }: { section: Section }) {
  switch (section.type) {
    case 'fit': {
      const s = section as S<'fit'>;
      return (
        <section className="tm-sec" id="sec-fit">
          <SectionHead sym="##" type="fit" note="req → evidence" />
          {s.intro ? <p className="tm-intro">{s.intro}</p> : null}
          <div className="tm-kv">
            {s.items.map((it, i) => (
              <div key={i} className="tm-kvrow">
                <div className="tm-req">{it.requirement}</div>
                <div className="tm-ev">{it.evidence}</div>
              </div>
            ))}
          </div>
        </section>
      );
    }
    case 'experience': {
      const s = section as S<'experience'>;
      return (
        <section className="tm-sec" id="sec-experience">
          <SectionHead sym="▸" type="experience" note="git log --reverse" />
          <div className="tm-log">
            {s.items.map((it, i) => {
              const hash = (it.role + (it.org ?? '') + i).replace(/[^a-z0-9]/gi, '');
              const padded = (hash + '0000000').slice(0, 7).toLowerCase();
              return (
                <div key={i} className="tm-commit">
                  <div className="tm-hash">{padded}</div>
                  <p className="tm-crole">{it.role}</p>
                  {it.org || it.period ? (
                    <p className="tm-cmeta">
                      {it.org ? <span className="tm-at">@ </span> : null}
                      {it.org ?? ''}
                      {it.org && it.period ? ' · ' : ''}
                      {it.period ?? ''}
                    </p>
                  ) : null}
                  <p className="tm-csum">{it.summary}</p>
                  {it.highlights.length > 0 ? (
                    <ul className="tm-hl-list">
                      {it.highlights.map((h, j) => (
                        <li key={j}>{h}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      );
    }
    case 'skills': {
      const s = section as S<'skills'>;
      return (
        <section className="tm-sec" id="sec-skills">
          <SectionHead sym="##" type="skills" note="--list" />
          <div className="tm-skills">
            {s.groups.map((g, i) => (
              <div key={i} className="tm-sgroup">
                <p className="tm-slabel">{g.label}</p>
                {g.items.length > 0 ? (
                  <div className="tm-tags">
                    {g.items.map((it, j) => (
                      <span key={j} className="tm-tag">
                        {it}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      );
    }
    case 'education': {
      const s = section as S<'education'>;
      return (
        <section className="tm-sec" id="sec-education">
          <SectionHead sym="▸" type="education" />
          <div className="tm-edu">
            {s.items.map((it, i) => (
              <div key={i} className="tm-edurow">
                <span className="tm-degree">{it.degree}</span>
                {it.org ? <span className="tm-eorg">· {it.org}</span> : null}
                {it.period ? <span className="tm-eperiod">{it.period}</span> : null}
              </div>
            ))}
          </div>
        </section>
      );
    }
    case 'projects': {
      const s = section as S<'projects'>;
      return (
        <section className="tm-sec" id="sec-projects">
          <SectionHead sym="##" type="projects" note="ls -la" />
          {s.intro ? <p className="tm-intro">{s.intro}</p> : null}
          <div className="tm-projs">
            {s.items.map((it, i) => (
              <div key={i} className="tm-proj">
                <p className="tm-pname">
                  {it.name}
                  {it.tag ? <span className="tm-ptag">{it.tag}</span> : null}
                </p>
                <p className="tm-pdesc">{it.description}</p>
                {it.url && URLRE.test(it.url) ? (
                  <a
                    className="tm-purl"
                    href={it.url}
                    target="_blank"
                    rel="noreferrer noopener"
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
      const s = section as S<'roadmap'>;
      return (
        <section className="tm-sec" id="sec-roadmap">
          <SectionHead sym="▸" type="roadmap" note="// 30 · 60 · 90" />
          <div className="tm-road">
            {s.phases.map((ph, i) => (
              <div key={i} className="tm-phase">
                <span className="tm-check">[x]</span>
                <span className="tm-when">{ph.when}</span>
                <span className="tm-focus">{ph.focus}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }
    case 'collaboration': {
      const s = section as S<'collaboration'>;
      return (
        <section className="tm-sec" id="sec-collaboration">
          <SectionHead sym="//" type="collaboration" />
          <p className="tm-prose">{s.body}</p>
        </section>
      );
    }
    case 'industry_match': {
      const s = section as S<'industry_match'>;
      return (
        <section className="tm-sec" id="sec-industry_match">
          <SectionHead sym="//" type="industry_match" />
          <p className="tm-prose">{s.body}</p>
        </section>
      );
    }
    case 'honest': {
      const s = section as S<'honest'>;
      return (
        <section className="tm-sec" id="sec-honest">
          <SectionHead sym="//" type="honest" note="no overpromise" />
          <p className="tm-prose honest">{s.body}</p>
        </section>
      );
    }
    default:
      return null;
  }
}
