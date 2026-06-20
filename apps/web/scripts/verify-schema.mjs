// M2-Verifikation: echte Integration gegen das Supabase-Projekt.
// Beweist: offero_init_user (Wallet=1), spend_credits-Idempotenz, INSUFFICIENT_CREDITS,
// Free-Reroll, und RLS (anon/fremder Nutzer sieht fremdes Wallet nicht; Client kann Wallet
// nicht direkt schreiben). Legt Test-User an und räumt sie wieder ab.
// Lauf: node --env-file=apps/web/.env.local apps/web/scripts/verify-schema.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anon || !service) {
  console.error('Fehlende Env (URL/ANON/SERVICE).');
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false } });
const results = [];
const check = (name, cond, detail = '') => {
  results.push({ name, ok: Boolean(cond), detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const stamp = Date.now();
const pw = 'Test-Pw-' + stamp + '!a';
let userA, userB;

async function main() {
  // 1) Zwei Test-User anlegen
  const a = await admin.auth.admin.createUser({ email: `offero-verify-a-${stamp}@example.com`, password: pw, email_confirm: true });
  const b = await admin.auth.admin.createUser({ email: `offero-verify-b-${stamp}@example.com`, password: pw, email_confirm: true });
  userA = a.data.user?.id;
  userB = b.data.user?.id;
  check('Test-User angelegt', userA && userB, `${userA?.slice(0, 8)} / ${userB?.slice(0, 8)}`);

  // 2) init_user → Wallet (balance 1, free_rerolls 3) + Profil
  await admin.rpc('offero_init_user', { p_user_id: userA });
  await admin.rpc('offero_init_user', { p_user_id: userA }); // idempotent (2. Aufruf darf nicht doppeln)
  await admin.rpc('offero_init_user', { p_user_id: userB });
  const { data: walletA } = await admin.from('offero_credit_wallet').select('*').eq('user_id', userA).single();
  check('init_user: Wallet balance=1, free_rerolls=3, plan=free',
    walletA?.balance === 1 && walletA?.free_rerolls_remaining === 3 && walletA?.plan === 'free',
    JSON.stringify({ balance: walletA?.balance, rr: walletA?.free_rerolls_remaining, plan: walletA?.plan }));
  const { data: profA } = await admin.from('offero_profile').select('user_id').eq('user_id', userA).single();
  check('init_user: Profil angelegt', profA?.user_id === userA);
  const { count: ledgerInitCount } = await admin.from('offero_credit_ledger').select('*', { count: 'exact', head: true }).eq('user_id', userA);
  check('init_user idempotent: keine Ledger-Buchung beim Init', ledgerInitCount === 0, `ledger rows=${ledgerInitCount}`);

  // 3) Generierung −1 Credit
  const { data: gen1 } = await admin.rpc('offero_spend_credits', { p_user_id: userA, p_reason: 'generation', p_ref_id: 'gen-1', p_is_reroll: false });
  const r1 = Array.isArray(gen1) ? gen1[0] : gen1;
  check('spend generation: charged=1, balance=0', r1?.charged === 1 && r1?.balance === 0, JSON.stringify(r1));

  // 4) Idempotenz: gleicher ref_id bucht NICHT erneut
  const { data: gen1b } = await admin.rpc('offero_spend_credits', { p_user_id: userA, p_reason: 'generation', p_ref_id: 'gen-1', p_is_reroll: false });
  const r1b = Array.isArray(gen1b) ? gen1b[0] : gen1b;
  check('spend generation idempotent: charged=0, balance bleibt 0', r1b?.charged === 0 && r1b?.balance === 0, JSON.stringify(r1b));
  const { count: ledgerCountA } = await admin.from('offero_credit_ledger').select('*', { count: 'exact', head: true }).eq('user_id', userA).eq('ref_id', 'gen-1');
  check('Idempotenz: genau 1 Ledger-Zeile für gen-1', ledgerCountA === 1, `rows=${ledgerCountA}`);

  // 5) Kein Guthaben → INSUFFICIENT_CREDITS
  const { error: insuffErr } = await admin.rpc('offero_spend_credits', { p_user_id: userA, p_reason: 'generation', p_ref_id: 'gen-2', p_is_reroll: false });
  check('spend ohne Guthaben → INSUFFICIENT_CREDITS', insuffErr && String(insuffErr.message).includes('INSUFFICIENT_CREDITS'), insuffErr?.message ?? 'kein Fehler');

  // 6) Free-Reroll: charged=0, free_rerolls 3→2
  const { data: rr } = await admin.rpc('offero_spend_credits', { p_user_id: userA, p_reason: 're_roll', p_ref_id: 'rr-1', p_is_reroll: true });
  const rrr = Array.isArray(rr) ? rr[0] : rr;
  check('free reroll: charged=0, free_rerolls=2', rrr?.charged === 0 && rrr?.free_rerolls_remaining === 2, JSON.stringify(rrr));

  // 7) RLS — anonymer Client sieht KEIN Wallet
  const anonClient = createClient(url, anon, { auth: { persistSession: false } });
  const { data: anonWallet } = await anonClient.from('offero_credit_wallet').select('*');
  check('RLS: anon sieht keine Wallets', Array.isArray(anonWallet) && anonWallet.length === 0, `rows=${anonWallet?.length}`);

  // 8) RLS — User B (eingeloggt) sieht NICHT das Wallet von User A
  const { data: signIn } = await anonClient.auth.signInWithPassword({ email: `offero-verify-b-${stamp}@example.com`, password: pw });
  const tokenB = signIn?.session?.access_token;
  const clientB = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${tokenB}` } }, auth: { persistSession: false } });
  const { data: bSeesA } = await clientB.from('offero_credit_wallet').select('*').eq('user_id', userA);
  check('RLS: User B sieht NICHT Wallet von User A', Array.isArray(bSeesA) && bSeesA.length === 0, `rows=${bSeesA?.length}`);
  const { data: bSeesOwn } = await clientB.from('offero_credit_wallet').select('*').eq('user_id', userB);
  check('RLS: User B sieht eigenes Wallet', Array.isArray(bSeesOwn) && bSeesOwn.length === 1, `rows=${bSeesOwn?.length}`);

  // 9) RLS — Client kann Wallet NICHT direkt schreiben (keine update-Policy)
  const { data: updRows } = await clientB.from('offero_credit_wallet').update({ balance: 9999 }).eq('user_id', userB).select();
  check('RLS: direktes Wallet-Update vom Client blockiert (0 Zeilen)', Array.isArray(updRows) && updRows.length === 0, `geänderte Zeilen=${updRows?.length}`);
}

async function cleanup() {
  if (userA) await admin.auth.admin.deleteUser(userA);
  if (userB) await admin.auth.admin.deleteUser(userB);
  console.log('Cleanup: Test-User gelöscht (Cascade räumt profile/wallet/ledger ab).');
}

main()
  .catch((e) => { console.error('Fehler:', e); results.push({ name: 'run', ok: false }); })
  .finally(async () => {
    await cleanup().catch(() => {});
    const failed = results.filter((r) => !r.ok);
    console.log(`\n=== ${results.length - failed.length}/${results.length} Checks PASS ===`);
    process.exit(failed.length === 0 ? 0 : 1);
  });
