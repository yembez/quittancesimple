import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function PowensCallback() {
  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        const code = params.get("code");
        const state = params.get("state");

        if (!code) {
          alert("Code de connexion Powens manquant.");
          return;
        }

        // Vérifier session utilisateur Supabase
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          alert("Vous devez être connecté pour finaliser la connexion bancaire.");
          window.location.href = "/login";
          return;
        }

        console.log("🔁 Callback Powens détecté :", { code, state, user: user.id });

        // Log côté Supabase pour debug
        await supabase.from("powens_callback_logs").insert({
          event_type: "callback_received",
          user_id: user.id,
          request_url: window.location.href,
          query_params: { code: code.substring(0, 20), state }
        });

        // APPEL À L’EDGE FUNCTION SUPABASE
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/powens-connect/exchange`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
              code,
              userId: user.id
            })
          }
        );

        if (!response.ok) {
          const errJSON = await response.json().catch(() => ({}));
          console.error("❌ Erreur powens-connect/exchange :", errJSON);

          await supabase.from("powens_callback_logs").insert({
            event_type: "exchange_error",
            user_id: user.id,
            error_message: errJSON.error || "Unknown exchange error",
            request_url: window.location.href
          });

          alert("Erreur lors de l'échange Powens");
          window.location.href = "/dashboard";
          return;
        }

        const data = await response.json();

        console.log("✅ Powens échange réussi :", data);

        await supabase.from("powens_callback_logs").insert({
          event_type: "exchange_success",
          user_id: user.id,
          response_body: data
        });

        // Redirection vers dashboard
        window.location.href = "/dashboard?powens=success";
      } catch (err: any) {
        console.error("❌ Erreur callback Powens :", err);

        await supabase.from("powens_callback_logs").insert({
          event_type: "callback_fatal_error",
          error_message: err.message,
          request_url: window.location.href
        });

        alert("Erreur interne lors de la connexion bancaire.");
        window.location.href = "/dashboard";
      }
    };

    run();
  }, []);

  return (
    <p style={{ padding: 20 }}>
      Connexion bancaire en cours… Veuillez patienter.
    </p>
  );
}
