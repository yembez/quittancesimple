# Vercel Analytics - Guide Simple

## ✅ C'est déjà configuré !

Vercel Analytics est déjà installé et configuré sur ton site. Rien d'autre à faire dans le code.

## 📊 Comment voir tes statistiques ?

### 1. Va sur ton Dashboard Vercel

1. Connecte-toi sur [vercel.com](https://vercel.com)
2. Sélectionne ton projet
3. Clique sur l'onglet **"Analytics"** dans le menu

### 2. Ce que tu vas voir

Une interface simple et claire avec :

- **📈 Visites totales** - Combien de personnes visitent ton site
- **📍 Pages populaires** - Quelles pages sont les plus visitées
- **🌍 Pays** - D'où viennent tes visiteurs
- **📱 Appareils** - Mobile, tablette ou desktop
- **🌐 Navigateurs** - Chrome, Safari, Firefox, etc.
- **📉 Graphiques** - Évolution dans le temps

### 3. C'est en temps réel

Les stats se mettent à jour automatiquement. Tu verras les visiteurs qui arrivent sur ton site en direct.

## 💰 Prix

- **GRATUIT** jusqu'à 2 500 événements/mois
- Pour un petit site, c'est largement suffisant
- Si tu dépasses, Vercel te proposera un plan payant (mais tu seras prévenu)

## 🔒 Conformité CNIL

✅ **Pas de bandeau cookies nécessaire** car :
- Aucun cookie déposé
- IP anonymisées automatiquement
- Pas de publicité
- Pas de vente de données
- Conforme RGPD

La politique de confidentialité a été mise à jour automatiquement.

## 🎯 C'est tout !

Tu n'as rien d'autre à faire. Les statistiques s'accumulent automatiquement dès que des gens visitent ton site.

## 💡 Astuces

### Voir les performances de ton site
Dans Vercel Dashboard → **Speed Insights**, tu peux aussi activer les métriques de performance (vitesse de chargement, etc.)

### Évènements personnalisés (Optionnel)
Si tu veux tracker des actions spécifiques (clics sur des boutons, soumissions de formulaires), tu peux utiliser :

```typescript
import { track } from '@vercel/analytics';

// Dans ton code
track('button_click', { button_name: 'generate_pdf' });
```

Mais ce n'est pas nécessaire pour les statistiques de base.

## ❓ Questions fréquentes

**Q: Je ne vois pas de stats dans Vercel ?**
R: Il faut attendre que le site soit déployé sur Vercel et que des visiteurs arrivent.

**Q: C'est vraiment gratuit ?**
R: Oui, jusqu'à 2 500 événements/mois (= environ 2 500 pages vues).

**Q: Dois-je activer quelque chose dans Vercel ?**
R: Non, dès que ton site est déployé sur Vercel, Analytics fonctionne automatiquement.

**Q: Les stats marchent en local (localhost) ?**
R: Non, seulement sur ton site en production (déployé).

## 📚 Ressources

- [Documentation Vercel Analytics](https://vercel.com/docs/analytics)
- [Politique de confidentialité Vercel](https://vercel.com/legal/privacy-policy)
