# 0005 — Feinschliff: in-place Update + Edit-Log (statt Subversion)

- **Status:** Accepted
- **Datum:** 2026-06-21
- **Kontext:** `v1-spec.md` §11 und `data-model.md` ließen offen, ob Feinschliff-Edits (gratis,
  unbegrenzt) als eigene (Sub-)Version geführt oder in-place auf der aktuellen
  `generation_version` angewandt werden. Feinschliff ist bewusst großzügig & kostenlos
  (Constitution Art. I.3), also potenziell sehr häufig.
- **Entscheidung:**
  1. **Feinschliff aktualisiert `generation_version.content` in-place** (die aktuelle Version).
  2. Jede Änderung schreibt einen **leichten Audit-Eintrag** in `offero_edit_log`
     (`version_id`, `user_id`, `patch` jsonb, `created_at`).
  3. **Re-Roll bleibt eine neue Version** (`kind = 're_roll'`).
- **Konsequenzen:**
  - (+) Wenige Zeilen pro Bewerbung; klare „aktuelle Version"; trotzdem nachvollziehbar.
  - (+) `current_version_id` bleibt stabil; Auslieferung/PDF lesen immer dieselbe Version.
  - (−) Kein vollständiges Undo über Versionen (nur Edit-Log als Spur). Falls später nötig,
    kann das Edit-Log zum Rückspielen genutzt oder auf Snapshots erweitert werden.
- **Alternativen verworfen:**
  - *Eigene Subversion je Edit* → volle Historie/Undo, aber bei unbegrenzten Gratis-Edits viele
    Zeilen und ein wanderndes `current_version_id`.
- **Umsetzung:** `offero_edit_log` (Migration `0001_offero_schema.sql`), Repository-Port
  `GenerationVersionRepo.updateContent` + `appendEdit` (`packages/core/src/ports/repository.ts`).
