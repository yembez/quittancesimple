-- Signature mail : remplacer Guilhem par Vincent et Fondateur par Co-fondateur dans les templates de campagne.
-- (Version renommée : éviter le doublon 20260228000000 avec create_campaign_cta_clicks.)
UPDATE campaign_templates
SET closing_html = '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 4px;"><tr><td style="padding-right: 12px; vertical-align: middle;"><img src="https://www.quittancesimple.fr/images/vincent-photo.png" alt="Vincent, Quittance Simple" style="width: 76px; height: 76px; border-radius: 999px; display: block; object-fit: cover; object-position: 50% 28%;"></td><td style="font-size: 14px; line-height: 1.5; color: #111827; vertical-align: middle;">À bientôt,<br><strong>Vincent</strong><br><span style="color:#4b5563;">Co-fondateur de Quittance Simple</span><br><span style="color:#4b5563;">Bailleur comme vous</span></td></tr></table>'
WHERE campaign_key = 'j2'
  AND closing_html LIKE '%Guilhem%';
