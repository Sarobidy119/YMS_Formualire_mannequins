# YMS Model Management System — Phase 1 : Architecture & Base de données

## 1. Vue d'ensemble de l'architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│   Frontend (Vercel)  │         │   Supabase (Backend)      │
│                      │         │                            │
│  React + TS + Vite   │◄───────►│  Auth                     │
│  /admin  (UX only)   │  anon   │  PostgreSQL + RLS         │
│  /client (UX only)   │  key    │  Storage (buckets privés) │
│  React Router        │         │  Edge Functions (si besoin)│
└─────────────────────┘         └──────────────────────────┘
```

Principe clé : **la séparation `admin/` vs `client/` dans le frontend n'est qu'organisationnelle**. Toute la sécurité réelle repose sur :
- Supabase Auth (identité)
- une table `profiles.role` (rôle)
- RLS PostgreSQL sur chaque table (autorisation réelle, appliquée même via API directe)
- des policies Storage (fichiers)

Aucune clé `service_role` ne sera jamais exposée côté frontend. Seule la clé `anon` est utilisée dans le client React ; toute la logique privilégiée passe par RLS ou par des Edge Functions.

---

## 2. Arborescence des fichiers (frontend)

```
yms-model-management/
├── src/
│   ├── admin/
│   │   ├── pages/          (Dashboard, ModelsList, ModelDetail, Castings, Settings...)
│   │   ├── components/     (StatsCard, ModelsTable, Charts, Filters...)
│   │   ├── layouts/        (AdminLayout avec Sidebar)
│   │   └── routes/         (adminRoutes.tsx)
│   │
│   ├── client/
│   │   ├── pages/          (Onboarding, ModelForm (steps), MyProfile, Status)
│   │   ├── components/     (StepWizard, PhotoUpload, FormSections...)
│   │   ├── layouts/        (ClientLayout)
│   │   └── routes/         (clientRoutes.tsx)
│   │
│   ├── shared/
│   │   ├── components/     (UI générique : Button, Input, Modal, Toast, Skeleton...)
│   │   ├── hooks/          (useAuth, useModels, useDebounce...)
│   │   ├── services/       (modelsService.ts, photosService.ts, authService.ts...)
│   │   ├── types/          (models.ts, database.types.ts généré par Supabase CLI)
│   │   ├── utils/          (formatters, ageCalculator, fileValidators...)
│   │   └── validation/     (schemas Zod : modelSchema.ts, consentSchema.ts...)
│   │
│   ├── lib/
│   │   └── supabase.ts     (client Supabase, clé anon uniquement)
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── supabase/
│   ├── migrations/         (fichiers SQL numérotés, voir section 9)
│   ├── seed.sql            (données de test, Phase développement uniquement)
│   └── functions/          (Edge Functions si nécessaire : pdf-export, signed-url...)
│
├── .env.local               (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
└── vercel.json
```

---

## 3. Schéma de base de données (conception normalisée)

### 3.1 `profiles`
Miroir de `auth.users`, porte le rôle applicatif.

| Colonne      | Type        | Contraintes                          |
|--------------|-------------|---------------------------------------|
| id           | uuid        | PK, FK → auth.users(id), ON DELETE CASCADE |
| role         | text        | NOT NULL, CHECK IN ('admin','model'), DEFAULT 'model' |
| full_name    | text        | NOT NULL |
| created_at   | timestamptz | NOT NULL DEFAULT now() |

Créé automatiquement via un **trigger** `handle_new_user()` sur `auth.users` (INSERT). Le rôle `admin` n'est jamais assignable par l'utilisateur lui-même — uniquement via SQL/back-office par un admin existant.

### 3.2 `models`
Table centrale, données non sensibles + identité.

| Colonne                    | Type        | Contraintes |
|-----------------------------|-------------|-------------|
| id                          | uuid        | PK, DEFAULT gen_random_uuid() |
| profile_id                  | uuid        | FK → profiles(id), UNIQUE, NOT NULL |
| yms_id                      | text        | UNIQUE, NOT NULL (généré serveur, ex: YMS-M001) |
| first_name                  | text        | NOT NULL |
| last_name                   | text        | NOT NULL |
| birth_date                  | date        | NOT NULL, CHECK (birth_date < now()) |
| gender                      | text        | NOT NULL, CHECK IN ('femme','homme') |
| city                        | text        | NOT NULL |
| district                    | text        | |
| phone                       | text        | NOT NULL |
| whatsapp                    | text        | |
| email                       | text        | |
| emergency_contact_name      | text        | NOT NULL |
| emergency_contact_relation  | text        | NOT NULL |
| status                      | text        | NOT NULL DEFAULT 'actif', CHECK IN ('actif','disponible','indisponible','suspendu') |
| category                    | text        | NOT NULL, CHECK IN ('mannequin_femme','mannequin_homme') |
| level_yms                   | text        | CHECK IN ('debutant','intermediaire','experimente') |
| joined_date                 | date        | NOT NULL DEFAULT current_date |
| last_participation          | date        | |
| created_at / updated_at     | timestamptz | DEFAULT now() |

Index : `idx_models_status`, `idx_models_gender`, `idx_models_city`, index composite pour la recherche (voir 3.13).

### 3.3 `model_measurements` (1-1 avec models)
| Colonne | Type | Contraintes |
|---|---|---|
| id | uuid | PK |
| model_id | uuid | FK → models(id) UNIQUE NOT NULL, ON DELETE CASCADE |
| height_cm | numeric | NOT NULL, CHECK (height_cm BETWEEN 100 AND 230) |
| weight_kg | numeric | CHECK (weight_kg IS NULL OR weight_kg BETWEEN 30 AND 200) |
| shoe_size | numeric | |
| clothing_size | text | |
| chest_cm | numeric | |
| waist_cm | numeric | |
| hips_cm | numeric | |
| hair_color | text | |
| eye_color | text | |
| distinguishing_features | text | |

### 3.4 `experiences` (table de référence / lookup)
| id (uuid PK) | code (text unique) | label (text) |
Valeurs : `defile`, `shooting`, `publicite`, `clip_video`, `cinema`, `theatre`, `evenementiel`, `autre`

### 3.5 `model_experiences` (N-N models ↔ experiences + détail)
| id | model_id FK | experience_id FK | details text | UNIQUE(model_id, experience_id) |

### 3.6 `skills` (lookup)
| id (uuid PK) | code (unique) | label |
Valeurs : `runway`, `pose_photo`, `acting`, `dance`, `presentation_mc`, `expression_corporelle`, `prise_de_parole`, `makeup`, `autre`

### 3.7 `model_skills` (N-N)
| model_id FK | skill_id FK | PRIMARY KEY (model_id, skill_id) |

### 3.8 `availabilities` (1-1 avec models)
| id | model_id FK UNIQUE | available_runway bool | available_shooting bool | available_ad bool | available_event bool | available_days text[] | available_hours text | can_travel bool | travel_zone text |

### 3.9 `model_photos`
| id | model_id FK NOT NULL | photo_type text CHECK IN ('portrait','full_body_front','full_body_profile','three_quarter','portfolio') | storage_path text NOT NULL | mime_type text | file_size_bytes int | uploaded_at timestamptz DEFAULT now() |

Index sur `(model_id, photo_type)`.

### 3.10 `model_documents`
| id | model_id FK | document_type text CHECK IN ('cv','parental_authorization','other') | storage_path text | uploaded_at |

### 3.11 `consents`
| id | model_id FK UNIQUE | accepted_rules bool NOT NULL | image_usage_consent bool NOT NULL | data_processing_consent bool NOT NULL | accuracy_confirmation bool NOT NULL | is_minor bool NOT NULL DEFAULT false | parent_name text | parent_contact text | parent_consent bool | consent_date timestamptz DEFAULT now() |

CHECK : si `is_minor = true` alors `parent_name` et `parent_contact` et `parent_consent` ne peuvent pas être NULL (via trigger ou CHECK avec fonction).

### 3.12 `admin_notes` (ADMIN ONLY — jamais exposé au mannequin)
| id | model_id FK | note text | internal_rating int CHECK (BETWEEN 1 AND 5) | author_id FK → profiles(id) | created_at |

### 3.13 `model_activities` (journal / historique)
| id | model_id FK | activity_type text | description text | created_at |
Utilisé pour "Dernières activités" du dashboard, et plus tard pour l'historique des castings.

### 3.14 Tables prévues pour le futur module Casting (créées maintenant, non branchées à l'UI)
```
castings
  id, name, client, event_date, type, criteria jsonb, created_by FK profiles, created_at

casting_models
  casting_id FK, model_id FK, status text CHECK IN ('propose','selectionne','refuse'),
  PRIMARY KEY (casting_id, model_id)
```

### 3.15 Fonction / séquence pour `yms_id`
```sql
CREATE SEQUENCE models_yms_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_yms_id()
RETURNS trigger AS $$
BEGIN
  NEW.yms_id := 'YMS-M' || LPAD(nextval('models_yms_id_seq')::text, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_generate_yms_id
BEFORE INSERT ON models
FOR EACH ROW
WHEN (NEW.yms_id IS NULL)
EXECUTE FUNCTION generate_yms_id();
```
Le frontend n'envoie jamais `yms_id` : la colonne est calculée côté base, et RLS empêchera de toute façon un UPDATE de ce champ par un non-admin.

---

## 4. Diagramme ER en texte (MCD)

```
profiles (1) ──── (1) models (1) ──── (1) model_measurements
                      │
                      ├── (1) ──── (1) availabilities
                      ├── (1) ──── (1) consents
                      │
                      ├── (1) ──── (N) model_photos
                      ├── (1) ──── (N) model_documents
                      ├── (1) ──── (N) admin_notes
                      ├── (1) ──── (N) model_activities
                      │
                      ├── (N) ──── (N) experiences   via model_experiences
                      ├── (N) ──── (N) skills         via model_skills
                      │
                      └── (N) ──── (N) castings        via casting_models  [futur]
```

Toutes les relations "détail" (measurements, availabilities, consents) sont en 1-1 pour garder `models` léger et éviter une table fourre-tout, conformément à la demande de normalisation.

---

## 5. Stratégie RLS (Row Level Security)

### 5.1 Fonction utilitaire
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```
`SECURITY DEFINER` pour éviter une récursion RLS sur `profiles` elle-même.

### 5.2 Principe général par table
- **`profiles`** : chacun lit sa propre ligne ; admin lit tout ; seul un admin peut changer un `role`.
- **`models`** :
  - SELECT : `is_admin() OR profile_id = auth.uid()`
  - INSERT : `profile_id = auth.uid()` (un mannequin ne crée que son propre profil), ou admin
  - UPDATE : mannequin limité à ses propres colonnes autorisées (voir 5.3) ; admin illimité
  - DELETE : `is_admin()` uniquement
- **`model_measurements`, `model_experiences`, `model_skills`, `availabilities`, `model_photos`, `model_documents`** : accès si `model_id` appartient au `auth.uid()` courant (via sous-requête sur `models`), ou admin.
- **`consents`** : lecture/écriture par le propriétaire (à la création), lecture admin ; pas de suppression possible pour un mannequin.
- **`admin_notes`** : **SELECT et toute action réservées à `is_admin()`**. Aucune policy ne permet au mannequin de lire cette table, quelle que soit la requête envoyée directement à l'API PostgREST.
- **`experiences`, `skills`** (lookup) : lecture publique authentifiée, écriture admin seulement.
- **`castings`, `casting_models`** : admin uniquement (V1).

### 5.3 Empêcher un mannequin de modifier ses champs sensibles
Un `UPDATE ... USING` simple ne suffit pas à restreindre les *colonnes*. Deux approches complémentaires seront utilisées :
1. **Colonnes sensibles séparées** : `status`, `category`, `level_yms`, `yms_id` restent modifiables uniquement par admin car elles vivent dans `models`, protégées par une policy UPDATE qui vérifie `is_admin() OR (profile_id = auth.uid() AND <colonnes sensibles inchangées>)` via un trigger `BEFORE UPDATE` qui rejette toute tentative de changement de ces colonnes si l'appelant n'est pas admin.
2. Exemple de trigger :
```sql
CREATE OR REPLACE FUNCTION protect_admin_fields()
RETURNS trigger AS $$
BEGIN
  IF NOT is_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.level_yms IS DISTINCT FROM OLD.level_yms
       OR NEW.yms_id IS DISTINCT FROM OLD.yms_id THEN
      RAISE EXCEPTION 'Modification non autorisée';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5.4 Exemple de policy complète (models)
```sql
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY models_select ON models
  FOR SELECT USING (is_admin() OR profile_id = auth.uid());

CREATE POLICY models_insert ON models
  FOR INSERT WITH CHECK (is_admin() OR profile_id = auth.uid());

CREATE POLICY models_update ON models
  FOR UPDATE USING (is_admin() OR profile_id = auth.uid());

CREATE POLICY models_delete ON models
  FOR DELETE USING (is_admin());
```

Ce même schéma (select/insert/update/delete séparés, avec `is_admin() OR propriétaire`) sera répliqué table par table dans la migration `008_rls.sql`, avec `admin_notes` et `castings` limités à `is_admin()` sur toutes les opérations.

Chaque policy sera testée en Phase 11 avec des requêtes simulant un utilisateur `model` essayant d'accéder aux données d'un autre mannequin ou à `admin_notes`.

---

## 6. Architecture Auth

- **Fournisseur** : Supabase Auth, email + mot de passe (extensible plus tard à OAuth si besoin).
- **Création de compte** : un visiteur s'inscrit → trigger `handle_new_user()` crée la ligne `profiles` avec `role = 'model'` par défaut. Aucune API front ne permet de choisir son propre rôle.
- **Promotion admin** : faite manuellement par un admin existant via une requête SQL/back-office (jamais via l'UI publique).
- **Session** : gérée par le SDK Supabase (`persistSession: true`), stockée en storage sécurisé du navigateur.
- **Routes protégées** : un `<ProtectedRoute role="admin">` et `<ProtectedRoute role="model">` côté React vérifient `session + profiles.role` avant de rendre `/admin/*` ou `/client/*`. **Rappel** : ceci est du confort UX ; la vraie barrière est RLS, donc même si quelqu'un bidouille le JS pour afficher `/admin/dashboard`, les requêtes Supabase renverront des ensembles vides ou des erreurs 403 pour un non-admin.
- **Mot de passe oublié** : flux standard Supabase (`resetPasswordForEmail` + page de reset).

---

## 7. Architecture Storage

Deux buckets **privés** (pas de lecture publique anonyme) :

```
model-photos/
  {model_id}/
    portrait/
    full-body-front/
    full-body-profile/
    three-quarter/
    portfolio/

model-documents/
  {model_id}/
    cv/
    parental-authorization/
```

- Policies Storage : lecture/écriture autorisée si `auth.uid()` correspond au propriétaire du `model_id` (jointure via `models.profile_id`) OU `is_admin()`.
- Accès aux photos dans le dashboard admin ou le profil : via **URLs signées** à durée limitée (générées à la demande côté client avec la clé anon, autorisée par la policy Storage — pas besoin d'Edge Function pour ça grâce à RLS Storage).
- Contraintes appliquées côté client ET revalidées : type MIME (`image/jpeg`, `image/png`, `image/webp`), taille max (ex. 5 Mo par photo, 10 Mo pour documents), renommage systématique en UUID pour éviter les collisions et les noms de fichiers piégés.
- Suppression : seule une policy DELETE liée au propriétaire ou à l'admin est acceptée ; suppression physique + suppression de la ligne `model_photos` dans la même transaction (via service applicatif).

---

## 8. Routes frontend

```
/                         → landing / redirection selon session
/login
/forgot-password
/register                 → création de compte mannequin

/client/onboarding        → wizard multi-étapes (formulaire)
/client/profile           → consultation de son profil
/client/status             → statut de validation

/admin/dashboard
/admin/models              → liste + recherche + filtres
/admin/models/:id          → fiche individuelle (Model Profile + admin_notes)
/admin/models/:id/edit
/admin/castings             → V1 minimal / V2 complet
/admin/settings
```

`ProtectedRoute` encapsule chaque groupe ; toute route `/admin/*` redirige un rôle `model` vers `/client/profile`, et tout utilisateur non authentifié vers `/login`.

---

## 9. Plan des migrations SQL

```
supabase/migrations/
├── 001_profiles.sql          (table + trigger handle_new_user)
├── 002_lookup_tables.sql     (experiences, skills)
├── 003_models.sql            (table models + séquence + trigger yms_id)
├── 004_model_details.sql     (measurements, availabilities)
├── 005_model_relations.sql   (model_experiences, model_skills)
├── 006_photos_documents.sql  (model_photos, model_documents)
├── 007_consents.sql
├── 008_admin_notes_activities.sql
├── 009_castings.sql          (futur module, structure seulement)
├── 010_rls_policies.sql      (toutes les policies + is_admin())
└── 011_protect_admin_fields.sql (trigger de protection colonnes sensibles)
```

Chaque fichier sera fourni intégralement en Phase 2 avec les commandes `supabase migration up` / `supabase db push`.

---

## 10. Plan de développement (rappel des phases)

| Phase | Contenu |
|---|---|
| 1 | Architecture + base de données ✅ (ce document) |
| 2 | Configuration Supabase (projet, `.env`, client, CLI, migrations 001-011) |
| 3 | Authentification (login, logout, reset password, ProtectedRoute) |
| 4 | Interface admin (layout, sidebar, routing) |
| 5 | Formulaire mannequin (wizard 8 étapes, Zod, RHF) |
| 6 | Upload photos (Storage, policies, aperçu, validation) |
| 7 | Dashboard (stats, graphiques) |
| 8 | Recherche & filtres avancés |
| 9 | Model Profile (vue admin + vue mannequin) |
| 10 | Export PDF |
| 11 | Sécurité & tests RLS |
| 12 | Tests généraux |
| 13 | Déploiement Vercel + Supabase |

---

### Point de validation avant la Phase 2

Avant de générer les fichiers SQL réels, confirme-moi :
1. Le format `YMS-M001` te convient (largeur de 3 chiffres, donc jusqu'à 999 avant besoin d'ajuster — facilement modifiable) ?
2. Les statuts (`actif`, `disponible`, `indisponible`, `suspendu`) sont-ils indépendants ou `disponible/indisponible` est-il un sous-état de `actif` ? (ça change une contrainte CHECK)
3. Un mannequin mineur doit-il pouvoir se créer un compte lui-même, ou est-ce toujours un admin/parent qui crée le profil pour un mineur ?

Dès que j'ai ces réponses (ou si tu préfères que je pose des hypothèses raisonnables et qu'on avance), je passe à la **Phase 2 : configuration Supabase + fichiers de migration complets**.
