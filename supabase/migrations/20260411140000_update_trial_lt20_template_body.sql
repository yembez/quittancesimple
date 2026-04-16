-- Modèle v3 : relance « testez votre automatisation en 2 min » — marche à suivre en 3 étapes + résultat.
UPDATE public.campaign_templates
SET
  subject = $s$⏱️ Testez votre automatisation en 2 minutes (avant la fin de votre essai)$s$,
  body_html = $b$
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bonjour {{ prenom }},</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Vous avez activé votre essai sur Quittance Simple, mais votre automatisation est actuellement en veille.</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">N'attendez pas l'échéance de votre prochain loyer pour vérifier que tout fonctionne&nbsp;!</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Je vous propose de tester la «&nbsp;magie&nbsp;» de l'envoi en 1 clic tout de suite, en 2 minutes chrono.</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;"><strong>Voici comment tester&nbsp;:</strong></p>
<ol style="margin: 0.2em 0 1.25em 0; padding-left: 1.25em; line-height: 1.75;">
<li style="margin-bottom: 0.65em;"><strong>Préparez l'envoi</strong>&nbsp;: Dans votre espace bailleur, choisissez le mode «&nbsp;Validation en 1 clic&nbsp;», renseignez votre numéro de mobile et mettez votre propre e-mail à la place de celui du locataire.</li>
<li style="margin-bottom: 0.65em;"><strong>Lancez le chrono</strong>&nbsp;: Réglez le rappel au jour d'aujourd'hui et l'heure à dans 2 minutes (ex&nbsp;: s'il est 14h05, mettez 14h07).</li>
<li style="margin-bottom: 0.65em;"><strong>Vivez l'expérience</strong>&nbsp;: À l'heure dite, vous recevez le SMS et l'e-mail. Cliquez sur le bouton «&nbsp;Envoyer&nbsp;».</li>
</ol>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;"><strong>Résultat</strong>&nbsp;: Vous recevrez instantanément la quittance (côté locataire) ainsi que votre copie d'archive (copie).</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">C'est le meilleur moyen de valider votre configuration et de voir le temps que vous allez gagner chaque mois, sans aucun risque.</p>
$b$,
  cta_text = 'Je fais le test maintenant',
  cta_url = 'https://www.quittancesimple.fr/dashboard',
  closing_html = ''
WHERE campaign_key = 'trial_auto_incomplete_lt20';
