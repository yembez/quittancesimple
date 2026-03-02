# Vérifier le déploiement de l’Edge Function `send-quittance`

## 1. Déployer la fonction

À la racine du projet (où se trouve le dossier `supabase/`) :

```bash
npx supabase functions deploy send-quittance --project-ref VOTRE_REF_PROJET
```

Sans `--project-ref`, le déploiement part vers le projet lié à `supabase link`. Vérifiez que c’est bien le bon projet (prod).

Pour voir le projet actuellement lié :

```bash
npx supabase projects list
# puis éventuellement
npx supabase link --project-ref XXXXX
```

## 2. Vérifier que le déploiement a réussi

- **Dans le terminal** : le déploiement doit afficher un succès du type  
  `Deployed Function send-quittance on project XXXXX`.

- **Dans le dashboard Supabase** :  
  **Project → Edge Functions → send-quittance**  
  Vérifier la date/heure du dernier déploiement.

## 3. Vérifier que la bonne version tourne (email locataire)

Après avoir déclenché un envoi au locataire (clic depuis l’email ou le SMS de rappel) :

1. **Objet de l’email reçu par le locataire**
   - **Nouvelle version (OK)** : `Quittance de loyer – [période]` (avec un tiret long « – »).
   - **Ancienne version (à corriger)** : `Votre quittance de loyer - [période]`.

2. **Contenu du corps**
   - **Nouvelle version (OK)** :  
     « Bonjour [Prénom Nom], Veuillez trouver ci-joint votre quittance de loyer… », « Détails du paiement », « Cordialement, [Bailleur] ».
   - **Ancienne version (à corriger)** :  
     « Votre quittance est prête », « Ça vous dirait de ne plus jamais y penser ? », CTA Pack Automatique.

3. **Code source de l’email (optionnel)**  
   Dans votre client mail : afficher le code source / « View source » de l’email reçu par le locataire, puis rechercher :  
   `TEMPLATE_LOCATAIRE_V2`  
   Si cette chaîne est présente, le template **locataire** déployé est bien utilisé.

## 4. Consulter les logs (en cas de doute)

**Supabase Dashboard → Edge Functions → send-quittance → Logs.**

Après un envoi depuis le clic rappel, vous devriez voir une ligne du type :

```text
[send-quittance] action= auto_send recipient= xxx… isToTenant= true template= LOCATAIRE
```

Si vous voyez `isToTenant= false` ou `template= PROPRIETAIRE` alors que vous avez cliqué depuis l’email/SMS de rappel, soit la fonction n’est pas la dernière version déployée, soit le body de la requête n’envoie pas `action: 'auto_send'` ou l’email du locataire.

## 5. En cas de mauvais projet

Si vous avez plusieurs projets (staging, prod), vérifiez :

- Que le **lien Supabase** (`supabase link`) pointe vers le projet utilisé par l’app qui envoie les rappels.
- Que **VITE_SUPABASE_URL** (et la clé) dans l’environnement de l’app correspondent à ce même projet.

Une fois le bon projet lié, refaites :

```bash
npx supabase functions deploy send-quittance
```
