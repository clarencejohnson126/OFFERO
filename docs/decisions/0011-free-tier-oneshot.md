# ADR 0011 — Free-Tier ist echtes One-Shot (1 Credit, 0 Re-Rolls)

Status: akzeptiert · 2026-06-23 · ersetzt Punkt 4 aus ADR 0006 (teilweise)

## Kontext

Die Produkt-Doktrin (`packages/core/src/billing/plan-catalog.ts`) definiert den kostenlosen Plan
als One-Shot: `free.freeRerolls = 0`. Ein Re-Roll/Iteration ist bewusst der **erste Upgrade-Grund**
(ADR 0009 / `docs/product/pricing.md`) — er ist im Free-Tier nicht gratis.

Die DB widersprach dem: `0001_offero_schema.sql` legte ein frisches Free-Wallet faktisch mit
**3 Re-Rolls** an — sowohl in `offero.init_user` (`balance=1, rerolls=3`) als auch über den
INSERT-Default `coalesce(p_free_rerolls, 3)` in `offero.grant_credits`. Damit bekam jeder Gratis-Nutzer
drei kostenlose Re-Rolls — gegen die Plan-Katalog-Wahrheit und gegen das Upgrade-Funnel-Argument.

## Entscheidung

1. **`offero.init_user`** legt ein frisches Free-Wallet mit `balance=1, free_rerolls_remaining=0, plan='free'`
   an. Body sonst unverändert (Profil-Anlage, Idempotenz via `on conflict do nothing`,
   `SECURITY DEFINER`, `search_path = ''`).
2. **`offero.grant_credits`** INSERT-Default `coalesce(p_free_rerolls, 3)` → `coalesce(p_free_rerolls, 0)`:
   Ohne explizites `p_free_rerolls` erbt ein frisches Wallet **keine** Re-Rolls. Bezahl-Pläne
   (starter/plus/pro = 3) übergeben `p_free_rerolls` explizit und bleiben unberührt. Idempotenz
   (`(user_id, reason, ref_id)`) unverändert.
3. **Fix-Forward** als Migration `0005_free_tier_oneshot.sql` (nur `offero`-Schema, `create or replace`).
   Keine Historie umgeschrieben.
4. **Verifikation** (`verify-schema.mjs`, `verify-profile.mjs`) erwartet jetzt `free_rerolls_remaining = 0`;
   der Re-Roll-Pfad im Free-Tier kostet wie eine Generierung (charged=1) bzw. `INSUFFICIENT_CREDITS`
   ohne Guthaben.

## Konsequenzen

- **Positiv:** DB und Plan-Katalog sind wieder deckungsgleich; der Upgrade-Funnel (Iteration kostet)
  greift wie gedacht. `plan-catalog.ts` bleibt die einzige Entitlement-Wahrheit (ADR 0006 Punkt 9).
- **Migration:** Wird bewusst manuell angewandt. Bestehende Free-Wallets mit Alt-Rerolls werden von
  dieser Migration **nicht** rückwirkend angefasst (nur künftige Init/Grant); ein Daten-Cleanup ist
  separat zu entscheiden (🔲, später), falls relevant.

## Alternativen

- *`plan-catalog.ts` auf 3 anheben* — verworfen: widerspräche der Pricing-Doktrin (Re-Roll = Upgrade-Grund).
- *Logik im Spend-Pfad statt im Wallet-Default* — verworfen: Quelle der Re-Roll-Menge ist das Wallet;
  der Default gehört an die Init-/Grant-Stelle, nicht in `spend_credits`.
