-- Autoriser la campagne mail « essai < 20 j, auto incomplète » (admin + get-campaign-content).
ALTER TABLE public.campaign_templates
  DROP CONSTRAINT IF EXISTS campaign_templates_campaign_key_check;

ALTER TABLE public.campaign_templates
  ADD CONSTRAINT campaign_templates_campaign_key_check
  CHECK (campaign_key IN ('j2', 'j5', 'j8', 'trial_auto_incomplete_lt20'));

INSERT INTO public.campaign_templates (campaign_key, subject, body_html, cta_text, cta_url, closing_html)
VALUES (
  'trial_auto_incomplete_lt20',
  'Complétez votre espace — il vous reste {{ jours_restants }} jour(s) d''essai',
  '<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bonjour {{ prenom }},</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Votre automatisation est presque prête : il manque encore une information pour que tout fonctionne sans accroc.</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Il vous reste <strong>{{ jours_restants }}</strong> jour(s) sur votre essai gratuit — ouvrez votre espace pour finaliser en quelques clics.</p>',
  'Compléter mon espace',
  'https://www.quittancesimple.fr/dashboard',
  ''
)
ON CONFLICT (campaign_key) DO NOTHING;
