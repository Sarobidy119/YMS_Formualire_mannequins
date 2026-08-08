-- 002_lookup_tables.sql
-- Tables de référence : experiences, skills

create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null
);

insert into experiences (code, label) values
  ('defile', 'Défilé'),
  ('shooting', 'Shooting photo'),
  ('publicite', 'Publicité'),
  ('clip_video', 'Clip vidéo'),
  ('cinema', 'Cinéma'),
  ('theatre', 'Théâtre'),
  ('evenementiel', 'Événementiel'),
  ('autre', 'Autres')
on conflict (code) do nothing;

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null
);

insert into skills (code, label) values
  ('runway', 'Runway / Défilé'),
  ('pose_photo', 'Pose photo'),
  ('acting', 'Acting'),
  ('dance', 'Dance'),
  ('presentation_mc', 'Présentation / MC'),
  ('expression_corporelle', 'Expression corporelle'),
  ('prise_de_parole', 'Prise de parole'),
  ('makeup', 'Makeup'),
  ('autre', 'Autres talents')
on conflict (code) do nothing;
