-- Le contrôle d'éligibilité est réalisé par l'Edge Function avant inscription.
-- Ce trigger ne doit jamais faire échouer la création Auth : il crée le profil
-- et relie la fiche mannequin approuvée lorsqu'elle existe.
create or replace function handle_new_user()
returns trigger as $$
declare
  approved_model_id uuid;
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'model', coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;

  select a.model_id into approved_model_id
  from public.model_applications a
  where lower(a.email) = lower(new.email)
    and a.status = 'approuvee'
    and a.model_id is not null
  order by a.reviewed_at desc nulls last
  limit 1;

  if approved_model_id is not null then
    update public.models
    set profile_id = new.id
    where id = approved_model_id and profile_id is null;
  end if;
  return new;
end;
$$ language plpgsql security definer;
