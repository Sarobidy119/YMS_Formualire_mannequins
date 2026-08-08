-- 011_protect_admin_fields.sql
-- Un mannequin ne doit jamais pouvoir changer status/category/level_yms/yms_id
-- même s'il est propriétaire de la ligne (RLS 'models_update' l'autoriserait sinon
-- à modifier la ligne entière). Ce trigger bloque ces colonnes pour les non-admins.

create or replace function protect_admin_fields()
returns trigger as $$
begin
  if not is_admin() then
    if new.status is distinct from old.status
       or new.category is distinct from old.category
       or new.level_yms is distinct from old.level_yms
       or new.yms_id is distinct from old.yms_id
       or new.profile_id is distinct from old.profile_id
       or new.joined_date is distinct from old.joined_date then
      raise exception 'Modification non autorisée : champ réservé aux administrateurs';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_protect_admin_fields on models;
create trigger trg_protect_admin_fields
  before update on models
  for each row execute function protect_admin_fields();
