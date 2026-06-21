'use client';

import { useEffect, useState } from 'react';

import type { CvStructured } from '@offero/core';

import { api } from '@/lib/api';

interface ProfileResp {
  displayName: string | null;
  cvRaw: { bucket: string; path: string } | null;
  cvStructured: CvStructured | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResp | null>(null);
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState('');
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

  async function run(kind: string, fn: () => Promise<void>) {
    setBusy(kind);
    setErr('');
    setMsg('');
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setBusy('');
    }
  }

  const cv = profile?.cvStructured ?? null;

  return (
    <main className="container page" style={{ maxWidth: 760 }}>
      <p className="eyebrow">Profil</p>
      <h1>Dein Profil</h1>
      <p className="muted">
        Die KI strukturiert deinen Lebenslauf — <strong>du bestätigst und korrigierst</strong>. Das ist
        die Grundlage jeder zugeschnittenen Bewerbung.
      </p>

      {msg && <p className="notice">{msg}</p>}
      {err && <p className="error">{err}</p>}

      <div className="card stack" style={{ marginTop: 'var(--sp-5)' }}>
        <div>
          <label className="label" htmlFor="name">Anzeigename</label>
          <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button
          className="btn btn-ghost"
          type="button"
          disabled={busy === 'name'}
          onClick={() => run('name', async () => {
            await api.updateProfile({ displayName: name });
            setMsg('Name gespeichert.');
          })}
        >
          {busy === 'name' ? 'Speichern…' : 'Speichern'}
        </button>
      </div>

      <div className="card stack" style={{ marginTop: 'var(--sp-4)' }}>
        <h3>Lebenslauf</h3>
        {profile?.cvRaw ? (
          <p className="muted">CV hochgeladen ✓ — du kannst ihn neu hochladen oder strukturieren.</p>
        ) : (
          <p className="muted">Lade deinen Lebenslauf als Text (.txt/.md) hoch. PDF-Parsing kommt später.</p>
        )}
        <input
          className="input"
          type="file"
          accept=".txt,.md,text/plain"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <div className="row">
          <button
            className="btn btn-ghost"
            type="button"
            disabled={!file || busy === 'upload'}
            onClick={() => run('upload', async () => {
              if (!file) return;
              await api.uploadCv(file);
              setMsg('CV hochgeladen. Jetzt strukturieren.');
              await load();
            })}
          >
            {busy === 'upload' ? 'Hochladen…' : 'Hochladen'}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={!profile?.cvRaw || busy === 'parse'}
            onClick={() => run('parse', async () => {
              const r = (await api.parseCv()) as { cvStructured: CvStructured };
              setProfile((p) => (p ? { ...p, cvStructured: r.cvStructured } : p));
              setMsg('CV strukturiert — bitte prüfen.');
            })}
          >
            {busy === 'parse' ? 'Strukturiere…' : 'Strukturieren (KI)'}
          </button>
        </div>
      </div>

      {cv && (
        <div className="card stack" style={{ marginTop: 'var(--sp-4)' }}>
          <h3>Strukturierte Daten</h3>
          {cv.summary && <p className="muted">{cv.summary}</p>}

          {cv.experience.length > 0 && (
            <div className="stack">
              <strong>Erfahrung</strong>
              {cv.experience.map((x, i) => (
                <div key={i}>
                  <div className="spread">
                    <span>{x.role}{x.org ? ` · ${x.org}` : ''}</span>
                    <span className="muted">{x.period}</span>
                  </div>
                  {x.highlights?.length > 0 && (
                    <ul className="muted" style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                      {x.highlights.map((h, j) => <li key={j}>{h}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {cv.education.length > 0 && (
            <div className="stack">
              <strong>Ausbildung</strong>
              {cv.education.map((x, i) => (
                <div className="spread" key={i}>
                  <span>{x.degree}{x.org ? ` · ${x.org}` : ''}</span>
                  <span className="muted">{x.period}</span>
                </div>
              ))}
            </div>
          )}

          {cv.skills.length > 0 && (
            <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
              {cv.skills.map((s) => <span className="tag" key={s}>{s}</span>)}
            </div>
          )}

          {cv.languages.length > 0 && (
            <p className="muted">
              Sprachen: {cv.languages.map((l) => `${l.name}${l.level ? ` (${l.level})` : ''}`).join(' · ')}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
