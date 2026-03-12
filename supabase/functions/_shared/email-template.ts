/**
 * Modèle d'e-mail unifié pour tous les envois utilisateur.
 * Design basé sur test-template-email1.html — bleu vif #2563eb.
 *
 * Titre selon contexte :
 * - "Quittance Simple" : quittance gratuite, utilisateurs grand public
 * - "QS- Espace Bailleur" : communications depuis l'espace bailleur (baux, relances essai, etc.)
 *
 * Référence visuelle : docs/email-template-reference.html
 */

export const EMAIL_BLEU_VIF = '#2563eb';

export type EmailTitle = 'Quittance Simple' | 'QS- Espace Bailleur' | '';

export interface EmailTemplateOptions {
  /** Titre affiché en en-tête : "Quittance Simple", "QS- Espace Bailleur" ou vide pour aucun titre */
  title: EmailTitle;
  /** Contenu principal (HTML) : paragraphes, listes, etc. */
  bodyHtml: string;
  /** Texte du bouton CTA (optionnel) */
  ctaText?: string;
  /** URL du bouton CTA (optionnel) */
  ctaUrl?: string;
  /** Signature / fin de message (HTML), ex. "À très vite,<br><strong>Vincent de Quittance Simple</strong>" */
  closingHtml?: string;
  /** URL de contact (défaut: mailto:contact@quittancesimple.fr) */
  contactUrl?: string;
  /** Année pour le copyright (défaut: année courante) */
  year?: number;
  /** Ligne supplémentaire dans le footer (ex. raison de l'envoi) */
  footerReason?: string;
  /** URL de désabonnement (optionnelle, par défaut page de désabonnement QS) */
  unsubscribeUrl?: string;
}

const DEFAULT_CONTACT_URL = 'mailto:contact@quittancesimple.fr';
const DEFAULT_UNSUBSCRIBE_URL = 'https://www.quittancesimple.fr/unsubscribe';
const DEFAULT_FOOTER_REASON = "Vous recevez cet e-mail dans le cadre d'une communication Quittance Simple.";

/**
 * Génère le HTML complet d'un e-mail selon le modèle design commun.
 */
export function buildEmailHtml(options: EmailTemplateOptions): string {
  const {
    title,
    bodyHtml,
    ctaText,
    ctaUrl,
    closingHtml = `À très vite,<br><strong>Vincent de Quittance Simple</strong>`,
    unsubscribeUrl = DEFAULT_UNSUBSCRIBE_URL,
    contactUrl = DEFAULT_CONTACT_URL,
    year = new Date().getFullYear(),
    footerReason = DEFAULT_FOOTER_REASON,
  } = options;

  const ctaBlock =
    ctaText && ctaUrl
      ? `<p style="margin-top: 25px; text-align: center;"><a href="${ctaUrl}" class="button">${ctaText}</a></p>`
      : '';

  const logoBlock = title
    ? `<div class="logo">${title}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333333; line-height: 1.6; background-color: #f9f9f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 8px; border: 1px solid #eeeeee; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .logo { font-size: 22px; font-weight: bold; color: ${EMAIL_BLEU_VIF}; margin-bottom: 30px; text-decoration: none; }
    .button { display: inline-block; padding: 14px 28px; background-color: ${EMAIL_BLEU_VIF}; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 25px; }
    .footer { margin-top: 40px; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; padding-top: 20px; }
    .highlight { color: ${EMAIL_BLEU_VIF}; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    ${logoBlock}

    ${bodyHtml}
${ctaBlock}

    <p style="margin-top: 40px;">${closingHtml}</p>

    <div class="footer">
      ${footerReason}<br>
      Des questions ? Des suggestions ? Nous serions ravis d'avoir vos retours :
      <a href="${contactUrl}" style="color: ${EMAIL_BLEU_VIF}; text-decoration: none;">Nous contacter</a><br>
      <a href="${unsubscribeUrl}" style="color: ${EMAIL_BLEU_VIF}; text-decoration: none;">Se désabonner</a> © 2026 Quittance Simple
    </div>
  </div>
</body>
</html>`;
}
