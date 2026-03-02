import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `Tu es un expert en rédaction d'annonces immobilières attractives.
Ton rôle est d'améliorer une annonce tout en gardant EXACTEMENT les mêmes informations factuelles.

RÈGLES STRICTES :
- Ne change AUCUN chiffre (loyer, charges, surface, etc.)
- Ne change AUCUNE date
- Ne change AUCUNE adresse
- Garde toutes les proximités mentionnées
- Garde toutes les conditions/contraintes (garant, etc.)
- Garde la structure en sections avec "Titre :" (sans astérisques ni markdown)
- Ne change pas les libellés des sections ("Conditions :", "Proximités :")
- N'utilise JAMAIS de markdown (**gras**, etc.) - utilise uniquement du texte brut

CE QUE TU PEUX FAIRE SELON LE STYLE DEMANDÉ :
- Améliorer les tournures de phrases selon le style (sobre/chaleureux/dynamique)
- Rendre plus attractif et vendeur selon le style
- Utiliser des synonymes appropriés au style
- Ajouter des mots de liaison pour fluidifier
- Adapter le ton et le vocabulaire au style demandé

LONGUEUR : Maximum 250 mots (sans compter les sections Conditions et contraintes)`;

const STYLE_PROMPTS: Record<string, string> = {
  sobre: 'Style sobre et professionnel, neutre et factuel.',
  chaleureux: 'Style chaleureux et convivial, accueillant et rassurant.',
  dynamique: 'Style dynamique et moderne, énergique et attractif.',
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { annonce, style = 'sobre' } = body;

    if (!annonce) {
      return new Response(
        JSON.stringify({ error: "Annonce requise" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.sobre;
    const userPrompt = `Améliore cette annonce en style ${style} (${stylePrompt}) :

${annonce}

IMPORTANT :
- Garde TOUS les chiffres, dates et informations factuelles identiques
- Garde la structure avec les sections "Conditions :" et "Proximités :"
- N'utilise PAS de markdown (**gras**) - texte brut uniquement
- Adapte le TON et le VOCABULAIRE selon le style ${style} :
  * sobre : professionnel, neutre, factuel
  * chaleureux : convivial, accueillant, rassurant, bienveillant
  * dynamique : moderne, énergique, attractif, enthousiaste
- Change vraiment le style selon l'option choisie, ne garde pas le même texte !`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'amélioration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const enhancedAnnonce = data.choices?.[0]?.message?.content?.trim() || annonce;

    return new Response(
      JSON.stringify({ annonce: enhancedAnnonce }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Une erreur est survenue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
