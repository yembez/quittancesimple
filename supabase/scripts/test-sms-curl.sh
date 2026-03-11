#!/usr/bin/env bash
# Test d'envoi SMS (send-owner-reminder-sms-v2)
# Remplacer YOUR_SERVICE_ROLE_KEY par ta vraie clé.
# Vérifier dans la réponse le champ "provider" : si ce n'est pas "smsto", le SMS
# est parti via un autre fournisseur (SMSMode/Octopush) et n'apparaîtra pas sur SMS.to.

echo "Envoi du SMS de test..."
RESP=$(curl -s -X POST "https://jfpbddtdblqakabyjxkq.supabase.co/functions/v1/send-owner-reminder-sms-v2" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "+33671622206",
    "proprietaireName": "Test",
    "locataireName": "Test",
    "shortCode": "TEST01",
    "montantTotal": 100
  }')
echo "$RESP" | head -c 500
echo ""
echo "---"
echo "Provider utilisé (doit être smsto pour voir le SMS sur sms.to): $(echo "$RESP" | grep -o '"provider":"[^"]*"' || echo 'non trouvé')"
