# Analyse : table proprietaires, campagnes J+2 et suivi des leads

## 1. Pourquoi il y a des `free_account` et des `NULL` dans les statuts ?

### Colonne `lead_statut` (table `proprietaires`)

La colonne `lead_statut` est **nullable** et peut prendre les valeurs suivantes (définies dans la migration `20260125204446_add_lead_statut_column_correct.sql`) :

| Valeur | Signification | Où c’est défini |
|--------|----------------|------------------|
| `free_quittance_pdf` | Lead a généré une quittance gratuite (email capté sur le générateur) | `send-quittance` (upsert après envoi de la quittance PDF) |
| `free_account` | Compte créé via /inscription (accès FreeDashboard) | `FreeSignup.tsx` |
| `QA_1st_interested` | A cliqué « Souscrire » mais n’a pas encore payé | `LoginModal`, `PackActivationFlow` |
| `QA_payment_incomplete` | Session Stripe ouverte mais non finalisée | `stripe-checkout` |
| `QA_paid_subscriber` / `QA_paying_customer` | Paiement confirmé | `checkout-success`, `stripe-webhook`, etc. |
| `cancelled` | Abonnement résilié | `stripe-webhook` |
| **`NULL`** | Jamais défini | Anciens enregistrements, ou parcours qui ne mettent pas à jour le statut |

Donc :

- **NULL** = le propriétaire n’a jamais eu de mise à jour de `lead_statut` (ancien flux, ou seulement passage par un formulaire qui ne set pas ce champ).
- **free_account** = inscription explicite via la page /inscription (création de compte).
- **free_quittance_pdf** = génération d’une quittance gratuite ; l’email est enregistré/upserté dans `proprietaires` avec ce statut dans `send-quittance/index.ts` (ligne 493).

### Pourquoi la campagne J+2 envoie à des `free_account` et des `NULL` ?

Pour la campagne **J+2**, le segment utilisé dans `admin-trigger-campaign` est **`free_leads`**. La requête est :

```ts
// J+2 (segment "free_leads")
query = query.gte("nombre_quittances", 1).is("campaign_j2_sent_at", null);
```

Il n’y a **aucun filtre sur `lead_statut`** pour J+2. Donc sont ciblés **tous** les propriétaires qui :

- ont au moins 1 quittance (`nombre_quittances >= 1`),
- n’ont pas encore reçu le J+2 (`campaign_j2_sent_at` IS NULL),
- et qui passent les autres filtres (email valide, pas désabonné, etc.).

Résultat : des lignes avec `lead_statut` = **NULL**, **free_account** ou **free_quittance_pdf** reçoivent le J+2. D’où le mélange que tu vois dans les statuts.

En revanche, pour **J+5** et **J+8** le code filtre bien sur `lead_statut` :

```ts
// J+5 / J+8
query = query.eq("lead_statut", "free_quittance_pdf").is("campaign_j5_sent_at", null);
// ou campaign_j8_sent_at
```

Donc J+2 est plus large que J+5/J+8 par conception actuelle.

---

## 2. QA_1st_interested et welcome_email_sent_at : pourquoi NULL ?

### Distinguer les leads qui ont créé leur espace + essai gratuit

Les leads avec **`lead_statut = 'QA_1st_interested'`** sont bien ceux qui ont **créé leur espace et activé l'essai gratuit** (Pack Automatique). Ce statut est défini uniquement dans :

- **PackActivationFlow** : à la fin du flow d’activation (upsert `proprietaires` avec `lead_statut: 'QA_1st_interested'`, puis appel à `send-welcome-email`).
- **LoginModal** : lors de la création de compte depuis la modale (même schéma : upsert puis `send-welcome-email`).

Donc en base, **QA_1st_interested = a créé son espace + essai gratuit aujourd’hui** (ou à une date passée, sans avoir encore payé).

### Pourquoi `welcome_email_sent_at` est NULL pour certains QA_1st_interested ?

La colonne **`welcome_email_sent_at`** (table `proprietaires`) est renseignée **uniquement** dans l’Edge Function **`send-welcome-email`**, et seulement **après** un envoi réussi vers Resend. Si elle reste NULL pour des `QA_1st_interested`, les causes possibles sont :

1. **Envoi welcome email en échec**  
   Si Resend renvoie une erreur (quota, domaine, etc.), la fonction ne va pas jusqu’à l’`UPDATE`. Donc `welcome_email_sent_at` n’est jamais mis à jour, même si le lead est bien en `QA_1st_interested`.

2. **Mise à jour en base qui ne trouvait pas la ligne**  
   L’update se faisait auparavant en `.eq("email", email.trim())`. En PostgreSQL, la comparaison de chaînes est **sensible à la casse**. Si l’email en base était `Jean@Mail.com` et que la fonction recevait `jean@mail.com`, l’update affectait 0 lignes → `welcome_email_sent_at` restait NULL.  
   **Correctif appliqué** : dans `send-welcome-email`, on cherche d’abord le propriétaire par `.ilike("email", emailTrim)` puis on met à jour par `id`, ce qui rend la mise à jour insensible à la casse.

3. **Données historiques**  
   Les comptes créés **avant** l’ajout de la colonne `welcome_email_sent_at` (migration `20260221100000`) ou **avant** que la fonction n’écrive cette colonne n’ont jamais eu de mise à jour. Ils restent donc NULL même si un welcome avait été envoyé à l’époque.

4. **Appel non effectué ou échoué côté client**  
   L’appel à `send-welcome-email` est en `try/catch` et marqué « non bloquant » dans PackActivationFlow et LoginModal. En cas d’erreur réseau ou de timeout, l’email peut ne jamais être envoyé et la colonne jamais remplie.

En résumé : **NULL ne signifie pas forcément « n’a pas reçu le welcome »** ; ça peut être un échec d’envoi, un update qui ne matchait pas (casse), ou des données anciennes. Pour les **nouveaux** comptes, avec le correctif (recherche par `ilike` + update par `id`), tout envoi welcome réussi devrait bien remplir `welcome_email_sent_at`.

---

## 3. Pourquoi les leads « ré-apparaissent » dans la base ?

Les leads ne « ré-apparaissent » pas au sens où des lignes seraient recréées. Ce qui se passe :

1. **Admin Analytics** charge **tous** les enregistrements de la table `proprietaires` (sans filtre par statut ou campagne), puis les segmente (hot / warm / cold / inactive) côté front. Donc **tous les propriétaires restent visibles** dans la liste.

2. Quand tu lances un envoi J+2 (ex. 49 mails) :
   - les 49 destinataires reçoivent l’email ;
   - pour chacun, on met à jour `campaign_j2_sent_at` sur sa ligne `proprietaires` (dans `admin-trigger-campaign` après envoi réussi).
   - Ces 49 lignes restent dans la table ; elles ne disparaissent pas, elles ont simplement `campaign_j2_sent_at` renseigné.

3. Ce que tu vois comme « ré-apparition » peut venir de :
   - **La liste affichée** : c’est la liste de **tous** les leads ; ceux qui ont reçu le J+2 apparaissent toujours, mais dans la section « Destinataires ayant reçu les e-mails » (filtrés par `campaign_j2_sent_at` non null), pas dans les « à envoyer ».
   - **Un problème d’UPDATE** : si pour une partie des 49 l’`id` n’était pas correctement pris en compte (ex. type UUID vs number), `campaign_j2_sent_at` n’aurait pas été mis à jour pour ces lignes, qui continueraient donc à apparaître comme « à envoyer » au prochain envoi. Le correctif sur les UUID dans `admin-trigger-campaign` (sentIds en `(string | number)[]` et push de `r.id`) est là pour éviter ça.

En résumé : ce n’est pas l’envoi qui « fait remonter » les leads ; ils sont déjà dans la base. L’envoi met à jour `campaign_j2_sent_at` pour ne plus les renvoyer en J+2. Si certains semblent encore à envoyer, vérifier en base que leurs `campaign_j2_sent_at` sont bien remplis après l’envoi.

---

## 4. 0 clic sur le CTA – peut-on savoir si l’email J+2 a été ouvert ?

### Clics (déjà en place)

- Les clics sur le CTA sont enregistrés via l’URL de tracking (`track-cta-click`) et la table `campaign_cta_clicks`.
- 0 clic = personne n’a cliqué sur le lien CTA (ou le lien n’était pas celui tracké).

### Ouvertures (opens)

- **Actuellement** : il n’y a **aucun** suivi des ouvertures d’emails dans le projet (pas de webhook Resend, pas de table dédiée).
- **Côté Resend** : l’événement **`email.opened`** existe. Resend envoie un webhook quand le destinataire ouvre l’email (avec suivi des ouvertures activé sur le domaine).
- **Pour savoir si le J+2 a été ouvert**, il faut :
  1. Activer le suivi des ouvertures sur ton domaine dans Resend (Dashboard → Domains).
  2. Créer un webhook Resend qui pointe vers une URL de ton backend (ex. une Edge Function Supabase).
  3. Dans cette Edge Function : recevoir les événements `email.opened` (et éventuellement `email.delivered`, `email.clicked`), identifier l’email/campagne (via metadata ou headers envoyés à Resend), puis enregistrer en base (ex. table `campaign_opens` ou colonnes sur `proprietaires`).

En l’état, **sans webhook Resend configuré, on ne peut pas savoir si l’email J+2 a été ouvert**.

---

## 5. Recommandations

### Aligner J+2 avec J+5/J+8 (appliqué)

Le segment J+2 a été aligné sur J+5/J+8 : **seuls les leads avec `lead_statut = 'free_quittance_pdf'`** sont désormais ciblés pour le J+2 (en plus de `nombre_quittances >= 1` et `campaign_j2_sent_at` IS NULL). Les `free_account` et les `NULL` ne recevront plus le J+2. Modifié dans `admin-trigger-campaign/index.ts`.

### Mettre en place le suivi des ouvertures

- Créer une Edge Function (ex. `resend-webhook`) qui :
  - reçoit les webhooks Resend ;
  - filtre sur `type === 'email.opened'` (et optionnellement `email.delivered` / `email.clicked`) ;
  - associe l’événement à un destinataire / une campagne (metadata ou identifiant dans l’email) ;
  - écrit dans une table (ex. `campaign_opens` : `email`, `campaign_key`, `opened_at`).
- Dans le dashboard Resend : configurer l’URL de cette fonction comme endpoint de webhook et cocher `email.opened` (et les autres événements utiles).
- Dans l’admin (Analytics ou autre), afficher le nombre d’ouvertures par campagne (J+2, J+5, J+8) en plus des clics.

Si tu veux, on peut détailler le schéma de la table et le code de la Edge Function `resend-webhook` en pas à pas (payload Resend, vérification de signature, écriture en base).
