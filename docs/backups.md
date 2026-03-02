# Politique de sauvegarde Supabase

## Objectif
Avant chaque deployment Supabase (migrations + fonctions), le script `scripts/deploy_supabase.sh` :

- exécute `supabase db dump` pour générer un dump complet (`backup-YYYYMMDD-HHMM-prod.sql`),
- déplace le fichier généré dans `backups/`,
- applique les migrations/push et déploie les fonctions.

Ce fichier documente comment consommer et gérer ces dumps.

## Emplacement

- Tous les dumps sont rangés dans le dossier `backups/` sous la racine.
- Chaque backup porte un nom horodaté pour tracer facilement son origine.

## Conservation / nettoyage

- Tu peux conserver un nombre limité de fichiers (ex. les 5 derniers dumps) pour éviter de gonfler le repo.
- Pour les dumps plus anciens, tu peux soit :
  - les archiver en dehors du repo (`mv backups/*.sql /chemin/secure/`), ou
  - les compresser (`gzip backups/backup-*.sql`) puis les supprimer du suivi via un commit dédié.

## Restauration rapide

Pour restaurer un backup dans Supabase :  
```bash
supabase db restore --file=backups/backup-YYYYMMDD-HHMM-prod.sql
```

## Bonnes pratiques

- Confirme toujours que la sauvegarde s’est bien générée (message `backup déplacé vers backups/...` dans le script).
- Ajoute les dumps importants à un stockage externe (S3 bucket privé / disque chiffré).
- Souviens-toi de purger régulièrement les dumps obsolètes pour éviter un repo trop lourd.
