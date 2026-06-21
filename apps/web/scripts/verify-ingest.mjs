// M3c-Live-Verifikation: CV-Upload → INGEST-Parse (Claude Haiku) → cv_structured.
// Lauf: BASE_URL=http://localhost:3001 node --env-file=apps/web/.env.local apps/web/scripts/verify-ingest.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const base = process.env.BASE_URL ?? 'http://localhost:3001';
const admin = createClient(url, service, { auth: { persistSession: false }, db: { schema: 'offero' } });

const results = [];
const check = (n, c, d = '') => { results.push({ n, ok: Boolean(c) }); console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); };

const CV = `Clarence Johnson — M.Eng.
Mannheim · clarence@example.com

Profil
KI- und Automatisierungs-Engineer. Baut RAG-, LLM- und Agentic-Lösungen, nah am Kunden.

Berufserfahrung
2024–heute  Freelancer, KI & Prozessautomatisierung
  - RAG-Pipelines und LLM-Integrationen mit Claude und Supabase gebaut
  - Workflow-Automatisierung für mittelständische Kunden
2014–2024  Projektingenieur, Anlagenbau
  - Über zehn Jahre Projektarbeit vom Bedarf bis zum Go-Live

Ausbildung
M.Eng. Maschinenbau, Hochschule Mannheim
B.Eng. Maschinenbau, Hochschule Mannheim

Skills
Python, TypeScript, Claude API, Supabase, RAG, Prozessautomatisierung, Projektmanagement

Sprachen
Deutsch (Muttersprache), Englisch (verhandlungssicher)`;

const stamp = Date.now();
const pw = 'Test-Pw-' + stamp + '!a';
let uid, cvPath;

async function main() {
  const a = await admin.auth.admin.createUser({ email: `ingest-${stamp}@example.com`, password: pw, email_confirm: true });
  uid = a.data.user?.id;
  const anonC = createClient(url, anon, { auth: { persistSession: false } });
  const { data: si } = await anonC.auth.signInWithPassword({ email: `ingest-${stamp}@example.com`, password: pw });
  const H = { Authorization: `Bearer ${si?.session?.access_token}` };
  check('Test-User + Login', Boolean(uid && si?.session?.access_token));

  const fd = new FormData();
  fd.append('file', new Blob([CV], { type: 'text/plain' }), 'cv.txt');
  const up = await fetch(`${base}/api/v1/profile/cv`, { method: 'POST', headers: H, body: fd });
  const upj = await up.json();
  cvPath = upj?.cvRaw?.path;
  check('CV-Upload → 200', up.status === 200, `HTTP ${up.status}`);

  const t0 = Date.now();
  const pr = await fetch(`${base}/api/v1/profile/cv/parse`, { method: 'POST', headers: H });
  const prj = await pr.json();
  check('CV-Parse (INGEST) → 200', pr.status === 200, `HTTP ${pr.status} (${Date.now() - t0}ms)`);
  const cs = prj?.cvStructured;
  check('cv_structured.experience[] befüllt', Array.isArray(cs?.experience) && cs.experience.length > 0, JSON.stringify(cs?.experience?.[0]));
  check('cv_structured.education[] befüllt', Array.isArray(cs?.education) && cs.education.length > 0, JSON.stringify(cs?.education?.[0]?.degree));
  check('cv_structured.skills[] befüllt', Array.isArray(cs?.skills) && cs.skills.length >= 3, (cs?.skills || []).slice(0, 6).join(', '));
  check('cv_structured.languages[] befüllt', Array.isArray(cs?.languages) && cs.languages.length > 0, JSON.stringify(cs?.languages?.[0]));

  const g = await fetch(`${base}/api/v1/profile`, { headers: H });
  const gj = await g.json();
  check('profile.cvStructured persistiert', Array.isArray(gj?.cvStructured?.skills) && gj.cvStructured.skills.length >= 3);
}

main()
  .catch((e) => { console.error('Fehler:', e); results.push({ n: 'run', ok: false }); })
  .finally(async () => {
    if (cvPath) await admin.storage.from('offero-cv').remove([cvPath]).catch(() => {});
    if (uid) await admin.auth.admin.deleteUser(uid).catch(() => {});
    const failed = results.filter((r) => !r.ok);
    console.log(`\n=== ${results.length - failed.length}/${results.length} PASS ===`);
    process.exit(failed.length === 0 ? 0 : 1);
  });
