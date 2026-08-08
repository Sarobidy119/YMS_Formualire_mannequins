# Déploiement séparé : Admin et User

L'application produit maintenant deux builds indépendants. Le build User ne contient pas les pages ni le menu Admin.

| Projet | Commande de build | Dossier publié | URL |
| --- | --- | --- | --- |
| Administration | `npm run build:admin` | `dist/admin` | `https://admin.ton-domaine.com` |
| Mannequins / personnel | `npm run build:user` | `dist/user` | `https://espace.ton-domaine.com` |

Crée deux projets Vercel (ou deux services chez ton hébergeur), chacun connecté au même dépôt mais configuré avec la commande et le dossier correspondant.

Dans chacun des deux projets, ajoute ces variables d'environnement avec les vraies URLs :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
VITE_ADMIN_APP_URL=https://admin.ton-domaine.com
VITE_USER_APP_URL=https://espace.ton-domaine.com
```

Pour le développement local :

```bash
npm run dev:user    # http://localhost:5174
npm run dev:admin   # http://localhost:5173
```

Ajoute également `https://admin.ton-domaine.com/*` et `https://espace.ton-domaine.com/*` dans **Supabase → Authentication → URL Configuration → Redirect URLs**. Les liens de réinitialisation de mot de passe retourneront ainsi vers le bon site.

La séparation des deux sites empêche l'interface Admin d'être livrée dans le lien envoyé au personnel. Les règles RLS Supabase restent la protection effective des données et doivent rester activées.
