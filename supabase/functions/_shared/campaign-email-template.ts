/**
 * Template HTML des e-mails de campagne (J+2, etc.) — structure et texte du modèle joint.
 * Placeholders : PRENOM, LIEN_ACTIVATION, LIEN_DESABONNEMENT, PHOTO_VINCENT_URL
 */

const DEFAULT_PHOTO_VINCENT = "https://www.quittancesimple.fr/images/automation/marc_2.png";
const DEFAULT_CONTACT = "mailto:contact@quittancesimple.fr";

export interface CampaignEmailOptions {
  prenom: string;
  lienActivation: string;
  lienDesabonnement: string;
  bodyHtml?: string;
  ctaText?: string;
  closingHtml?: string;
  photoVincentUrl?: string;
  contactUrl?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Génère le HTML complet d'un e-mail de campagne (table layout, box grise, puces vertes, CTA bleu, signature).
 */
export function buildCampaignEmailHtml(options: CampaignEmailOptions): string {
  const {
    prenom,
    lienActivation,
    lienDesabonnement,
    bodyHtml,
    ctaText,
    closingHtml,
    photoVincentUrl = DEFAULT_PHOTO_VINCENT,
    contactUrl = DEFAULT_CONTACT,
  } = options;

  const prenomSafe = escapeHtml(prenom.trim() || "Prénom");

  const lienSafe = lienActivation.replace(/"/g, "&quot;");
  const hasCustomBody = !!bodyHtml && bodyHtml.trim().length > 0;
  const hasCustomClosing = !!closingHtml && closingHtml.trim().length > 0;
  const ctaLabel = (ctaText && ctaText.trim()) || "Découvrir mon espace&nbsp;gratuit";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Bienvenue sur Quittance Simple</title>
  <style>
    @media only screen and (max-width: 620px) {
      .wrapper { padding: 16px !important; }
      .content { padding-left: 20px !important; padding-right: 20px !important; max-width: 100% !important; }
      .cta-block { padding: 12px 24px !important; font-size: 16px !important; }
      .signature-img { width: 64px !important; height: 64px !important; object-fit: cover !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5; -webkit-text-size-adjust: 100%;">
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td class="wrapper" style="padding: 24px 16px;">
        
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <tr>
            <td class="content" style="padding: 32px 32px 0; max-width: 600px;">
              <p style="margin: 0 0 18px; font-size: 18px; line-height: 1.5; color: #000000; font-weight: 600;">
                Bonjour&nbsp;${prenomSafe},
              </p>
            </td>
          </tr>
          
          ${hasCustomBody ? `
          <tr>
            <td class="content" style="padding: 0 32px 24px;">
              ${bodyHtml}
            </td>
          </tr>
          ` : `
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                Vous avez créé une quittance récemment sur Quittance&nbsp;Simple et je voulais vous remercier et surtout vous souhaiter la bienvenue&nbsp;!
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                Parce que Quittance&nbsp;Simple, c'est un peu comme une petite communauté&nbsp;: celle des bailleurs qui se facilitent la vie.
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #000000;">
                      Et justement, pour vous faciliter la vie, je vous ai ouvert l'accès à votre <a href="${lienSafe}" style="color: #4A90E2; text-decoration: underline;">Espace&nbsp;Bailleur&nbsp;gratuit</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                Dedans, vous trouverez ce que j'appelle des «&nbsp;facilitateurs de vie&nbsp;».
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.5; color: #000000;">
                Le premier&nbsp;? <strong>Automatiser vos quittances</strong> sans refaire les mêmes manipulations tous les mois&nbsp;:
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px 0 48px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 12px;">
                <tr>
                  <td style="width: 20px; vertical-align: top; padding-top: 6px;">
                    <div style="width: 8px; height: 8px; background-color: #7CAA89; border-radius: 50%;"></div>
                  </td>
                  <td style="padding-left: 10px; vertical-align: top;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #000000;">
                      Vos informations et celles de votre locataire sont <strong>déjà remplies</strong>
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 12px;">
                <tr>
                  <td style="width: 20px; vertical-align: top; padding-top: 6px;">
                    <div style="width: 8px; height: 8px; background-color: #7CAA89; border-radius: 50%;"></div>
                  </td>
                  <td style="padding-left: 10px; vertical-align: top;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #000000;">
                      Vos quittances peuvent s'envoyer <strong>100&nbsp;% automatiquement</strong>
                    </p>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="width: 20px; vertical-align: top; padding-top: 6px;">
                    <div style="width: 8px; height: 8px; background-color: #7CAA89; border-radius: 50%;"></div>
                  </td>
                  <td style="padding-left: 10px; vertical-align: top;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #000000;">
                      Ou <strong>en un seul clic</strong> si vous voulez plus de&nbsp;contrôle
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 18px 32px 0;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                Bref, l'idée est simple&nbsp;: ne plus perdre de temps avec Word,&nbsp;Excel, les copier-coller, les envois email, les exports&nbsp;PDF, les archives&nbsp;...
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.5; color: #000000;">
                Et il y a d'autres facilitateurs dans votre&nbsp;Espace.
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #000000;">
                À vous de les découvrir&nbsp;— c'est gratuit&nbsp;!
              </p>
            </td>
          </tr>
          `}
          
          <tr>
            <td class="content" style="padding: 0 32px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="${lienSafe}" class="cta-block" style="display: inline-block; background-color: #4A90E2; color: #ffffff !important; text-decoration: none; padding: 14px 32px; font-size: 17px; font-weight: 600; border-radius: 6px;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td class="content" style="padding: 0 32px 24px;">
              <div style="border-top: 1px solid #e1e8ed;"></div>
            </td>
          </tr>
          
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                Petite question (je suis curieux)&nbsp;: combien de locataires gérez-vous aujourd'hui&nbsp;? Vous pouvez simplement répondre à cet&nbsp;email.
              </p>
            </td>
          </tr>
          
          <tr>
            <td class="content" style="padding: 0 32px 24px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #000000;">
                Merci, et encore bienvenue&nbsp;!
              </p>
            </td>
          </tr>
          
          ${hasCustomClosing ? `
          <tr>
            <td class="content" style="padding: 0 32px 32px;">
              ${closingHtml}
            </td>
          </tr>
          ` : `
          <tr>
            <td class="content" style="padding: 0 32px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width: 70px; vertical-align: top; padding-right: 16px;">
                    <img src="${photoVincentUrl.replace(/"/g, "&quot;")}" alt="Marc" width="80" height="80" class="signature-img" style="border-radius: 50%; display: block; object-fit: cover;">
                  </td>
                  <td style="vertical-align: middle;">
                    <p style="margin: 0 0 4px; font-size: 17px; font-weight: 600; color: #000000; line-height: 1.4;">
                      À&nbsp;bientôt,<br>Marc
                    </p>
                    <p style="margin: 0; font-size: 15px; line-height: 1.4; color: #000000;">
                      Co-fondateur de Quittance&nbsp;Simple<br>
                      Bailleur&nbsp;comme vous
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `}
          
          <tr>
            <td class="content" style="padding: 24px 32px; background-color: #f8f9fa; border-top: 1px solid #e1e8ed;">
              <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.5; color: #333333;">
                Vous recevez cet e-mail dans le cadre d'une communication Quittance&nbsp;Simple.<br>
                Des questions&nbsp;? Des suggestions&nbsp;? Nous serions ravis d'avoir vos retours&nbsp;: 
                <a href="${contactUrl.replace(/"/g, "&quot;")}" style="color: #7CAA89; text-decoration: underline;">Nous&nbsp;contacter</a>
              </p>
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #333333;">
                <a href="${lienDesabonnement.replace(/"/g, "&quot;")}" style="color: #333333; text-decoration: underline;">Se&nbsp;désabonner</a> 
                ©&nbsp;2026 Quittance&nbsp;Simple
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
}
