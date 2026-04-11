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
