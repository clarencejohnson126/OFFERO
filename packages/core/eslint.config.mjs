import { base, coreGuard } from '@offero/config/eslint';

// base + Mobile-Guard: kein React/Next/Supabase-SDK/Stripe, keine Browser-Globals im Kern.
export default [...base, ...coreGuard];
