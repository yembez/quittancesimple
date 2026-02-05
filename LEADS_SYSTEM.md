# Système de Gestion des Leads - Quittance Connectée+

## Vue d'ensemble

Le système de gestion des leads permet de capturer l'intérêt des utilisateurs (existants ou nouveaux) pour les nouveaux produits comme "Quittance Connectée+".

## Architecture

### Table: `interested_users_v2`

Cette table centralise tous les leads intéressés par les nouveaux produits.

**Colonnes:**
- `id` (uuid) - Identifiant unique
- `email` (text, unique) - Email du lead
- `source` (text) - Page d'origine (ex: 'automation', 'home', etc.)
- `notified` (boolean) - Si le lead a été notifié du lancement
- `proprietaire_id` (uuid, nullable) - Lien vers un compte proprietaire existant
- `product_interest` (text) - Produit qui intéresse le lead (ex: 'quittance_connectee_plus')
- `created_at` (timestamp) - Date de création

### Fonctionnement

#### Pour les nouveaux utilisateurs:
1. L'utilisateur clique sur "Me tenir informé" sur la page Automation
2. Il entre son email dans le modal
3. Le système vérifie si cet email existe déjà dans la table `proprietaires`
4. Si non trouvé, le lead est créé avec `proprietaire_id = NULL`
5. Un message de confirmation s'affiche

#### Pour les utilisateurs existants:
1. L'utilisateur clique sur "Me tenir informé"
2. Il entre son email
3. Le système trouve son compte dans `proprietaires`
4. Le lead est créé avec le lien vers son compte (`proprietaire_id` renseigné)
5. Un message de confirmation s'affiche

### Avantages

1. **Segmentation précise**: On peut différencier les leads nouveaux des clients existants
2. **Marketing ciblé**: Possibilité d'envoyer des messages différents selon le statut
3. **Conversion tracking**: Suivi du parcours depuis l'intérêt jusqu'à l'achat
4. **Évite les doublons**: L'email est unique, pas de duplication possible

### Utilisation des données

Les leads capturés peuvent être utilisés pour:
- Envoyer une notification de lancement du produit
- Proposer une offre early-bird aux premiers intéressés
- Analyser l'intérêt par segment (nouveaux vs existants)
- Prioriser les fonctionnalités selon la demande

### Exemple de requête

```sql
-- Tous les leads intéressés par Quittance Connectée+
SELECT
  iu.*,
  p.nom,
  p.prenom,
  CASE
    WHEN iu.proprietaire_id IS NOT NULL THEN 'Client existant'
    ELSE 'Nouveau prospect'
  END as type_lead
FROM interested_users_v2 iu
LEFT JOIN proprietaires p ON iu.proprietaire_id = p.id
WHERE iu.product_interest = 'quittance_connectee_plus'
  AND iu.notified = false
ORDER BY iu.created_at DESC;
```

## Pages concernées

- `/automation` - Bloc "Quittance Connectée+" avec bouton "Me tenir informé"

## Composants

- `NotifyMeModal.tsx` - Modal de capture des emails
- Component utilisé avec prop `sourcePage` pour tracker l'origine

## Prochaines étapes

1. Créer un edge function pour envoyer les notifications de lancement
2. Créer un dashboard admin pour voir les leads
3. Ajouter un système de tags pour segmenter davantage
