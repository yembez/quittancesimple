/** Site public canonique pour les liens e-mail (aligné send-welcome-email, etc.) */
export const QS_SITE_EMAIL = "https://www.quittancesimple.fr";

/**
 * Les CTA ne doivent pas ouvrir `/dashboard` en premier chargement pour un invité :
 * le layout espace bailleur ne doit pas s’afficher sans session. On pointe vers l’accueil
 * avec `openLogin=1` et `returnUrl=/dashboard` ; l’app redirige tout de suite si une session existe.
 */
export function openLoginLandingInsteadOfDashboard(
  absoluteOrRelativeUrl: string,
  options: { fallbackLoginEmail: string },
): string {
  const SITE = QS_SITE_EMAIL;
  let u: URL;
  try {
    u = new URL(absoluteOrRelativeUrl, SITE);
  } catch {
    return absoluteOrRelativeUrl;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host !== "quittancesimple.fr" && host !== "localhost") {
    return absoluteOrRelativeUrl;
  }
  const path = (u.pathname.replace(/\/$/, "") || "/").toLowerCase();
  if (path !== "/dashboard") return absoluteOrRelativeUrl;

  const loginEmail = (
    u.searchParams.get("loginHint") ||
    u.searchParams.get("loginEmail") ||
    options.fallbackLoginEmail
  ).trim();
  const openRelance = u.searchParams.get("openRelance");

  const out = new URL(`${SITE}/`);
  out.searchParams.set("openLogin", "1");
  if (loginEmail) out.searchParams.set("loginEmail", loginEmail);
  out.searchParams.set("returnUrl", "/dashboard");
  if (openRelance) out.searchParams.set("postLoginOpenRelance", openRelance);
  return out.toString();
}

function attrAmpersandEscape(url: string): string {
  return url.replace(/&/g, "&amp;");
}

/**
 * Pour la campagne trial_auto_incomplete_lt20 : le corps peut contenir des liens bruts vers `/dashboard`
 * (HTML complet, copier-coller admin, `{{ lien_activation }}` mal configuré).
 * On force tout href vers le dashboard public vers la landing `openLogin` + `returnUrl`,
 * et on réécrit le paramètre `to=` des URLs `track-cta-click` si la cible est `/dashboard`.
 */
export function rewriteTrialDashboardLinksInHtml(html: string, recipientEmail: string): string {
  const email = recipientEmail.trim();
  const hintDashboard = `https://www.quittancesimple.fr/dashboard?loginHint=${encodeURIComponent(email)}`;
  const landing = openLoginLandingInsteadOfDashboard(hintDashboard, { fallbackLoginEmail: email });
  const safe = attrAmpersandEscape(landing);

  let out = html;

  out = out.replace(/href="(https?:\/\/[^/]+\/functions\/v1\/track-cta-click\?[^"]+)"/gi, (full, urlStr: string) => {
    try {
      const normalized = urlStr.replace(/&amp;/g, "&");
      const u = new URL(normalized);
      const toRaw = u.searchParams.get("to");
      if (!toRaw) return full;
      let decoded = toRaw;
      for (let d = 0; d < 4; d++) {
        try {
          const next = decodeURIComponent(decoded);
          if (next === decoded) break;
          decoded = next;
        } catch {
          break;
        }
      }
      let innerUrl: URL;
      try {
        innerUrl = new URL(decoded);
      } catch {
        return full;
      }
      const host = innerUrl.hostname.replace(/^www\./, "");
      const path = (innerUrl.pathname.replace(/\/$/, "") || "/").toLowerCase();
      if (host !== "quittancesimple.fr" || path !== "/dashboard") return full;
      const newTo = openLoginLandingInsteadOfDashboard(decoded, { fallbackLoginEmail: email });
      u.searchParams.set("to", newTo);
      return `href="${attrAmpersandEscape(u.toString())}"`;
    } catch {
      return full;
    }
  });

  out = out.replace(
    /href="https?:\/\/(www\.)?quittancesimple\.fr\/dashboard[^"]*"/gi,
    `href="${safe}"`,
  );
  out = out.replace(
    /href='https?:\/\/(www\.)?quittancesimple\.fr\/dashboard[^']*'/gi,
    `href='${safe}'`,
  );

  return out;
}
