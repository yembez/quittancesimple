# Anti-doublons — campagne `trial_auto_incomplete_lt20`

## Pourquoi un destinataire a pu recevoir plusieurs fois

Le segment `trial_auto_incomplete_lt20` est envoyé via la fonction Edge `send-bulk-mailing`.
Avant ce correctif, il n’existait **aucune trace “déjà envoyé”** pour ce segment, donc un relancement (offset=0, retry, double exécution) pouvait renvoyer le même e-mail à la même adresse.

## Correctif (idempotence)

Une table `public.campaign_sends` est ajoutée avec une contrainte unique sur `(campaign_key, email)`.

Pour `segment = trial_auto_incomplete_lt20`, `send-bulk-mailing` :

- tente d’insérer `(campaign_key='trial_auto_incomplete_lt20', email=<destinataire normalisé>)`
- si l’insertion **échoue car doublon**, l’envoi est **ignoré** (skip)

## Requêtes SQL utiles (Supabase → SQL editor)

### Voir combien ont déjà été “consommés” (envoyés)

```sql
select count(*) as total_sent
from public.campaign_sends
where campaign_key = 'trial_auto_incomplete_lt20';
```

### Vérifier s’il y a des doublons (ne devrait jamais en avoir)

```sql
select campaign_key, email, count(*) as n
from public.campaign_sends
where campaign_key = 'trial_auto_incomplete_lt20'
group by campaign_key, email
having count(*) > 1
order by n desc, email asc;
```

### Auditer une adresse précise

```sql
select *
from public.campaign_sends
where campaign_key = 'trial_auto_incomplete_lt20'
  and email = lower(trim('adelnour424@yahoo.com'))
order by sent_at desc;
```

## Rattrapage (si des envois ont déjà eu lieu avant le correctif)

Si tu veux “geler” les destinataires déjà touchés avant le déploiement, exporte depuis Resend
la liste des e-mails envoyés pour cette campagne, puis insère-les dans `campaign_sends` :

```sql
-- Exemple : remplace les emails ci-dessous par ceux exportés (normalisés en minuscule).
insert into public.campaign_sends (campaign_key, email, sent_at)
values
  ('trial_auto_incomplete_lt20', 'exemple1@email.com', now()),
  ('trial_auto_incomplete_lt20', 'exemple2@email.com', now())
on conflict (campaign_key, email) do nothing;
```

