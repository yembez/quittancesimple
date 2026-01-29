# Configuration de l'envoi de courrier recommandé

Ce document explique le système d'envoi de courriers recommandés pour les lettres de révision de loyer.

## Version actuelle : Traitement manuel

Dans la version actuelle, les envois recommandés sont traités **manuellement par l'administrateur**. Ce système permet de démarrer le service sans dépendance à une API externe, tout en offrant une expérience utilisateur identique à un service automatisé.

## Services proposés

### 1. Recommandé électronique
- **Prix**: 6.90€ TTC
- **Délai**: 24-48h ouvrées
- **Avantages**: Rapide, preuve de dépôt et de réception électronique

### 2. Recommandé postal (La Poste)
- **Prix**: 12.90€ TTC
- **Délai**: 2-3 jours ouvrés
- **Avantages**: Courrier papier officiel via La Poste

## Flux utilisateur

1. **Calcul de révision** : L'utilisateur complète le formulaire de calcul de révision de loyer
2. **Choix du mode** : Il sélectionne le mode d'envoi (électronique ou postal)
3. **Saisie des coordonnées** : Il renseigne ses coordonnées et celles du locataire
4. **Paiement** : Il effectue le paiement sécurisé via Stripe
5. **Confirmation immédiate** : Il reçoit un email de confirmation avec la référence de sa demande

## Flux administrateur

### Email de notification

Lorsqu'un paiement est validé, l'administrateur (2speek@gmail.com) reçoit automatiquement un email détaillé contenant :

#### Informations de référence
- **ID de la demande** : Identifiant unique pour le suivi
- **Mode d'envoi** : Recommandé électronique (6.90€) ou Recommandé postal (12.90€)
- **ID paiement Stripe** : Preuve de paiement

#### Coordonnées expéditeur (Bailleur)
- Nom complet
- Adresse postale
- Email de contact

#### Coordonnées destinataire (Locataire)
- Nom complet
- Adresse postale complète

#### Détails de la révision
- Adresse du logement
- Date de signature du bail (si renseignée)
- Ancien loyer (hors charges)
- Nouveau loyer (hors charges)
- IRL ancien (trimestre et année)
- IRL nouveau (trimestre et année)

#### Document à envoyer
- Lien de téléchargement du PDF de la lettre

### Actions à effectuer

1. **Télécharger le PDF** : Cliquer sur le lien dans l'email
2. **Envoyer le courrier** :
   - Pour un envoi électronique : Utiliser un service comme AR24
   - Pour un envoi postal : Utiliser Maileva ou se rendre à La Poste
3. **Noter le numéro de suivi** : Conserver le numéro de tracking fourni
4. **Mettre à jour le statut** : Accéder à la base de données Supabase

### Mise à jour du statut dans Supabase

1. Se connecter à Supabase : https://supabase.com/dashboard
2. Aller dans "Table Editor" > "registered_mail_requests"
3. Trouver la demande par son ID
4. Mettre à jour les champs :
   - `status` : Passer de "pending" à "processing" puis "sent"
   - `tracking_number` : Renseigner le numéro de suivi
   - `processed_at` : Timestamp de l'envoi

## Email de confirmation utilisateur

L'utilisateur reçoit automatiquement un email de confirmation contenant :

- **Confirmation de paiement** : Validation du paiement
- **Référence de la demande** : Pour le suivi
- **Récapitulatif** : Résumé des informations
- **Suivi** : Étapes du processus (confirmation → traitement → envoi → réception)
- **Délai estimé** : Selon le mode d'envoi choisi

L'utilisateur sera notifié par un second email une fois que l'envoi aura été effectué et qu'un numéro de suivi sera disponible.

## Architecture technique

### Base de données

Table `registered_mail_requests` :
- `id` : UUID unique de la demande
- `proprietaire_id` : Référence vers le propriétaire
- `baillor_name` / `baillor_address` : Coordonnées expéditeur
- `locataire_name` / `locataire_address` : Coordonnées destinataire
- `logement_address` : Adresse du bien
- `ancien_loyer` / `nouveau_loyer` : Montants
- `irl_ancien` / `irl_nouveau` : Indices IRL
- `trimestre` / `annee_ancienne` / `annee_nouvelle` : Périodes de référence
- `date_bail` : Date de signature du bail
- `send_mode` : 'electronique' ou 'postal'
- `pdf_url` : Lien vers le document généré
- `stripe_payment_intent` : ID du paiement
- `status` : 'pending', 'processing', 'sent', 'failed'
- `tracking_number` : Numéro de suivi (rempli manuellement)
- `created_at` / `processed_at` : Horodatage

### Edge Functions

1. **stripe-webhook** :
   - Reçoit les webhooks Stripe
   - Crée la demande en base de données
   - Stocke le PDF généré
   - Déclenche les notifications

2. **send-registered-mail-admin-notification** :
   - Envoie l'email détaillé à l'administrateur
   - Contient toutes les informations nécessaires

3. **send-registered-mail-user-confirmation** :
   - Envoie l'email de confirmation à l'utilisateur
   - Récapitule la demande et le processus

### Flux de paiement complet

1. Utilisateur remplit le formulaire de révision
2. Générateur crée le HTML de la lettre
3. Stripe Checkout est créé avec toutes les métadonnées
4. Utilisateur paie via Stripe
5. Webhook Stripe reçoit la confirmation de paiement
6. Le PDF est uploadé sur Supabase Storage (bucket 'quittances')
7. La demande est créée dans `registered_mail_requests`
8. Email envoyé à l'administrateur avec tous les détails
9. Email de confirmation envoyé à l'utilisateur
10. Administrateur traite manuellement l'envoi
11. Administrateur met à jour le statut et le tracking
12. (Futur) Notification automatique à l'utilisateur avec le tracking

## Format de la lettre

La lettre générée suit le modèle officiel conforme à la législation française :

- **Layout** : Expéditeur à gauche, destinataire à droite avec la date
- **Date** : Format DD/MM/YYYY
- **Objet** : Révision annuelle du loyer
- **Référence légale** : Article 17-1 de la loi du 6 juillet 1989
- **Mention du bail** : Date de signature du contrat de bail
- **Formule de calcul** : Loyer précédent hors charges × Nouvel IRL / IRL précédent
- **IRL** : Indication des trimestres et années de référence
- **Nouveau loyer** : Montant calculé avec effet immédiat
- **Formule de politesse** : Salutations distinguées

## Évolution future (V2)

La version 2 intégrera des API tierces pour automatiser complètement le processus :

- **AR24** : Pour les envois électroniques
- **Maileva** : Pour les envois postaux

Cette automatisation permettra :
- Envoi instantané après paiement
- Tracking automatique
- Notification automatique de réception
- Archivage numérique des preuves

## Support

Pour toute question ou problème :
- Email administrateur : 2speek@gmail.com
- Dashboard Supabase : https://supabase.com/dashboard
- Dashboard Stripe : https://dashboard.stripe.com
