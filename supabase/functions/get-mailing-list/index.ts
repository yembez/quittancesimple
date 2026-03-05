import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Mailing-List-Secret",
};

/** E-mails considérés comme tests : exclus de toute campagne. */
const EMAILS_TEST = new Set([
  "leachainais@gmail.com",
  "gillesalze@gmail.com",
  "2speek@gmail.com",
]);

const DOMAINE_TEST = "@maildrop.cc";
const PREFIX_TEST = "2speek";

function isEmailValidePourMailing(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const e = email.trim().toLowerCase();
  if (e.endsWith(DOMAINE_TEST)) return false;
  if (e.startsWith(PREFIX_TEST)) return false;
  if (EMAILS_TEST.has(e)) return false;
  return e.includes("@") && e.includes(".");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Méthode non autorisée" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const secret = Deno.env.get("MAILING_LIST_SECRET");
  const authHeader = req.headers.get("Authorization");
  const customHeader = req.headers.get("X-Mailing-List-Secret");
  const provided = customHeader || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
  if (!secret || provided !== secret) {
    return new Response(
      JSON.stringify({ error: "Non autorisé" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const segment = url.searchParams.get("segment") || "all"; // all | leads | trial | paid
    const format = url.searchParams.get("format") || "json"; // json | csv

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Configuration manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    let query = supabase
      .from("proprietaires")
      .select("id, email, nom, prenom, lead_statut, created_at, date_fin_essai, abonnement_actif")
      .not("email", "is", null)
      .not("email", "ilike", "%" + DOMAINE_TEST + "%")
      .or("mailing_desabonne.is.null,mailing_desabonne.eq.false");

    if (segment === "leads") {
      query = query.eq("lead_statut", "free_quittance_pdf");
    } else if (segment === "trial") {
      query = query.eq("lead_statut", "QA_1st_interested");
    } else if (segment === "paid") {
      query = query.in("lead_statut", ["QA_paid_subscriber", "QA_paying_customer"]);
    }

    const { data: rows, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("get-mailing-list error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: desabonnesRows } = await supabase.from("mailing_desabonnes").select("email");
    const desabonnesSet = new Set(
      (desabonnesRows || []).map((r: { email: string }) => r.email?.toLowerCase()).filter(Boolean)
    );

    const filtered = (rows || []).filter((r: { email?: string }) => {
      const e = (r.email || "").trim().toLowerCase();
      return isEmailValidePourMailing(r.email || "") && !desabonnesSet.has(e);
    });

    if (format === "csv") {
      const header = "email;nom;prenom;lead_statut;created_at\n";
      const lines = filtered.map(
        (r: { email: string; nom?: string; prenom?: string; lead_statut?: string; created_at?: string }) =>
          [r.email, r.nom ?? "", r.prenom ?? "", r.lead_statut ?? "", r.created_at ?? ""]
            .map((c) => `"${String(c).replace(/"/g, '""')}"`)
            .join(";")
      );
      const csv = header + lines.join("\n");
      return new Response(csv, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="mailing-list.csv"',
        },
      });
    }

    return new Response(
      JSON.stringify({
        total: filtered.length,
        segment,
        exclusions: "E-mails @maildrop.cc et 3 adresses test exclues.",
        emails: filtered.map((r: { id: string; email: string; nom?: string; prenom?: string; lead_statut?: string; created_at?: string }) => ({
          id: r.id,
          email: r.email,
          nom: r.nom ?? null,
          prenom: r.prenom ?? null,
          lead_statut: r.lead_statut ?? null,
          created_at: r.created_at ?? null,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("get-mailing-list:", err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
