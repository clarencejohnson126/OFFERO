-- Offero v1 — Storage-Buckets + Policies. Bucket-IDs mit offero--Präfix (geteiltes Projekt).
-- cv/photo privat (PII), image/video/pdf öffentlich lesbar (veröffentlichte Bewerbungs-Assets).
-- Pfad-Konvention: {user_id}/... → Owner-Check über storage.foldername(name)[1].

insert into storage.buckets (id, name, public) values
  ('offero-cv', 'offero-cv', false),
  ('offero-photo', 'offero-photo', false),
  ('offero-image', 'offero-image', true),
  ('offero-video', 'offero-video', true),
  ('offero-pdf', 'offero-pdf', true)
on conflict (id) do nothing;

-- Private Buckets (cv, photo): nur Owner. Server lädt via Service-Role (umgeht RLS).
create policy "offero_private_read" on storage.objects for select to authenticated
  using (
    bucket_id in ('offero-cv', 'offero-photo')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "offero_private_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('offero-cv', 'offero-photo')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "offero_private_update" on storage.objects for update to authenticated
  using (
    bucket_id in ('offero-cv', 'offero-photo')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "offero_private_delete" on storage.objects for delete to authenticated
  using (
    bucket_id in ('offero-cv', 'offero-photo')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Veröffentlichte Medien: public=true trägt den Read; Owner-Write zusätzlich abgesichert.
create policy "offero_media_owner_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id in ('offero-image', 'offero-video', 'offero-pdf')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
