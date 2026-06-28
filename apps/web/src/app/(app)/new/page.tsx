'use client';

import { PASTE_HINT_PATTERN, TEMPLATE_CATALOG } from '@offero/core';
import { ArrowUpRight, ClipboardPaste, Link2, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { Button, Card } from '@/components/ui';
import { api, type GenStreamEvent } from '@/lib/api';

interface GenResult {
  id: string;
  slug: string;
  sections: string[];
}

interface Progress {
  pct: number;
  label: string;
}

const URL_RE = /^https?:\/\/\S+$/i;

/** Echte Stream-Events → Balkenstand. Kein Fake-Timer; jeder Wert spiegelt einen realen Schritt. */
function progressFor(ev: GenStreamEvent): Progress | null {
  if (ev.type !== 'progress') return null;
  switch (ev.stage) {
    case 'fetch_job':
      return { pct: 8, label: 'Lade Stellenanzeige…' };
    case 'fetch_brand':
      return { pct: 15, label: 'Lade Firmen-Website…' };
    case 'analyze':
      return { pct: 24, label: 'Analysiere Stelle…' };
    case 'plan':
      return { pct: 33, label: 'Plane Aufbau…' };
    case 'write': {
      const cur = ev.current ?? 0;
      const tot = ev.total ?? 1;
      return { pct: 36 + Math.round((cur / tot) * 56), label: `Schreibe Sektionen… ${cur}/${tot}` };
    }
    case 'assemble':
      return { pct: 95, label: 'Finalisiere…' };
    default:
      return null;
  }
}

export default function NewApplicationPage() {
  const [job, setJob] = useState('');
  const [about, setAbout] = useState('');
  const [titleHint, setTitleHint] = useState('');
  const [language, setLanguage] = useState('de');
  const [branding, setBranding] = useState(false);
  const [companyUrl, setCompanyUrl] = useState('');
  const [template, setTemplate] = useState('aurora');
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [intro, setIntro] = useState<File | null>(null);
  const [genImages, setGenImages] = useState(false);
  const [imageCount, setImageCount] = useState(3);
  const [remotionVideo, setRemotionVideo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [needsPaste, setNeedsPaste] = useState(false);
  const [result, setResult] = useState<GenResult | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const jobRef = useRef<HTMLTextAreaElement>(null);

  const isLink = URL_RE.test(job.trim());

  function focusJobForPaste() {
    setNeedsPaste(false);
    setErr('');
    const el = jobRef.current;
    if (el) {
      el.focus();
      el.select();
    }
  }

  async function generate() {
    setErr('');
    setNeedsProfile(false);
    setNeedsPaste(false);
    setResult(null);
    const j = job.trim();
    if (!isLink && j.length < 40) {
      setErr('Bitte die Stellenanzeige als Link einfügen — oder den kompletten Anzeigentext.');
      return;
    }
    // Kein Client-Vorabblock mehr: der Server löst Cloudflare-Portale (Indeed) über das Unlocker-
    // Backend. Scheitert es doch, kommt der freundliche „Text einfügen"-Hinweis aus dem catch.
    setBusy(true);
    setProgress({ pct: 3, label: 'Starte…' });
    try {
      // Medien VOR der Generierung hochladen (fließen dann in die Website). Best effort:
      // ein fehlgeschlagener Upload blockiert die Generierung nicht.
      const imageDocIds: string[] = [];
      if (photos.length > 0 || intro) {
        setProgress({ pct: 5, label: 'Lade Medien…' });
        for (const ph of photos.slice(0, 12)) {
          try {
            const r = (await api.uploadDocument(ph, 'image')) as { document: { id: string } };
            if (r?.document?.id) imageDocIds.push(r.document.id);
          } catch {
            /* einzelner Upload-Fehler ignoriert */
          }
        }
        if (intro) {
          try {
            await api.uploadDocument(intro, 'video');
          } catch {
            /* Intro-Upload-Fehler ignoriert */
          }
        }
      }

      const created = (await api.createApplication({
        jobUrl: isLink ? j : undefined,
        jobText: isLink ? undefined : j,
        titleHint: titleHint || undefined,
        template,
      })) as { application: { id: string; tenantSlug: string } };

      let slug = '';
      let sections: string[] = [];
      let streamError: { message: string } | null = null;
      // Echte Fortschritts-Events streamen → Balken folgt dem realen Stand.
      await api.generateApplicationStream(
        created.application.id,
        {
          language,
          focusPrompt: about.trim() || undefined,
          branding,
          companyUrl: companyUrl.trim() || undefined,
          market: language === 'en' ? 'intl' : 'dach',
          showContactDetails,
          imageDocIds: imageDocIds.length > 0 ? imageDocIds : undefined,
          motionIntro: remotionVideo,
        },
        (ev) => {
          const p = progressFor(ev);
          if (p) setProgress(p);
          if (ev.type === 'done') {
            slug = ev.slug ?? '';
            sections = ev.sections ?? [];
            setProgress({ pct: 100, label: 'Fertig' });
          }
          if (ev.type === 'error') streamError = { message: ev.message ?? 'Fehler' };
        },
      );
      if (streamError) throw new Error((streamError as { message: string }).message);
      if (!slug) throw new Error('Generierung ohne Ergebnis — bitte erneut versuchen.');

      // KI-Bilder als separater Schritt (eigenes Zeitbudget) — hängen sich an die Website an.
      if (genImages) {
        setProgress({ pct: 99, label: `Erzeuge ${imageCount} KI-Bild(er)…` });
        try {
          await api.generateImages(created.application.id, imageCount);
        } catch {
          /* Bilder sind optional — ein Fehler blockiert die fertige Bewerbung nicht. */
        }
      }

      setResult({ id: created.application.id, slug, sections });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fehler bei der Generierung.';
      if (/Stichworte|Lebenslauf|Über dich/i.test(msg)) setNeedsProfile(true);
      // „Link nicht lesbar"-Fälle: kein roter Fehler, sondern Nudge zum Anzeigentext einfügen.
      if (isLink && PASTE_HINT_PATTERN.test(msg)) setNeedsPaste(true);
      setErr(msg);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[22px] font-bold tracking-tight text-fg">Neue Bewerbung</h1>
      <p className="mt-1.5 text-sm text-muted">
        Stellenanzeige rein (Link oder Text) — Offero erzeugt eine zugeschnittene Bewerbungs-Website.
        Kein Lebenslauf nötig: ein paar Stichworte zu dir reichen. Kostet 1 Credit.
      </p>

      <Card className="mt-6 space-y-4 p-5">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-fg-soft">
            Stellenanzeige
            {isLink && (
              <span className="inline-flex items-center gap-1 text-brand">
                <Link2 className="size-3.5" /> Link erkannt
              </span>
            )}
          </label>
          <textarea
            ref={jobRef}
            value={job}
            onChange={(e) => {
              setJob(e.target.value);
              if (err) {
                setErr('');
                setNeedsPaste(false);
                setNeedsProfile(false);
              }
            }}
            rows={isLink ? 2 : 9}
            placeholder="Link zur Stellenanzeige einfügen — oder den kompletten Anzeigentext hier reinkopieren…"
            className="w-full resize-y rounded-lg border border-line bg-bg p-3.5 text-sm text-fg placeholder:text-faint focus-visible:border-brand-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          />
          <p className="mt-1 text-xs text-faint">
            Tipp: Bei modernen Job-Portalen (viel JavaScript) klappt der Link nicht immer — dann
            einfach den Anzeigentext einfügen.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-fg-soft">
            Über dich <span className="text-faint">(optional — ohne Lebenslauf empfohlen)</span>
          </label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            placeholder="Ein paar Stichworte zu dir: Erfahrung, Skills, Schwerpunkte, was dich passend macht…"
            className="w-full resize-y rounded-lg border border-line bg-bg p-3.5 text-sm text-fg placeholder:text-faint focus-visible:border-brand-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={titleHint}
            onChange={(e) => setTitleHint(e.target.value)}
            placeholder="Firma + Rolle (für die Web-Adresse), optional"
            className="h-10 flex-1 rounded-lg border border-line bg-bg px-3.5 text-sm text-fg placeholder:text-faint focus-visible:border-brand-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-10 rounded-lg border border-line bg-bg px-3 text-sm text-fg"
          >
            <option value="de">Deutsch</option>
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[13px] font-medium text-fg-soft">Design der Website</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {TEMPLATE_CATALOG.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={`rounded-lg border p-2.5 text-left transition ${
                  template === t.id
                    ? 'border-brand-line bg-brand-soft ring-1 ring-brand/30'
                    : 'border-line bg-bg-soft hover:border-line-strong'
                }`}
              >
                <div className="text-[13px] font-semibold text-fg">{t.name}</div>
                <div className="mt-0.5 text-[11px] leading-tight text-muted">{t.tagline}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-bg-soft p-3.5">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={branding}
              onChange={(e) => setBranding(e.target.checked)}
              className="mt-0.5 size-4 accent-[#d9912f]"
            />
            <span className="text-sm">
              <span className="font-medium text-fg">Im Branding der Firma</span>
              <span className="mt-0.5 block text-xs text-muted">
                Farben der ausschreibenden Firma übernehmen (ohne Logo) — die Website wird automatisch
                aus der Stelle erkannt.
              </span>
            </span>
          </label>
          {branding && (
            <input
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="Firmen-Website (optional, sonst automatisch) — z. B. lidl.de"
              className="mt-3 h-10 w-full rounded-lg border border-line bg-bg px-3.5 text-sm text-fg placeholder:text-faint focus-visible:border-brand-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            />
          )}
        </div>

        <div className="rounded-lg border border-line bg-bg-soft p-3.5">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={showContactDetails}
              onChange={(e) => setShowContactDetails(e.target.checked)}
              className="mt-0.5 size-4 accent-[#d9912f]"
            />
            <span className="text-sm">
              <span className="font-medium text-fg">Telefon/Adresse öffentlich zeigen</span>
              <span className="mt-0.5 block text-xs text-muted">
                Standard aus (Datenschutz). E-Mail bleibt sichtbar.
              </span>
            </span>
          </label>
        </div>

        <div className="rounded-lg border border-line bg-bg-soft p-3.5">
          <div className="text-[13px] font-medium text-fg">
            Fotos &amp; Intro-Video <span className="text-faint">(optional)</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            Eigene Fotos erscheinen als Galerie auf der Website; ein kurzes Intro-Video oder -Audio
            wird eingebettet. (KI-generierte Bilder folgen.)
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <label className="block text-xs text-fg-soft">
              Fotos (max. 12)
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
                className="mt-1 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-bg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-fg hover:file:border-line-strong"
              />
              {photos.length > 0 && (
                <span className="mt-1 block text-xs text-brand">{photos.length} Foto(s) gewählt</span>
              )}
            </label>
            <label className="block text-xs text-fg-soft">
              Intro-Video oder -Audio
              <input
                type="file"
                accept="video/mp4,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg"
                onChange={(e) => setIntro(e.target.files?.[0] ?? null)}
                className="mt-1 block w-full text-xs text-muted file:mr-3 file:rounded-md file:border file:border-line file:bg-bg file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-fg hover:file:border-line-strong"
              />
              {intro && <span className="mt-1 block truncate text-xs text-brand">{intro.name}</span>}
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-bg-soft p-3.5">
          <div className="text-[13px] font-medium text-fg">
            KI-Medien <span className="text-faint">(optional)</span>
          </div>
          <label className="mt-2.5 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={genImages}
              onChange={(e) => setGenImages(e.target.checked)}
              className="mt-0.5 size-4 accent-[#d9912f]"
            />
            <span className="text-sm">
              <span className="font-medium text-fg">KI-Bilder generieren</span>
              <span className="mt-0.5 block text-xs text-muted">
                Abstrakte, zur Stelle passende Bildwelt für Hero &amp; Sektionen (keine Personen, kein
                Text). Dauert ein paar Sekunden extra.
              </span>
            </span>
          </label>
          {genImages && (
            <div className="mt-2 flex items-center gap-2 pl-7 text-xs text-fg-soft">
              Anzahl:
              <select
                value={imageCount}
                onChange={(e) => setImageCount(Number(e.target.value))}
                className="h-8 rounded-md border border-line bg-bg px-2 text-sm text-fg"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-faint">(max. 5)</span>
            </div>
          )}
          <label className="mt-3 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={remotionVideo}
              onChange={(e) => setRemotionVideo(e.target.checked)}
              className="mt-0.5 size-4 accent-[#d9912f]"
            />
            <span className="text-sm">
              <span className="font-medium text-fg">Remotion-Motion-Intro</span>
              <span className="mt-0.5 block text-xs text-muted">
                Animiertes Intro (Name, Rolle, Schlagworte, Branding), das <b>live auf der Seite</b>{' '}
                abspielt. Kein Download — läuft direkt im Browser.
              </span>
            </span>
          </label>
        </div>

        <div className="space-y-3 pt-1">
          <Button onClick={generate} disabled={busy} size="lg">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? 'Generiere…' : 'Generieren'}
          </Button>
          {busy && progress && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-fg-soft">{progress.label}</span>
                <span className="font-mono text-faint">{progress.pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {err && needsPaste ? (
          <div className="rounded-md border border-[#e0b15a] bg-[#fdf6e6] p-3.5 text-sm">
            <div className="flex items-start gap-2 text-[#8a5a00]">
              <ClipboardPaste className="mt-0.5 size-4 shrink-0" />
              <p>{err}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={focusJobForPaste}
            >
              <ClipboardPaste className="size-3.5" /> Anzeigentext hier einfügen
            </Button>
          </div>
        ) : (
          err && (
            <p className="text-sm text-danger">
              {err}
              {needsProfile && (
                <>
                  {' '}
                  <Link href="/profile" className="font-medium text-brand hover:underline">
                    oder Lebenslauf hinterlegen →
                  </Link>
                </>
              )}
            </p>
          )
        )}
      </Card>

      {result && (
        <Card className="mt-5 space-y-4 p-5">
          <div className="flex items-center gap-2 text-success">
            <Sparkles className="size-5" />
            <h3 className="text-[15px] font-semibold text-fg">Fertig — deine Bewerbungs-Website steht.</h3>
          </div>
          <p className="text-sm text-muted">
            {result.sections.length} Sektionen: {result.sections.join(' · ')}
          </p>
          {genImages && (
            <p className="text-xs text-brand">✓ KI-Bilder hinzugefügt — auf der Website sichtbar.</p>
          )}
          {remotionVideo && (
            <p className="text-xs text-brand">✓ Motion-Intro eingebettet — spielt auf der Seite.</p>
          )}
          <Link href={`/p/${result.slug}`} target="_blank" className="inline-block">
            <Button size="lg">
              Bewerbung ansehen <ArrowUpRight className="size-4" />
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-faint">ATS-saubere Beilage:</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void api.downloadExport(result.id, 'pdf', `${result.slug}-ats.pdf`)}
            >
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void api.downloadExport(result.id, 'docx', `${result.slug}-ats.docx`)}
            >
              DOCX
            </Button>
          </div>
          <p className="text-xs text-faint">
            Öffentliche Adresse: <span className="font-mono">/p/{result.slug}</span>
          </p>
        </Card>
      )}
    </div>
  );
}
