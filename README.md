# YMS Model Management System

Pour publier les espaces Admin et User sur deux URLs distinctes, consulte [DEPLOYMENT.md](DEPLOYMENT.md).

Application complète de gestion des mannequins pour Youth Malagasy Service (YMS).

## Stack

- React + TypeScript + Vite + Tailwind CSS
- React Router, React Hook Form, Zod, Lucide React
- Supabase (Auth, PostgreSQL, Storage, RLS)
- jsPDF pour l'export de fiches profil

## 1. Installation

```bash
npm install
```

## 2. Configuration Supabase

1. Crée un projet sur https://supabase.com
2. Copie `.env.example` vers `.env.local` et renseigne :

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

**Ne mets jamais la clé `service_role` dans le frontend.**

## 3. Appliquer les migrations

Avec la Supabase CLI (recommandé) :

```bash
supabase login
supabase link --project-ref <ton-project-ref>
supabase db push
```

Ou manuellement : exécute chaque fichier de `supabase/migrations/` dans l'éditeur SQL de Supabase, **dans l'ordre numérique** (001 → 012).

## 4. Créer un premier compte admin

1. Inscris-toi normalement via `/register` (le compte est créé avec le rôle `model` par défaut).
2. Dans l'éditeur SQL de Supabase, promeus ce compte en admin :

```sql
update profiles set role = 'admin' where id = '<uuid-de-ton-utilisateur>';
```

(Trouve l'UUID dans Authentication > Users, ou `select id, full_name from profiles;`)

## 5. Données de test (développement uniquement)

`supabase/seed.sql` génère 20 mannequins fictifs. Comme `auth.users` ne peut pas être peuplé
par simple SQL, adapte le script pour utiliser des `profile_id` réels si tu veux des comptes
connectables, ou exécute-le tel quel pour peupler uniquement les données de test/dashboard.

## 6. Lancer le projet

```bash
npm run dev
```

## 7. Déploiement

**Frontend (Vercel)** :
```bash
vercel
```
Configure les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans le dashboard Vercel.

**Backend** : rien à déployer séparément, Supabase héberge la base de données, l'auth et le storage.

## Architecture

Voir `ARCHITECTURE.md` pour le détail complet (schéma DB, stratégie RLS, diagramme ER).

## Sécurité — points clés

- La séparation `src/admin` / `src/client` est uniquement organisationnelle : la sécurité réelle
  est assurée par les policies RLS PostgreSQL (voir `010_rls_policies.sql`, `011_protect_admin_fields.sql`).
- `admin_notes` n'est lisible que par un admin, appliqué au niveau base de données.
- Les buckets Storage sont privés ; l'accès aux photos passe par des URLs signées.
- L'`yms_id` est généré côté base par trigger, jamais envoyé par le frontend.
- Un mannequin ne peut jamais modifier `status`, `category`, `level_yms`, `yms_id` même en
  modifiant une requête côté client (trigger `protect_admin_fields`).

## Ce qui est fourni dans cette V1

- Auth complète (login, register, mot de passe oublié, sessions, routes protégées)
- Formulaire mannequin mobile-first en 8 étapes avec sauvegarde de brouillon (sessionStorage, données non sensibles uniquement)
- Upload de photos vers Supabase Storage avec validation (type, taille, renommage sécurisé)
- Dashboard admin avec statistiques et graphiques simples
- Liste des mannequins avec recherche texte + filtres avancés, tableau desktop / cartes mobile
- Fiche individuelle (Model Profile) avec séparation stricte des infos admin-only
- Export PDF du profil (sans données sensibles)
- Structure de base de données prête pour le futur module Casting

## Ce qui reste à compléter pour la production

- Module Casting (UI) — la structure DB existe déjà (`castings`, `casting_models`)
- Formulaire d'édition admin complet (`/admin/models/:id/edit`)
- Page Statistiques/Paramètres admin détaillées
- Génération de types Supabase automatique (`supabase gen types typescript`) pour remplacer les types manuels de `database.types.ts`
- Tests (unitaires + tests RLS avec plusieurs rôles simulés)
- Edge Function optionnelle pour la génération de PDF côté serveur si un rendu plus riche est nécessaire
