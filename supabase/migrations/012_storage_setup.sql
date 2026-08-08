-- 012_storage_setup.sql
-- Création des buckets privés + policies Storage
-- Convention de chemin : {bucket}/{model_id}/{sous-dossier}/{fichier}

insert into storage.buckets (id, name, public)
values ('model-photos', 'model-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('model-documents', 'model-documents', false)
on conflict (id) do nothing;

-- Fonction : le model_id (1er segment du chemin) appartient-il à l'utilisateur courant ?
create or replace function owns_storage_model_folder(object_name text)
returns boolean as $$
  select exists (
    select 1 from models
    where id::text = split_part(object_name, '/', 1)
      and profile_id = auth.uid()
  );
$$ language sql security definer stable;

-- model-photos
create policy "model_photos_select" on storage.objects
  for select using (
    bucket_id = 'model-photos' and (is_admin() or owns_storage_model_folder(name))
  );

create policy "model_photos_insert" on storage.objects
  for insert with check (
    bucket_id = 'model-photos' and (is_admin() or owns_storage_model_folder(name))
  );

create policy "model_photos_update" on storage.objects
  for update using (
    bucket_id = 'model-photos' and (is_admin() or owns_storage_model_folder(name))
  );

create policy "model_photos_delete" on storage.objects
  for delete using (
    bucket_id = 'model-photos' and (is_admin() or owns_storage_model_folder(name))
  );

-- model-documents (mêmes règles)
create policy "model_documents_select" on storage.objects
  for select using (
    bucket_id = 'model-documents' and (is_admin() or owns_storage_model_folder(name))
  );

create policy "model_documents_insert" on storage.objects
  for insert with check (
    bucket_id = 'model-documents' and (is_admin() or owns_storage_model_folder(name))
  );

create policy "model_documents_update" on storage.objects
  for update using (
    bucket_id = 'model-documents' and (is_admin() or owns_storage_model_folder(name))
  );

create policy "model_documents_delete" on storage.objects
  for delete using (
    bucket_id = 'model-documents' and (is_admin() or owns_storage_model_folder(name))
  );
