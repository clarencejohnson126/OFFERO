-- Outcome-Tracking + transparente View-Analytik (Task #39, ADR 0012 §7).
-- Zwei Bausteine des Moat-Daten-Schwungrads:
--   1) offero.application_outcome — append-only Outcome-Events der eigenen Bewerbungen
--      (gesendet → gesehen → geantwortet → … → angenommen/abgelehnt). Eigentümer-RLS.
--   2) offero.page_view — COOKIELESS, KEIN user_id, KEIN roher IP/UA. Der transparente
--      „Recruiter-Radar": serverseitig (Service-Role) geschrieben, vom Eigentümer gelesen.
-- Doktrin: Text + CHECK statt Enum (ADR 0006), nur das offero-Schema, RLS überall,
-- additive Fix-Forward-Migration (CREATE/ALTER ... IF NOT EXISTS), nichts Bestehendes brechen.

-- ── application_outcome (append-only, 1:N pro Bewerbung) ──────────────────────
-- Eigentümer protokolliert den Verlauf seiner eigenen Bewerbung. Reine Event-Historie:
-- nie updaten/löschen im Normalbetrieb, der jeweils jüngste Eintrag ist der aktuelle Stand.
create table if not exists offero.application_outcome (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references offero.application (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  status         text not null
                   check (status in ('sent', 'viewed', 'replied', 'interview', 'offer', 'accepted', 'rejected', 'ghosted')),
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists application_outcome_app_idx on offero.application_outcome (application_id, created_at desc);
create index if not exists application_outcome_user_idx on offero.application_outcome (user_id, created_at desc);
alter table offero.application_outcome enable row level security;

-- RLS: nur der Eigentümer (user_id = auth.uid()) liest/schreibt. Append-only by convention
-- (kein update/delete-Policy → Clients können bestehende Events nicht verändern).
drop policy if exists application_outcome_select on offero.application_outcome;
create policy application_outcome_select on offero.application_outcome
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists application_outcome_insert on offero.application_outcome;
create policy application_outcome_insert on offero.application_outcome
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ── page_view (transparenter Radar, cookieless) ──────────────────────────────
-- 0001 legte offero.page_view bereits an (id bigint identity, application_id, ts, coarse_signal).
-- Hier nur ADDITIV erweitern: tenant_slug (Auflösungs-Komfort), viewed_at (Alias/Klartext für ts),
-- duration_ms (Beacon-Verweildauer). KEIN user_id, KEIN roher IP/UA — bewusst datenarm.
create table if not exists offero.page_view (
  id             bigint generated always as identity primary key,
  application_id uuid not null references offero.application (id) on delete cascade,
  ts             timestamptz not null default now(),
  coarse_signal  jsonb not null default '{}'::jsonb
);

alter table offero.page_view
  add column if not exists tenant_slug text;
alter table offero.page_view
  add column if not exists viewed_at timestamptz not null default now();
alter table offero.page_view
  add column if not exists duration_ms int;

create index if not exists page_view_app_ts_idx on offero.page_view (application_id, ts desc);
create index if not exists page_view_app_viewed_idx on offero.page_view (application_id, viewed_at desc);
alter table offero.page_view enable row level security;
-- offero.page_view: bewusst KEINE Client-Schreib-Policy — Inserts laufen ausschließlich
-- serverseitig über die Service-Role (umgeht RLS). Lesen läuft über die SECURITY-DEFINER-Funktion
-- unten (Eigentümer-Check), damit Clients nie roh in die Tabelle schauen.

-- ── application_views(p_application_id) — Eigentümer-gegateter Lesepfad ───────
-- Aggregiert die Views EINER Bewerbung, prüft vorher die Eigentümerschaft (auth.uid()
-- gegen offero.application.user_id). SECURITY DEFINER + leeres search_path (Härtung, vgl. 0001).
-- Liefert genau eine Zeile; bei fremder/fehlender Bewerbung → 0/NULL (kein Leak).
create or replace function offero.application_views(p_application_id uuid)
returns table (views bigint, last_viewed_at timestamptz, avg_duration_ms numeric)
language plpgsql security definer set search_path = '' as $$
begin
  -- Eigentümer-Check: nur eigene Bewerbung gibt echte Zahlen zurück.
  if not exists (
    select 1 from offero.application a
    where a.id = p_application_id and a.user_id = (select auth.uid())
  ) then
    views := 0; last_viewed_at := null; avg_duration_ms := null; return next; return;
  end if;

  select count(*)::bigint, max(pv.viewed_at), avg(pv.duration_ms)
    into views, last_viewed_at, avg_duration_ms
    from offero.page_view pv
    where pv.application_id = p_application_id;
  return next;
end;
$$;

-- ── Grants (Tabellen über RLS gegatet; Funktion eigentümer-gegated, daher für auth nutzbar) ──
grant select, insert on offero.application_outcome to anon, authenticated;
grant all on offero.application_outcome to service_role;
grant select, insert on offero.page_view to service_role; -- nur Service-Role schreibt/liest roh
grant all on offero.page_view to service_role;
grant usage, select on all sequences in schema offero to service_role;

revoke all on function offero.application_views(uuid) from public, anon;
grant execute on function offero.application_views(uuid) to authenticated, service_role;
