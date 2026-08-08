-- Numéro du contact à prévenir en cas d'urgence.
-- Nullable pour préserver les profils déjà enregistrés avant cette évolution.
alter table public.models
  add column if not exists emergency_contact_phone text;

alter table public.models
  drop constraint if exists models_emergency_contact_phone_format;

alter table public.models
  add constraint models_emergency_contact_phone_format
  check (emergency_contact_phone is null or emergency_contact_phone ~ '^\\d{10}$');
