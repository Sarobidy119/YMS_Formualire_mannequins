-- 008_admin_notes_activities.sql
-- ADMIN ONLY : jamais lisible par un mannequin, même via requête directe (voir RLS 010)

create table if not exists admin_notes (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models(id) on delete cascade,
  note text,
  internal_rating integer check (internal_rating between 1 and 5),
  author_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists model_activities (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models(id) on delete cascade,
  activity_type text not null,
  description text,
  created_at timestamptz not null default now()
);
