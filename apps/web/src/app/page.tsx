import Link from 'next/link';

// Landing (öffentlich) — Editorial Premium. Value-first: erste Bewerbung gratis (Trust-Funnel).
export default function HomePage() {
  return (
    <main>
      <nav className="nav">
        <div className="container">
          <span className="brand">offero</span>
          <div className="nav-links">
            <Link href="/login">Anmelden</Link>
            <Link className="btn btn-primary" href="/signup">
              Erste Bewerbung gratis
            </Link>
          </div>
        </div>
      </nav>

      <section className="container page">
        <p className="eyebrow">Eine Bewerbung. Eine Website. Pro Stelle.</p>
        <h1 style={{ fontSize: '3.2rem', maxWidth: 760 }}>
          Eine maßgeschneiderte Bewerbungs-Website — in Minuten, nicht Stunden.
        </h1>
        <p className="muted" style={{ fontSize: '1.2rem', maxWidth: 620 }}>
          Lade deinen Lebenslauf hoch, füge eine Stellenanzeige ein — Offero erzeugt eine zugeschnittene,
          ehrliche Website, die auffällt, statt im PDF-Stapel unterzugehen.
        </p>
        <div className="row" style={{ marginTop: 'var(--sp-5)' }}>
          <Link className="btn btn-primary btn-lg" href="/signup">
            Erste Bewerbung gratis
          </Link>
          <span className="muted" style={{ fontSize: '0.95rem' }}>
            Keine Kreditkarte. Du bestätigst alles selbst.
          </span>
        </div>

        <hr className="divider" style={{ marginTop: 'var(--sp-8)' }} />

        <div className="grid-2" style={{ marginTop: 'var(--sp-5)' }}>
          <div className="stack">
            <h3>Auffallen statt einreihen</h3>
            <p className="muted">
              Eine lebendige, gebrandete Website mit Story schlägt das 200ste PDF — pro Stelle individuell.
            </p>
          </div>
          <div className="stack">
            <h3>Ehrlich &amp; überzeugend</h3>
            <p className="muted">
              Wahrheitsgemäßes Framing, bescheidener Ton. Kein automatischer Versand — der Mensch entscheidet.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
