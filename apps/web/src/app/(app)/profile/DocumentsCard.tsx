'use client';

import { FileUp, Loader2, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card } from '@/components/ui';
import { api } from '@/lib/api';

interface Doc {
  id: string;
  kind: string;
  file_name: string | null;
  content_type: string | null;
  size_bytes: number;
}

interface DocsResp {
  documents: Doc[];
  totalBytes: number;
  maxBytes: number;
}

const KIND_LABEL: Record<string, string> = {
  cv: 'Lebenslauf',
  cover_letter: 'Anschreiben',
  certificate: 'Zertifikat',
  image: 'Bild',
  video: 'Video',
  other: 'Dokument',
};

const mb = (n: number) => (n / 1024 / 1024).toFixed(1);

export function DocumentsCard() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [max, setMax] = useState(50 * 1024 * 1024);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      const r = (await api.listDocuments()) as DocsResp;
      setDocs(r.documents);
      setTotal(r.totalBytes);
      setMax(r.maxBytes);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Fehler beim Laden.');
    }
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErr('');
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await api.uploadDocument(file);
      }
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setErr('');
    try {
      await api.deleteDocument(id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.');
    }
  }

  const pct = Math.min(100, Math.round((total / max) * 100));

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <FileUp className="size-4 text-muted" />
        <h3 className="text-[15px] font-semibold">
          Unterlagen <span className="text-xs font-normal text-faint">(optional)</span>
        </h3>
      </div>
      <p className="text-sm text-muted">
        Lade weitere Unterlagen hoch — Anschreiben, Zertifikate, Bilder, ein kurzes Intro-Video (MP4)
        oder ZIP. Sie fließen in die Generierung ein; Bilder &amp; Video erscheinen in der Website.
        Max. 50&nbsp;MB gesamt.
      </p>

      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-faint">
          <span>
            {mb(total)} / {mb(max)} MB belegt
          </span>
          <span>{docs.length} Datei(en)</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className={`h-full rounded-full transition-all ${pct > 90 ? 'bg-danger' : 'bg-brand'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <label className="block">
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.webp,.gif,.mp4,.zip,application/pdf,image/*,video/mp4,application/zip"
          disabled={busy}
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = '';
          }}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-bg-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-fg hover:file:bg-surface-2 disabled:opacity-50"
        />
      </label>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" /> Lade hoch…
        </p>
      )}
      {err && <p className="text-sm text-danger">{err}</p>}

      {docs.length > 0 && (
        <ul className="divide-y divide-line">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-fg">{d.file_name ?? 'Datei'}</p>
                <p className="text-xs text-faint">
                  {KIND_LABEL[d.kind] ?? d.kind} · {mb(d.size_bytes)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(d.id)}
                className="shrink-0 rounded-md p-1.5 text-faint hover:bg-surface-2 hover:text-danger"
                aria-label="Löschen"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {docs.length === 0 && !busy && (
        <p className="flex items-center gap-2 text-xs text-faint">
          <Upload className="size-3.5" /> Noch keine Unterlagen hochgeladen.
        </p>
      )}
    </Card>
  );
}
