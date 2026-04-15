-- Autoriser la campagne mail « essai < 20 j, auto incomplète » (admin + get-campaign-content).
ALTER TABLE public.campaign_templates
  DROP CONSTRAINT IF EXISTS campaign_templates_campaign_key_check;

ALTER TABLE public.campaign_templates
  ADD CONSTRAINT campaign_templates_campaign_key_check
  CHECK (campaign_key IN ('j2', 'j5', 'j8', 'trial_auto_incomplete_lt20'));

INSERT INTO public.campaign_templates (campaign_key, subject, body_html, cta_text, cta_url, closing_html)
VALUES (
  'trial_auto_incomplete_lt20',
  $s$⏱️ Testez votre automatisation en 2 minutes (avant la fin de votre essai)$s$,
  $b$
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bonjour {{ prenom }},</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Vous avez activé votre essai sur Quittance Simple, mais votre automatisation est actuellement en veille.</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">N'attendez pas l'échéance de votre prochain loyer pour vérifier que tout fonctionne&nbsp;! Je vous propose de tester la «&nbsp;magie&nbsp;» de l'envoi en 1 clic tout de suite, en 2 minutes chrono.</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;"><strong>Voici la marche à suivre pour votre test&nbsp;:</strong></p>
<ol style="margin: 0.2em 0 1.25em 0; padding-left: 1.25em; line-height: 1.75;">
<li style="margin-bottom: 0.65em;"><strong>Préparez l'envoi</strong>&nbsp;: Dans vos réglages, renseignez votre numéro de mobile et mettez votre propre e-mail à la place de celui du locataire.</li>
<li style="margin-bottom: 0.65em;"><strong>Lancez le chrono</strong>&nbsp;: Réglez l'heure de rappel à dans 2 minutes (ex&nbsp;: s'il est 14h05, mettez 14h07).</li>
<li style="margin-bottom: 0.65em;"><strong>Vivez l'expérience</strong>&nbsp;: À l'heure dite, vous recevez le SMS et l'e-mail. Cliquez sur le bouton «&nbsp;Envoyer&nbsp;».</li>
</ol>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;"><strong>Résultat</strong>&nbsp;: Vous recevrez instantanément la quittance (côté locataire) ainsi que votre copie d'archive.</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">C'est le meilleur moyen de valider votre configuration et de voir le temps que vous allez gagner chaque mois, sans aucun risque.</p>
$b$,
  'Je fais le test maintenant',
  'https://www.quittancesimple.fr/dashboard',
  ''
)
ON CONFLICT (campaign_key) DO NOTHING;
