// M3-Verifikation: Profil-Flow gegen die LIVE-API (Bearer-JWT). Legt Test-User an, raeumt auf.
// Lauf: BASE_URL=http://localhost:3001 node --env-file=apps/web/.env.local apps/web/scripts/verify-profile.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const base = process.env.BASE_URL ?? 'http://localhost:3000';
const admin = createClient(url, service, { auth: { persistSession: false }, db: { schema: 'offero' } });

const results = [];
const check = (n, c, d = '') => { results.push({ n, ok: Boolean(c) }); console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`); };
const stamp = Date.now();
const pw = 'Test-Pw-' + stamp + '!a';
let uid, cvPath;

async function main() {
  const a = await admin.auth.admin.createUser({ email: `m3-${stamp}@example.com`, password: pw, email_confirm: true });
  uid = a.data.user?.id;
  check('Test-User angelegt', Boolean(uid), uid?.slice(0, 8));

  const anonC = createClient(url, anon, { auth: { persistSession: false } });
  const { data: si } = await anonC.auth.signInWithPassword({ email: `m3-${stamp}@example.com`, password: pw });
  const token = si?.session?.access_token;
  check('Login → JWT', Boolean(token));
  const H = { Authorization: `Bearer ${token}` };

  const un = await fetch(`${base}/api/v1/profile`);
  check('GET /profile ohne Token → 401', un.status === 401, `HTTP ${un.status}`);

  const g = await fetch(`${base}/api/v1/profile`, { headers: H });
  const gj = await g.json();
  check('GET /profile → 200 + eigene userId', g.status === 200 && gj.userId === uid, `HTTP ${g.status}`);

  const { data: w } = await admin.from('credit_wallet').select('*').eq('user_id', uid).maybeSingle();
  check('Lazy-Init: Wallet balance=1, rerolls=0', w?.balance === 1 && w?.free_rerolls_remaining === 0, `balance=${w?.balance}`);

  const p = await fetch(`${base}/api/v1/profile`, {
    method: 'PUT', headers: { ...H, 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Clarence Test', toolStack: ['Claude', 'Supabase'] }),
  });
  const pj = await p.json();
  check('PUT /profile → displayName + toolStack gesetzt', p.status === 200 && pj.displayName === 'Clarence Test' && Array.isArray(pj.toolStack), `HTTP ${p.status}`);

  const g2 = await fetch(`${base}/api/v1/profile`, { headers: H });
  const g2j = await g2.json();
  check('GET /profile → displayName persistiert', g2j.displayName === 'Clarence Test');

  const pv = await fetch(`${base}/api/v1/profile`, {
    method: 'PUT', headers: { ...H, 'content-type': 'application/json' },
    body: JSON.stringify({ unknownField: 1 }),
  });
  check('PUT /profile ungültiges Feld → 422 (strict)', pv.status === 422, `HTTP ${pv.status}`);

  const fd = new FormData();
  fd.append('file', new Blob(['Lebenslauf Clarence Johnson, M.Eng. — KI/Automatisierung'], { type: 'text/plain' }), 'cv.txt');
  const cv = await fetch(`${base}/api/v1/profile/cv`, { method: 'POST', headers: H, body: fd });
  const cvj = await cv.json();
  cvPath = cvj?.cvRaw?.path;
  check('POST /profile/cv → cvRaw.bucket=cv', cv.status === 200 && cvj?.cvRaw?.bucket === 'cv', `HTTP ${cv.status} ${JSON.stringify(cvj?.cvRaw)}`);
  check('CV-Upload: profile.cvRaw gesetzt', cvj?.profile?.cvRaw?.path === cvPath);
}

main()
  .catch((e) => { console.error('Fehler:', e); results.push({ n: 'run', ok: false }); })
  .finally(async () => {
    if (cvPath) await admin.storage.from('offero-cv').remove([cvPath]).catch(() => {});
    if (uid) await admin.auth.admin.deleteUser(uid).catch(() => {});
    console.log('Cleanup: Test-User + CV-Objekt entfernt.');
    const failed = results.filter((r) => !r.ok);
    console.log(`\n=== ${results.length - failed.length}/${results.length} PASS ===`);
    process.exit(failed.length === 0 ? 0 : 1);
  });
