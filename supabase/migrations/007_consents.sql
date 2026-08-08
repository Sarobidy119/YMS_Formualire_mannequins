-- 007_consents.sql

create table if not exists consents (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null unique references models(id) on delete cascade,
  accepted_rules boolean not null default false,
  image_usage_consent boolean not null default false,
  data_processing_consent boolean not null default false,
  accuracy_confirmation boolean not null default false,
  is_minor boolean not null default false,
  parent_name text,
  parent_contact text,
  parent_consent boolean,
  consent_date timestamptz not null default now(),
  constraint chk_minor_requires_parent check (
    is_minor = false or (parent_name is not null and parent_contact is not null and parent_consent is not null)
  )
);
