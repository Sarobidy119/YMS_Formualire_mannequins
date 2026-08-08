-- 010_rls_policies.sql
-- Stratégie RLS complète : is_admin() + policies par table

-- ============================================================
-- Fonction utilitaire (SECURITY DEFINER pour éviter la récursion RLS)
-- ============================================================
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================================
-- profiles
-- ============================================================
alter table profiles enable row level security;

create policy profiles_select on profiles
  for select using (is_admin() or id = auth.uid());

create policy profiles_update on profiles
  for update using (id = auth.uid())
  with check (
    -- un utilisateur ne peut jamais changer son propre rôle
    role = (select role from profiles where id = auth.uid()) or is_admin()
  );

-- ============================================================
-- models
-- ============================================================
alter table models enable row level security;

create policy models_select on models
  for select using (is_admin() or profile_id = auth.uid());

create policy models_insert on models
  for insert with check (is_admin() or profile_id = auth.uid());

create policy models_update on models
  for update using (is_admin() or profile_id = auth.uid());

create policy models_delete on models
  for delete using (is_admin());

-- ============================================================
-- model_measurements
-- ============================================================
alter table model_measurements enable row level security;

create policy measurements_all on model_measurements
  for all using (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  )
  with check (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );

-- ============================================================
-- availabilities
-- ============================================================
alter table availabilities enable row level security;

create policy availabilities_all on availabilities
  for all using (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  )
  with check (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );

-- ============================================================
-- model_experiences / model_skills
-- ============================================================
alter table model_experiences enable row level security;
create policy model_experiences_all on model_experiences
  for all using (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  )
  with check (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );

alter table model_skills enable row level security;
create policy model_skills_all on model_skills
  for all using (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  )
  with check (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );

-- ============================================================
-- experiences / skills (lookup, lecture pour tout authentifié, écriture admin)
-- ============================================================
alter table experiences enable row level security;
create policy experiences_select on experiences for select using (auth.role() = 'authenticated');
create policy experiences_write on experiences for all using (is_admin()) with check (is_admin());

alter table skills enable row level security;
create policy skills_select on skills for select using (auth.role() = 'authenticated');
create policy skills_write on skills for all using (is_admin()) with check (is_admin());

-- ============================================================
-- model_photos / model_documents
-- ============================================================
alter table model_photos enable row level security;
create policy model_photos_all on model_photos
  for all using (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  )
  with check (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );

alter table model_documents enable row level security;
create policy model_documents_all on model_documents
  for all using (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  )
  with check (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );

-- ============================================================
-- consents
-- ============================================================
alter table consents enable row level security;
create policy consents_select on consents
  for select using (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );
create policy consents_insert on consents
  for insert with check (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );
create policy consents_update on consents
  for update using (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );
-- pas de policy delete => suppression interdite à tous sauf via admin direct (aucune policy = refus par défaut)

-- ============================================================
-- admin_notes : ADMIN ONLY, aucun accès mannequin sous aucune forme
-- ============================================================
alter table admin_notes enable row level security;
create policy admin_notes_all on admin_notes
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- model_activities : lecture propriétaire + admin, écriture admin seulement
-- ============================================================
alter table model_activities enable row level security;
create policy model_activities_select on model_activities
  for select using (
    is_admin() or model_id in (select id from models where profile_id = auth.uid())
  );
create policy model_activities_write on model_activities
  for insert with check (is_admin());
create policy model_activities_update on model_activities
  for update using (is_admin());
create policy model_activities_delete on model_activities
  for delete using (is_admin());

-- ============================================================
-- castings / casting_models : admin uniquement en V1
-- ============================================================
alter table castings enable row level security;
create policy castings_all on castings for all using (is_admin()) with check (is_admin());

alter table casting_models enable row level security;
create policy casting_models_all on casting_models for all using (is_admin()) with check (is_admin());
