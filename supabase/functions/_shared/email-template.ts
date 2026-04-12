/**
 * Modèle d'e-mail canonique Quittance Simple (références produit) :
 * - Espace Bailleur : mail de bienvenue (`send-welcome-email`) — titre « QS- Espace Bailleur », signature Marc.
 * - Grand public / quittance gratuite : bonus propriétaire dans `send-quittance` — titre « Quittance Simple », bloc Marc « À bientôt » + Co-fondateur.
 *
 * Toute nouvelle campagne ou relance doit utiliser `buildEmailHtml` (pas de HTML document complet sauf cas exceptionnel).
 * Photo signature : `MARC_SIGNATURE_IMAGE_URL`.
 *
 * Référence visuelle : docs/email-template-reference.html
 */

export const EMAIL_BLEU_VIF = "#2563eb";

/** Site public pour assets e-mail (HTTPS) */
export const QS_PUBLIC_SITE_URL = "https://www.quittancesimple.fr";

export const MARC_SIGNATURE_IMAGE_URL = `${QS_PUBLIC_SITE_URL}/images/automation/marc_2.png`;

export type EmailTitle = "Quittance Simple" | "QS- Espace Bailleur" | "";

export type MarcClosingVariant = "espace_bailleur" | "pack_promo" | "standard" | "compact";

export interface BuildMarcClosingOptions {
  variant?: MarcClosingVariant;
  /** HTML au-dessus du tableau photo + nom (ex. phrase de politesse avant signature) */
  preambleHtml?: string;
}

/**
 * Bloc signature Marc (photo + texte) — réutiliser pour tous les mails « Marc ».
 * - `espace_bailleur` : comme le mail de bienvenue Espace Bailleur.
 * - `pack_promo` : comme le mail « quittance gratuite / automatique » (bonus propriétaire).
 * - `standard` : fermeture générique campagnes (À très vite + Marc de QS).
 * - `compact` : nom + rôle seulement (après un preamble type « Bonne journée, »).
 */
export function buildMarcClosingHtml(options: BuildMarcClosingOptions = {}): string {
  const variant = options.variant ?? "standard";
  const preamble = options.preambleHtml?.trim();

  let rightCell: string;
  switch (variant) {
    case "espace_bailleur":
      rightCell =
        "À très vite dans votre Espace Bailleur,<br><strong>Marc de Quittance Simple</strong>";
      break;
    case "pack_promo":
      rightCell =
        "À bientôt,<br><strong>Marc</strong><br><span style=\"color:#4b5563;\">Co-fondateur de Quittance Simple</span><br><span style=\"color:#4b5563;\">Bailleur comme vous</span>";
      break;
    case "compact":
      rightCell =
        "<strong>Marc de Quittance Simple</strong><br><span style=\"color:#4b5563;\">Co-fondateur de Quittance Simple</span>";
      break;
    case "standard":
    default:
      rightCell =
        "À très vite,<br><strong>Marc de Quittance Simple</strong><br><span style=\"color:#4b5563;\">Co-fondateur de Quittance Simple</span>";
      break;
  }

  const table = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin-top:4px;">
  <tr>
    <td style="padding:0;padding-right:12px;vertical-align:middle;">
      <img src="${MARC_SIGNATURE_IMAGE_URL}" width="84" height="84" alt="Marc, Quittance Simple" style="display:block;width:84px;height:84px;border-radius:999px;object-fit:cover;object-position:50% 32%;" />
    </td>
    <td style="padding:0;vertical-align:middle;font-size:14px;line-height:1.5;color:#111827;">
      ${rightCell}
    </td>
  </tr>
</table>`;

  if (preamble) {
    return `${preamble}<br><br>${table}`;
  }
  return table;
}

/** Fermeture Marc par défaut selon le titre du mail (aligné références produit). */
export function defaultMarcClosingForTitle(title: EmailTitle): string {
  if (title === "Quittance Simple") {
    return buildMarcClosingHtml({ variant: "pack_promo" });
  }
  if (title === "QS- Espace Bailleur") {
    return buildMarcClosingHtml({ variant: "espace_bailleur" });
  }
  return buildMarcClosingHtml({ variant: "standard" });
}

export interface EmailTemplateOptions {
  title: EmailTitle;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  closingHtml?: string;
  contactUrl?: string;
  year?: number;
  footerReason?: string;
  unsubscribeUrl?: string;
}

const DEFAULT_CONTACT_URL = "mailto:contact@quittancesimple.fr";
const DEFAULT_UNSUBSCRIBE_URL = `${QS_PUBLIC_SITE_URL}/unsubscribe`;
const DEFAULT_FOOTER_REASON = "Vous recevez cet e-mail dans le cadre d'une communication Quittance Simple.";

/**
 * Génère le HTML complet : en-tête, corps typographié (comme le mail de bienvenue), CTA, signature Marc, pied de page.
 */
export function buildEmailHtml(options: EmailTemplateOptions): string {
  const {
    title,
    bodyHtml,
    ctaText,
    ctaUrl,
    closingHtml,
    unsubscribeUrl = DEFAULT_UNSUBSCRIBE_URL,
    contactUrl = DEFAULT_CONTACT_URL,
    year = new Date().getFullYear(),
    footerReason = DEFAULT_FOOTER_REASON,
  } = options;

  const closingResolved =
    closingHtml != null && String(closingHtml).trim() !== ""
      ? String(closingHtml)
      : defaultMarcClosingForTitle(title);

  const ctaBlock =
    ctaText && ctaUrl
      ? `<p style="margin-top: 25px; text-align: center;"><a href="${ctaUrl}" class="button">${ctaText}</a></p>`
      : "";

  const logoBlock = title ? `<div class="logo">${title}</div>` : "";

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
    .qs-email-main p { margin: 0 0 1.15em 0; line-height: 1.75; color: #333333; }
    .qs-email-main ul { margin: 0.2em 0 1.25em 0; padding-left: 1.25em; line-height: 1.75; color: #333333; }
    .qs-email-main li { margin-bottom: 0.65em; }
    .qs-email-main li:last-child { margin-bottom: 0.15em; }
  </style>
</head>
<body>
  <div class="container">
    ${logoBlock}

    <div class="qs-email-main">
    ${bodyHtml}
    </div>
${ctaBlock}

    <p style="margin-top: 40px;">${closingResolved}</p>

    <div class="footer">
      ${footerReason}<br>
      Des questions ? Des suggestions ? Nous serions ravis d'avoir vos retours :
      <a href="${contactUrl}" style="color: ${EMAIL_BLEU_VIF}; text-decoration: none;">Nous contacter</a><br>
      <a href="${unsubscribeUrl}" style="color: ${EMAIL_BLEU_VIF}; text-decoration: none;">Se désabonner</a> © ${year} Quittance Simple
    </div>
  </div>
</body>
</html>`;
}
