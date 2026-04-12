-- Modèle par défaut plus proche des campagnes Espace Bailleur (corps + CTA) ; signature Marc via closing vide + buildEmailHtml.
UPDATE public.campaign_templates
SET
  subject = 'Automatisation en attente — il vous reste {{ jours_restants }} jour(s) d''essai',
  body_html = '<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bonjour {{ prenom }},</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Vous avez commencé à paramétrer votre espace sur Quittance Simple — merci&nbsp;!</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Pour que l''envoi automatique des quittances et les rappels fonctionnent sans accroc, il manque encore une information (par exemple l''e-mail du locataire ou le téléphone du bailleur, selon ce que vous avez choisi).</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Il vous reste <strong>{{ jours_restants }}</strong> jour(s) sur votre essai gratuit&nbsp;: en quelques minutes vous finalisez la configuration et vous gagnez du temps chaque mois.</p><p style="margin: 0 0 1.15em 0; line-height: 1.75;">Le bouton ci-dessous ouvre la page d''accueil&nbsp;: si vous n''êtes pas encore connecté, la connexion s''affiche&nbsp;; une fois identifié, vous êtes renvoyé vers votre tableau de bord.</p>',
  cta_text = 'Finaliser mon espace bailleur',
  cta_url = 'https://www.quittancesimple.fr/dashboard',
  closing_html = ''
WHERE campaign_key = 'trial_auto_incomplete_lt20';
