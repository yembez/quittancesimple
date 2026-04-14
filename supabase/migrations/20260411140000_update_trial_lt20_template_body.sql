-- Modèle convenu : relance « automatisation en veille » (mobile + e-mail locataire + astuce test 2 min).
-- Les lignes après le bouton (« Si vous avez la moindre question… ») sont injectées par send-bulk-mailing (postCtaHtml).
UPDATE public.campaign_templates
SET
  subject = $s$⏳ Bientôt la fin de votre essai (mais votre automatisation est en veille)$s$,
  body_html = $b$
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Bonjour {{ prenom }},</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Je me permets de vous contacter car il ne vous reste que quelques jours pour tester gratuitement l'envoi de quittance automatique.</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Actuellement, votre automatisation est en «&nbsp;veille&nbsp;» car il manque deux éléments essentiels&nbsp;:</p>
<ul style="margin: 0.2em 0 1.25em 0; padding-left: 1.25em; line-height: 1.75;">
<li style="margin-bottom: 0.65em;">Votre numéro de mobile (pour recevoir votre rappel par SMS pour l'automatisation «&nbsp;en 1 clic&nbsp;»).</li>
<li style="margin-bottom: 0.15em;">L'e-mail de votre locataire (pour que le système envoie la quittance).</li>
</ul>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;"><span class="highlight">ASTUCE</span>&nbsp;: Voulez-vous voir la «&nbsp;magie&nbsp;» en 2 minutes avant la fin de votre essai&nbsp;?</p>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">C'est le meilleur moment pour faire un test réel sans aucun risque pour votre locataire&nbsp;:</p>
<ul style="margin: 0.2em 0 1.25em 0; padding-left: 1.25em; line-height: 1.75;">
<li style="margin-bottom: 0.65em;"><strong>L'astuce</strong>&nbsp;: Mettez votre propre e-mail à la place de celui du locataire.</li>
<li style="margin-bottom: 0.65em;"><strong>Le chrono</strong>&nbsp;: Réglez le rappel à +2 minutes de l'heure actuelle.</li>
<li style="margin-bottom: 0.15em;"><strong>Le résultat</strong>&nbsp;: Vous recevrez le SMS et l'e-mail de rappel, vous cliquerez dans l'un ou l'autre, et vous recevrez la quittance instantanément dans votre boîte mail.</li>
</ul>
<p style="margin: 0 0 1.15em 0; line-height: 1.75;">Ne laissez pas votre essai se terminer sans avoir vu le temps que vous allez gagner chaque mois&nbsp;!</p>
$b$,
  cta_text = 'Je complète mon test (2 min)',
  cta_url = 'https://www.quittancesimple.fr/dashboard',
  closing_html = ''
WHERE campaign_key = 'trial_auto_incomplete_lt20';
