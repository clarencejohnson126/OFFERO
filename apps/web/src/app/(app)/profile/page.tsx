'use client';

import { FileText, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { CvStructured } from '@offero/core';

import { Button, Card, Input, Label, Pill } from '@/components/ui';
import { api } from '@/lib/api';

import { DocumentsCard } from './DocumentsCard';

interface ProfileResp {
  displayName: string | null;
  cvRaw: { bucket: string; path: string } | null;
  cvStructured: CvStructured | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResp | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<'' | 'name' | 'cv'>('');
  const [cvStep, setCvStep] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const p = (await api.getProfile()) as ProfileResp;
      setProfile(p);
      setName(p.displayName ?? '');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler');
    }
  }

  async function saveName() {
    setErr('');
    setMsg('');
    setBusy('name');
    try {
      await api.updateProfile({ displayName: name });
      setMsg('Name gespeichert.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setBusy('');
    }
  }

  // EIN Schritt: Datei wählen → hochladen → analysieren. Kein separater „Hochladen"-Klick.
  async function uploadAndAnalyze(file: File) {
    setErr('');
    setMsg('');
    setBusy('cv');
    try {
      setCvStep('Lade hoch…');
      await api.uploadCv(file);
      setCvStep('Analysiere…');
      const r = (await api.parseCv()) as { cvStructured: CvStructured };
      setProfile((p) => ({
        displayName: p?.displayName ?? null,
        cvRaw: { bucket: 'cv', path: file.name },
        cvStructured: r.cvStructured,
      }));
      setMsg('Lebenslauf hochgeladen & analysiert ✓');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler beim Lebenslauf.');
    } finally {
      setBusy('');
      setCvStep('');
    }
  }

  const cv = profile?.cvStructured ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-fg">Profil</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Optional, aber hilfreich: Lade deinen Lebenslauf hoch — die KI strukturiert ihn{' '}
          <span className="font-medium text-fg">automatisch</span>. Für eine schnelle Bewerbung
          reichen aber auch ein paar Stichworte direkt bei „Neue Bewerbung".
        </p>
      </div>

      {msg && (
        <div className="rounded-md border border-line bg-brand-soft px-3.5 py-2.5 text-sm text-brand">
          {msg}
        </div>
      )}
      {err && <p className="text-sm text-danger">{err}</p>}

      <Card className="p-5">
        <Label htmlFor="name">Anzeigename</Label>
        <div className="flex gap-2">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vor- und Nachname"
          />
          <Button variant="secondary" disabled={busy === 'name'} onClick={saveName}>
            {busy === 'name' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Speichern
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-muted" />
          <h3 className="text-[15px] font-semibold">
            Lebenslauf <span className="text-xs font-normal text-faint">(optional)</span>
          </h3>
        </div>
        <p className="mt-1.5 text-sm text-muted">
          {profile?.cvStructured
            ? 'Lebenslauf analysiert ✓ — du kannst unten prüfen oder einen neuen hochladen.'
            : 'Lade deinen Lebenslauf als PDF oder Text (.pdf, .txt, .md) hoch — er wird automatisch analysiert.'}
        </p>
        <input
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain"
          disabled={busy === 'cv'}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f) void uploadAndAnalyze(f);
            e.target.value = '';
          }}
          className="mt-3 block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-bg-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-fg hover:file:bg-surface-2 disabled:opacity-50"
        />
        {busy === 'cv' && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> {cvStep}
          </p>
        )}
      </Card>

      <DocumentsCard />

      {cv && (
        <Card className="space-y-5 p-5">
          <h3 className="text-[15px] font-semibold">Strukturierte Daten</h3>
          {cv.summary && <p className="text-sm text-muted">{cv.summary}</p>}

          {cv.experience.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wider text-faint uppercase">Erfahrung</p>
              <div className="space-y-3">
                {cv.experience.map((x, i) => (
                  <div key={i} className="border-l-2 border-line pl-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-medium text-fg">
                        {x.role}
                        {x.org ? <span className="text-muted"> · {x.org}</span> : null}
                      </p>
                      {x.period && <span className="shrink-0 font-mono text-xs text-faint">{x.period}</span>}
                    </div>
                    {x.highlights.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-sm text-muted">
                        {x.highlights.map((h, j) => (
                          <li key={j}>– {h}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {cv.education.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wider text-faint uppercase">Ausbildung</p>
              <div className="space-y-1.5">
                {cv.education.map((x, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-fg">
                      {x.degree}
                      {x.org ? <span className="text-muted"> · {x.org}</span> : null}
                    </span>
                    {x.period && <span className="shrink-0 font-mono text-xs text-faint">{x.period}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {cv.skills.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium tracking-wider text-faint uppercase">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {cv.skills.map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
              </div>
            </div>
          )}

          {cv.languages.length > 0 && (
            <p className="text-sm text-muted">
              <span className="text-fg-soft">Sprachen:</span>{' '}
              {cv.languages.map((l) => `${l.name}${l.level ? ` (${l.level})` : ''}`).join(' · ')}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
