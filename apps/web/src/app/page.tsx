import { PLAN_CATALOG } from '@offero/core';

// Server-Component, die den geteilten Kern konsumiert (beweist die Schichtentrennung).
export default function HomePage() {
  const plans = Object.values(PLAN_CATALOG);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
      <p style={{ color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', fontSize: 13 }}>
        Phase 1 — Scaffold
      </p>
      <h1 style={{ fontSize: 40, margin: '8px 0 12px' }}>Offero</h1>
      <p style={{ color: 'var(--muted)', fontSize: 18 }}>
        Maßgeschneiderte Bewerbungs-Websites — eine pro Stelle, in Minuten generiert.
      </p>

      <h2 style={{ fontSize: 20, marginTop: 40 }}>Pakete</h2>
      <ul style={{ paddingLeft: 18 }}>
        {plans.map((plan) => (
          <li key={plan.id} style={{ marginBottom: 6 }}>
            <strong>{plan.id}</strong> — {plan.credits === 'unlimited' ? 'unbegrenzt' : `${plan.credits} Credits`}
            {' · '}
            {plan.features.join(', ')}
          </li>
        ))}
      </ul>

      <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 40 }}>
        API-Vertrag unter <code>/api/v1</code> · Health: <a href="/api/v1/health">/api/v1/health</a>
      </p>
    </main>
  );
}
