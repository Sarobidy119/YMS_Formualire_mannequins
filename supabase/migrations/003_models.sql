-- 003_models.sql
-- Table centrale models + génération automatique de l'ID YMS

create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  yms_id text unique, -- généré par trigger, jamais fourni par le frontend
  first_name text not null,
  last_name text not null,
  birth_date date not null check (birth_date < current_date),
  gender text not null check (gender in ('femme', 'homme')),
  city text not null,
  district text,
  phone text not null,
  whatsapp text,
  email text,
  emergency_contact_name text not null,
  emergency_contact_relation text not null,
  status text not null default 'actif' check (status in ('actif', 'disponible', 'indisponible', 'suspendu')),
  category text not null check (category in ('mannequin_femme', 'mannequin_homme')),
  level_yms text check (level_yms in ('debutant', 'intermediaire', 'experimente')),
  joined_date date not null default current_date,
  last_participation date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_models_status on models(status);
create index if not exists idx_models_gender on models(gender);
create index if not exists idx_models_city on models(city);
create index if not exists idx_models_search on models using gin (
  to_tsvector('simple', coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' || coalesce(yms_id,''))
);

-- Séquence + trigger pour générer YMS-M001, YMS-M002...
create sequence if not exists models_yms_id_seq start 1;

create or replace function generate_yms_id()
returns trigger as $$
begin
  if new.yms_id is null then
    new.yms_id := 'YMS-M' || lpad(nextval('models_yms_id_seq')::text, 3, '0');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_generate_yms_id on models;
create trigger trg_generate_yms_id
  before insert on models
  for each row execute function generate_yms_id();

-- updated_at automatique
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_models_updated_at on models;
create trigger trg_models_updated_at
  before update on models
  for each row execute function set_updated_at();
