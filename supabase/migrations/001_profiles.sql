-- 001_profiles.sql
-- Table profiles : miroir de auth.users, porte le rôle applicatif

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'model' check (role in ('admin', 'model')),
  full_name text not null,
  created_at timestamptz not null default now()
);

comment on table profiles is 'Profil applicatif lié à auth.users, porte le rôle (admin/model)';

-- Fonction + trigger : création automatique du profil à l'inscription
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'model', -- le rôle admin ne peut JAMAIS être choisi à l'inscription
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
