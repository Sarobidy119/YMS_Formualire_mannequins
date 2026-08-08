-- 005_model_relations.sql
-- Relations N-N : model_experiences, model_skills

create table if not exists model_experiences (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models(id) on delete cascade,
  experience_id uuid not null references experiences(id) on delete cascade,
  details text,
  unique (model_id, experience_id)
);

create table if not exists model_skills (
  model_id uuid not null references models(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (model_id, skill_id)
);
