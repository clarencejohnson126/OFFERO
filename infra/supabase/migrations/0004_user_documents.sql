-- Unterlagen des Nutzers (über den CV hinaus): Anschreiben, Zertifikate, Bilder, Video.
-- Material für die Generierung (Text/Vision) und zum Einbinden in die Website (Medien).
-- Text + CHECK statt Enum (ADR 0006). RLS: jeder sieht/ändert nur seine eigenen.

create table if not exists offero.user_document (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('cv', 'cover_letter', 'certificate', 'image', 'video', 'other')),
  bucket text not null,
  path text not null,
  file_name text,
  content_type text,
  size_bytes bigint not null default 0,
  -- nach dem Auswerten (Stufe 2) gefüllt: extrahierter/erkannter Text.
  extracted_text text,
  created_at timestamptz not null default now()
);

create index if not exists user_document_user_idx on offero.user_document (user_id, created_at desc);

alter table offero.user_document enable row level security;

drop policy if exists user_document_owner on offero.user_document;
create policy user_document_owner on offero.user_document
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
