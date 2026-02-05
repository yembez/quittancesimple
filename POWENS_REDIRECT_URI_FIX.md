# ✅ Correction du Redirect URI Powens

## 🔴 Problème Rencontré

```
Error: Invalid 'redirect_uri', the parameter must match
the constraints defined in the administration console.
```

## 🎯 Cause

Le `redirect_uri` envoyé à Powens ne correspond pas à celui configuré dans votre console d'administration Powens.

## ✅ Solution Appliquée

### 1. Code Corrigé

**Fichier**: `src/services/bankAggregation/powensService.ts`

**Avant**:
```typescript
const redirectUri = isWebContainer
  ? 'https://app.quittancesimple.fr/dashboard'  // ❌ FAUX
  : `${window.location.origin}/dashboard`;       // ❌ FAUX
```

**Après**:
```typescript
const redirectUri = isWebContainer
  ? 'https://app.quittancesimple.fr/bank-sync'  // ✅ CORRECT
  : `${window.location.origin}/bank-sync`;       // ✅ CORRECT
```

### 2. URLs Utilisées par Environnement

| Environnement | Redirect URI |
|---------------|--------------|
| **Production** | `https://app.quittancesimple.fr/bank-sync` |
| **Dev Local** | `http://localhost:5173/bank-sync` |
| **WebContainer** | `https://app.quittancesimple.fr/bank-sync` |

## 🔧 Configuration Requise dans Powens

### Accès au Dashboard Powens

1. **Sandbox**: https://dashboard-sandbox.powens.com
2. **Production**: https://dashboard.powens.com

### Étapes de Configuration

#### Option A : Via l'interface web

1. Connectez-vous au dashboard Powens
2. Sélectionnez votre application
3. Allez dans **Settings** → **OAuth** ou **Redirect URIs**
4. Ajoutez ces URLs :
   ```
   https://app.quittancesimple.fr/bank-sync
   http://localhost:5173/bank-sync (pour dev)
   ```
5. **Sauvegardez** les modifications

#### Option B : Via l'API (si disponible)

Si Powens fournit une API de configuration :

```bash
curl -X POST https://api.powens.com/v1/oauth/redirect-uris \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "redirect_uris": [
      "https://app.quittancesimple.fr/bank-sync",
      "http://localhost:5173/bank-sync"
    ]
  }'
```

## ✅ Vérification

### 1. Vérifier la configuration Powens

Dans le dashboard Powens, vous devriez voir :

```
Redirect URIs configurés:
✓ https://app.quittancesimple.fr/bank-sync
✓ http://localhost:5173/bank-sync
```

### 2. Tester la connexion

1. Allez sur `/bank-sync`
2. Cliquez "Connecter ma banque"
3. Ouvrez la console browser (F12)
4. Vérifiez les logs :

```javascript
🔗 Redirect URI pour Powens: https://app.quittancesimple.fr/bank-sync
```

5. Vous devriez être redirigé vers Powens sans erreur

### 3. Logs attendus

**Dans la console browser** :
```
🔗 Redirect URI pour Powens: https://app.quittancesimple.fr/bank-sync
🚀 Creating Powens link token for user: xxx-xxx-xxx
```

**Dans Supabase Edge Function logs** :
```
🚀 Creating Powens link token for user: xxx-xxx-xxx
🔗 Redirect URI: https://app.quittancesimple.fr/bank-sync
✅ Webview URL generated: https://webview.powens.com/fr/connect?...
```

## 🐛 Troubleshooting

### Erreur persiste après configuration

1. **Vérifiez l'URL exacte** dans Powens (pas de trailing slash, bon protocole)
2. **Attendez 1-2 minutes** pour la propagation de la config
3. **Videz le cache** du navigateur (Ctrl+F5)
4. **Testez avec une navigation privée**

### Redirect URI différent en dev

Si vous développez en local avec une URL différente :

```typescript
// Dans powensService.ts, ajustez selon votre environnement
const redirectUri = `${window.location.origin}/bank-sync`;
console.log('🔗 Redirect URI:', redirectUri);
```

Puis ajoutez cette URL dans Powens dashboard.

### URL WebContainer dynamique

Les URLs WebContainer changent à chaque session. Options :

1. **Utiliser toujours production** (solution actuelle)
2. **Contact Powens** pour wildcards : `*.webcontainer-api.io/bank-sync`
3. **Tester uniquement en prod/local**

## 📝 Documentation Powens

Référence officielle pour configurer les redirect URIs :

- [Powens OAuth Documentation](https://docs.powens.com/authentication/oauth)
- [Integration Guide](https://docs.powens.com/guides/getting-started)
- [Support Powens](https://www.powens.com/contact)

## 🚀 Prochaines Étapes

Une fois la configuration Powens terminée :

1. ✅ Testez la connexion bancaire
2. ✅ Vérifiez que le status passe à 'active' en BDD
3. ✅ Consultez les logs dans `powens_callback_logs`
4. ✅ Configurez les règles de détection de paiement

## ✨ Résumé

- **Code corrigé** : `/bank-sync` au lieu de `/dashboard`
- **Action requise** : Configurer le redirect URI dans Powens dashboard
- **URLs à ajouter** : `https://app.quittancesimple.fr/bank-sync`
- **Test** : Une fois configuré, la connexion devrait fonctionner

---

**Need help?** Si l'erreur persiste après avoir configuré Powens, vérifiez :
1. L'URL exacte (protocole, domaine, path)
2. Pas de trailing slash (`/bank-sync` ✅ vs `/bank-sync/` ❌)
3. Les logs détaillés dans la console et Supabase
