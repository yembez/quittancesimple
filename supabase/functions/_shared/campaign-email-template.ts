/**
 * Template historique des campagnes leads (J+2, J+5, J+8) en base `campaign_templates`.
 * Les **nouvelles** campagnes produit / Espace Bailleur doivent utiliser `buildEmailHtml`
 * (`email-template.ts`) + segment type `trial_auto_incomplete_lt20`, pas ce layout.
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
  slots?: CampaignEmailSlots;
  photoVincentUrl?: string;
  contactUrl?: string;
}

export interface CampaignEmailSlots {
  welcome?: string;
  thanksMid?: string;
  community?: string;
  box?: string;
  transition?: string;
  listIntro?: string;
  bullet1?: string;
  bullet2?: string;
  bullet3?: string;
  conclusion?: string;
  final1?: string;
  final2?: string;
  question?: string;
  thanks?: string;
}

interface FreeformOptions {
  prenomSafe: string;
  bodyHtml: string;
  ctaLabel: string;
  lienSafe: string;
  lienDesabonnementSafe: string;
  closingHtml?: string;
  photoVincentUrl: string;
  contactUrl: string;
}

function buildCampaignFreeformHtml(opts: FreeformOptions): string {
  const { prenomSafe, bodyHtml, ctaLabel, lienSafe, lienDesabonnementSafe, closingHtml, photoVincentUrl, contactUrl } = opts;
  const hasCustomClosing = !!closingHtml && closingHtml.trim().length > 0;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Quittance Simple</title>
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
            <td class="content" style="padding: 32px 32px 0;">
              <div style="font-size: 16px; line-height: 1.6; color: #000000;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 24px 32px 32px;">
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
          ${hasCustomClosing ? `
          <tr>
            <td class="content" style="padding: 0 32px 32px;">
              ${closingHtml}
            </td>
          </tr>
          ` : `
          <tr>
            <td class="content" style="padding: 0 32px 12px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #000000;">
                À votre disposition pour vous aider,
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="width: 70px; vertical-align: top; padding-right: 16px;">
                    <img src="${photoVincentUrl.replace(/"/g, "&quot;")}" alt="Marc" width="80" height="80" class="signature-img" style="border-radius: 50%; display: block; object-fit: cover;">
                  </td>
                  <td style="vertical-align: middle;">
                    <p style="margin: 0 0 4px; font-size: 17px; font-weight: 600; color: #000000; line-height: 1.4;">
                      Marc
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
                <a href="${lienDesabonnementSafe}" style="color: #333333; text-decoration: underline;">Se&nbsp;désabonner</a>
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
    slots,
    photoVincentUrl = DEFAULT_PHOTO_VINCENT,
    contactUrl = DEFAULT_CONTACT,
  } = options;

  const prenomSafe = escapeHtml(prenom.trim() || "Prénom");

  const lienSafe = lienActivation.replace(/"/g, "&quot;");
  const lienDesabonnementSafe = lienDesabonnement.replace(/"/g, "&quot;");
  const hasSlots = !!slots && typeof slots === "object" && Object.keys(slots).length > 0;
  const hasCustomBody = !hasSlots && !!bodyHtml && bodyHtml.trim().length > 0;
  const hasCustomClosing = !!closingHtml && closingHtml.trim().length > 0;
  const ctaLabel = (ctaText && ctaText.trim()) || "Découvrir mon espace&nbsp;gratuit";

  // Objectif : garder la MISE EN PAGE identique quoi qu'il arrive.
  // Quand `body_html` est renseigné, on extrait uniquement les textes (p + li) pour
  // alimenter les blocs fixes du template (paragraphes, puces, question, merci).
  const stripTags = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const sanitizeSlotHtml = (raw: string): string => {
    // Sanitize minimal (admin-only) : retire scripts/handlers, garde quelques balises simples.
    let s = raw;
    s = s.replace(/<\s*script[\s\S]*?>[\s\S]*?<\s*\/\s*script\s*>/gi, "");
    s = s.replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, ""); // onclick=...
    s = s.replace(/\shref\s*=\s*(['"])\s*javascript:[\s\S]*?\1/gi, ' href="#"');
    // Autorise seulement: strong, em, br, a
    s = s.replace(/<(\/?)(?!strong\b|em\b|br\b|a\b)[a-z0-9:-]+\b[^>]*>/gi, "");
    return s;
  };

  const replaceLinkTokens = (raw: string): string => {
    return raw
      .replace(/\{\{\s*lien_activation\s*\}\}/gi, lienSafe)
      .replace(/\{\{\s*lien_desabonnement\s*\}\}/gi, lienDesabonnementSafe);
  };

  const slotTextToHtml = (s: string | undefined): string | null => {
    if (!s) return null;
    const raw = String(s).trim();
    if (!raw) return null;
    // On autorise un petit sous-ensemble HTML dans les slots (ex: <strong>, <em>, <br>, <a>).
    // Les retours ligne sont convertis en <br>.
    const withBreaks = raw.replace(/\n/g, "<br>");
    const withTokens = replaceLinkTokens(withBreaks);
    return sanitizeSlotHtml(withTokens);
  };

  const replacePrenomTokens = (html: string): string => {
    // Supporte {{ prenom }} et {{prenom}}
    return html
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenomSafe)
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenomSafe)
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenomSafe)
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenomSafe)
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenomSafe)
      .replace(/\{\{\s*prenom\s*\}\}/gi, prenomSafe);
  };

  const parseCampaignTextFromBodyHtml = (rawHtml: string | undefined) => {
    if (!rawHtml) return null;
    const personalized = replacePrenomTokens(rawHtml);

    const paragraphMatches = [...personalized.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    const paragraphs = paragraphMatches
      .map((m) => (m[1] ?? "").trim())
      .filter(Boolean)
      // On ignore les paragraphes de type "Bonjour ..."
      .filter((p) => !normalize(stripTags(p)).startsWith("bonjour"));

    const liMatches = [...personalized.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    const listItems = liMatches.map((m) => (m[1] ?? "").trim()).filter(Boolean);

    const strip = (html: string) => stripTags(html);
    const pickRegex = (paragraphsHtml: string[], regex: RegExp): string | null => {
      for (const p of paragraphsHtml) {
        const t = strip(p);
        const m = t.match(regex);
        if (m && m[1]) return m[1].trim();
        if (m) return (m[0] ?? "").trim();
      }
      return null;
    };

    // Blocs à extraire sans chevauchement (certaines phrases sont dans le même <p>)
    const thanksMidCandidate = pickRegex(paragraphs, /((?:Alors\s+merci)[^.?!]*[!?.])/i);
    const questionCandidate = pickRegex(paragraphs, /((?:Petite question)[^.?!]*[.?!])/i);
    const thanksCandidate = pickRegex(
      paragraphs,
      /((?:Merci\s*,\s*et\s+encore\s+bienvenue)[^.?!]*[!?.])/i
    );

    const finalBlockParagraph = paragraphs.find((p) => {
      const t = normalize(stripTags(p));
      return t.includes(normalize("et il y a d")) && t.includes(normalize("facilitateurs")) && t.includes(normalize("esp"));
    });

    const splitFinalBlock = (pHtml: string | null | undefined): { final1Html: string | null; final2Html: string | null } => {
      if (!pHtml) return { final1Html: null, final2Html: null };
      const t = stripTags(pHtml)
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const marker = "À vous de les découvrir";
      const idx = t.toLowerCase().indexOf(marker.toLowerCase());
      if (idx === -1) return { final1Html: null, final2Html: null };

      const before = t.slice(0, idx).trim();
      const after = t.slice(idx).trim();
      return { final1Html: before || null, final2Html: after || null };
    };

    const { final1Html: final1Candidate, final2Html: final2Candidate } = splitFinalBlock(finalBlockParagraph);

    const findBy = (keywords: string[]) => {
      const kw = keywords.map(normalize);
      return (
        paragraphs.find((p) => {
          const t = normalize(stripTags(p));
          return kw.some((k) => k && t.includes(k));
        }) ?? null
      );
    };

    const welcomeWithoutThanksMid =
      paragraphs[0]?.replace(/Alors\s+merci[\s\S]*$/i, "").trim() || null;

    const thanksMidIndex = paragraphs.findIndex((p) => {
      const t = normalize(stripTags(p));
      return t.includes(normalize("alors merci")) && t.includes(normalize("bienvenue"));
    });

    // “Communauté” doit correspondre au paragraphe qui contient l'idée “petite communauté / bailleurs”.
    // Fallback: le paragraphe juste après “Alors merci et bienvenue !”.
    const communityCandidate =
      paragraphs.find((p) => {
        const t = normalize(stripTags(p));
        return (
          t.includes(normalize("quittance simple")) &&
          (t.includes(normalize("petite communaute")) ||
            (t.includes(normalize("bailleurs")) && t.includes(normalize("facilitent la vie"))))
        );
      }) ?? (thanksMidIndex >= 0 ? paragraphs[thanksMidIndex + 1] : null) ?? null;

    return {
      paragraphs,
      listItems,
      welcomeHtml: welcomeWithoutThanksMid,
      thanksMidHtml: thanksMidCandidate ?? null,
      communityHtml:
        (() => {
          if (!communityCandidate) return null;
          // Anti-doublon: si on retombe sur le paragraphe d'accueil, on bascule sur la valeur par défaut.
          const w0 = normalize(stripTags(paragraphs[0] ?? ""));
          const cc = normalize(stripTags(communityCandidate));
          if (w0 && cc && w0 === cc) return null;
          return communityCandidate;
        })(),
      boxHtml:
        paragraphs.find((p) => {
          const t = normalize(stripTags(p));
          return t.includes(normalize("espace")) && t.includes(normalize("bailleur"));
        }) ?? null,
      transitionHtml: findBy(["dedans"]) ?? null,
      listIntroHtml: findBy(["le premier", "automatiser"]) ?? null,
      conclusionHtml: findBy(["bref"]) ?? null,
      final1Html: final1Candidate,
      final2Html: final2Candidate,
      questionHtml: questionCandidate,
      thanksHtml: thanksCandidate,
    };
  };

  const parsedBody = hasCustomBody ? parseCampaignTextFromBodyHtml(bodyHtml) : null;

  const isFreeform = hasCustomBody && parsedBody && parsedBody.paragraphs.length > 0 && !parsedBody.boxHtml && !parsedBody.transitionHtml;
  if (isFreeform) {
    return buildCampaignFreeformHtml({
      prenomSafe,
      bodyHtml: replacePrenomTokens(bodyHtml!),
      ctaLabel,
      lienSafe,
      lienDesabonnementSafe,
      closingHtml: hasCustomClosing ? closingHtml! : undefined,
      photoVincentUrl,
      contactUrl,
    });
  }

  const defaultWelcomeHtml =
    "Vous avez créé une quittance récemment sur Quittance&nbsp;Simple et je voulais vous remercier et surtout vous souhaiter la bienvenue&nbsp;!";
  const defaultCommunityHtml =
    "Parce que Quittance&nbsp;Simple, c'est un peu comme une petite communauté&nbsp;: celle des bailleurs qui se facilitent la vie.";
  const defaultBoxHtml =
    `Et justement, pour vous faciliter la vie, je vous ai ouvert l'accès à votre <a href="${lienSafe}" style="color: #4A90E2; text-decoration: underline;">Espace&nbsp;Bailleur&nbsp;gratuit</a>.`;
  const defaultTransitionHtml = "Dedans, vous trouverez ce que j'appelle des «&nbsp;facilitateurs de vie&nbsp;».";
  const defaultListIntroHtml =
    "Le premier&nbsp;? <strong>Automatiser vos quittances</strong> sans refaire les mêmes manipulations tous les mois&nbsp;:";
  const defaultConclusionHtml =
    "Bref, l'idée est simple&nbsp;: ne plus perdre de temps avec Word,&nbsp;Excel, les copier-coller, les envois email, les exports&nbsp;PDF, les archives&nbsp;...";
  const defaultFinal1Html = "Et il y a d'autres facilitateurs dans votre&nbsp;Espace.";
  const defaultFinal2Html = "À vous de les découvrir&nbsp;— c'est gratuit&nbsp;!";
  const defaultQuestionHtml =
    "Petite question (je suis curieux)&nbsp;: combien de locataires gérez-vous aujourd'hui&nbsp;? Vous pouvez simplement répondre à cet&nbsp;email.";
  const defaultThanksHtml = "Merci, et encore bienvenue !";

  const bullet1Default = "Vos informations et celles de votre locataire sont <strong>déjà remplies</strong>";
  const bullet2Default = "Vos quittances peuvent s'envoyer <strong>100&nbsp;% automatiquement</strong>";
  const bullet3Default = "Ou <strong>en un seul clic</strong> si vous voulez plus de&nbsp;contrôle";

  const welcomeHtml =
    slotTextToHtml(slots?.welcome) ??
    parsedBody?.welcomeHtml ??
    defaultWelcomeHtml;
  const thanksMidHtml =
    slotTextToHtml(slots?.thanksMid) ??
    parsedBody?.thanksMidHtml ??
    "Alors merci et bienvenue !";
  const communityHtml =
    slotTextToHtml(slots?.community) ??
    parsedBody?.communityHtml ??
    defaultCommunityHtml;

  const safeBoxHtml =
    slotTextToHtml(slots?.box) ??
    (() => {
      const raw = parsedBody?.boxHtml;
      if (!raw) return defaultBoxHtml;
      const anchor = `<a href="${lienSafe}" style="color: #4A90E2; text-decoration: underline;">Espace&nbsp;Bailleur&nbsp;gratuit</a>`;
      return raw
        .replace(/Espace&nbsp;Bailleur&nbsp;gratuit/gi, anchor)
        .replace(/Espace\s*Bailleur\s*gratuit/gi, anchor);
    })();

  const transitionHtml =
    slotTextToHtml(slots?.transition) ??
    parsedBody?.transitionHtml ??
    defaultTransitionHtml;
  const listIntroHtml =
    slotTextToHtml(slots?.listIntro) ??
    parsedBody?.listIntroHtml ??
    defaultListIntroHtml;
  const conclusionHtml =
    slotTextToHtml(slots?.conclusion) ??
    parsedBody?.conclusionHtml ??
    defaultConclusionHtml;
  const final1Html =
    slotTextToHtml(slots?.final1) ??
    parsedBody?.final1Html ??
    defaultFinal1Html;
  const final2Html =
    slotTextToHtml(slots?.final2) ??
    parsedBody?.final2Html ??
    defaultFinal2Html;
  const questionHtml =
    slotTextToHtml(slots?.question) ??
    parsedBody?.questionHtml ??
    defaultQuestionHtml;
  const thanksHtml =
    slotTextToHtml(slots?.thanks) ??
    parsedBody?.thanksHtml ??
    defaultThanksHtml;

  const bullet1Html =
    slotTextToHtml(slots?.bullet1) ??
    parsedBody?.listItems?.[0] ??
    bullet1Default;
  const bullet2Html =
    slotTextToHtml(slots?.bullet2) ??
    parsedBody?.listItems?.[1] ??
    bullet2Default;
  const bullet3Html =
    slotTextToHtml(slots?.bullet3) ??
    parsedBody?.listItems?.[2] ??
    bullet3Default;

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
          
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                ${welcomeHtml}
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                ${thanksMidHtml}
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                ${communityHtml}
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #000000;">
                      ${safeBoxHtml}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                ${transitionHtml}
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 12px; font-size: 16px; line-height: 1.5; color: #000000;">
                ${listIntroHtml}
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
                      ${bullet1Html}
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
                      ${bullet2Html}
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
                      ${bullet3Html}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 18px 32px 0;">
              <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.5; color: #000000;">
                ${conclusionHtml}
              </p>
            </td>
          </tr>
          <tr>
            <td class="content" style="padding: 0 32px;">
              <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.5; color: #000000;">
                ${final1Html}
              </p>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #000000;">
                ${final2Html}
              </p>
            </td>
          </tr>
          
          
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
                ${questionHtml}
              </p>
            </td>
          </tr>
          
          <tr>
            <td class="content" style="padding: 0 32px 24px;">
              <p style="margin: 0; font-size: 16px; line-height: 1.5; color: #000000;">
                ${thanksHtml}
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
