-- Candidatures publiques : aucune inscription Auth n'est créée avant validation YMS.
create table if not exists model_applications (
  id uuid primary key default gen_random_uuid(),
  application_number text not null unique default ('YMS-C-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  email text not null,
  full_name text not null,
  data jsonb not null,
  photo_paths jsonb not null default '[]'::jsonb,
  status text not null default 'en_attente' check (status in ('en_attente', 'approuvee', 'refusee')),
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  review_note text,
  model_id uuid unique references models(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_model_applications_status on model_applications(status, created_at desc);
create index if not exists idx_model_applications_email on model_applications(email);

alter table model_applications enable row level security;

-- Les insertions sont effectuées uniquement par l'Edge Function avec service_role.
-- Cela évite d'exposer les données personnelles et les uploads à l'accès anonyme direct.
create policy applications_admin_all on model_applications
  for all using (is_admin()) with check (is_admin());

insert into storage.buckets (id, name, public) values ('application-uploads', 'application-uploads', false)
on conflict (id) do nothing;
