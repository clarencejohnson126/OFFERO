import type { ApplicationContent, MediaRef, Section } from '@offero/core';

import { SiteEffects } from './SiteEffects';
import { splitMedia } from './templates/shared';

// Rendert den generierten ApplicationContent als eigenständige Bewerbungs-Website im
// Offero-Goldstandard (Referenz: bewerbungen/N10). Cinematic-dunkler Hero, Ticker, Aufgaben-Map,
// Stationen, Fahrplan, ehrliche Einordnung, Persona, CTA + Signatur, Progress/Dot-Nav.
// Eigenständiges Theme (Klassen-Präfix os-), unabhängig vom Offero-App-Look.

const HEX = /^#([0-9a-fA-F]{6})$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URLRE = /^https?:\/\/[^\s]+$/i;
function host(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
}

function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Akzent-Palette aus dem Firmen-Branding; ohne Branding ein schlichtes, neutrales Slate
 *  (kein lautes Magenta). Zu dunkle/zu helle Markentöne (Weiß/Schwarz) werden verworfen. */
function palette(content: ApplicationContent) {
  const cols = (content.company.brand?.colors ?? []).filter(
    (c) => HEX.test(c) && lum(c) > 0.12 && lum(c) < 0.9,
  );
  const primary = cols[0] ?? '#64748b';
  const royal = cols[1] ?? (cols[0] ? '#0030ff' : '#475569');
  const cyan = cols[2] ?? primary;
  return { primary, royal, cyan, grad: `linear-gradient(120deg,${primary},${royal})` };
}

type S<T extends Section['type']> = Extract<Section, { type: T }>;

export function SiteRenderer({ content }: { content: ApplicationContent }) {
  const p = palette(content);
  const hero = content.sections.find((s): s is S<'hero'> => s.type === 'hero');
  const contact = content.sections.find((s): s is S<'contact'> => s.type === 'contact');
  const body = content.sections.filter((s) => s.type !== 'hero' && s.type !== 'contact');
  const company = content.company.name ?? '';
  const ticker = tickerWords(content);
  const summary = content.recruiterSummary;
  const selfIntro = content.selfIntro;
  const proofLinks = (content.proofLinks ?? []).filter((l) => URLRE.test(l.url));
  const integrity = content.integrity;
  const { images, video } = splitMedia(content);

  // Quick-Nav: bis zu 5 Sprung-Chips zu den ersten Body-Sektionen (gleiche id wie die Blocks).
  const navChips = body
    .map((s) => ({ type: s.type, label: LABELS[s.type] ?? '' }))
    .filter((c) => c.label)
    .slice(0, 5);

  const styleVars = {
    ['--sky' as string]: p.primary,
    ['--royal' as string]: p.royal,
    ['--cyan' as string]: p.cyan,
    ['--grad' as string]: p.grad,
  };

  return (
    <div className="os" style={styleVars} lang={content.language}>
      <style>{CSS}</style>
      <div className="os-progress" data-prog />

      {hero && <Hero hero={hero} company={company} />}

      {ticker.length > 0 && (
        <div className="os-ticker">
          <div className="os-track">
            {[0, 1].map((dup) => (
              <span key={dup}>
                {ticker.map((w, i) => (
                  <span key={i} className="os-tk">
                    {i % 2 ? <i>{w}</i> : <b>{w}</b>}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {(summary || navChips.length > 0) && (
        <section className="os-tldr">
          <div className="os-wrap os-tldr-in">
            {summary && (
              <div className="os-tldr-card os-reveal">
                <div className="os-eyebrow">10-Sekunden-Antwort</div>
                <h2 className="os-tldr-h">{summary.headline}</h2>
                {summary.points.length > 0 && (
                  <ul className="os-tldr-pts">
                    {summary.points.slice(0, 3).map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {navChips.length > 0 && (
              <nav className="os-qnav" aria-label="Schnellnavigation">
                {navChips.map((c, i) => (
                  <a key={i} className="os-qchip" href={`#sec-${c.type}`}>
                    {c.label}
                  </a>
                ))}
              </nav>
            )}
          </div>
        </section>
      )}

      {body.map((s, i) => (
        <Block key={i} section={s} index={i} />
      ))}

      {selfIntro && <SelfIntro intro={selfIntro} />}

      {(images.length > 0 || video) && <Gallery images={images} video={video} />}

      {proofLinks.length > 0 && <Proof links={proofLinks} />}

      {contact && hero && <Cta contact={contact} hero={hero} company={company} />}

      {integrity && integrity.visible !== false && integrity.statement && (
        <div className="os-integrity">
          <div className="os-wrap os-integrity-in">
            <span className="os-integrity-dot" />
            {integrity.statement}
          </div>
        </div>
      )}

      <footer className="os-foot">
        <div className="os-wrap os-foot-in">
          <div>
            © 2026 {hero?.name ?? ''}
            {hero?.role ? ` · ${hero.role}` : ''}
            {company ? ` · ${company}` : ''}
          </div>
          <div className="os-foot-links">
            {contact?.email && EMAIL.test(contact.email) && (
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
            )}
            {(contact?.links ?? []).map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <SiteEffects />
    </div>
  );
}

function Eyebrow({ n, label }: { n?: number; label: string }) {
  return (
    <div className="os-eyebrow">
      {n !== undefined ? `${String(n).padStart(2, '0')} · ${label}` : label}
    </div>
  );
}

function Hero({ hero, company }: { hero: S<'hero'>; company: string }) {
  const last = hero.headline.length - 1;
  return (
    <header className="os-hero" data-dot data-label="Start">
      <div className="os-hero-bg" />
      <div className="os-hero-veil" />
      <div className="os-wrap os-hero-in">
        <div className="os-hero-top">
          <div>
            BEWERBUNG{hero.role ? ' · ' : ''}
            <b>{hero.role}</b>
          </div>
          {company && (
            <div className="os-live">
              <span className="os-pulse" /> für <b>{company}</b>
            </div>
          )}
        </div>
        {hero.eyebrow && <div className="os-eyebrow os-on-dark">{hero.eyebrow}</div>}
        <h1 className="os-h1">
          {hero.headline.map((line, i) => (
            <span key={i} className={i === last ? 'os-hl' : undefined}>
              {line}
              {i < last ? ' ' : ''}
            </span>
          ))}
        </h1>
        <p className="os-lede">{hero.pitch}</p>
        {hero.chips.length > 0 && (
          <div className="os-chips">
            {hero.chips.map((c, i) => (
              <span key={i} className={`os-chip${i === hero.chips.length - 1 ? ' os-chip-hi' : ''}`}>
                {c}
              </span>
            ))}
          </div>
        )}
        <div className="os-cue">
          <span className="os-cue-bar" /> Warum das passt
        </div>
      </div>
    </header>
  );
}

const LABELS: Record<string, string> = {
  fit: 'Eure Aufgaben, konkret',
  experience: 'Woher ich komme',
  skills: 'Schwerpunkte',
  education: 'Ausbildung',
  projects: 'Schon gebaut',
  roadmap: 'Wie ich starten würde',
  industry_match: 'Branchen-Brücke',
  collaboration: 'Zur Zusammenarbeit',
  honest: 'Ehrlich gesagt',
};
const HEADINGS: Record<string, string> = {
  fit: 'Was ich konkret übernehme.',
  experience: 'Mein Hintergrund, ehrlich erzählt.',
  skills: 'Meine Schwerpunkte.',
  education: 'Ausbildung.',
  projects: 'Was ich schon gebaut habe.',
  roadmap: 'Meine ersten Tage, Wochen und Monate.',
  industry_match: 'Die Brücke zu eurer Branche.',
};

function Block({ section, index }: { section: Section; index: number }) {
  const n = index + 1;
  const bg = section.type === 'honest' ? 'os-warm' : index % 2 === 0 ? '' : 'os-soft';
  const dotLabel = LABELS[section.type] ?? '';

  return (
    <section className={`os-block ${bg}`} id={`sec-${section.type}`} data-dot data-label={dotLabel}>
      <div className="os-wrap">
        <Inner section={section} n={n} />
      </div>
    </section>
  );
}

function Inner({ section, n }: { section: Section; n: number }) {
  switch (section.type) {
    case 'fit':
      return (
        <>
          <div className="os-head os-reveal">
            <Eyebrow n={n} label={LABELS.fit ?? ''} />
            <h2>{HEADINGS.fit}</h2>
            {section.intro && <p>{section.intro}</p>}
          </div>
          <div className="os-maplist">
            {section.items.map((it, i) => (
              <div key={i} className="os-maprow os-reveal">
                <div className="os-ico">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <span className="os-need">{it.requirement}</span>
                  <p>{it.evidence}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    case 'experience':
      return (
        <>
          <div className="os-head os-reveal">
            <Eyebrow n={n} label={LABELS.experience ?? ''} />
            <h2>{HEADINGS.experience}</h2>
          </div>
          <div className="os-stations">
            {section.items.map((x, i) => (
              <div key={i} className="os-stn os-reveal">
                <div className="os-yr">{x.period ?? ''}</div>
                <div>
                  <h4>
                    {x.role}
                    {x.org ? ` · ${x.org}` : ''}
                  </h4>
                  <p>{x.summary}</p>
                  {x.highlights.length > 0 && (
                    <ul className="os-mini">
                      {x.highlights.map((h, j) => (
                        <li key={j}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      );
    case 'skills':
      return (
        <>
          <div className="os-head os-reveal">
            <Eyebrow n={n} label={LABELS.skills ?? ''} />
            <h2>{HEADINGS.skills}</h2>
          </div>
          <div className="os-cards">
            {section.groups.map((g, i) => (
              <div key={i} className="os-pcard os-reveal">
                <h3>
                  <span className="os-d" />
                  {g.label}
                </h3>
                <div className="os-pills">
                  {g.items.map((it, j) => (
                    <span key={j} className="os-pill">
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      );
    case 'education':
      return (
        <>
          <div className="os-head os-reveal">
            <Eyebrow n={n} label={LABELS.education ?? ''} />
            <h2>{HEADINGS.education}</h2>
          </div>
          <div className="os-stations">
            {section.items.map((e, i) => (
              <div key={i} className="os-stn os-reveal">
                <div className="os-yr">{e.period ?? ''}</div>
                <div>
                  <h4>
                    {e.degree}
                    {e.org ? ` · ${e.org}` : ''}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    case 'roadmap':
      return (
        <>
          <div className="os-head os-reveal">
            <Eyebrow n={n} label={LABELS.roadmap ?? ''} />
            <h2>{HEADINGS.roadmap}</h2>
          </div>
          <div className="os-steps">
            {section.phases.map((ph, i) => (
              <div key={i} className="os-step os-reveal">
                <div className="os-ph">{ph.when}</div>
                <div className="os-num">{i + 1}</div>
                <p>{ph.focus}</p>
              </div>
            ))}
          </div>
        </>
      );
    case 'industry_match':
      return (
        <>
          <div className="os-head os-reveal">
            <Eyebrow n={n} label={LABELS.industry_match ?? ''} />
            <h2>{HEADINGS.industry_match}</h2>
          </div>
          <div className="os-persona os-reveal">
            <p>{section.body}</p>
          </div>
        </>
      );
    case 'collaboration':
      return (
        <div className="os-persona os-reveal" style={{ marginTop: 0 }}>
          <div className="os-ptag">{LABELS.collaboration}</div>
          <p>{section.body}</p>
        </div>
      );
    case 'projects':
      return (
        <>
          <div className="os-head os-reveal">
            <Eyebrow n={n} label={LABELS.projects ?? ''} />
            <h2>{HEADINGS.projects}</h2>
            {section.intro && <p>{section.intro}</p>}
          </div>
          <div className="os-cards">
            {section.items.map((it, i) => (
              <div key={i} className="os-pcard os-reveal">
                <h3>
                  <span className="os-d" />
                  {it.name}
                  {it.tag ? <span className="os-tag">{it.tag}</span> : null}
                </h3>
                <p>
                  {it.description}
                  {it.url && URLRE.test(it.url) ? (
                    <>
                      {' '}
                      <a href={it.url} target="_blank" rel="noopener noreferrer">
                        {host(it.url)} ↗
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        </>
      );
    case 'honest':
      return (
        <div className="os-honest os-reveal">
          <h3>{LABELS.honest}</h3>
          <p>{section.body}</p>
        </div>
      );
    default:
      return null;
  }
}

function Cta({
  contact,
  hero,
  company,
}: {
  contact: S<'contact'>;
  hero: S<'hero'>;
  company: string;
}) {
  const mail =
    contact.email && EMAIL.test(contact.email)
      ? `mailto:${contact.email}?subject=${encodeURIComponent('Bewerbung' + (hero.role ? ' ' + hero.role : ''))}`
      : null;
  return (
    <section className="os-block os-cta" data-dot data-label="Kontakt" id="os-kontakt">
      <span className="os-orb" style={{ width: 340, height: 340, left: '8%', top: 0 }} />
      <span
        className="os-orb"
        style={{ width: 300, height: 300, right: '6%', bottom: 0, animationDelay: '-7s' }}
      />
      <div className="os-wrap os-cta-in">
        <div className="os-eyebrow os-on-dark os-center">Der nächste Schritt</div>
        <h2>{contact.ctaLine ?? 'Lassen wir uns kurz kennenlernen.'}</h2>
        <p>{hero.pitch}</p>
        <div className="os-btns">
          {mail && (
            <a className="os-btn os-btn-primary" href={mail} data-mailto>
              Kontakt aufnehmen
            </a>
          )}
          {contact.phone && (
            <a className="os-btn os-btn-ghost" href={`tel:${contact.phone.replace(/\s/g, '')}`}>
              {contact.phone}
            </a>
          )}
        </div>
        <div className="os-sign">
          <div className="os-nm">{hero.name}</div>
          <div className="os-ti">
            {[hero.role, contact.location, company].filter(Boolean).join(' · ')}
          </div>
        </div>
        {contact.badge && <div className="os-made">Erstellt mit Offero</div>}
      </div>
    </section>
  );
}

function SelfIntro({ intro }: { intro: NonNullable<ApplicationContent['selfIntro']> }) {
  return (
    <section className="os-block os-soft" id="sec-intro" data-dot data-label="Lerne mich kennen">
      <div className="os-wrap">
        <div className="os-head os-reveal">
          <Eyebrow label="Persönlich" />
          <h2>Lerne mich kennen.</h2>
        </div>
        <div className="os-selfintro os-reveal">
          {intro.kind === 'video' ? (
            <video
              className="os-self-media"
              controls
              preload="metadata"
              playsInline
              poster={intro.posterUrl}
            >
              <source src={intro.url} type={intro.mimeType} />
            </video>
          ) : (
            <audio className="os-self-audio" controls preload="metadata">
              <source src={intro.url} type={intro.mimeType} />
            </audio>
          )}
          {intro.caption && <p className="os-self-cap">{intro.caption}</p>}
          {intro.transcript && (
            <details className="os-self-tr">
              <summary>Transkript</summary>
              <p>{intro.transcript}</p>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}

function Gallery({ images, video }: { images: MediaRef[]; video?: MediaRef }) {
  return (
    <section className="os-block" id="sec-media" data-dot data-label="Eindrücke">
      <div className="os-wrap">
        <div className="os-head os-reveal">
          <Eyebrow label="Eindrücke" />
          <h2>Ein paar Eindrücke.</h2>
        </div>
        {video?.url && (
          <video className="os-self-media os-reveal" controls preload="metadata" playsInline>
            <source src={video.url} type={video.mimeType} />
          </video>
        )}
        {images.length > 0 && (
          <div className="os-gallery">
            {images.map((m, i) =>
              m.url ? (
                <img
                  key={i}
                  className="os-gimg os-reveal"
                  src={m.url}
                  alt={m.alt ?? m.caption ?? ''}
                  loading="lazy"
                />
              ) : null,
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Proof({ links }: { links: { label: string; url: string; claim?: string }[] }) {
  return (
    <section className="os-block os-soft" id="sec-proof" data-dot data-label="Belege">
      <div className="os-wrap">
        <div className="os-head os-reveal">
          <Eyebrow label="Nachweise" />
          <h2>Belege — prüf mich.</h2>
        </div>
        <div className="os-proof">
          {links.map((l, i) => (
            <a
              key={i}
              className="os-proof-item os-reveal"
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="os-proof-label">
                {l.label} <span className="os-proof-arrow">↗</span>
              </span>
              {l.claim && <span className="os-proof-claim">{l.claim}</span>}
              <span className="os-proof-host">{host(l.url)}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function tickerWords(content: ApplicationContent): string[] {
  const out: string[] = [];
  const skills = content.sections.find((s): s is S<'skills'> => s.type === 'skills');
  if (skills) for (const g of skills.groups) out.push(...g.items);
  const hero = content.sections.find((s): s is S<'hero'> => s.type === 'hero');
  if (hero) out.push(...hero.chips);
  const seen = new Set<string>();
  return out.filter((w) => w && w.length < 28 && !seen.has(w) && seen.add(w)).slice(0, 9);
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
.os{--ink:#0a0d14;--body:#3e454e;--mute:#6c7480;--line:#e5eaef;--bg:#fff;--bg-soft:#f6f4f8;--bg-warm:#f5f3fb;--display:'Space Grotesk',system-ui,sans-serif;--text:'Inter',system-ui,sans-serif;--maxw:1040px;font-family:var(--text);color:var(--body);background:var(--bg);font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased;min-height:100vh;overflow-x:hidden;}
.os *{margin:0;padding:0;box-sizing:border-box;}
.os h1,.os h2,.os h3,.os h4{font-family:var(--display);color:var(--ink);line-height:1.12;letter-spacing:-.01em;}
.os a{color:var(--royal);text-decoration:none;}
.os strong{color:var(--ink);font-weight:700;}
.os-wrap{max-width:var(--maxw);margin:0 auto;padding:0 26px;}
.os-progress{position:fixed;top:0;left:0;height:3px;width:0;z-index:120;background:var(--grad);}
.os-eyebrow{display:inline-flex;align-items:center;gap:9px;font-family:var(--text);font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--sky);}
.os-eyebrow::before{content:"";width:24px;height:2px;background:var(--cyan);display:inline-block;}
.os-eyebrow.os-on-dark{color:var(--cyan);}
.os-eyebrow.os-center{justify-content:center;}
/* hero */
.os-hero{position:relative;min-height:94vh;display:flex;align-items:center;color:#eaf3fb;overflow:hidden;padding:90px 0 70px;background:#0a0d14;}
.os-hero-bg{position:absolute;inset:0;z-index:0;background:radial-gradient(60% 70% at 80% 8%,color-mix(in srgb,var(--sky) 35%,transparent),transparent 70%),radial-gradient(70% 80% at 0% 100%,color-mix(in srgb,var(--royal) 60%,transparent),transparent 70%),#0a0d14;animation:os-kb 26s ease-in-out infinite alternate;}
@keyframes os-kb{from{transform:scale(1.04);}to{transform:scale(1.12);}}
.os-hero-veil{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(10,13,20,.35),rgba(10,13,20,.8));}
.os-hero-veil::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 42%,color-mix(in srgb,var(--cyan) 16%,transparent) 50%,transparent 58%);background-size:300% 300%;animation:os-sheen 8s linear infinite;}
@keyframes os-sheen{0%{background-position:120% 0;}100%{background-position:-120% 0;}}
.os-hero-in{position:relative;z-index:2;}
.os-hero-top{display:flex;justify-content:space-between;align-items:center;font-size:13px;letter-spacing:.03em;color:#c3b6d9;margin-bottom:46px;flex-wrap:wrap;gap:8px;}
.os-hero-top b{color:#fff;font-weight:700;}
.os-live{display:inline-flex;align-items:center;gap:7px;}
.os-pulse{width:8px;height:8px;border-radius:50%;background:var(--cyan);animation:os-pulse 1.8s infinite;}
@keyframes os-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--cyan) 60%,transparent);}70%{box-shadow:0 0 0 9px transparent;}100%{box-shadow:0 0 0 0 transparent;}}
.os-h1{color:#fff;font-size:clamp(38px,6.4vw,74px);font-weight:700;max-width:19ch;margin-top:14px;}
.os-h1 .os-hl{color:var(--cyan);}
.os-lede{font-size:clamp(18px,2.2vw,21px);color:#dfd6ec;max-width:55ch;margin-top:24px;line-height:1.56;}
.os-chips{margin-top:34px;display:flex;flex-wrap:wrap;gap:10px;}
.os-chip{font-size:13px;font-weight:500;color:#e4dcf0;border:1px solid rgba(255,255,255,.24);border-radius:100px;padding:8px 15px;background:rgba(10,13,20,.35);transition:transform .25s,border-color .25s,background .25s;}
.os-chip:hover{transform:translateY(-3px);border-color:var(--cyan);}
.os-chip-hi{border-color:color-mix(in srgb,var(--cyan) 60%,transparent);color:#ffd9ec;}
.os-cue{margin-top:44px;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:#b29fcf;display:flex;align-items:center;gap:11px;}
.os-cue-bar{width:1px;height:30px;background:linear-gradient(var(--cyan),transparent);}
/* ticker */
.os-ticker{background:var(--ink);overflow:hidden;white-space:nowrap;padding:13px 0;}
.os-track{display:inline-block;animation:os-scrollx 30s linear infinite;font-family:var(--display);font-weight:700;font-size:15px;letter-spacing:.05em;text-transform:uppercase;color:#5d6680;}
.os-tk{margin:0 22px;}
.os-tk b{color:var(--sky);}
.os-tk i{color:var(--cyan);font-style:normal;}
@keyframes os-scrollx{to{transform:translateX(-50%);}}
/* blocks */
.os-block{padding:84px 0;position:relative;}
.os-soft{background:var(--bg-soft);}
.os-warm{background:var(--bg-warm);}
.os-head{max-width:66ch;margin-bottom:42px;}
.os-head h2{font-size:clamp(27px,4vw,42px);font-weight:700;margin:15px 0 14px;}
.os-head p{font-size:18px;color:var(--mute);font-family:var(--text);}
.os-cards{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
.os-pcard{background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px;transition:transform .3s,box-shadow .3s;position:relative;overflow:hidden;}
.os-pcard::before{content:"";position:absolute;left:0;top:0;height:100%;width:3px;background:var(--grad);transform:scaleY(0);transform-origin:top;transition:transform .4s;}
.os-pcard:hover{transform:translateY(-4px);box-shadow:0 16px 36px color-mix(in srgb,var(--sky) 12%,transparent);}
.os-pcard:hover::before{transform:scaleY(1);}
.os-pcard h3{font-family:var(--text);font-size:18px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:10px;color:var(--ink);}
.os-pcard h3 .os-d{width:10px;height:10px;border-radius:3px;background:var(--sky);transform:rotate(45deg);flex:none;}
.os-tag{margin-left:auto;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--royal);background:color-mix(in srgb,var(--royal) 10%,transparent);border-radius:6px;padding:3px 8px;}
.os-pills{display:flex;flex-wrap:wrap;gap:8px;}
.os-pill{font-size:13px;border:1px solid var(--line);background:#fbfafd;border-radius:8px;padding:6px 11px;color:#4a515b;}
.os-maplist{display:grid;gap:14px;}
.os-maprow{display:grid;grid-template-columns:auto 1fr;gap:18px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px;align-items:start;transition:transform .3s,box-shadow .3s;}
.os-maprow:hover{transform:translateX(4px);box-shadow:0 12px 28px color-mix(in srgb,var(--sky) 8%,transparent);}
.os-ico{width:42px;height:42px;border-radius:11px;flex:none;display:flex;align-items:center;justify-content:center;background:var(--grad);color:#fff;font-family:var(--display);font-weight:700;font-size:15px;}
.os-maprow h4{font-family:var(--text);font-size:16.5px;font-weight:700;margin-bottom:5px;color:var(--ink);}
.os-maprow p{font-size:15px;}
.os-need{font-size:11.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--sky);margin-bottom:6px;display:block;}
.os-stations{display:grid;gap:12px;}
.os-stn{display:grid;grid-template-columns:auto 1fr;gap:16px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 20px;align-items:baseline;}
.os-yr{font-family:var(--display);font-weight:700;font-size:13px;color:var(--royal);white-space:nowrap;}
.os-stn h4{font-family:var(--text);font-size:16.5px;font-weight:700;margin-bottom:5px;color:var(--ink);}
.os-stn p{font-size:14.5px;}
.os-mini{margin:8px 0 0;padding:0;list-style:none;display:grid;gap:4px;}
.os-mini li{font-size:14px;color:var(--mute);padding-left:16px;position:relative;}
.os-mini li::before{content:"";position:absolute;left:2px;top:.6em;width:5px;height:5px;border-radius:50%;background:var(--sky);}
.os-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.os-step{background:#fff;border:1px solid var(--line);border-radius:16px;padding:26px;}
.os-num{font-family:var(--display);font-weight:700;font-size:50px;line-height:1;color:transparent;-webkit-text-stroke:1.4px color-mix(in srgb,var(--sky) 55%,transparent);margin-bottom:8px;}
.os-ph{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--royal);margin-bottom:8px;}
.os-step p{font-size:14.5px;}
.os-honest{background:#fff;border:1px solid var(--line);border-left:4px solid var(--sky);border-radius:0 16px 16px 0;padding:30px 34px;max-width:78ch;}
.os-honest h3{font-family:var(--text);font-size:19px;font-weight:700;margin-bottom:11px;color:var(--ink);}
.os-honest p{font-size:16.5px;}
.os-persona{max-width:80ch;border-radius:16px;padding:28px 32px;color:#eaf3fb;background:linear-gradient(135deg,var(--ink),#241040 60%,var(--royal));border:1px solid rgba(255,255,255,.12);}
.os-ptag{font-size:12px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--cyan);margin-bottom:10px;}
.os-persona p{color:#e4dcf0;font-size:16.5px;}
.os-persona p strong{color:#fff;}
/* cta */
.os-cta{text-align:center;color:#eaf3fb;overflow:hidden;background:var(--ink);}
.os-cta h2{color:#fff;font-size:clamp(28px,4.6vw,46px);max-width:22ch;margin:16px auto 16px;}
.os-cta p{color:#c2cdda;font-size:18px;max-width:56ch;margin:0 auto 34px;font-family:var(--text);}
.os-cta-in{position:relative;z-index:2;}
.os-orb{position:absolute;border-radius:50%;filter:blur(74px);opacity:.4;z-index:0;background:var(--royal);animation:os-float 15s ease-in-out infinite;}
@keyframes os-float{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(26px,-22px) scale(1.12);}}
.os-btns{display:flex;gap:13px;justify-content:center;flex-wrap:wrap;}
.os-btn{display:inline-flex;align-items:center;gap:9px;font-family:var(--text);font-weight:700;font-size:16px;padding:15px 28px;border-radius:100px;transition:transform .18s,box-shadow .18s;}
.os-btn-primary{background:linear-gradient(100deg,var(--sky),var(--royal));color:#fff;box-shadow:0 12px 30px color-mix(in srgb,var(--sky) 40%,transparent);}
.os-btn-primary:hover{transform:translateY(-3px);}
.os-btn-ghost{border:1px solid rgba(255,255,255,.28);color:#fff;}
.os-btn-ghost:hover{background:rgba(255,255,255,.08);}
.os-sign{margin-top:42px;}
.os-nm{font-family:var(--display);font-size:26px;font-weight:700;color:#fff;}
.os-ti{color:#a89ec0;font-size:14px;margin-top:4px;}
.os-made{margin-top:22px;font-size:12px;color:#6b7693;}
.os-foot{background:#0a0d14;color:#6b7693;padding:32px 0;font-size:13.5px;}
.os-foot-in{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;align-items:center;}
.os-foot-links{display:flex;gap:14px;flex-wrap:wrap;}
.os-foot a{color:#a89ec0;}
.os-foot a:hover{color:#fff;}
.os-dots{position:fixed;right:16px;top:50%;transform:translateY(-50%);z-index:110;display:flex;flex-direction:column;gap:10px;}
.os-dots a{width:9px;height:9px;border-radius:50%;background:color-mix(in srgb,var(--royal) 24%,transparent);transition:all .3s;display:block;}
.os-dots a.os-active{background:var(--sky);transform:scale(1.5);}
@media(max-width:900px){.os-dots{display:none;}}
.os-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#16181d;color:#fff;padding:13px 22px;border-radius:100px;font-family:Inter,system-ui,sans-serif;font-size:14px;font-weight:600;z-index:99999;box-shadow:0 10px 34px rgba(0,0,0,.4);opacity:0;transition:opacity .25s;}
.os-reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);}
.os-reveal.os-in{opacity:1;transform:none;}
/* tldr / quick-nav */
.os-tldr{background:var(--ink);padding:34px 0;border-bottom:1px solid rgba(255,255,255,.06);}
.os-tldr-in{display:flex;flex-direction:column;gap:22px;}
.os-tldr-card{color:#eaf3fb;}
.os-tldr-h{color:#fff;font-size:clamp(22px,3.2vw,30px);font-weight:700;margin:12px 0 16px;max-width:30ch;}
.os-tldr-pts{list-style:none;display:grid;gap:9px;max-width:72ch;}
.os-tldr-pts li{position:relative;padding-left:24px;font-size:16px;color:#dfd6ec;}
.os-tldr-pts li::before{content:"";position:absolute;left:2px;top:.55em;width:8px;height:8px;border-radius:2px;background:var(--cyan);transform:rotate(45deg);}
.os-qnav{display:flex;flex-wrap:wrap;gap:9px;}
.os-qchip{font-size:12.5px;font-weight:600;letter-spacing:.02em;color:#e4dcf0;border:1px solid rgba(255,255,255,.22);border-radius:100px;padding:7px 14px;background:rgba(255,255,255,.04);transition:border-color .25s,background .25s,transform .25s;}
.os-qchip:hover{border-color:var(--cyan);background:rgba(255,255,255,.09);transform:translateY(-2px);}
/* self-intro + media */
.os-selfintro{max-width:760px;}
.os-self-media{width:100%;border-radius:16px;border:1px solid var(--line);background:#000;display:block;}
.os-self-audio{width:100%;margin-top:4px;}
.os-self-cap{font-size:14.5px;color:var(--mute);margin-top:12px;}
.os-self-tr{margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 18px;}
.os-self-tr summary{cursor:pointer;font-family:var(--text);font-weight:700;font-size:14px;color:var(--ink);letter-spacing:.02em;}
.os-self-tr p{font-size:15px;margin-top:10px;color:var(--body);}
.os-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px;}
.os-gimg{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:14px;border:1px solid var(--line);transition:transform .3s,box-shadow .3s;}
.os-gimg:hover{transform:translateY(-3px);box-shadow:0 14px 30px color-mix(in srgb,var(--sky) 12%,transparent);}
/* proof */
.os-proof{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.os-proof-item{display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px;transition:transform .3s,box-shadow .3s,border-color .3s;}
.os-proof-item:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--sky) 40%,transparent);box-shadow:0 12px 28px color-mix(in srgb,var(--sky) 10%,transparent);}
.os-proof-label{font-family:var(--text);font-size:16.5px;font-weight:700;color:var(--ink);}
.os-proof-arrow{color:var(--royal);}
.os-proof-claim{font-size:14.5px;color:var(--body);}
.os-proof-host{font-size:12.5px;color:var(--mute);letter-spacing:.02em;}
/* integrity */
.os-integrity{background:#0a0d14;padding:0 0 8px;}
.os-integrity-in{display:flex;align-items:center;gap:10px;font-size:12.5px;line-height:1.5;color:#7d869c;padding-top:18px;}
.os-integrity-dot{width:6px;height:6px;border-radius:50%;flex:none;background:color-mix(in srgb,var(--cyan) 70%,transparent);}
@media(max-width:820px){.os-cards{grid-template-columns:1fr;}.os-steps{grid-template-columns:1fr;}.os-block{padding:58px 0;}.os-gallery{grid-template-columns:repeat(2,1fr);}.os-proof{grid-template-columns:1fr;}}
@media(prefers-reduced-motion:reduce){.os *{animation:none!important;}.os-reveal{opacity:1;transform:none;}}
`;
