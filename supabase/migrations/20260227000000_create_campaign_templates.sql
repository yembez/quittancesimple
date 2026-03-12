-- Templates des campagnes email (J+2, J+5, J+8) pour l'admin.
-- Lecture/écriture via Edge Functions avec ADMIN_ANALYTICS_PASSWORD uniquement.

CREATE TABLE IF NOT EXISTS campaign_templates (
  campaign_key text PRIMARY KEY CHECK (campaign_key IN ('j2', 'j5', 'j8')),
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  cta_text text NOT NULL DEFAULT '',
  cta_url text NOT NULL DEFAULT '',
  closing_html text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS : aucune politique pour anon/authenticated ; seules les Edge Functions (service_role) y accèdent.
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- Pas de policy = personne ne peut lire/écrire via le client Supabase standard.
-- Les fonctions Edge utilisent SUPABASE_SERVICE_ROLE_KEY pour bypass RLS.

INSERT INTO campaign_templates (campaign_key, subject, body_html, cta_text, cta_url, closing_html)
VALUES (
  'j2',
  'Votre Espace Bailleur est prêt — vos infos sont déjà là',
  '<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bonjour {{ prenom }},</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Vous avez créé une quittance récemment sur Quittance Simple, merci&nbsp;!</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Je voulais simplement vous dire une chose :</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">👉 Votre espace bailleur gratuit est déjà prêt.</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Vous pouvez maintenant gérer vos quittances automatiquement sans refaire les mêmes manipulations tous les mois.</p><p style="margin: 0 0 0.9em 0; line-height: 1.75;">Par exemple :</p><ul style="margin: 0.2em 0 1.25em 1.2em; padding-left: 1em; line-height: 1.75;"><li style="margin-bottom: 0.7em;">vos informations et celles de votre locataire sont déjà enregistrées</li><li style="margin-bottom: 0.7em;">vos quittances peuvent s''envoyer automatiquement</li><li style="margin-bottom: 0.1em;">vous pouvez aussi envoyer en un clic si vous préférez garder la main</li></ul><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bref, l''idée est simple :<br>ne plus perdre de temps avec Word, Excel et les copier-coller.</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Si vous avez 30&nbsp;secondes, je suis curieux de savoir :<br>combien de locataires gérez-vous aujourd''hui ?<br>Vous pouvez simplement répondre à cet email.</p>',
  'Découvrir mon espace bailleur',
  'https://www.quittancesimple.fr/#loginEmail={{ email }}&mode=signup',
  '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 4px;"><tr><td style="padding-right: 12px; vertical-align: middle;"><img src="https://www.quittancesimple.fr/images/vincent-photo.png" alt="Vincent, Quittance Simple" style="width: 76px; height: 76px; border-radius: 999px; display: block; object-fit: cover; object-position: 50% 28%;"></td><td style="font-size: 14px; line-height: 1.5; color: #111827; vertical-align: middle;">À bientôt,<br><strong>Vincent</strong><br><span style="color:#4b5563;">Co-fondateur de Quittance Simple</span><br><span style="color:#4b5563;">Bailleur comme vous</span></td></tr></table>'
)
ON CONFLICT (campaign_key) DO NOTHING;

INSERT INTO campaign_templates (campaign_key, subject, body_html, cta_text, cta_url, closing_html)
VALUES ('j5', 'Campagne J+5 (à personnaliser)', '<p>Bonjour {{ prenom }},</p><p>Contenu à venir.</p>', 'En savoir plus', 'https://www.quittancesimple.fr/', '')
ON CONFLICT (campaign_key) DO NOTHING;

INSERT INTO campaign_templates (campaign_key, subject, body_html, cta_text, cta_url, closing_html)
VALUES ('j8', 'Campagne J+8 (à personnaliser)', '<p>Bonjour {{ prenom }},</p><p>Contenu à venir.</p>', 'En savoir plus', 'https://www.quittancesimple.fr/', '')
ON CONFLICT (campaign_key) DO NOTHING;
