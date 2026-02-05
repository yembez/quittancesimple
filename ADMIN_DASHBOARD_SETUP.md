# Admin Dashboard - Configuration et Utilisation

## Vue d'ensemble

L'interface admin privée permet d'accéder aux statistiques et données de QuittanceSimple de manière sécurisée.

## Sécurité

✅ **Implémenté:**
- Authentification Supabase obligatoire
- Vérification de l'email admin via allowlist
- Edge Function sécurisée avec SERVICE_ROLE_KEY (jamais exposée côté front)
- Redirection automatique si non authentifié
- Page "Accès refusé" si email non autorisé

## Configuration requise

### 1. Variable d'environnement ADMIN_EMAILS

Vous devez configurer la variable d'environnement `ADMIN_EMAILS` dans Supabase pour spécifier les emails autorisés à accéder au dashboard admin.

**Via Supabase Dashboard:**
1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet QuittanceSimple
3. Allez dans "Edge Functions" > "admin-dashboard"
4. Cliquez sur "Settings" ou "Secrets"
5. Ajoutez la variable:
   - **Nom**: `ADMIN_EMAILS`
   - **Valeur**: `2speek@gmail.com`

   Pour plusieurs admins, séparez par des virgules:
   - **Valeur**: `2speek@gmail.com,autre@email.com`

**Via Supabase CLI (alternatif):**
```bash
supabase secrets set ADMIN_EMAILS=2speek@gmail.com
```

### 2. Variables automatiques

Les variables suivantes sont déjà configurées automatiquement par Supabase:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## Accès au Dashboard

### URL
- **Production**: `https://www.quittancesimple.fr/admin`
- **Local**: `http://localhost:5173/admin`

### Connexion
1. Assurez-vous d'être connecté avec votre compte Supabase (email: 2speek@gmail.com)
2. Accédez à `/admin`
3. Si non connecté → redirection vers `/`
4. Si connecté mais email non autorisé → page "Accès refusé"
5. Si autorisé → affichage du dashboard

## Fonctionnalités

### KPIs disponibles
- **Nouveaux leads**: Nombre de propriétaires inscrits (7j/30j)
- **Quittances générées**: Nombre total de quittances créées (7j)
- **Leads IRL**: Nombre de prospects pour révision de loyer (7j)
- **Abonnements actifs**: Nombre d'abonnements payants actifs
- **CA Stripe**: Chiffre d'affaires des 30 derniers jours (si disponible)

### Tables
- **Derniers leads**: 10 derniers propriétaires inscrits
  - Email, source, produit, date
- **Derniers abonnements**: 10 derniers abonnements actifs
  - Email, plan, statut, date

### Filtres
- Période: 7 derniers jours / 30 derniers jours

## Architecture technique

### Frontend (`/src/pages/Admin.tsx`)
- Vérifie la session Supabase
- Appelle l'Edge Function avec le JWT dans Authorization Bearer
- Affiche les données ou les erreurs
- Redirection automatique si non autorisé

### Backend (`/supabase/functions/admin-dashboard/index.ts`)
- Vérifie le token JWT via `supabase.auth.getUser()`
- Vérifie l'email dans la liste `ADMIN_EMAILS`
- Utilise `SUPABASE_SERVICE_ROLE_KEY` pour lire les données sensibles
- Retourne les KPIs et listes agrégées

### Sources de données
- **Leads**: Table `proprietaires`
- **IRL**: Tables `prospects_revision_loyer` + `rappels_nouveau_loyer`
- **Quittances**: Tables `quittances_generated` + `quittances`
- **Abonnements**: Colonne `abonnement_actif` dans `proprietaires`
- **Stripe**: Table `factures` avec statut `payee`

## Test de l'accès

### Test avec votre compte (2speek@gmail.com)
1. Connectez-vous sur QuittanceSimple
2. Allez sur `/admin`
3. ✅ Vous devriez voir le dashboard avec toutes les données

### Test avec un autre compte
1. Connectez-vous avec un autre email
2. Allez sur `/admin`
3. ❌ Vous devriez voir "Accès refusé"

### Test sans authentification
1. Déconnectez-vous
2. Allez sur `/admin`
3. 🔄 Redirection automatique vers `/`

## Dépannage

### Erreur 403 "Forbidden"
➡️ Votre email n'est pas dans `ADMIN_EMAILS`
- Vérifiez la variable d'environnement dans Supabase
- Assurez-vous que l'email correspond exactement (pas d'espaces)

### Erreur 401 "Unauthorized"
➡️ Vous n'êtes pas authentifié
- Connectez-vous d'abord sur le site
- Vérifiez que la session Supabase est active

### Erreur 500 "Internal server error"
➡️ Problème côté serveur
- Vérifiez les logs de l'Edge Function dans Supabase Dashboard
- Vérifiez que toutes les tables existent

### Données vides ou nulles
➡️ Normal si pas encore de données
- Les compteurs affichent 0
- Les tableaux affichent "Aucun lead/abonnement trouvé"
- Le CA Stripe affiche "N/A" si pas de factures payées

## Sécurité - Checklist

✅ Le front n'a jamais accès à `SUPABASE_SERVICE_ROLE_KEY`
✅ Toutes les requêtes passent par l'Edge Function sécurisée
✅ Vérification JWT + email admin sur chaque requête
✅ CORS configuré correctement
✅ Redirection si non authentifié
✅ Message d'erreur si non autorisé
✅ Pas de RLS à modifier (sécurité au niveau Edge Function)

## Maintenance

### Ajouter un nouvel admin
1. Allez dans Supabase Dashboard > Edge Functions > admin-dashboard > Secrets
2. Modifiez `ADMIN_EMAILS` pour ajouter le nouvel email:
   ```
   2speek@gmail.com,nouveladmin@email.com
   ```
3. Sauvegardez
4. Le nouvel admin peut maintenant accéder à `/admin`

### Retirer un admin
1. Modifiez `ADMIN_EMAILS` pour supprimer l'email
2. Sauvegardez
3. L'ancien admin verra "Accès refusé" immédiatement

## Support

En cas de problème:
1. Vérifiez les logs Edge Function dans Supabase Dashboard
2. Vérifiez la console navigateur (F12)
3. Vérifiez que `ADMIN_EMAILS` est bien configuré
4. Testez avec votre email: 2speek@gmail.com
