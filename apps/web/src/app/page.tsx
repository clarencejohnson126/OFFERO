import Link from 'next/link';

// Offero — Landing/Produktseite im „Katalog"-Look (McMaster-Ethos), 1:1 aus
// offero-product/catalog.html migriert. CSS unter `.ocat` gescoped → kein Leck in andere Seiten.
// Bilder liegen unter /public/{catalog,examples}. CTAs sind an die echten Flows (/signup, /login)
// verdrahtet — Design 1:1, Verkabelung an das vorhandene Routing angeschlossen.

const WHY: Array<[string, string, string]> = [
  ['Fällt im Stapel auf', 'nein', 'ja'],
  ['Auf die Stelle zugeschnitten', 'manuell', 'automatisch'],
  ['Anforderungs-Abgleich sichtbar', 'nein', 'ja'],
  ['Geöffnet-Signal (Recruiter-Radar)', 'nein', 'geplant (Pro)'],
  ['Erstellzeit', 'Stunden', 'Minuten'],
  ['Auch als PDF exportierbar', '—', 'ja'],
];

const SPECS: Array<[string, string, string]> = [
  ['CV-Strukturierung', 'Free', 'Lebenslauf wird ausgelesen und in Erfahrung/Skills/Stationen geordnet.'],
  ['Anforderungs-Matching', 'Free', 'Skills Punkt für Punkt auf die Stellenanforderungen abgeglichen.'],
  ['Eigener Prompt', 'Free', 'Du steuerst Fokus und Ton der Bewerbung.'],
  ['Eigene Subdomain', 'Free', 'z. B. clara-weber.offero.app'],
  ['PDF- und DOCX-Export', 'Free', 'ATS-sauberer Export — mit Link zur Bewerbungs-Website.'],
  ['Arbeitgeber-Branding', 'Plus (geplant)', 'Farbe und Ton der Stellenanzeige werden aufgegriffen. Noch nicht verfügbar.'],
  ['Recruiter-Radar', 'Pro (geplant)', 'Cookieless Signal: zeigt, ob/wann geöffnet wurde. Noch nicht verfügbar.'],
  ['Daten in der EU', 'Free', 'EU-Hosting, Export und Löschung jederzeit.'],
];

const EXAMPLES: Array<[string, string, string, string]> = [
  ['Lead AI Engineer', 'maibornwolff', 'IT-Beratung', 'maibornwolff'],
  ['IT Architecture', 'bcg platinion', 'Strategie', 'bcg'],
  ['AI Engineer, Agentic', 'lbbw', 'Banking', 'lbbw'],
  ['PM Conversational AI', 'riverty', 'Fintech', 'riverty'],
  ['KI-Pionier', 'iph', 'Produktion', 'iph'],
  ['AI Architect', 'enercon', 'Energie', 'enercon'],
  ['Process Automation', 'holzhey', 'Industrie', 'holzhey'],
  ['AI Consultant', 'elunic', 'IIoT', 'elunic'],
];

const DISCOVER: Array<[string, string, string, string]> = [
  ['discover-cv', 'Aus deinem Lebenslauf', 'Hochladen, strukturieren, bestätigen — danach wiederverwendbar.', '5 Schritte ›'],
  ['discover-laptop', 'Website pro Stelle', 'Zugeschnitten, gebrandet, unter eigener Subdomain.', '8 Beispiele ›'],
  ['discover-mobile', 'Auf jedem Gerät', 'Responsiv und schnell — teilbar per Link oder PDF.', 'Details ›'],
  ['discover-radar', 'Recruiter-Radar', 'Soll zeigen, ob und wann deine Bewerbung geöffnet wurde.', 'Pro · in Vorbereitung ›'],
];

const SUCCESS: Array<[string, string, string]> = [
  ['success-handshake', 'Eingeladen', 'Eine Website, die im Vorstellungsgespräch landet.'],
  ['success-recruiter', 'Gesehen', 'Recruiter merken sich, wer heraussticht.'],
  ['success-newstart', 'Neustart', 'Der erste Tag im neuen Job.'],
  ['success-screen', 'Überzeugt', 'Deine Story — klar und ehrlich.'],
];

const FAQ: Array<[string, string]> = [
  ['Erfindet Offero Skills dazu?', 'Das ist der Anspruch — und Offero ist darauf ausgelegt: ein Ehrlichkeits-Gate hält die KI an, nur deine echte Erfahrung wahrheitsgemäß zu rahmen statt Skills oder Zeiträume zu erfinden. Und du prüfst jede Bewerbung, bevor sie online geht.'],
  ['Wird automatisch versendet?', 'Nie. Du prüfst die Vorschau und gibst erst dann frei.'],
  ['Was passiert mit meinen Daten?', 'EU-Hosting, Export und Löschung jederzeit; kein Training ohne deine Zustimmung.'],
  ['Bekomme ich auch ein PDF?', 'Ja, jede Website lässt sich als ATS-sauberes PDF oder DOCX exportieren — mit Link zur Website im Dokument.'],
];

const SERVICES: Array<[string, string]> = [
  ['In Minuten fertig', 'Vom Upload zur teilbaren Website in wenigen Minuten, nicht Stunden.'],
  ['Du behältst die Kontrolle', 'Kein Auto-Versand. Du prüfst die Vorschau und gibst frei.'],
  ['PDF- und DOCX-Export', 'ATS-sauberer Export als Beilage — mit Link zur vollständigen Website.'],
  ['Daten in der EU', 'EU-Hosting, Export und Löschung jederzeit.'],
  ['Auf Ehrlichkeit ausgelegt', 'Ein Ehrlichkeits-Gate rahmt deine echte Erfahrung wahrheitsgemäß — und du gibst jede Bewerbung frei, bevor sie online geht.'],
];

const PRICES: Array<[string, string, string, string]> = [
  ['Free', '1 (One-Shot)', 'Text · eigene Subdomain · PDF-/DOCX-Export', '0 €'],
  ['Starter', '5', '+ ∞ Feinschliff · 3 Re-Rolls', '9,99 €'],
  ['Plus', '12', '+ Arbeitgeber-Branding · Premium-Templates', '19,99 €'],
  ['Pro', '25', '+ Recruiter-Radar (View-Analytics)', '39,99 €'],
];

export default function LandingPage() {
  return (
    <div className="ocat">
      <style>{CSS}</style>

      {/* Top-Leiste */}
      <div className="top">
        <div className="in">
          <span className="logo">
            OFFER<span className="d">O</span>
          </span>
          <form className="search" action="/signup">
            <input name="q" placeholder="Stellenanzeige oder Stichwort eingeben…" aria-label="Suche" />
            <button type="submit">Suchen</button>
          </form>
          <span className="acct">
            Bestell-Nr. · <Link href="/login">Anmelden</Link> · <Link href="/dashboard">Konto</Link>
          </span>
        </div>
      </div>
      <div className="subbar">
        <div className="in">
          Start › Bewerbungen › <b>Bewerbungs-Website erstellen</b>
        </div>
      </div>

      {/* Sidebar + Main */}
      <div className="page">
        <nav className="side">
          <h4>Bewerbung erstellen</h4>
          <ul>
            <li className="cur">
              <a href="#">Übersicht</a>
            </li>
            <li>
              <a href="#wie">1 · Lebenslauf hochladen</a>
            </li>
            <li>
              <a href="#wie">2 · Stelle + Prompt</a>
            </li>
            <li>
              <a href="#wie">3 · Generieren</a>
            </li>
            <li>
              <a href="#wie">4 · Feinschliff &amp; Freigabe</a>
            </li>
          </ul>
          <h4>Pakete</h4>
          <ul>
            <li>
              <a href="#preise">Free</a>
            </li>
            <li>
              <a href="#preise">Starter</a>
            </li>
            <li>
              <a href="#preise">Plus</a>
            </li>
            <li>
              <a href="#preise">Pro</a>
            </li>
          </ul>
          <h4>Mehr</h4>
          <ul>
            <li>
              <a href="#beispiele">Vorlagen</a>
            </li>
            <li>
              <a href="#beispiele">Beispiele</a>
            </li>
            <li>
              <a href="#">Recruiter-Radar</a>
            </li>
            <li>
              <a href="#">PDF-/DOCX-Export</a>
            </li>
          </ul>
        </nav>

        <main className="main">
          <h1>Bewerbungs-Website erstellen</h1>
          <p className="lead">
            Lebenslauf hochladen, Stellenanzeige + Prompt einfügen — Offero erzeugt eine
            zugeschnittene, gebrandete Bewerbungs-Website unter deiner eigenen Subdomain. Erste
            Bewerbung kostenlos. Kein Auto-Versand: du gibst frei.
          </p>
          <div className="btnrow">
            <Link className="buy" href="/signup">
              Erste Bewerbung gratis erstellen
            </Link>{' '}
            <span style={{ color: '#666', fontSize: '12px', marginLeft: '6px' }}>
            Keine Kreditkarte · Daten in der EU
          </span>
          </div>

          <p className="trustbar">
            <span>
              ✓ Erste Bewerbung <b>gratis</b>
            </span>
            <span>✓ Keine Kreditkarte</span>
            <span>✓ Kein Auto-Versand — du gibst frei</span>
            <span>✓ Daten in der EU</span>
          </p>

          <h2>Warum eine Website statt PDF?</h2>
          <table>
            <tbody>
              <tr>
                <th>Kriterium</th>
                <th className="n">Klassisches PDF</th>
                <th className="n">Offero-Website</th>
              </tr>
              {WHY.map(([k, pdf, off]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td className="n">{pdf}</td>
                  <td className="n">
                    <b style={{ color: '#1a7a3c' }}>{off}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 id="wie">So funktioniert&rsquo;s</h2>
          <ol className="steps">
            <li>
              <b>Lebenslauf hochladen.</b> Die KI strukturiert Erfahrung, Skills und Stationen. Du
              bestätigst und korrigierst.
            </li>
            <li>
              <b>Stelle + Prompt einfügen.</b> Offero gleicht die Anforderungen ab und setzt deinen
              Fokus um.
            </li>
            <li>
              <b>Generieren &amp; prüfen.</b> Live-Vorschau — du siehst das Ergebnis, bevor es geteilt wird.
            </li>
            <li>
              <b>Freigeben.</b> Kein Auto-Versand — erst du gibst frei. Teilen per Subdomain oder
              als PDF-/DOCX-Export.
            </li>
          </ol>

          <h2>Spezifikationen / Funktionen</h2>
          <table>
            <tbody>
              <tr>
                <th>Funktion</th>
                <th>Ab Paket</th>
                <th>Beschreibung</th>
              </tr>
              {SPECS.map(([fn, paket, desc]) => (
                <tr key={fn}>
                  <td>{fn}</td>
                  <td>{paket}</td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2 id="beispiele">Beispiele (live generiert)</h2>
          <table>
            <tbody>
              <tr>
                <th>Rolle</th>
                <th>Arbeitgeber</th>
                <th>Branche</th>
                <th></th>
              </tr>
              {EXAMPLES.map(([role, org, branche, slug]) => (
                <tr key={slug}>
                  <td>{role}</td>
                  <td>{org}</td>
                  <td>{branche}</td>
                  <td>
                    <a href={`/examples/${slug}.png`} target="_blank" rel="noopener noreferrer">
                      ansehen
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="note">
            <b>Ehrlich:</b> Wir haben (noch) keine Bewertungen — und erfinden auch keine. Offero setzt
            deine echte Erfahrung überzeugend in Szene, ist darauf ausgelegt keine Skills zu erfinden
            und versendet nichts automatisch. Was rausgeht, entscheidest du.
          </div>

          <div className="btnrow" style={{ marginTop: '14px' }}>
            <Link className="buy" href="/signup">
              Erste Bewerbung gratis erstellen
            </Link>
          </div>
        </main>
      </div>

      {/* Entdecken — Bild-Karten */}
      <div className="wide">
        <div className="in">
          <h3 className="sec">Entdecken — was du mit Offero baust</h3>
          <div className="dcards">
            {DISCOVER.map(([img, title, text, link]) => (
              <div className="dcard" key={img}>
                <img src={`/catalog/${img}.jpg`} alt={title} />
                <div className="b">
                  <div className="t">{title}</div>
                  <div className="x">{text}</div>
                  <a href="#">{link}</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Erfolg — Bildstreifen */}
      <div className="wide alt">
        <div className="in">
          <h3 className="sec">Erfolg fängt mit einer Bewerbung an</h3>
          <div className="srow">
            {SUCCESS.map(([img, label, text]) => (
              <div className="scard" key={img}>
                <img src={`/catalog/${img}.jpg`} alt={label} />
                <div className="c">
                  <b>{label}</b>
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vertrauen & Daten */}
      <div className="wide alt">
        <div className="in">
          <h3 className="sec">Vertrauen &amp; Daten</h3>
          <div className="scols" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
            <div className="scol">
              <h5>Du gibst frei</h5>
              <p>
                Generieren ist ein Vorschlag, kein Endprodukt. Nichts wird automatisch an Arbeitgeber
                gesendet — der Mensch bestätigt, immer.
              </p>
            </div>
            <div className="scol">
              <h5>Deine Worte, dein Prompt</h5>
              <p>
                Du steuerst Fokus und Ton — und gibst jede Bewerbung frei. Ein Ehrlichkeits-Gate hält
                die KI an, deine echte Erfahrung wahrheitsgemäß zu rahmen statt sie aufzublähen.
              </p>
            </div>
            <div className="scol">
              <h5>Daten in der EU</h5>
              <p>
                EU-Hosting, Export und Löschung jederzeit. Wir trainieren nichts ohne deine
                ausdrückliche Zustimmung.
              </p>
            </div>
          </div>
          <div className="note" style={{ marginTop: '12px' }}>
            <b>Ehrlich:</b> Wir haben (noch) keine Sternchen-Bewertungen — und erfinden auch keine.
            Statt Versprechen: die acht echten Beispiele oben.
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="wide">
        <div className="in">
          <h3 className="sec">Häufige Fragen</h3>
          <table>
            <tbody>
              <tr>
                <th style={{ width: '34%' }}>Frage</th>
                <th>Antwort</th>
              </tr>
              {FAQ.map(([q, a]) => (
                <tr key={q}>
                  <td>{q}</td>
                  <td>{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unsere Leistungen */}
      <div className="wide">
        <div className="in">
          <h3 className="sec">Unsere Leistungen</h3>
          <div className="scols">
            {SERVICES.map(([title, text]) => (
              <div className="scol" key={title}>
                <h5>{title}</h5>
                <p>{text}</p>
                <a href="#">Mehr ›</a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pakete & Preise */}
      <div className="wide alt" id="preise">
        <div className="in">
          <h3 className="sec">Pakete &amp; Preise</h3>
          <p style={{ fontSize: '13px', color: '#444', margin: '0 0 8px' }}>
            Aktuell live: die <b>erste Bewerbung gratis</b>. Die Bezahlpakete (Starter, Plus, Pro)
            sind in Vorbereitung — noch nicht kaufbar; die Tabelle zeigt das geplante Modell.
          </p>
          <table>
            <tbody>
              <tr>
                <th>Paket</th>
                <th className="n">Bewerbungen</th>
                <th>Enthalten</th>
                <th className="n">Preis</th>
                <th></th>
              </tr>
              {PRICES.map(([paket, count, incl, price]) => (
                <tr key={paket}>
                  <td>
                    <b>{paket}</b>
                  </td>
                  <td className="n">{count}</td>
                  <td>{incl}</td>
                  <td className="n price">{price}</td>
                  <td className="n">
                    {paket === 'Free' ? (
                      <Link href="/signup">gratis starten</Link>
                    ) : (
                      <span style={{ color: '#999' }}>bald</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '11.5px', color: '#777', margin: '2px 0 0' }}>
            Einmalkauf — keine Abo-Falle. Keine versteckten Kosten.
          </p>
          <div className="btnrow" style={{ marginTop: '12px' }}>
            <Link className="buy" href="/signup">
              Erste Bewerbung gratis erstellen
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="foot">
        <div className="cols">
          <div>
            <h6>Produkt</h6>
            <a href="#">Bewerbung erstellen</a>
            <a href="#beispiele">Vorlagen</a>
            <a href="#beispiele">Beispiele</a>
            <a href="#">Recruiter-Radar</a>
            <a href="#">PDF-Export</a>
          </div>
          <div>
            <h6>Pakete</h6>
            <a href="#preise">Free</a>
            <a href="#preise">Starter</a>
            <a href="#preise">Plus</a>
            <a href="#preise">Pro</a>
          </div>
          <div>
            <h6>Konto</h6>
            <Link href="/login">Anmelden</Link>
            <Link href="/signup">Registrieren</Link>
            <Link href="/dashboard">Bestellverlauf</Link>
            <Link href="/profile">Einstellungen</Link>
          </div>
          <div>
            <h6>Hilfe</h6>
            <a href="#">FAQ</a>
            <a href="#">Kontakt</a>
            <a href="#">Status</a>
            <a href="#">Anleitung</a>
          </div>
          <div>
            <h6>Rechtliches</h6>
            <a href="#">Datenschutz</a>
            <a href="#">AGB</a>
            <a href="#">Impressum</a>
            <a href="#">DSGVO</a>
          </div>
        </div>
        <div className="in">
          <span>© 2026 Offero · Bewerbungs-Websites · Daten in der EU · Export &amp; Löschung jederzeit</span>
          <span>Gemacht für Bewerber:innen</span>
        </div>
      </div>
    </div>
  );
}

// Katalog-CSS aus catalog.html, vollständig unter `.ocat` gescoped (keine globalen Tag-Selektoren),
// damit das Design 1:1 stimmt, ohne andere Seiten zu beeinflussen.
const CSS = `
.ocat *{box-sizing:border-box}
.ocat{background:#fff;color:#1f1f1f;font:13px/1.45 Arial,Helvetica,"Liberation Sans",sans-serif}
.ocat a{color:#0a52ad;text-decoration:none}
.ocat a:hover{text-decoration:underline}
.ocat .price{color:#c0150c;font-weight:bold}
.ocat .top{background:#3a3f33;color:#fff;border-bottom:3px solid #c98a2b}
.ocat .top .in{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:14px;padding:8px 14px}
.ocat .logo{font-weight:bold;font-size:19px;letter-spacing:-.3px;white-space:nowrap}
.ocat .logo .d{color:#e6a23c}
.ocat .search{flex:1;display:flex}
.ocat .search input{flex:1;border:1px solid #888;border-right:none;padding:7px 9px;font:13px Arial,sans-serif}
.ocat .search button{border:1px solid #b9791f;background:#d9912f;color:#fff;font-weight:bold;padding:0 16px;cursor:pointer}
.ocat .top .acct{font-size:12px;color:#dfe2d8;white-space:nowrap}
.ocat .top .acct a{color:#fff}
.ocat .subbar{background:#eceae4;border-bottom:1px solid #c9c6bd;font-size:12px}
.ocat .subbar .in{max-width:1180px;margin:0 auto;padding:5px 14px;color:#666}
.ocat .subbar b{color:#1f1f1f}
.ocat .page{max-width:1180px;margin:0 auto;display:flex;align-items:flex-start}
.ocat .side{width:212px;flex:none;border-right:1px solid #d6d3ca;padding:10px 0 40px;background:#f6f5f1}
.ocat .side h4{margin:14px 12px 4px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#7a7768;border-bottom:1px solid #ddd9cf;padding-bottom:3px}
.ocat .side ul{list-style:none;margin:0;padding:0}
.ocat .side li a{display:block;padding:3px 12px 3px 18px;color:#0a52ad;font-size:12.5px}
.ocat .side li a:hover{background:#e7e4db;text-decoration:none}
.ocat .side li.cur a{background:#e1ddd0;color:#1f1f1f;font-weight:bold;border-left:3px solid #c98a2b;padding-left:15px}
.ocat .side li small{display:block;padding:1px 12px 1px 28px;color:#888;font-size:11px}
.ocat .main{flex:1;padding:16px 22px 50px;min-width:0}
.ocat h1{font-size:20px;margin:2px 0 4px;font-weight:bold}
.ocat .lead{color:#444;font-size:13.5px;margin:0 0 14px;max-width:75ch}
.ocat h2{font-size:14px;margin:24px 0 6px;background:#eceae4;border:1px solid #d6d3ca;padding:5px 9px;font-weight:bold}
.ocat table{border-collapse:collapse;width:100%;margin:4px 0 6px;font-size:12.5px}
.ocat th,.ocat td{border:1px solid #d6d3ca;padding:5px 8px;text-align:left;vertical-align:top}
.ocat th{background:#f1efe9;font-weight:bold;color:#33312a}
.ocat tr:nth-child(even) td{background:#faf9f6}
.ocat td.n,.ocat th.n{text-align:right;white-space:nowrap}
.ocat .btnrow{margin:6px 0 0}
.ocat .buy{display:inline-block;border:1px solid #b9791f;background:#d9912f;color:#fff;font-weight:bold;padding:6px 16px;cursor:pointer;font-size:13px}
.ocat .buy:hover{background:#c5811f;text-decoration:none;color:#fff}
.ocat .steps{margin:6px 0;padding-left:0;list-style:none;counter-reset:s}
.ocat .steps li{counter-increment:s;padding:3px 0 3px 24px;position:relative;color:#333}
.ocat .steps li::before{content:counter(s)".";position:absolute;left:4px;color:#c0150c;font-weight:bold}
.ocat .steps b{color:#1f1f1f}
.ocat ul.spec{margin:6px 0;padding-left:18px;color:#333}
.ocat ul.spec li{margin:2px 0}
.ocat .note{border:1px solid #e0cba8;background:#fbf6ed;padding:8px 10px;color:#5a4326;font-size:12.5px;margin:8px 0}
.ocat .trustbar{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:#3a3a32;border:1px solid #d6d3ca;background:#f6f5f1;padding:7px 11px;margin:10px 0 0}
.ocat .trustbar span{white-space:nowrap}
.ocat .trustbar b{color:#1a7a3c}
.ocat .foot{border-top:2px solid #c98a2b;background:#3a3f33;color:#cfd2c8;font-size:11.5px;margin-top:30px}
.ocat .foot .in{max-width:1180px;margin:0 auto;padding:12px 14px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}
.ocat .foot a{color:#fff}
@media(max-width:760px){.ocat .side{display:none}.ocat .search{display:none}}
.ocat .wide{border-top:1px solid #d6d3ca}
.ocat .wide .in{max-width:1180px;margin:0 auto;padding:20px 22px}
.ocat .wide.alt{background:#f6f5f1}
.ocat h3.sec{font-size:15px;font-weight:bold;margin:0 0 12px;color:#1f1f1f}
.ocat .dcards,.ocat .srow,.ocat .scols{display:grid;gap:16px}
.ocat .dcards,.ocat .srow{grid-template-columns:repeat(4,1fr)}
.ocat .scols{grid-template-columns:repeat(5,1fr);gap:20px}
.ocat .dcard{border:1px solid #d6d3ca;background:#fff}
.ocat .dcard img{width:100%;height:130px;object-fit:cover;border-bottom:1px solid #d6d3ca;display:block;filter:saturate(.92)}
.ocat .dcard .b{padding:9px 11px}
.ocat .dcard .t{font-weight:bold;font-size:13px;margin:0 0 4px}
.ocat .dcard .x{color:#666;font-size:11.5px;margin:0 0 6px}
.ocat .dcard a{font-size:12px}
.ocat .scard{background:#fff;border:1px solid #d6d3ca}
.ocat .scard img{width:100%;height:118px;object-fit:cover;display:block;border-bottom:1px solid #d6d3ca}
.ocat .scard .c{padding:8px 11px;font-size:12px;color:#444}
.ocat .scard .c b{display:block;color:#1f1f1f;margin-bottom:2px}
.ocat .scol h5{font-size:12.5px;font-weight:bold;margin:0;border-bottom:1px solid #c98a2b;padding-bottom:4px;display:inline-block}
.ocat .scol p{font-size:12px;color:#555;margin:6px 0}
.ocat .foot .cols{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;padding:14px 14px 4px;max-width:1180px;margin:0 auto}
.ocat .foot .cols h6{color:#fff;font-size:11px;margin:0 0 6px;text-transform:uppercase;letter-spacing:.05em}
.ocat .foot .cols a{display:block;color:#cfd2c8;padding:2px 0;font-size:12px}
@media(max-width:900px){.ocat .dcards,.ocat .srow,.ocat .scols,.ocat .foot .cols{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.ocat .dcards,.ocat .srow,.ocat .scols,.ocat .foot .cols{grid-template-columns:1fr}}
`;
