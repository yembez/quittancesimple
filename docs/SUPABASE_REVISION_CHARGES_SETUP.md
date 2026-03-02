# Mise en place Supabase : révision des charges

Guide pas à pas pour activer la table, le cron et l’envoi d’emails de rappel « révision des charges ».

---

## Prérequis

- Un projet Supabase (celui de Quittance Simple)
- Supabase CLI installé sur ta machine (optionnel mais pratique) : https://supabase.com/docs/guides/cli
- Accès au **Dashboard Supabase** : https://app.supabase.com

---

## Étape 1 : Créer la table `charges_revision_reminders`

### Option A : Avec le Dashboard Supabase (sans CLI)

1. Ouvre ton projet sur **https://app.supabase.com**
2. Dans le menu de gauche, clique sur **SQL Editor**
3. Clique sur **New query**
4. Ouvre le fichier `supabase/migrations/20260210120000_create_charges_revision_reminders_table.sql` dans ton éditeur, **copie tout son contenu**
5. Colle-le dans l’éditeur SQL du Dashboard
6. Clique sur **Run** (ou Ctrl+Entrée)
7. Vérifie qu’il n’y a pas d’erreur en rouge ; tu dois voir un message du type « Success »

### Option B : Avec la CLI Supabase

Dans un terminal, à la racine du projet (dossier `quittancesimple`) :

```bash
# Se connecter au projet (si pas déjà fait)
supabase link --project-ref gqybhqvdxdycjhgvwzaz

# Appliquer les migrations en attente
supabase db push
```

---

## Étape 2 : Créer le cron pour les rappels révision des charges

### Option A : Avec le Dashboard

1. Toujours dans **SQL Editor**, **New query**
2. Ouvre `supabase/migrations/20260210130000_create_charges_revision_reminder_cron_job.sql`
3. **Copie tout le contenu** du fichier et colle-le dans une nouvelle requête SQL
4. Clique sur **Run**
5. Vérifie « Success »

> Si ton projet Supabase n’a pas `pg_cron` activé, tu peux avoir une erreur. Dans ce cas, va dans **Database → Extensions**, cherche **pg_cron** et active-la, puis réexécute le SQL du cron.

### Option B : Avec la CLI

Si tu as fait `supabase db push` à l’étape 1, cette migration est normalement déjà appliquée avec les autres. Sinon :

```bash
supabase db push
```

---

## Étape 3 : Déployer la fonction d’envoi d’email

La fonction `send-charges-revision-reminder-email` doit être déployée sur Supabase Edge Functions.

1. Ouvre un terminal à la racine du projet (`quittancesimple`)
2. Connecte-toi à Supabase (si besoin) :

   ```bash
   supabase login
   ```

3. Lie le projet (si ce n’est pas déjà fait) :

   ```bash
   supabase link --project-ref gqybhqvdxdycjhgvwzaz
   ```

   (Remplace `gqybhqvdxdycjhgvwzaz` par le **Reference ID** de ton projet : il est dans **Settings → General** du Dashboard.)

4. Déploie la fonction :

   ```bash
   supabase functions deploy send-charges-revision-reminder-email
   ```

5. Quand c’est demandé, confirme. À la fin tu dois voir un message du type « Deployed function send-charges-revision-reminder-email ».

---

## Étape 4 : Configurer les variables d’environnement de la fonction

Les edge functions utilisent des **secrets** pour les clés API.

1. Dans le Dashboard Supabase : **Edge Functions** (menu de gauche)
2. Clique sur **send-charges-revision-reminder-email**
3. Onglet **Settings** (ou **Secrets** selon l’interface)
4. Ajoute les variables suivantes :

| Nom            | Valeur                    | Obligatoire |
|----------------|---------------------------|-------------|
| `RESEND_API_KEY` | Ta clé API Resend         | Oui         |
| `SITE_URL`       | `https://www.quittancesimple.fr` (ou ton domaine) | Non (valeur par défaut dans le code) |

Pour ajouter un secret en CLI à la place :

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set SITE_URL=https://www.quittancesimple.fr
```

La fonction `send-irl-reminder-email` utilise déjà `RESEND_API_KEY` ; si c’est le même projet, la clé est souvent déjà définie pour toutes les functions.

---

## Étape 5 : Vérifier que tout fonctionne

1. **Table**  
   Dans **Table Editor**, tu dois voir la table **charges_revision_reminders**. Tu peux y insérer une ligne de test (proprietaire_id, reminder_date = aujourd’hui ou demain, status = `scheduled`).

2. **Cron**  
   Dans **Database → Cron Jobs** (ou **Extensions → pg_cron** selon la version), tu dois voir le job **send-charges-revision-reminder-emails-daily** avec la schedule `0 8 * * *`.

3. **Fonction**  
   Dans **Edge Functions**, **send-charges-revision-reminder-email** doit être listée et déployée.

4. **Test manuel de la fonction**  
   - Soit depuis l’onglet de la fonction dans le Dashboard : bouton **Invoke** avec un body `{}`.  
   - Soit en ligne de commande :

   ```bash
   curl -X POST "https://gqybhqvdxdycjhgvwzaz.supabase.co/functions/v1/send-charges-revision-reminder-email" \
     -H "Authorization: Bearer TON_ANON_OU_SERVICE_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

   Si aucun rappel n’a une `reminder_date` = aujourd’hui, la réponse sera du type : `No charges revision reminders to send today`. C’est normal.

---

## Récapitulatif

| Étape | Où | Action |
|-------|-----|--------|
| 1 | SQL Editor ou `supabase db push` | Exécuter la migration de la table `charges_revision_reminders` |
| 2 | SQL Editor ou `supabase db push` | Exécuter la migration du cron `send-charges-revision-reminder-emails-daily` |
| 3 | Terminal | `supabase functions deploy send-charges-revision-reminder-email` |
| 4 | Edge Functions → Settings / Secrets | Vérifier `RESEND_API_KEY` (et optionnellement `SITE_URL`) |
| 5 | Table Editor + Cron Jobs + Edge Functions | Vérifier table, cron et fonction |

Une fois ces étapes faites, chaque jour à 08:00 UTC le cron appellera la fonction, qui enverra un email aux propriétaires dont la date de rappel « révision des charges » est le jour même.
