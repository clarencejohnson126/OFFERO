// Stabile Nutzer-Hinweise bei nicht-automatisch-lesbaren Links. Konstanten, damit die Web-UI
// per Textabgleich den „Text einfügen"-Nudge (statt rotem Fehler) anzeigen kann.

/** Generischer Nudge: Link ließ sich nicht auslesen → Anzeigentext einfügen. */
export const PASTE_NUDGE =
  'Diesen Link konnten wir nicht automatisch auslesen — kopier bitte den Anzeigentext aus der Stellenanzeige direkt hier rein, dann läuft’s.';

/** Indeed ist serverseitig Cloudflare-geblockt → ehrlich kommunizieren. */
export const INDEED_BLOCKED =
  'Indeed-Links lassen sich technisch nicht automatisch auslesen — bitte den Anzeigentext aus der Anzeige direkt einfügen.';

/** Regex-tauglicher Marker, an dem die UI alle „bitte einfügen"-Fälle erkennt. */
export const PASTE_HINT_PATTERN = /einfügen|auslesen|reinkopieren|zu wenig Text/i;
