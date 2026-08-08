-- seed.sql
-- Données de test — DÉVELOPPEMENT UNIQUEMENT, ne jamais exécuter en production
-- Ce script crée 20 mannequins fictifs (10 femmes / 10 hommes) avec des profils
-- variés pour tester filtres, recherche et dashboard.
--
-- IMPORTANT : les comptes auth.users associés doivent être créés séparément
-- (via Supabase Auth Admin API) car auth.users ne peut pas être peuplé
-- directement par une simple requête SQL dans un projet standard.
-- Ce script suppose que 20 profils "model" existent déjà dans `profiles`
-- avec des UUID connus (voir scripts/seed-auth-users.ts fourni dans le projet).

do $$
declare
  villes text[] := array['Antananarivo','Toamasina','Fianarantsoa','Mahajanga','Antsirabe'];
  niveaux text[] := array['debutant','intermediaire','experimente'];
  statuts text[] := array['actif','disponible','indisponible'];
  i integer;
  v_profile_id uuid;
  v_model_id uuid;
  v_gender text;
  v_category text;
begin
  for i in 1..20 loop
    v_gender := case when i <= 10 then 'femme' else 'homme' end;
    v_category := case when v_gender = 'femme' then 'mannequin_femme' else 'mannequin_homme' end;

    -- Remplacer par de vrais profile_id issus de auth.users en environnement réel
    v_profile_id := gen_random_uuid();

    insert into profiles (id, role, full_name)
    values (v_profile_id, 'model', 'Mannequin Test ' || i)
    on conflict (id) do nothing;

    insert into models (
      profile_id, first_name, last_name, birth_date, gender, city,
      phone, emergency_contact_name, emergency_contact_relation,
      status, category, level_yms
    ) values (
      v_profile_id,
      'Prenom' || i,
      'Nom' || i,
      (current_date - ((18 + i) * interval '365 days')),
      v_gender,
      villes[1 + (i % array_length(villes,1))],
      '034000000' || lpad(i::text, 2, '0'),
      'Contact Urgence ' || i,
      'Parent',
      statuts[1 + (i % array_length(statuts,1))],
      v_category,
      niveaux[1 + (i % array_length(niveaux,1))]
    )
    returning id into v_model_id;

    insert into model_measurements (model_id, height_cm, shoe_size, clothing_size)
    values (v_model_id, 165 + (i % 25), 37 + (i % 6), 'M');

    insert into availabilities (model_id, available_runway, available_shooting, available_ad, available_event, can_travel)
    values (v_model_id, (i % 2 = 0), true, (i % 3 = 0), true, (i % 2 = 0));

    insert into consents (model_id, accepted_rules, image_usage_consent, data_processing_consent, accuracy_confirmation)
    values (v_model_id, true, true, true, true);
  end loop;
end $$;
