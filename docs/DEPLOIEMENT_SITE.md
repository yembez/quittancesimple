# Mise en ligne du site (local → production)

Ce guide décrit comment mettre en ligne le nouveau site développé en local : **frontend** (app React) et **backend Supabase** (Edge Functions, base de données).

---

## 1. Frontend (site React / Vite)

Le projet est configuré pour **Vercel** et **Netlify**. Utilise la plateforme sur laquelle ton site est déjà hébergé.

### Option A : Vercel

1. **Connexion**  
   - Va sur [vercel.com](https://vercel.com), connecte-toi et lie le dépôt Git du projet (si ce n’est pas déjà fait).

2. **Déploiement**  
   - **Si le projet est déjà connecté** : pousse tes commits sur la branche utilisée par Vercel (souvent `main` ou `refonte-design`). Un déploiement se déclenche automatiquement.  
   - **Déploiement manuel** : à la racine du projet :
     ```bash
     npm run build
     npx vercel --prod
     ```
   - Vercel utilise le `vercel.json` présent (rewrite vers `index.html` pour le routing React).

3. **Variables d’environnement**  
   Dans **Vercel → Project → Settings → Environment Variables**, assure-toi d’avoir au minimum :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - Les autres variables `VITE_*` ou Stripe si ton build en a besoin.

### Option B : Netlify

1. **Connexion**  
   - Va sur [netlify.com](https://netlify.com), connecte-toi et lie le dépôt Git du projet.

2. **Build**  
   Le fichier `netlify.toml` définit déjà :
   - **Build command** : `npx vite build`
   - **Publish directory** : `dist`
   - **Redirects** : `/*` → `/index.html` (SPA).

3. **Déploiement**  
   - Push sur la branche connectée → déploiement auto.  
   - Ou en CLI :
     ```bash
     npm run build
     npx netlify deploy --prod --dir=dist
     ```

4. **Variables d’environnement**  
   **Site → Build & deploy → Environment** : ajoute les mêmes variables que pour Vercel (`VITE_SUPABASE_URL`, etc.).

---

## 2. Supabase (base de données + Edge Functions)

Les changements récents (templates e-mail, signature « Vincent », lien Nous contacter en `mailto:`) sont dans des **Edge Functions**. Il faut les redéployer pour que la prod utilise le nouveau code.

### 2.1 Lier le projet Supabase

À la racine du projet :

```bash
npx supabase login
npx supabase link --project-ref jfpbddtdblqakabyjxkq
```

(Remplace par ton `project-ref` si différent — voir [Supabase Dashboard](https://supabase.com/dashboard) → Settings → General.)

### 2.2 Migrations (si tu as des nouvelles migrations)

Si tu as ajouté des migrations dans `supabase/migrations/` :

```bash
npx supabase db push
```

**Recommandation** : faire un backup avant. Le script existant fait backup + push :

```bash
./scripts/deploy_supabase.sh
```

Ce script fait aussi le déploiement des fonctions de **signature**. Il ne déploie pas toutes les fonctions e-mail.

### 2.3 Déployer les Edge Functions (e-mails et autres)

Pour que les nouveaux e-mails (quittance gratuite, rappels essai, etc.) soient pris en compte, déploie les fonctions concernées :

```bash
# Fonctions e-mail modifiées (template unifié, signature Vincent, mailto contact)
npx supabase functions deploy send-quittance
npx supabase functions deploy send-trial-reminder-email
```

Si tu préfères tout redéployer :

```bash
# Exemple : déployer les fonctions principales (à adapter selon tes besoins)
for f in send-quittance send-trial-reminder-email send-charges-revision-reminder-email signatures-create signatures-get signatures-send-otp signatures-sign signatures-request-modification signatures-cancel signatures-generate-final-pdf; do
  npx supabase functions deploy "$f"
done
```

### 2.4 Secrets Supabase

Dans **Supabase Dashboard → Project → Edge Functions → Secrets**, vérifie que les secrets utilisés par les fonctions sont bien renseignés, par exemple :

- `RESEND_API_KEY`
- `APP_URL` (URL du site en prod)
- `STRIPE_*` si utilisé par les fonctions
- etc.

---

## 3. Ordre recommandé

1. **Backup / sécurité**  
   Si tu modifies la base : lancer `./scripts/deploy_supabase.sh` (qui fait backup + `db push`) ou au minimum `supabase db dump` avant `db push`.

2. **Supabase**  
   - `supabase link`  
   - `supabase db push` (si migrations)  
   - `supabase functions deploy` pour les fonctions modifiées (au minimum `send-quittance`, `send-trial-reminder-email`).

3. **Frontend**  
   - Push sur la branche connectée à Vercel/Netlify, ou déploiement manuel avec `npm run build` puis `vercel --prod` ou `netlify deploy --prod`.

4. **Contrôle**  
   - Ouvrir l’URL de prod du site et vérifier que l’app charge (même Supabase / même env).  
   - Déclencher un envoi de quittance gratuite et vérifier que l’e-mail reçu a le bon contenu (signature « Vincent de Quittance Simple », lien « Nous contacter » en mailto, bleu vif, etc.).

---

## 4. Résumé des commandes (copier-coller)

```bash
# 1. Build frontend (vérifier qu’il passe)
npm run build

# 2. Supabase : lien projet (une fois)
npx supabase login
npx supabase link --project-ref jfpbddtdblqakabyjxkq

# 3. Migrations + backup (optionnel, si script présent)
./scripts/deploy_supabase.sh

# 4. Edge Functions e-mail (obligatoire pour les nouveaux mails)
npx supabase functions deploy send-quittance
npx supabase functions deploy send-trial-reminder-email

# 5. Frontend en prod
# Soit : push Git (déploiement auto Vercel/Netlify)
# Soit :
npx vercel --prod
# ou
npx netlify deploy --prod --dir=dist
```

Une fois ces étapes faites, le nouveau site (frontend + e-mails) est en ligne.
