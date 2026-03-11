# Quittances systématiques – Récapitulatif complet

Document de référence avant implémentation. Toute la logique et les choix décrits ci-dessous doivent être respectés lors du dev.

---

## 1. Objectif

Offrir un **mode d’envoi automatique avec préavis** :

- À la **date/heure programmée (J)** : on n’envoie pas la quittance tout de suite. On envoie un **e-mail au propriétaire** pour l’informer que la quittance partira automatiquement **dans 5 jours** s’il ne fait rien, avec 3 actions possibles.
- **5 jours plus tard (J+5)** : si le propriétaire n’a rien fait, la quittance est **envoyée automatiquement** au locataire, avec copie au bailleur.
- Toute action du propriétaire (annuler, relancer, ou envoi manuel) **annule l’envoi auto à J+5** pour ce mois. La programmation pour les mois suivants reste inchangée.

Nom de la fonctionnalité / code : **quittances_systematic**.

---

## 2. Modèle de données

### 2.1 Table `quittances_systematic`

Une ligne = une quittance programmée pour un locataire et une période (mois/année).

| Colonne | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK, généré |
| `locataire_id` | uuid | FK → locataires(id) |
| `proprietaire_id` | uuid | FK → proprietaires(id) |
| `periode` | text | Ex. "Mars 2026" ou "2026-03" (format à fixer) |
| `date_preavis` | timestamptz | Date/heure d’envoi du mail de préavis (J) |
| `date_envoi_auto` | timestamptz | Date/heure prévue d’envoi automatique (J+5) |
| `status` | text | Voir § 3 |
| `action_token_send_manual` | text | Token unique pour le CTA "Envoi manuel" (optionnel, généré à la demande) |
| `action_token_expires_at` | timestamptz | Expiration du token (ex. 30 jours) |
| `created_at` | timestamptz | Création |
| `updated_at` | timestamptz | Dernière mise à jour |

Contrainte d’unicité : une seule ligne par `(locataire_id, periode)` (ou par `(locataire_id, mois, annee)` selon le format de `periode`).

### 2.2 Lien avec les locataires

Les locataires concernés sont ceux pour lesquels on a activé le **mode "Envoi systématique avec préavis"** (à distinguer du mode actuel "Rappel SMS/email puis clic"). Il faut donc un champ sur `locataires`, par exemple :

- `mode_envoi_quittance` : `'rappel_ puis_clic'` (défaut actuel) ou `'systematic_preavis_5j'`

(Le nom exact peut être ajusté en dev.)

---

## 3. États (`status`) et règles

Valeurs possibles de `status` :

| Status | Signification |
|--------|----------------|
| `pending_owner_action` | Préavis (J) envoyé ; on attend une action du bailleur. À J+5, si toujours ce statut → envoi auto. |
| `cancelled` | Le bailleur a cliqué "Annuler l’envoi". Pas d’envoi à J+5. |
| `reminder_sent` | Le bailleur a cliqué "Relancer le locataire". Relance envoyée ; pas d’envoi auto à J+5. |
| `sent_manual` | Le bailleur a envoyé la quittance en manuel (CTA email ou espace). Pas d’envoi à J+5. |
| `sent_auto` | Le système a envoyé la quittance automatiquement à J+5. |

Règles :

- Dès que le statut passe en `cancelled`, `reminder_sent` ou `sent_manual`, **on ne fait plus d’envoi automatique à J+5** pour cette ligne.
- Chaque mois, une **nouvelle** ligne `quittances_systematic` est créée pour la période du mois (pas d’impact sur les mois suivants).

---

## 4. Flux à la date/heure programmée (J)

1. Le **cron** (ou la logique qui tourne à la date/heure du rappel) identifie les locataires pour lesquels :
   - la date/heure courante = date/heure programmée (`date_rappel`, `heure_rappel`, `minute_rappel`) ;
   - le mode est `systematic_preavis_5j` (ou équivalent).
2. Pour chaque tel locataire :
   - Créer une ligne dans `quittances_systematic` :
     - `status = 'pending_owner_action'`
     - `date_preavis = now()`
     - `date_envoi_auto = now() + 5 jours`
     - `periode` = période courante (mois en cours).
   - Envoyer au **propriétaire** l’**e-mail de préavis** (voir § 6.1) avec les 3 CTAs.

---

## 5. Flux à J+5 (envoi automatique)

1. Une tâche (cron ou autre) parcourt `quittances_systematic` :
   - `date_envoi_auto <= now()`
   - `status = 'pending_owner_action'`
2. Pour chaque ligne trouvée :
   - Appeler **send-quittance** (même logique qu’aujourd’hui : PDF, envoi au locataire, copie au bailleur).
   - Mettre `status = 'sent_auto'`.
3. Ne rien faire pour les lignes dont le statut est déjà `cancelled`, `reminder_sent`, `sent_manual` ou `sent_auto`.

---

## 6. E-mails et CTAs

**Règle très importante (nom du locataire)** :  
Dans **tous** les e-mails liés à `quittances_systematic` :
- le **nom du locataire** doit apparaître clairement dans le **corps** du message (ex. « pour votre locataire [Nom du locataire] ») ;
- le **nom du locataire** doit également être présent dans le **sujet** (objet) de l’e-mail, par exemple :  
  `Quittance prête pour [Nom du locataire] – [Période]`,  
  `Préavis : quittance pour [Nom du locataire] – [Période]`,  
  `Confirmation – Annulation de l’envoi auto pour [Nom du locataire] – [Période]`, etc.

### 6.1 E-mail de préavis (envoyé à J)

- **Destinataire** : propriétaire (bailleur).
- **Contenu** : la quittance pour [période] est prête pour **le locataire [Nom du locataire]** ; elle sera envoyée automatiquement au locataire **dans 5 jours** si vous ne faites rien.
- **3 CTAs** :
  1. **Annuler l’envoi** → appelle l’action `cancel` (voir § 7.1).
  2. **Relancer le locataire** → lien vers l’espace bailleur qui **ouvre le modal de relance** pour ce locataire (lettre pré-remplie ; l’envoi se fait quand le bailleur clique "Envoyer" dans le modal). Pas d’envoi direct depuis l’email.
  3. **Envoyer la quittance maintenant (manuel)** → lien avec token vers la page d’envoi manuel direct (voir § 8). Un clic = envoi immédiat (send-quittance) + page de confirmation.

### 6.2 E-mail de confirmation "Annuler l’envoi"

- Envoyé après clic sur "Annuler l’envoi".
- **Contenu** : l’envoi automatique de la quittance pour [période] a été annulé. Quand le locataire aura payé, vous pourrez envoyer la quittance en manuel.
- **CTA** : **Envoyer la quittance en manuel** (même lien token que § 8, un clic = envoi direct + page "C’est envoyé").

### 6.3 E-mail de confirmation "Relance envoyée"

- Envoyé après que le bailleur a envoyé la relance (depuis le modal).
- **Contenu** : la relance loyer impayé a été envoyée à votre locataire. L’envoi automatique de la quittance pour cette période a été annulé. Quand le paiement sera reçu, vous pourrez envoyer la quittance en manuel.
- **CTA** : **Envoyer la quittance en manuel** (même lien token, un clic = envoi direct + page de confirmation).

---

## 7. Actions des CTAs (côté backend)

### 7.1 Annuler l’envoi (`cancel`)

- Réception : par exemple `GET/POST` vers une Edge Function avec `action=cancel&id=<quittances_systematic.id>` (et éventuellement token de sécurité).
- Actions :
  - Mettre `status = 'cancelled'` pour cette ligne.
  - Envoyer l’e-mail de confirmation "Annuler l’envoi" (§ 6.2) avec le CTA "Envoyer la quittance en manuel".

### 7.2 Relancer le locataire (`remind`)

- **Depuis l’email** : le CTA ne déclenche **pas** l’envoi de la relance côté serveur. Il redirige vers l’**espace bailleur** avec un paramètre du type `openRelance=<locataire_id>` pour **ouvrir le modal de relance** (lettre pré-remplie). L’envoi de la relance reste celui qui existe déjà (clic "Envoyer" dans le modal).
- **Après** envoi effectif de la relance (depuis le modal) : le backend qui gère cet envoi doit aussi :
  - Mettre à jour la ligne `quittances_systematic` correspondante en `status = 'reminder_sent'`.
  - Envoyer l’e-mail de confirmation "Relance envoyée" (§ 6.3) avec le CTA "Envoyer la quittance en manuel".

(Comment identifier la ligne `quittances_systematic` depuis le modal relance : par ex. `locataire_id` + période courante, ou un identifiant passé en contexte.)

### 7.3 Envoyer la quittance maintenant (manuel) (`send_now`)

- Soit via le lien token (voir § 8), soit via un lien direct avec `action=send_now&id=...`.
- Actions :
  - Vérifier que le statut est encore `pending_owner_action` (ou `reminder_sent` si on autorise l’envoi manuel après relance).
  - Appeler **send-quittance** (locataire + période) → envoi au locataire + copie au bailleur.
  - Mettre `status = 'sent_manual'`.
  - Rediriger vers la **page de confirmation** : "Votre quittance a bien été envoyée à [Locataire]. Une copie vous a été adressée."

---

## 8. CTA "Envoyer la quittance en manuel" – un clic = envoi direct

- **Pas** de redirection vers l’espace bailleur pour recliquer. Un seul clic dans l’email = envoi.
- **Lien** : `https://www.quittancesimple.fr/send-quittance-manual?token=xxx`
  - `token` : token unique stocké (ex. dans `quittances_systematic.action_token_send_manual`), avec expiration (ex. 30 jours).
- **Comportement** :
  1. Ouverture de l’URL (GET).
  2. Côté serveur (Edge Function ou API appelée par la page) : validation du token, puis appel direct à **send-quittance** pour le locataire/période liés au token.
  3. Mise à jour `status = 'sent_manual'`, invalidation ou marquage du token comme utilisé.
  4. Affichage d’une **page de confirmation** : "Votre quittance a bien été envoyée à [Locataire]. Une copie vous a été adressée."
- Fonctionne **avec ou sans connexion** du bailleur : le token suffit pour autoriser l’action.

---

## 9. Récap des composants à développer

| # | Composant | Description |
|---|-----------|-------------|
| 1 | **Migration SQL** | Créer la table `quittances_systematic` ; ajouter sur `locataires` le champ de mode (ex. `mode_envoi_quittance` ou `envoi_systematique_preavis`). |
| 2 | **Cron / logique J** | À la date/heure programmée : créer les lignes `quittances_systematic` et envoyer l’e-mail de préavis (nouvelle Edge Function ou extension de `auto-send-quittances`). |
| 3 | **Cron / logique J+5** | Tâche qui, à chaque run, sélectionne les lignes avec `date_envoi_auto <= now()` et `status = 'pending_owner_action'`, appelle send-quittance, met `sent_auto`. |
| 4 | **Edge Function actions** | Une fonction (ex. `quittances-systematic-action`) pour `cancel` et `send_now` ; envoi des e-mails de confirmation avec CTA "Envoi manuel". |
| 5 | **E-mails** | Templates : préavis (J), confirmation annulation, confirmation relance. Tous avec les bons CTAs (liens vers actions ou page token). |
| 6 | **Page /send-quittance-manual** | Page publique (ou avec token) : GET avec token → déclenche send-quittance côté backend → affiche page "Quittance envoyée". Génération et stockage des tokens. |
| 7 | **Relance** | CTA "Relancer" dans l’email → lien vers espace bailleur avec `openRelance=<locataire_id>`. Côté front : ouvrir le modal de relance existant. Après envoi depuis le modal : mise à jour `quittances_systematic` + envoi e-mail de confirmation avec CTA envoi manuel. |
| 8 | **UI espace bailleur** | Dans la config du locataire (ex. modal "Paramétrer les rappels") : choix du mode "Rappel puis clic" vs "Envoi systématique avec préavis 5 jours". |

---

## 10. Points de vigilance

- **Idempotence** : ne pas envoyer deux fois la quittance pour la même période (vérifier le statut avant send-quittance, et avant création de ligne à J).
- **Token** : un token par ligne (ou par action) ; expiration et usage unique après envoi manuel.
- **Relance** : réutiliser le système de relance existant ; seule l’intégration avec `quittances_systematic` (statut + mail de confirmation) est à ajouter.
- **Période** : format unique (ex. "2026-03" ou "Mars 2026") dans toute la chaîne (table, e-mails, send-quittance).

---

Ce document sert de spec de référence pour l’implémentation. Toute ambiguïté en dev doit être résolue en restant cohérent avec ce récap.
