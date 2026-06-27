-- Template-Wahl pro Bewerbung (Rendering-Variante). Additiv, Default = Goldstandard 'aurora'.
-- Text + CHECK statt Enum (migrationsfreundlich, ADR 0006). Betrifft nur das offero-Schema.

alter table offero.application
  add column if not exists template text not null default 'aurora';

alter table offero.application
  drop constraint if exists application_template_check;

alter table offero.application
  add constraint application_template_check
  check (template in ('aurora', 'editorial', 'terminal', 'brutalist', 'swiss'));
