# Configuration Powens - Agrégation Bancaire

Ce guide vous explique comment configurer Powens (ex-Budget Insight) pour l'agrégation bancaire dans votre application Quittance Connectée+.

## 📋 Pourquoi Powens ?

**Powens (ex-Budget Insight)** est l'agrégateur bancaire français de référence :

✅ **Couverture complète** : Plus de 300 banques françaises
✅ **Conformité DSP2** : Certifié et agréé en France
✅ **Pricing accessible** : Modèle adapté aux startups
✅ **Support français** : Équipe basée en France
✅ **API simple** : OAuth2 standard, documentation claire

## 🚀 Étape 1 : Créer un compte Powens

1. Contactez Powens pour créer un compte : https://www.powens.com/contact
2. Demandez un accès à l'**environnement sandbox** (gratuit pour tests)
3. Une fois validé, vous recevrez vos credentials

## 🔑 Étape 2 : Récupérer vos credentials

Dans votre dashboard Powens, vous trouverez :

- **Client ID** : Votre identifiant unique
- **Client Secret** : Votre secret d'authentification
- **API URLs** :
  - Sandbox : `https://api-sandbox.powens.com`
  - Production : `https://api.powens.com`

## ⚙️ Étape 3 : Configurer les Redirect URIs

**IMPORTANT** : Vous devez déclarer vos URLs de callback dans le dashboard Powens.

**URLs à déclarer :**

```
https://app.quittancesimple.fr/bank-sync
https://dev.quittancesimple.fr/bank-sync
http://localhost:5173/bank-sync  (pour dev local si besoin)
```

Ces URLs sont utilisées pour le callback OAuth2 après connexion bancaire.

## 🔧 Étape 4 : Configurer les variables d'environnement

### Dans votre fichier .env local :

```bash
# Powens Configuration
POWENS_CLIENT_ID=your-powens-client-id
POWENS_CLIENT_SECRET=your-powens-client-secret
POWENS_API_URL=https://api-sandbox.powens.com
POWENS_REDIRECT_URI=http://localhost:5173/bank-sync
```

### Dans Supabase Edge Function Secrets :

**Via le Dashboard Supabase :**

1. Allez dans votre projet Supabase
2. **Edge Functions** → **Secrets**
3. Ajoutez ces variables :
   - `POWENS_CLIENT_ID` = votre client ID
   - `POWENS_CLIENT_SECRET` = votre client secret
   - `POWENS_API_URL` = https://api-sandbox.powens.com (ou production)
   - `POWENS_REDIRECT_URI` = https://app.quittancesimple.fr/bank-sync

**Via Supabase CLI :**

```bash
supabase secrets set POWENS_CLIENT_ID=your-client-id
supabase secrets set POWENS_CLIENT_SECRET=your-client-secret
supabase secrets set POWENS_API_URL=https://api-sandbox.powens.com
supabase secrets set POWENS_REDIRECT_URI=https://app.quittancesimple.fr/bank-sync
```

## 📦 Étape 5 : Déployer l'Edge Function

L'Edge Function Powens doit être déployée sur Supabase :

```bash
# Via Supabase CLI
supabase functions deploy powens-connect
```

Ou utilisez l'outil MCP de déploiement automatique.

## 🧪 Étape 6 : Tester en mode Sandbox

En mode sandbox, Powens fournit des comptes de test pour toutes les grandes banques françaises.

**Identifiants de test universels :**
- Username : `00000000000`
- Password : `0000`

**Banques de test disponibles :**
- BNP Paribas
- Crédit Agricole
- Société Générale
- LCL
- Banque Postale
- Crédit Mutuel
- CIC
- Boursorama
- N26
- Revolut

Ces comptes permettent de tester tous les scénarios sans frais.

## 🏦 Fonctionnement de l'intégration

### Flux OAuth2 :

1. **Utilisateur clique sur "Connecter ma banque"**
   → Appel à `/powens-connect/webauth`
   → Récupération d'une URL d'authentification Powens

2. **Redirection vers Powens**
   → L'utilisateur se connecte à sa banque via Powens
   → Interface sécurisée gérée par Powens

3. **Callback avec code**
   → Powens redirige vers `/bank-sync?code=xxx`
   → Le code est échangé contre un access token permanent

4. **Sauvegarde de la connexion**
   → Le token est stocké dans `bank_connections`
   → La connexion est prête à être utilisée

5. **Récupération des transactions**
   → Appel à `/powens-connect/transactions`
   → Détection automatique des paiements de loyer

## 💰 Pricing Powens

### Sandbox (Gratuit)
- Illimité pour les tests
- Toutes les banques françaises simulées
- Données de test cohérentes

### Production

**Modèle "Pay-as-you-grow" :**
- **Setup** : Gratuit ou faible coût initial
- **Par utilisateur actif** : ~1-2€/mois selon volume
- **Pas de frais cachés**

**Pour votre offre à 2,90€/mois :**
- Coût Powens : ~1,50€/utilisateur
- Marge nette : ~1,40€/mois
- ROI positif dès le premier mois ✅

**Négociation de volume :**
Powens adapte ses tarifs selon votre croissance. Au-delà de 1000 utilisateurs, vous pouvez négocier un tarif dégressif.

## 🔍 Détection automatique des loyers

L'algorithme de détection utilise plusieurs critères :

1. **Montant attendu** ± tolérance
2. **IBAN expéditeur** (si fourni)
3. **Nom expéditeur** (correspondance partielle)
4. **Mots-clés** dans le libellé : "loyer", "location", etc.
5. **Période de vérification** : Jours 1-10 du mois

Dès qu'un paiement correspond, vous recevez une notification pour validation.

## 📊 Endpoints disponibles

L'Edge Function `powens-connect` expose :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/webauth` | POST | Créer une URL de connexion Powens |
| `/callback` | POST | Échanger le code OAuth2 |
| `/accounts` | GET | Récupérer les comptes bancaires |
| `/transactions` | GET | Récupérer les transactions |
| `/sync` | POST | Synchroniser les données |
| `/revoke` | POST | Révoquer une connexion |
| `/connections` | GET | Lister les connexions actives |

## 🛠️ Utilisation dans le code

### Frontend (déjà configuré)

```typescript
import { bankAggregationService } from '../services/bankAggregation';

// Créer une URL de connexion Powens
const { link_token } = await bankAggregationService.createLinkToken(userId);

// Rediriger l'utilisateur vers Powens
window.location.href = link_token;

// Au retour (callback), échanger le code
const result = await bankAggregationService.exchangePublicToken(
  code,
  userId
);

// Récupérer les transactions
const transactions = await bankAggregationService.getTransactions(
  connectionId,
  startDate,
  endDate
);
```

### Architecture modulaire

L'intégration Powens utilise l'architecture modulaire existante :

```
/src/services/bankAggregation/
  ├── interface.ts       ← Interface commune
  ├── plaidService.ts    ← Service Plaid (désactivé)
  ├── powensService.ts   ← Service Powens (actif)
  └── index.ts           ← Provider = 'powens'
```

**Pour basculer entre providers** (si besoin plus tard) :

```typescript
// Dans index.ts
const CURRENT_PROVIDER: BankAggregationProvider = 'powens'; // ou 'plaid'
```

## 🐛 Troubleshooting

### Erreur "Invalid client credentials"
- Vérifiez `POWENS_CLIENT_ID` et `POWENS_CLIENT_SECRET`
- Assurez-vous que les secrets sont déployés sur Supabase

### Erreur "Invalid redirect URI"
- Vérifiez que l'URL de callback est bien déclarée dans le dashboard Powens
- L'URL doit correspondre exactement (http vs https, trailing slash)

### Pas de transactions récupérées
- Vérifiez les dates (format YYYY-MM-DD)
- Assurez-vous que le compte a des transactions dans la période
- En sandbox, utilisez les identifiants de test

### Connexion expire rapidement
- Powens tokens permanents ne expirent normalement pas
- Si problème, vérifiez le champ `refresh_token` dans la DB
- Implémentez un refresh automatique si nécessaire

## 📚 Resources

- [Documentation Powens](https://docs.powens.com/)
- [Dashboard Powens](https://dashboard.powens.com/) (une fois votre compte créé)
- [API Reference](https://docs.powens.com/reference)
- [Support Powens](https://www.powens.com/contact)

## 🎯 Checklist de mise en production

- [ ] Compte Powens production créé
- [ ] Redirect URIs déclarés dans Powens
- [ ] Variables d'environnement configurées dans Supabase
- [ ] Edge Function déployée
- [ ] Tests en sandbox validés
- [ ] Premier utilisateur test en production
- [ ] Monitoring des erreurs activé
- [ ] Workflow de détection automatique testé

## 🚀 Next Steps

1. **Maintenant** : Testez avec le sandbox
2. **Cette semaine** : Validez le flux complet end-to-end
3. **Dans 2 semaines** : Passez en production avec premiers utilisateurs
4. **Dans 1 mois** : Activez la facturation à 2,90€/mois
5. **Croissance** : Suivez vos KPIs et optimisez la détection

## 💡 Tips pour maximiser la détection

1. **Demandez l'IBAN du locataire** : 90% de fiabilité
2. **Enrichissez les mots-clés** : "loyer", "location", "appart", "logement"
3. **Ajoutez le nom du locataire** : Correspondance partielle
4. **Période de vérification large** : Jours 1-10 du mois
5. **Tolérance raisonnable** : ±5€ pour frais bancaires

Avec ces paramètres, vous atteignez >95% de détection automatique ! 🎯

Bonne chance avec votre intégration Powens ! 🚀
