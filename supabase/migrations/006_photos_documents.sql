-- 006_photos_documents.sql

create table if not exists model_photos (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models(id) on delete cascade,
  photo_type text not null check (photo_type in
    ('portrait', 'full_body_front', 'full_body_profile', 'three_quarter', 'portfolio')),
  storage_path text not null,
  mime_type text,
  file_size_bytes integer,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_model_photos_model on model_photos(model_id, photo_type);

create table if not exists model_documents (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references models(id) on delete cascade,
  document_type text not null check (document_type in
    ('cv', 'parental_authorization', 'other')),
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);
