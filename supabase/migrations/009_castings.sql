-- 009_castings.sql
-- Structure prévue pour le futur module Casting (non branché à l'UI en V1)

create table if not exists castings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text,
  event_date date,
  type text,
  criteria jsonb default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists casting_models (
  casting_id uuid not null references castings(id) on delete cascade,
  model_id uuid not null references models(id) on delete cascade,
  status text not null default 'propose' check (status in ('propose', 'selectionne', 'refuse')),
  primary key (casting_id, model_id)
);
