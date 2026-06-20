# Mobile-Strategie — von Tag 1 migrierbar

Stand: 2026-06-20

> **Nutzer-Vorgabe (verbindlich):** Die App muss so ausgelegt sein, dass sie später
> **problemlos als Mobile-App gebaut/migriert** werden kann. Das ist eine Architektur-Pflicht
> (Constitution Art. IV.2), kein Nachgedanke. Diese Datei legt fest, *wie* wir das garantieren.

## Grundsatz

Wir bauen **nicht** zweimal. Wir bauen einen **Domänenkern + eine API** und setzen Clients
darauf. Web ist Client #1, eine native App ist Client #2. Migration = „neuen Client anschließen",
nicht „neu schreiben".

## Die 8 Regeln, die Mobile garantieren

1. **API-first, REST/JSON.** Jede Funktion ist über `/api/v1/*` erreichbar. Eine native App
   ruft exakt dieselben Endpunkte. Keine Funktion existiert nur als Server-Action/RSC-Detail.
2. **Domänenlogik in `packages/core`** — framework-neutral, kein `next/*`, kein `react`,
   kein `window`/DOM. Web und Mobile importieren denselben Kern.
3. **Geteilter `api-client`** — ein typisierter Client, den Web und Mobile nutzen. Eine
   Quelle der Wahrheit für Request/Response-Shapes.
4. **Auth token-basiert (JWT via Supabase Auth)** — funktioniert identisch im Browser und in
   React Native (Supabase RN-SDK). Keine cookie-only/Server-Session-Annahmen, die Mobile bricht.
5. **State serverseitig, Clients sind dünn.** Generierungs-/Job-Status wird über die API
   abgefragt (Polling/Realtime), nicht über web-spezifische Streams. So „sieht" Mobile denselben
   Fortschritt.
6. **Zahlung hinter `PaymentProvider`-Port.** Web nutzt **Stripe**. Mobile muss Apple/Google
   **In-App-Purchase** nutzen (15–30 % Store-Steuer) **oder** Käufe in die Web-App lenken
   (z. B. „im Web upgraden"). Diese Weiche ist ein Adapter-Wechsel, kein Umbau. 🔲 Entscheidung
   zum Launch dokumentieren (Marge vs. Store-Konformität).
7. **Design-Tokens statt web-only CSS.** Farben/Spacing/Typo als plattform-neutrale Tokens in
   `packages/ui`. Web rendert sie via Tailwind/CSS, Mobile via RN-StyleSheet/NativeWind. Die
   *generierten Bewerbungs-Sites* bleiben HTML (werden mobil als Webview/Share-Link angezeigt) —
   nur die **App-UI** (Editor, Dashboard) wird plattformspezifisch gerendert.
8. **Keine Browser-only-Abhängigkeiten im Kern.** PDF-/Headless-Render, File-System,
   `document` etc. leben in serverseitigen Adaptern, nie in geteiltem Client-Code.

## Was am generierten Output mobil passiert

- Die **Bewerbungs-Website** selbst bleibt eine echte Web-URL (Tenant-Subdomain). In der
  Mobile-App wird sie geteilt / in einem In-App-Webview angezeigt — sie muss nicht nativ
  nachgebaut werden.
- Der **Mehrwert der App** (Profil, Generierung anstoßen, Feinschliff, Status, Radar) läuft
  nativ gegen die API. Genau das ist der Teil, den wir plattformneutral halten.

## Migrationspfad (wenn es so weit ist)

1. `apps/mobile` (Expo) ins Monorepo.
2. `core` + `api-client` + `ui`-Tokens importieren (schon geteilt → 0 Umbau).
3. Native Screens für Auth, Dashboard, Editor, Status bauen — reine UI-Arbeit.
4. `PaymentProvider` auf IAP umstellen (oder Web-Checkout-Deeplink).
5. Push-Notifications für „Bewerbung wurde geöffnet" (Radar) — nativer Mehrwert.

## Anti-Pattern-Checkliste (bei jeder PR prüfen)

- [ ] Liegt neue Geschäftslogik im `core`-Paket (nicht in einer RSC/Route)?
- [ ] Ist die Funktion über `/api/v1/*` erreichbar?
- [ ] Nutzt der Code Browser-Globals (`window`, `document`) im geteilten Pfad? → verschieben.
- [ ] Hängt Auth an Cookies statt am JWT? → token-basiert machen.
- [ ] Wird Zahlung direkt an Stripe gekoppelt statt am Port? → Port nutzen.
