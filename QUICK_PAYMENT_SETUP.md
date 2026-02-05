# Configuration du Paiement Express Mobile

Ce document explique comment configurer le flux de paiement express pour mobile avec Apple Pay et Google Pay.

## Prérequis

### 1. Clé Publique Stripe

Vous devez ajouter votre clé publique Stripe dans le fichier `.env` :

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique_stripe
```

**Où trouver cette clé ?**

1. Connectez-vous à votre [Dashboard Stripe](https://dashboard.stripe.com)
2. Allez dans **Developers** → **API keys**
3. Copiez votre **Publishable key** (commence par `pk_test_` en mode test ou `pk_live_` en production)
4. Collez-la dans votre fichier `.env`

### 2. Clé Secrète Stripe (Edge Functions)

La clé secrète est automatiquement configurée dans Supabase. Vérifiez qu'elle existe :

```bash
# Dans votre projet Supabase
Settings → Edge Functions → Secrets
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete_stripe
```

## Fonctionnalités

### Flux Utilisateur Mobile

1. **Détection automatique** : Sur mobile, le `QuickPaymentModal` s'affiche au lieu du `LoginModal` classique
2. **Champ email unique** : L'utilisateur entre seulement son email (pré-rempli si disponible)
3. **Paiement express** :
   - **Apple Pay** (détecté automatiquement sur iOS avec Safari)
   - **Google Pay** (détecté automatiquement sur Android avec Chrome)
   - **Carte bancaire** en fallback
4. **Création automatique du compte** :
   - Mot de passe généré automatiquement (11 caractères sécurisés)
   - Email envoyé avec identifiants
   - Redirection vers la page de confirmation

### Mise à Jour API Stripe (2025)

Le code a été mis à jour pour utiliser la nouvelle API Stripe :
- ❌ **Ancienne méthode** : `stripe.redirectToCheckout({ sessionId })`
- ✅ **Nouvelle méthode** : `window.location.href = session.url`

Cette migration est nécessaire car Stripe a déprécié `redirectToCheckout()` dans les versions récentes.

### Composants Créés

#### 1. `QuickPaymentModal.tsx`
Modal de paiement express avec :
- Interface mobile-first (bottom sheet)
- Détection Apple Pay / Google Pay
- Formulaire simplifié (email uniquement)
- Animations fluides

#### 2. `QuickPaymentConfirm.tsx`
Page de confirmation post-paiement avec :
- Animation de succès
- Instructions claires
- Lien vers le dashboard

#### 3. Edge Functions

**`quick-checkout`** (`/functions/v1/quick-checkout`)
- Crée une session Stripe Checkout
- Génère un mot de passe sécurisé
- Configure les métadonnées pour la création du compte

**`send-quick-signup-email`** (`/functions/v1/send-quick-signup-email`)
- Envoie l'email de bienvenue avec identifiants
- Design professionnel avec le mot de passe en évidence
- Instructions pour les prochaines étapes

## Configuration Apple Pay / Google Pay

### Apple Pay

Apple Pay est disponible automatiquement si :
- L'utilisateur est sur Safari (iOS ou macOS)
- Une carte est enregistrée dans Apple Pay
- Votre domaine est vérifié dans Stripe

**Vérifier votre domaine** :
1. Dashboard Stripe → **Settings** → **Payment methods**
2. Cliquez sur **Apple Pay**
3. Ajoutez votre domaine et suivez les instructions de vérification

### Google Pay

Google Pay est disponible automatiquement si :
- L'utilisateur est sur Chrome (Android ou Desktop)
- Une carte est enregistrée dans Google Pay
- Votre compte Stripe est configuré

Aucune configuration supplémentaire n'est requise pour Google Pay.

## Test en Développement

### Mode Test Stripe

Utilisez ces cartes de test :

```
Carte réussie : 4242 4242 4242 4242
Carte échouée : 4000 0000 0000 0002
Date d'expiration : N'importe quelle date future
CVC : N'importe quel 3 chiffres
```

### Tester Apple Pay / Google Pay

En développement local, Apple Pay et Google Pay peuvent ne pas apparaître car ils nécessitent :
- Un domaine HTTPS vérifié
- L'environnement de production Stripe

Pour tester en développement :
1. Utilisez `ngrok` ou un tunnel HTTPS
2. Vérifiez le domaine dans Stripe
3. Testez depuis un véritable appareil mobile

## Variables d'Environnement Requises

```bash
# Frontend (.env)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Backend (Supabase Edge Functions Secrets)
STRIPE_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...  # Pour l'envoi d'emails
```

## Webhook Stripe (Important)

Le flux de paiement express s'intègre avec le webhook Stripe existant (`stripe-webhook`). Assurez-vous que :

1. Le webhook est configuré dans Stripe Dashboard
2. Il écoute les événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

3. Le webhook crée automatiquement le compte utilisateur avec :
   - Email du client
   - Mot de passe généré (depuis les métadonnées)
   - Plan sélectionné

## Sécurité

### Mot de Passe Auto-Généré

Format : 10 caractères alphanumériques + 1 caractère spécial
- Majuscules, minuscules, chiffres
- Caractère spécial : !@#$%
- Ordre randomisé

L'utilisateur peut modifier ce mot de passe après la première connexion depuis son dashboard.

### Protection des Données

- Les mots de passe sont hashés par Supabase Auth
- Les emails sont envoyés via Resend avec TLS
- Les paiements sont traités par Stripe (PCI DSS Level 1)

## Déploiement

1. **Déployez les Edge Functions** (déjà fait) :
   ```bash
   # Ces fonctions sont déjà déployées
   - quick-checkout
   - send-quick-signup-email
   ```

2. **Configurez les variables d'environnement** :
   - Frontend : `.env` avec `VITE_STRIPE_PUBLISHABLE_KEY`
   - Backend : Supabase Secrets avec `STRIPE_SECRET_KEY`

3. **Vérifiez les webhooks Stripe** :
   - URL : `https://xxx.supabase.co/functions/v1/stripe-webhook`
   - Événements configurés
   - Secret webhook enregistré

4. **Testez le flux complet** :
   - Ouvrez la page Pricing sur mobile
   - Cliquez sur "Activer"
   - Vérifiez que le QuickPaymentModal s'ouvre
   - Testez un paiement avec une carte test
   - Vérifiez la réception de l'email

## Troubleshooting

### "Configuration Stripe manquante"

Vérifiez que `VITE_STRIPE_PUBLISHABLE_KEY` est définie dans `.env` et que l'application a été redémarrée.

### Apple Pay / Google Pay n'apparaît pas

- Vérifiez que vous êtes sur HTTPS
- Vérifiez que le domaine est vérifié dans Stripe
- Testez depuis un appareil réel (pas un émulateur)
- Vérifiez qu'une carte est enregistrée dans Apple Pay / Google Pay

### L'email n'est pas reçu

- Vérifiez que `RESEND_API_KEY` est configurée dans les secrets Supabase
- Vérifiez les logs de l'edge function `send-quick-signup-email`
- Vérifiez les spams

### Le compte n'est pas créé

- Vérifiez que le webhook Stripe est configuré
- Vérifiez les logs de l'edge function `stripe-webhook`
- Vérifiez que l'événement `checkout.session.completed` est bien reçu

## Support

Pour toute question, contactez l'équipe technique.
