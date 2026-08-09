# Déploiement: Backend Render + Neon + Frontend Netlify

Ce projet est séparé en trois parties :
- Backend Express + PostgreSQL deployé sur Render
- Base de données PostgreSQL gérée par Neon
- Frontend Admin/User déployé sur deux sites Netlify distincts

## 1. Préparer la base de données Neon

1. Crée un nouveau projet PostgreSQL sur https://neon.tech.
2. Copie l'URL de connexion `DATABASE_URL` fournie par Neon.
3. Initialise le schéma avec le fichier SQL du backend :

```bash
psql "$DATABASE_URL" -f backend/sql/schema.sql
```

Si tu préfères, exécute le contenu de `backend/sql/schema.sql` depuis le SQL editor Neon.

## 2. Déployer le backend sur Render

Crée un service Web sur Render :
- Root directory : `backend`
- Build command : `npm install && npm run build`
- Start command : `npm start`
- Environment : `Node 20` ou `Node 18`
- Health check path : `/api/health`

Ajoute ces variables d'environnement dans Render :

```env
DATABASE_URL=<ta_url_neon>
JWT_SECRET=<ton_secret_jwt>
FRONTEND_ORIGIN=https://admin.ton-domaine.com,https://espace.ton-domaine.com
SMTP_HOST=<smtp_host>
SMTP_PORT=<smtp_port>
SMTP_USER=<smtp_user_optional>
SMTP_PASSWORD=<smtp_password_optional>
EMAIL_FROM=<no-reply@ton-domaine.com>
```

> Render fournit généralement `PORT` automatiquement, donc tu n'as pas besoin de le définir manuellement.

### Notes CORS
Le backend autorise les origines listées dans `FRONTEND_ORIGIN`. Assure-toi d'utiliser les URLs exactes des deux sites Netlify.

## 3. Déployer le frontend sur Netlify

Tu dois créer deux sites Netlify différents depuis le même dépôt :

### Site User
- Build command : `npm run build:user`
- Publish directory : `dist/user`
- Environment variables :
  - `VITE_API_BASE_URL=https://<ton-backend-render>.onrender.com/api`
  - `VITE_USER_APP_URL=https://espace.ton-domaine.com`
  - `VITE_ADMIN_APP_URL=https://admin.ton-domaine.com`

### Site Admin
- Build command : `npm run build:admin`
- Publish directory : `dist/admin`
- Environment variables :
  - `VITE_API_BASE_URL=https://<ton-backend-render>.onrender.com/api`
  - `VITE_ADMIN_APP_URL=https://admin.ton-domaine.com`
  - `VITE_USER_APP_URL=https://espace.ton-domaine.com`

Le frontend inclut déjà un fichier `frontend/public/_redirects` avec `/* /index.html 200`, donc le fallback SPA fonctionnera correctement.

## 4. Variables frontend indispensables

Le code frontend utilise :
- `VITE_API_BASE_URL` pour appeler l'API Express
- `VITE_ADMIN_APP_URL` et `VITE_USER_APP_URL` pour les liens de redirection

Sans ces variables, l'application ne pourra pas appeler le backend ni rediriger vers les bonnes URLs.

## 5. Tester localement

```bash
npm run build:user
npm run build:admin
```

Puis lance le backend localement depuis `backend` :

```bash
npm install
npm run dev
```

## 6. Remarques importantes

- Le backend actuel utilise une base PostgreSQL standard, pas Supabase. Les docs mentionnant Supabase sont obsolètes pour ce dépôt.
- `backend/.env.example` contient le template des variables nécessaires pour Render.
- Le frontend est construit à partir de `frontend/apps/user` et `frontend/apps/admin`.
