#!/usr/bin/env bash
set -euo pipefail

# Ce script execute la séquence complète de déploiement Supabase.
# Il cible le projet "jfpbddtdblqakabyjxkq" (production) : assure-toi d'avoir un backup et d'accepter l'impact.

PROJECT_REF="jfpbddtdblqakabyjxkq"
export SUPABASE_PROJECT_REF="${SUPABASE_PROJECT_REF:-$PROJECT_REF}"

confirm() {
  read -rp "Attention : tu vas toucher la base Supabase de production (${PROJECT_REF}). Continuer ? [y/N] " ans
  case "$ans" in
    [yY]|[yY][eE][sS]) ;;
    *) echo "Annulé." >&2; exit 1 ;;
  esac
}

confirm

echo "→ lien/connexion Supabase (login + link si besoin)"
supabase login || echo "Connecte-toi avec 'supabase login' si ce n'est pas déjà fait."
supabase link --project-ref "$PROJECT_REF"

echo "→ récupération des migrations distantes (pull)"
supabase db pull

BACKUP_FILE="backup-$(date +%Y%m%d-%H%M)-prod.sql"
BACKUP_DIR="backups"
echo "→ dump SQL de précaution (backup complet de la base prod)"
supabase db dump --file="$BACKUP_FILE"
mkdir -p "$BACKUP_DIR"
mv "$BACKUP_FILE" "$BACKUP_DIR/"
echo "→ backup déplacé vers $BACKUP_DIR/$BACKUP_FILE"

echo "→ migrations encore en attente sur la cli locale"
supabase migration list --status pending || true

echo "→ mise à jour locale des migrations (recommandé) ; la commande supabase db push applique les changements"
supabase db push

echo "→ déploiement des functions signature"
for func in signatures-create signatures-get signatures-send-otp signatures-sign signatures-request-modification signatures-cancel signatures-generate-final-pdf; do
  supabase functions deploy "$func"
done

echo "Déploiement terminé. Vérifie que les secrets (APP_URL, RESEND_API_KEY, SMSMODE_API_TOKEN...) sont bien à jour."
