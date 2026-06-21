// Legt einen bestätigten Demo-User an (für UI-Verifikation). Idempotent.
import { createClient } from '@supabase/supabase-js';

const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const email = process.env.DEMO_EMAIL ?? 'ui-demo@example.com';
const password = process.env.DEMO_PASSWORD ?? 'Demo-Pass-123!';

const { data: list } = await c.auth.admin.listUsers();
const existing = list?.users?.find((u) => u.email === email);
if (existing) {
  console.log('exists', existing.id);
} else {
  const { data, error } = await c.auth.admin.createUser({ email, password, email_confirm: true });
  console.log(error ? 'ERR ' + error.message : 'created ' + data.user.id);
}
