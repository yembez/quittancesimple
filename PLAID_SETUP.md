# Configuration Plaid - Agrégation Bancaire

Ce guide vous explique comment configurer Plaid pour l'agrégation bancaire dans votre application.

## 📋 Prérequis

1. Un compte Plaid (gratuit pour le mode sandbox)
2. Accès à votre dashboard Supabase

## 🚀 Étape 1 : Créer un compte Plaid

1. Allez sur [https://dashboard.plaid.com/signup](https://dashboard.plaid.com/signup)
2. Créez votre compte
3. Une fois connecté, allez dans **Team Settings** → **Keys**

## 🔑 Étape 2 : Récupérer vos clés API

Dans le dashboard Plaid, vous trouverez :

- **Client ID** : Votre identifiant unique
- **Sandbox Secret** : Pour les tests (gratuit, illimité)
- **Development Secret** : Pour tester avec de vraies banques (gratuit, limité)
- **Production Secret** : Pour la production (payant)

## ⚙️ Étape 3 : Configurer les variables d'environnement

### Dans votre fichier .env local :

```bash
# Plaid Configuration
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-sandbox-secret
PLAID_ENV=sandbox  # sandbox, development, ou production
```

### Dans Supabase Edge Function Secrets :

Les secrets doivent être configurés dans votre projet Supabase pour que l'Edge Function puisse y accéder.

**Via le Dashboard Supabase :**

1. Allez dans votre projet Supabase
2. **Edge Functions** → **Secrets**
3. Ajoutez ces variables :
   - `PLAID_CLIENT_ID` = votre client ID
   - `PLAID_SECRET` = votre secret
   - `PLAID_ENV` = sandbox (ou development/production)

**Via Supabase CLI :**

```bash
supabase secrets set PLAID_CLIENT_ID=your-client-id
supabase secrets set PLAID_SECRET=your-secret
supabase secrets set PLAID_ENV=sandbox
```

## 📦 Étape 4 : Déployer l'Edge Function

L'Edge Function Plaid doit être déployée sur Supabase :

```bash
# Via Supabase CLI
supabase functions deploy plaid-connect
```

Ou utilisez l'outil MCP de déploiement automatique disponible dans le projet.

## 🧪 Étape 5 : Tester en mode Sandbox

En mode sandbox, Plaid fournit des comptes de test :

**Identifiants de test :**
- Username : `user_good`
- Password : `pass_good`

**Institutions de test disponibles :**
- First Platypus Bank
- Tartan Bank
- Et d'autres...

Ces institutions permettent de tester tous les scénarios (succès, échec, MFA, etc.) sans frais.

## 🏦 Banques Françaises Supportées (Production)

En mode production, Plaid supporte les principales banques françaises :

- ✅ BNP Paribas
- ✅ Crédit Agricole
- ✅ Société Générale
- ✅ LCL
- ✅ Banque Postale
- ✅ Crédit Mutuel
- ✅ CIC

⚠️ **Note** : La couverture est limitée aux grandes banques. Pour une couverture complète du marché français (néobanques, banques en ligne), il faudra migrer vers Linxo Connect.

## 💰 Pricing Plaid

### Sandbox (Gratuit)
- Illimité pour les tests
- Aucune banque réelle

### Development (Gratuit)
- 100 Items gratuits
- Banques réelles
- Parfait pour valider le concept

### Production (Payant)
- À partir de $0.25-$0.50 par connexion/mois selon volume
- Modèle pay-as-you-grow
- Facturation mensuelle

**Pour votre modèle à 2,90€/mois :**
- Coût Plaid : ~0,25€/connexion
- Marge : ~2,65€/mois
- ROI : >10x 💰

## 🔄 Migration future vers Linxo Connect

L'architecture est prête pour migrer facilement vers Linxo :

**Pour basculer :**

1. Créez le service Linxo dans `/src/services/bankAggregation/linxoService.ts`
2. Implémentez l'interface `IBankAggregationService`
3. Dans `/src/services/bankAggregation/index.ts`, changez :
   ```typescript
   const CURRENT_PROVIDER: BankAggregationProvider = 'linxo';
   ```
4. Déployez l'Edge Function Linxo

**Avantages de cette architecture :**
- Swap en 5 minutes
- Code client inchangé
- Possibilité d'offrir les deux options
- Migration progressive par utilisateur

## 🛠️ Utilisation dans le Code

### Frontend (déjà configuré)

```typescript
import { bankAggregationService } from '../services/bankAggregation';

// Créer un link token
const token = await bankAggregationService.createLinkToken(userId);

// Échanger le public token
const result = await bankAggregationService.exchangePublicToken(
  publicToken,
  userId
);

// Récupérer les transactions
const transactions = await bankAggregationService.getTransactions(
  connectionId,
  startDate,
  endDate
);
```

### Endpoints Edge Function

L'Edge Function `plaid-connect` expose plusieurs endpoints :

- `POST /plaid-connect/link-token` - Créer un token de connexion
- `POST /plaid-connect/exchange-token` - Échanger le public token
- `GET /plaid-connect/accounts` - Récupérer les comptes
- `GET /plaid-connect/transactions` - Récupérer les transactions
- `POST /plaid-connect/sync` - Synchroniser les données
- `POST /plaid-connect/revoke` - Révoquer une connexion
- `GET /plaid-connect/connections` - Lister les connexions

## 🐛 Troubleshooting

### Erreur "Invalid credentials"
- Vérifiez que `PLAID_CLIENT_ID` et `PLAID_SECRET` sont corrects
- Assurez-vous que les secrets sont déployés sur Supabase

### Erreur "Institution not supported"
- En sandbox : utilisez les institutions de test Plaid
- En production : vérifiez que la banque est supportée en France

### Link ne s'ouvre pas
- Vérifiez la console pour les erreurs
- Assurez-vous que le `link_token` est valide (expire après 30 minutes)

## 📚 Resources

- [Documentation Plaid](https://plaid.com/docs/)
- [Dashboard Plaid](https://dashboard.plaid.com/)
- [Sandbox Testing Guide](https://plaid.com/docs/sandbox/test-credentials/)
- [Plaid Launch Checklist](https://plaid.com/docs/launch-checklist/)

## ✨ Next Steps

1. **Maintenant** : Testez avec le sandbox
2. **Dans 2-4 semaines** : Passez en mode development avec vraies banques
3. **Quand validé** : Activez la production et facturez vos utilisateurs
4. **Dans 3-6 mois** : Migrez vers Linxo Connect si besoin de plus de couverture

Bonne chance avec votre intégration Plaid ! 🚀
