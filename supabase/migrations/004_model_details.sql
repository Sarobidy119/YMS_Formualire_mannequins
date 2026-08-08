-- 004_model_details.sql
-- Mensurations et disponibilités (relations 1-1 avec models)

create table if not exists model_measurements (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null unique references models(id) on delete cascade,
  height_cm numeric not null check (height_cm between 100 and 230),
  weight_kg numeric check (weight_kg is null or weight_kg between 30 and 200),
  shoe_size numeric,
  clothing_size text,
  chest_cm numeric,
  waist_cm numeric,
  hips_cm numeric,
  hair_color text,
  eye_color text,
  distinguishing_features text
);

create table if not exists availabilities (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null unique references models(id) on delete cascade,
  available_runway boolean not null default false,
  available_shooting boolean not null default false,
  available_ad boolean not null default false,
  available_event boolean not null default false,
  available_days text[] default '{}',
  available_hours text,
  can_travel boolean not null default false,
  travel_zone text
);
