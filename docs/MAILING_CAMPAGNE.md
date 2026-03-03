# Campagne de mailing et tunnel d’acquisition

Ce document décrit comment récupérer les e-mails valides pour une campagne, quels segments cibler, et comment automatiser les envois après chaque nouveau lead (quittance gratuite).

---

## 1. E-mails exclus (tests)

Sont **toujours exclus** des listes d’envoi :

- Tous les e-mails dont le domaine est **`@maildrop.cc`**
- Les 3 adresses de test :  
  `leachainais@gmail.com`, `gillesalze@gmail.com`, `2speek@gmail.com`

Tous les autres e-mails de la table `proprietaires` sont considérés comme valides pour le mailing.

---

## 2. Récupérer la liste d’e-mails valides

### Option A : Fonction Edge `get-mailing-list` (recommandé)

Une fonction Supabase retourne les propriétaires valides (après exclusions), avec possibilité de segmenter.

**Prérequis**

- Définir dans Supabase (Edge Functions → Secrets) une variable **`MAILING_LIST_SECRET`** (mot de passe ou token de ton choix).

**Appels**

- **Tous les e-mails valides**  
  `GET https://<PROJECT_REF>.supabase.co/functions/v1/get-mailing-list`  
  Header : `X-Mailing-List-Secret: <TA_SECRET>` ou `Authorization: Bearer <TA_SECRET>`

- **Uniquement les leads « quittance gratuite »** (à cibler en priorité)  
  `GET .../get-mailing-list?segment=leads`

- **Export CSV**  
  `GET .../get-mailing-list?format=csv`  
  ou `?segment=leads&format=csv`

**Segments disponibles**

| `segment` | Signification |
|-----------|----------------|
| `all`    | Tous les propriétaires (hors e-mails test) |
| `leads`  | `lead_statut = 'free_quittance_pdf'` — ont généré une quittance gratuite |
| `trial`  | `lead_statut = 'QA_1st_interested'` — ont créé un compte / essai |
| `paid`   | Abonnés payants |

Exemple (remplace `<PROJECT_REF>` et `<TA_SECRET>`) :

```bash
curl -H "X-Mailing-List-Secret: TA_SECRET" \
  "https://PROJECT_REF.supabase.co/functions/v1/get-mailing-list?segment=leads&format=csv" \
  -o mailing-leads.csv
```

### Option B : Requête SQL dans le dashboard Supabase

Dans **SQL Editor** :

```sql
-- Tous les e-mails valides (hors tests)
SELECT id, email, nom, prenom, lead_statut, created_at
FROM proprietaires
WHERE email IS NOT NULL
  AND email NOT ILIKE '%@maildrop.cc'
  AND LOWER(TRIM(email)) NOT IN (
    'leachainais@gmail.com',
    'gillesalze@gmail.com',
    '2speek@gmail.com'
  )
ORDER BY created_at DESC;
```

Pour **uniquement les leads quittance gratuite** :

```sql
SELECT id, email, nom, prenom, lead_statut, created_at
FROM proprietaires
WHERE email IS NOT NULL
  AND email NOT ILIKE '%@maildrop.cc'
  AND LOWER(TRIM(email)) NOT IN (
    'leachainais@gmail.com', 'gillesalze@gmail.com', '2speek@gmail.com'
  )
  AND lead_statut = 'free_quittance_pdf'
ORDER BY created_at DESC;
```

Tu peux exporter le résultat en CSV depuis l’interface Supabase.

---

## 3. Identifier les leads « quittance gratuite »

Ce sont les personnes qui ont utilisé le **formulaire gratuit** (générateur de quittance) et dont l’e-mail a été enregistré.

- **En base** : table `proprietaires`, colonne **`lead_statut`**.
  - `free_quittance_pdf` = a généré une quittance gratuite (et a reçu le PDF par e-mail).
- **Mise à jour** : ce statut est positionné par la fonction **`send-quittance`** lors de l’envoi de la quittance gratuite (upsert sur `proprietaires` avec `lead_statut = 'free_quittance_pdf'`).

Pour une campagne dédiée « tunnel d’acquisition », utilise le segment **`segment=leads`** (ou la requête SQL avec `lead_statut = 'free_quittance_pdf'`).

---

## 4. Déclencher des e-mails automatiquement après chaque nouveau lead

Aujourd’hui, lorsqu’un utilisateur génère une quittance gratuite :

1. Le formulaire appelle **`send-quittance`**.
2. `send-quittance` envoie le PDF au bailleur (et au locataire si applicable) et fait un **upsert** dans `proprietaires` avec `lead_statut = 'free_quittance_pdf'`.

Pour **automatiser une campagne** après chaque nouveau lead, deux approches possibles :

### A. Envoi immédiat (ou différé) depuis `send-quittance`

- Dans **`send-quittance`**, après l’upsert du propriétaire avec `lead_statut = 'free_quittance_pdf'`, appeler une autre Edge Function dédiée (ex. `send-lead-nurture-email`) avec l’e-mail, le prénom, etc.
- Cette fonction peut :
  - soit envoyer tout de suite un e-mail de relance (ex. « Découvrez l’Espace Bailleur, essai 30 jours »),
  - soit enregistrer le lead dans une table « file d’attente de campagne » pour un envoi plus tard (cron).

### B. Cron + file d’attente

- Une table (ex. `mailing_queue` ou `lead_nurture_queue`) avec : `proprietaire_id`, `email`, `step`, `scheduled_at`, `sent_at`.
- Un **cron** (Supabase pg_cron ou Edge Function planifiée) qui :
  - sélectionne les lignes avec `scheduled_at <= now()` et `sent_at IS NULL`,
  - envoie l’e-mail correspondant au `step`,
  - met à jour `sent_at` (et éventuellement `step` pour la prochaine étape).

Dans les deux cas, il faut une (ou plusieurs) Edge Function d’envoi qui utilisent ta charte e-mail (template existant) et Resend.

---

## 5. Stratégie de campagne (conversion lead → essai → abonnement)

Ordre logique recommandé :

1. **Cibler en priorité** les `lead_statut = 'free_quittance_pdf'` (segment **leads**).
2. **Séquence d’e-mails** (exemples) :
   - J0 : e-mail de bienvenue / rappel « Vous avez généré votre quittance — découvrez l’Espace Bailleur, essai 30 j » (déjà partiellement couvert par l’e-mail actuel après génération).
   - J+3 ou J+7 : rappel bienveillant (avantages Pack Automatique, lien vers inscription ou tarifs).
   - J+14 : dernière relance avant fin de séquence (offre, témoignage, CTA clair).
3. **Ne pas (ou plus) relancer** les `lead_statut` déjà en `QA_1st_interested` (essai) ou `QA_paid_subscriber` / `QA_paying_customer` (payants), sauf pour des campagnes distinctes (ex. fidélisation).

Pour implémenter ça proprement :

- Utiliser **`get-mailing-list?segment=leads`** pour exporter ou alimenter ton outil d’envoi.
- Soit intégrer un outil (Brevo, Mailchimp, etc.) avec API : à chaque nouvel enregistrement `free_quittance_pdf`, appeler l’API pour ajouter le contact à une liste « Leads quittance gratuite » et laisser l’outil gérer la séquence.
- Soit tout faire côté Supabase : file d’attente + Edge Functions d’envoi + cron, comme décrit au §4.

---

## 6. Résumé des actions

| Action | Comment |
|--------|--------|
| Exporter tous les e-mails valides | `get-mailing-list` sans `segment` ou avec `segment=all`, ou requête SQL §2 Option B. |
| Exporter uniquement les leads quittance gratuite | `get-mailing-list?segment=leads` ou SQL avec `lead_statut = 'free_quittance_pdf'`. |
| Préparer un envoi groupé (campagne manuelle) | Appeler la fonction avec `format=csv` et importer le CSV dans ton outil d’e-mailing. |
| Déclencher un e-mail après chaque nouveau lead | Adapter `send-quittance` pour appeler une fonction d’envoi dédiée, ou insérer dans une table + cron. |
| Stratégie lead → essai → abonnement | Cibler le segment `leads`, puis séquence d’e-mails (J0, J+3/7, J+14) et ne plus pousser les déjà en essai/payant sur cette séquence. |

Une fois **`MAILING_LIST_SECRET`** configuré et la fonction **`get-mailing-list`** déployée, tu peux utiliser les appels décrits ci-dessus pour préparer et cibler tes campagnes.

---

## 7. Envoi groupé décalé (Resend gratuit)

Pour envoyer un même e-mail à tous les contacts valides **sans surcharger Resend** (offre gratuite : **100 e-mails/jour**, **2 requêtes/seconde**), utilise la fonction **`send-bulk-mailing`**.

### Limites Resend (gratuit)

- **100 e-mails / jour** (transactionnel)
- **2 requêtes / seconde** → la fonction décale chaque envoi (défaut 800 ms entre chaque)

### Déploiement

```bash
supabase functions deploy send-bulk-mailing
```

### Appel (POST)

**URL :** `POST https://<PROJECT_REF>.supabase.co/functions/v1/send-bulk-mailing`  
**Header :** `X-Mailing-List-Secret: <TA_SECRET>` (ou `Authorization: Bearer <TA_SECRET>`)

**Body (JSON) :**

| Champ      | Type   | Obligatoire | Description |
|-----------|--------|-------------|-------------|
| `subject` | string | oui         | Objet de l’e-mail |
| `bodyHtml`| string | oui         | Corps HTML (charte commune). Utiliser `{{ prenom }}` pour personnaliser. |
| `ctaText` | string | non         | Texte du bouton CTA |
| `ctaUrl`  | string | non         | URL du bouton CTA |
| `limit`   | number | non         | Nombre max d’e-mails dans cette exécution (défaut **100** pour rester sous le quota gratuit/jour) |
| `offset`  | number | non         | Décalage dans la liste (0 = début). À réutiliser pour la « suite » le lendemain. |
| `delayMs` | number | non         | Délai en ms entre chaque envoi (défaut **800** pour &lt; 2 req/s) |
| `segment` | string | non         | `all` (défaut) ou `leads` |
| `testEmails` | string[] | non  | **Envoi test** : envoie uniquement à ces adresses (max 5). Aucun envoi à la liste BDD. Idéal pour prévisualiser le mail avant de lancer la campagne. |

### Envoi test (prévisualiser avant de déclencher la campagne)

Pour **voir le mail** dans ta boîte avant d’envoyer à toute la liste : appelle la même fonction avec **`testEmails`** rempli (une ou plusieurs adresses, ex. la tienne). Aucun envoi à la base, uniquement aux adresses indiquées. Le prénom affiché dans le corps sera « Prénom » (ou utilise `{{ prenom }}` dans le body pour le remplacer).

**Exemple – premier e-mail de campagne (contenu prêt à l’emploi) :**

Sujet : `Votre accès à l'Espace Bailleur 2026 est ouvert 🗝️`

Corps (à passer en `bodyHtml`, avec `[Prénom]` ou `{{ prenom }}` pour la personnalisation) :

```html
<p>Bonjour {{ prenom }},</p>
<p>Vous avez utilisé notre générateur de quittances par le passé et je vous en remercie.</p>
<p>Aujourd'hui, on passe à la vitesse supérieure. On vous donne l'accès à votre espace Espace Bailleur - QS : une plateforme complète pour automatiser votre gestion (Quittances en 3s, Annonces IA, Signature de bail conforme et simplifiée, Révision de loyer...).</p>
<p>Pour vous remercier d'avoir été parmi nos premiers utilisateurs, votre compte « Essai Gratuit » est déjà pré-configuré.</p>
```

Bouton CTA : **Découvrir mon nouvel espace** → `https://www.quittancesimple.fr/`

**Commande curl pour recevoir un mail de test sur ton adresse :**

```bash
curl -X POST "https://TON_PROJECT.supabase.co/functions/v1/send-bulk-mailing" \
  -H "Content-Type: application/json" \
  -H "X-Mailing-List-Secret: TA_SECRET" \
  -d '{
    "subject": "Votre accès à l'\''Espace Bailleur 2026 est ouvert 🗝️",
    "bodyHtml": "<p>Bonjour {{ prenom }},</p><p>Vous avez utilisé notre générateur de quittances par le passé et je vous en remercie.</p><p>Aujourd'\''hui, on passe à la vitesse supérieure. On vous donne l'\''accès à votre espace Espace Bailleur - QS : une plateforme complète pour automatiser votre gestion (Quittances en 3s, Annonces IA, Signature de bail conforme et simplifiée, Révision de loyer...).</p><p>Pour vous remercier d'\''avoir été parmi nos premiers utilisateurs, votre compte « Essai Gratuit » est déjà pré-configuré.</p>",
    "ctaText": "Découvrir mon nouvel espace",
    "ctaUrl": "https://www.quittancesimple.fr/",
    "testEmails": ["ton-email@exemple.fr"]
  }'
```

Remplace `ton-email@exemple.fr` par ton adresse (et `TON_PROJECT` / `TA_SECRET`). Tu recevras un seul e-mail avec le rendu réel. Quand tu es ok, relance **sans** `testEmails` et avec `limit` / `offset` pour l’envoi programmé.

---

**Exemple (jour 1 – envoi des 100 premiers) :**

```bash
curl -X POST "https://TON_PROJECT.supabase.co/functions/v1/send-bulk-mailing" \
  -H "Content-Type: application/json" \
  -H "X-Mailing-List-Secret: TA_SECRET" \
  -d '{
    "subject": "Découvrez l’Espace Bailleur — 30 jours gratuits",
    "bodyHtml": "<p>Bonjour {{ prenom }},</p><p>Vous avez déjà utilisé notre générateur de quittance. Pour automatiser vos envois et gagner du temps, essayez l’Espace Bailleur pendant 30 jours.</p>",
    "ctaText": "Activer mon essai gratuit",
    "ctaUrl": "https://www.quittancesimple.fr/",
    "limit": 100,
    "offset": 0
  }'
```

**Exemple (jour 2 – e-mails 101 à 200) :**

```bash
# Même body en changeant uniquement "offset": 100
```

**Exemple (jour 3 – e-mails 201 à 291) :**

```bash
# "offset": 200, "limit": 100 (il n’en restera que 91 à envoyer)
```

La réponse indique `sent`, `failed`, `nextOffset` et un message pour la prochaine exécution.

### Prévisualiser avant d’envoyer (e-mails test)

Pour **voir le rendu du mail** sans lancer la campagne, envoie un ou plusieurs e-mails de test à tes propres adresses.

Dans le body JSON, ajoute **`testEmails`** (tableau d’adresses, max 5) :

```json
{
  "subject": "Votre accès à l'Espace Bailleur 2026 est ouvert 🗝️",
  "bodyHtml": "<p>Bonjour {{ prenom }},</p><p>...</p>",
  "ctaText": "Découvrir mon nouvel espace",
  "ctaUrl": "https://www.quittancesimple.fr/",
  "testEmails": ["ton@email.com"]
}
```

- La fonction **n’utilise pas** la liste en base : elle envoie **uniquement** aux adresses de `testEmails`.
- Le prénom affiché dans le mail sera **« Prénom »** (pour simuler le rendu).
- Tu reçois le mail tel qu’il sera envoyé en campagne. Une fois satisfait, **retire** `testEmails` du body et utilise `limit` / `offset` pour lancer l’envoi réel.

Un exemple complet pour le premier e-mail de campagne est dans **`docs/mailing-preview-premier-email.json`** : remplace `VOTRE_EMAIL_ICI@exemple.com` par ton adresse, puis appelle la fonction avec ce body pour recevoir le mail de test.
