-- Un compte mannequin ne peut être créé qu'après validation de sa candidature.
-- À la création du compte, il est automatiquement relié à sa fiche mannequin existante.
create or replace function handle_new_user()
returns trigger as $$
declare
  approved_model_id uuid;
begin
  select a.model_id into approved_model_id
  from public.model_applications a
  where lower(a.email) = lower(new.email)
    and a.status = 'approuvee'
    and a.model_id is not null
  order by a.reviewed_at desc nulls last
  limit 1;

  if approved_model_id is null then
    raise exception 'Inscription refusée : cette adresse e-mail ne possède pas de candidature YMS validée.';
  end if;

  insert into public.profiles (id, role, full_name)
  values (new.id, 'model', coalesce(new.raw_user_meta_data->>'full_name', ''));

  update public.models
  set profile_id = new.id
  where id = approved_model_id and profile_id is null;

  if not found then
    raise exception 'Ce compte mannequin est déjà associé à un utilisateur.';
  end if;
  return new;
end;
$$ language plpgsql security definer;
