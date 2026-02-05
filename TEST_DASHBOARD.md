# 🧪 Guide de Test - Accès au Dashboard

## Option 1 : Via la Modal de Souscription (Recommandé)

### Étapes :

1. **Accédez à la page Tarifs ou Automatisation**
   - URL : `/pricing` ou `/automation`

2. **Cliquez sur un bouton de souscription**
   - "Souscrire Quittance Automatique" (corail)
   - "Souscrire Quittance Automatique+" (vert)

3. **Remplissez le formulaire (Étape 1)**
   - Nom complet : `Jean Dupont`
   - Email : `test@example.com` (ou un email unique)
   - Mot de passe : `test123`
   - Confirmer le mot de passe : `test123`
   - Cliquez sur "Continuer vers le paiement"
   - ✅ **Compte créé dans Supabase Auth**

4. **Simulez le paiement (Étape 2)**
   - Ajustez le nombre de locataires si besoin
   - Cliquez sur "Confirmer et démarrer mon essai gratuit"
   - ⏱️ Le paiement est simulé (1,5 secondes)
   - ✅ **Propriétaire créé dans la table `proprietaires`**
   - ✅ **Données : nom, prénom, email, plan, date d'inscription**

5. **Redirection automatique (Étape 3)**
   - Message de confirmation ✅
   - Cliquez sur "Accéder à mon tableau de bord"
   - ✅ **Email stocké dans localStorage**
   - ✅ **Plan et nombre de locataires sauvegardés**
   - ✅ **Redirection vers `/dashboard` avec React Router (navigate)**

---

## Option 2 : Accès Direct au Dashboard

### URL directe :
```
/dashboard
```

**Note** : Si vous n'êtes pas connecté, le dashboard peut afficher un état vide ou vous demander de vous connecter.

---

## 🔑 Compte de Test Pré-configuré

Si vous avez déjà créé un compte via la modal :

- **Email** : celui que vous avez utilisé
- **Plan** : Auto ou Bank (selon votre choix)
- **Locataires** : nombre sélectionné dans la modal

Les données sont stockées dans **Supabase** via l'authentification.

---

## 📊 Fonctionnalités du Dashboard

Une fois connecté, vous devriez voir :

- ✅ Liste de vos locataires
- ✅ Historique des quittances
- ✅ Actions rapides (générer, envoyer)
- ✅ Paramètres selon votre plan (Auto ou Auto+)

---

## 🛠️ En cas de problème

### Le dashboard ne s'affiche pas ?

1. Vérifiez que vous avez bien complété les 3 étapes de la modal
2. Ouvrez la console du navigateur (F12) pour voir les erreurs
3. Vérifiez que Supabase est bien configuré (fichier `.env`)

### Je ne vois pas mes données ?

- Les données sont créées lors de la souscription via la modal
- Pour l'instant, le paiement est **simulé** (pas de vrai Stripe)
- Les données utilisateur sont stockées dans Supabase Auth

---

## 🎯 Raccourci de Test Rapide

Pour tester rapidement :

```
1. Aller sur /pricing
2. Clic "Souscrire Quittance Automatique"
3. Remplir : test@example.com / test123
4. Clic "Continuer"
5. Clic "Confirmer"
6. Clic "Accéder au dashboard"
7. ✅ Vous êtes sur /dashboard
```

---

## 📝 Notes Importantes

- ⚠️ **Le paiement Stripe n'est PAS réellement intégré** - c'est une simulation de 1,5 secondes
- ✅ **L'authentification Supabase fonctionne** - les comptes sont créés dans `auth.users`
- ✅ **Le propriétaire est créé dans la BDD** - table `proprietaires` avec upsert sur email
- 🎨 **Le tunnel de souscription est complet** - Modal → Compte → Paiement → Dashboard
- 🔄 **La redirection utilise React Router** - `navigate('/dashboard')` au lieu de `window.location`
- 💾 **Les données sont persistées** :
  - Supabase Auth : compte utilisateur
  - Table `proprietaires` : infos propriétaire + plan
  - localStorage : email, plan, nombre de locataires

---

## 🚀 Prochaines Étapes (si besoin)

Pour intégrer un vrai paiement Stripe :

1. Obtenir une clé API Stripe
2. Créer des produits/prix dans Stripe
3. Remplacer la simulation par `stripe.checkout.sessions.create()`
4. Gérer les webhooks Stripe pour confirmer le paiement

Pour l'instant, le tunnel est **fonctionnel en mode démo** ! 🎉
