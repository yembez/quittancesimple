import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PoiItem {
  type: string;
  label?: string;
  name?: string;
  distance_m?: number;
  distance_text?: string;
  walk_min?: number;
  /** Libellé générique pour l'annonce, ex: "Commerces à 100 m", "Bus, métro, gare à 30 m" */
  label_annonce?: string;
}

interface RequestBody {
  typeBien: string;
  meubleVide: string;
  ville: string;
  quartier?: string | null;
  surface: number;
  nombrePieces: number;
  etage?: number | null;
  loyerHC: number;
  charges: number;
  totalCC: number;
  caution?: number;
  dateDisponibilite: string;
  styleAnnonce: string;
  tags: string[];
  contraintes: string[];
  residenceSecurisee?: boolean;
  titlesOnly?: boolean;
  pois?: PoiItem[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: RequestBody = await req.json();
    const {
      typeBien,
      meubleVide,
      ville,
      quartier,
      surface,
      nombrePieces,
      etage,
      loyerHC,
      charges,
      totalCC,
      caution = 1,
      dateDisponibilite,
      styleAnnonce,
      tags,
      contraintes,
      residenceSecurisee = false,
      titlesOnly = false,
      pois = [],
    } = body;

    if (!ville || !surface || !loyerHC || !nombrePieces) {
      return new Response(
        JSON.stringify({ error: "Ville, surface, loyer HC et nombre de pièces sont requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Construire la localisation
    const localisation = quartier ? `${quartier}, ${ville}` : ville;
    const typeAppartement = nombrePieces === 1 ? "studio" : nombrePieces === 2 ? "T2" : nombrePieces === 3 ? "T3" : nombrePieces === 4 ? "T4" : `T${nombrePieces}`;
    
    const tagsText = tags && tags.length > 0 ? tags.join(", ") : "";
    const contraintesText = contraintes && contraintes.length > 0 ? contraintes.join(", ") : "";
    
    // Gérer la disponibilité : si date <= aujourd'hui → "Disponible dès aujourd'hui", sinon "Disponible à partir du [Date]"
    let disponibiliteText = "disponible immédiatement";
    if (dateDisponibilite) {
      const dateDispo = new Date(dateDisponibilite);
      const aujourdhui = new Date();
      aujourdhui.setHours(0, 0, 0, 0);
      dateDispo.setHours(0, 0, 0, 0);
      
      if (dateDispo <= aujourdhui) {
        disponibiliteText = "Disponible dès aujourd'hui";
      } else {
        const jour = dateDispo.getDate();
        const mois = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"][dateDispo.getMonth()];
        const annee = dateDispo.getFullYear();
        disponibiliteText = `Disponible à partir du ${jour} ${mois} ${annee}`;
      }
    }

    // Déterminer la longueur selon le style
    const longueurInstructions = styleAnnonce === "Court" 
      ? "Annonce très concise, environ 100 mots."
      : styleAnnonce === "Détaillé"
        ? "Annonce complète et détaillée, environ 300 mots."
        : "Annonce standard, environ 200 mots.";

    if (titlesOnly) {
      // Générer uniquement 3 titres
      const promptTitres = `Tu es un expert immobilier. Propose 3 variantes de titres percutants pour une annonce immobilière.

INFORMATIONS SUR LE BIEN :
Type de bien : ${typeBien}
Meublé ou vide : ${meubleVide}
Localisation : ${localisation}
Surface : ${surface}m²
Nombre de pièces : ${nombrePieces} (${typeAppartement})
${tagsText ? `Points forts : ${tagsText}` : ""}

Génère 3 titres différents, chacun sur une seule ligne, factuels mais accrocheurs. Pas d'emojis. Format : un titre par ligne, numérotés 1, 2, 3.`;

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
              content: "Tu es un expert en rédaction de titres d'annonces immobilières. Tu proposes des titres factuels, accrocheurs et sans emojis.",
            },
            {
              role: "user",
              content: promptTitres,
            },
          ],
          max_tokens: 150,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", errorText);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la génération des titres" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const data = await response.json();
      const titresText = data.choices?.[0]?.message?.content?.trim() || "";
      const titres = titresText.split("\n")
        .map((t: string) => t.replace(/^\d+\.\s*/, "").trim())
        .filter((t: string) => t.length > 0)
        .slice(0, 3);

      return new Response(
        JSON.stringify({ titres }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Choisir le modèle d'annonce selon type de bien et cible (A=coloc, B=familial/vide, C=urbain meublé)
    let modeleAnnonce: "A" | "B" | "C" = "B";
    if (typeBien === "Chambre en colocation") modeleAnnonce = "A";
    else if (typeBien === "Studio" || (typeBien === "Appartement" && meubleVide === "Meublé" && nombrePieces <= 2)) modeleAnnonce = "C";
    else if ((typeBien === "Appartement" || typeBien === "Maison") && meubleVide === "Vide") modeleAnnonce = "B";
    else modeleAnnonce = meubleVide === "Meublé" ? "C" : "B";

    const modelesDesc: Record<"A" | "B" | "C", string> = {
      A: `MODÈLE A "All-Inclusive" (cible : étudiants, jeunes actifs, colocation). Structure : Titre type "Chambre avec services - [Quartier/Ville] - [2-3 atouts]". Description : Une chambre se libère dans un logement de [Surface] m² [rénové si dans les points forts], [localisation/calme si pertinent], ambiance calme et conviviale. Bloc "Le Confort Tout Inclus" : [Loyer HC] € + [Charges] € = [Total CC] €, détail des charges (eau, électricité, chauffage, fibre, ménage commun) si pertinent. Bloc "Services +" : équipements en tirets (cuisine, buanderie, jardin) uniquement ce qui est fourni. Conditions : bail individuel, APL si éligible, pas de frais d'agence, signature électronique/visite visio si proposé.`,
      B: `MODÈLE B "Familial / Longue durée" (cible : appartement vide, couples, familles). Structure : Titre type "Bel appartement [Nombre] pièces - [Ville] - [Atout si fourni]". Description : Situé [Quartier/Ville], appartement de [Surface] m² : séjour, [X] chambre(s), rangements. Bloc "Vie de quartier" uniquement si infos (écoles, commerces, parc, stationnement) dans les points forts. Finances : Loyer [Loyer HC] € + [Charges] €. Dépôt de garantie seulement si fourni. "Le mot du propriétaire" : gestion directe, locataires sérieux, garanties (Visale/garant) si dans les contraintes.`,
      C: `MODÈLE C "Coup de Cœur Urbain" (cible : studio/T2 meublé, cadres, urbains). Structure : Titre type "[Type] rénové - [Ville] - [2 atouts]". Description : [Studio/Appartement] de [Surface] m² [rénové si dans les points forts], pièce de vie, cuisine ouverte, salle d'eau. Équipements en tirets (mobilier, isolation, fibre) uniquement ce qui est fourni. Localisation (centre, transports) seulement si "Proche transports" ou équivalent dans les points forts. Conditions : Loyer [Total CC] € CC, location directe propriétaire, [Disponibilité].`,
    };
    const modeleInstruction = `Tu dois t'inspirer du ${modelesDesc[modeleAnnonce]} Adapte cette structure aux seules informations fournies ci-dessous. N'invente ni temps de transport, ni dépôt de garantie, ni détails non fournis.`;

    // Préparer les informations sur les POI
    const poiCommerces = pois.find(p => p.type === "commerce");
    const poiEcoles = pois.find(p => p.type === "ecole");
    const poiParc = pois.find(p => p.type === "parc");
    const hasJardin = tags.includes("Jardin");
    const hasAscenseur = tags.includes("Ascenseur");
    const hasCommodites = poiCommerces || poiEcoles || tags.includes("Proche transports");

    // Générer l'annonce complète + titres
    const prompt = `Tu es un expert immobilier. Rédige une annonce sobre et factuelle selon le style (court/standard/détaillé) et le modèle indiqué. N'utilise aucun emoji.

${modeleInstruction}

RÈGLES DE REMPLISSAGE OBLIGATOIRES :
1. DÉBUT DE L'ANNONCE : Commence toujours par "Mise en location d'un joli ${typeBien.toLowerCase()}" ou "Mise en location d'un bel ${typeBien.toLowerCase()}" selon le contexte.
${residenceSecurisee ? `2. RÉSIDENCE SÉCURISÉE : Mentionne "dans une résidence sécurisée calme et tranquille" dans la description.` : ""}
${etage != null ? `3. ÉTAGE : Mentionne "L'appartement se situe au ${etage}${etage === 1 ? "er" : "ème"} étage"${hasAscenseur ? " avec ascenseur" : ""}.` : ""}
${hasCommodites ? `4. COMMODITÉS : Mentionne "Agréable à vivre" et "Proche de toute commodité" si pertinent.` : ""}
${poiCommerces ? `5. COMMERCES : Mentionne "Les commerces sont à moins de ${poiCommerces.distance_text}" dans l'annonce.` : ""}
${poiEcoles ? `6. ÉCOLES : Mentionne "Les écoles sont à moins de 10 minutes" si pertinent.` : ""}
${poiParc ? `7. PARC : Mentionne "Vous pourrez profiter du parc à ${poiParc.distance_text}" dans l'annonce.` : ""}
${hasJardin ? `8. JARDIN : Mentionne "Vous pourrez profiter du jardin" dans l'annonce.` : ""}

RÈGLES GÉNÉRALES :
- Ne débute jamais un paragraphe par "Ce", "Cette", "Cet". Utilise "L'appartement...", "Le studio...", "La maison...", "La chambre..." selon le type de bien.

Paragraphes de description : ne débute jamais un paragraphe par "Ce", "Cette", "Cet". Utilise à la place "L'appartement...", "Le studio...", "La maison...", "La chambre..." selon le type de bien (ex. "L'appartement se compose de...", "Le studio dispose de...").

Chambre en colocation (Modèle A uniquement) : ne jamais attribuer à "la chambre" des équipements ou espaces qui sont ceux du logement partagé. Interdit : "La chambre a une cuisine", "La chambre est équipée d'un jardin", "La chambre dispose d'une cuisine". À la place : "Le logement dispose d'une cuisine équipée", "Cuisine commune", "Accès au jardin", "Parties communes : cuisine, buanderie, jardin".

Points forts : liste les atouts par des tirets sans écrire le titre "Points forts" ou "Points forts :" au-dessus. Ne mentionne la localisation (quartier, proximité) dans les points forts que si elle est explicitement un atout dans les informations fournies (ex. "Calme", "Proche transports") ; sinon ne pas en faire un point fort.

Phrases à bannir (surtout en mode détaillé) : n'utilise jamais de formules enjoliveuses ou pompeuses. Interdiction explicite des tournures du type : "idéal pour...", "offrant ainsi...", "apportant une flexibilité...", "permettant aux futurs locataires de...", "facilitant ainsi...", "à votre convenance", "selon vos besoins", "espace fonctionnel pour...", "personnaliser leur intérieur", "installation rapide". Décris les faits bruts (pièces, surface, équipements) sans ajouter de conclusion valorisante. Pas d'enjolivement : si tu dis "cuisine équipée", tu t'arrêtes là ; tu n'ajoutes pas "idéal pour la préparation des repas" ou "offrant un espace fonctionnel".

RÈGLES STRICTES :
- Ne rien inventer. Utilise uniquement les informations que je te donne.
- Ton neutre et factuel. Pas de familiarité excessive, pas de "bonjour" au début.
- Pas d'emojis.
- Pas de phrases commerciales type agence ("rare", "à saisir", "exceptionnel", "coup de cœur", "pépite", "à ne pas manquer").
- Pas de superlatifs excessifs ou de langage marketing.
- N'enjolive pas l'info : pas de "idéal pour", "offrant ainsi", "apportant", "permettant de", "facilitant", "à votre convenance", "selon vos besoins". Reste factuel, phrase courte.
- Évite les appréciations et jugements de valeur. Ne dis pas "ce qui est toujours un plus", "ce qui rend plus pratique", etc.
- Présente les faits de manière neutre, sans conclure par une phrase de valorisation.
- Structure : suis le modèle (A, B ou C) indiqué en début de prompt ; les titres de blocs ("Le Confort Tout Inclus", "Vie de quartier", "Finances", "Le mot du propriétaire", "Équipements", "Localisation", "Conditions") sont autorisés quand ils correspondent au modèle.
- À la fin de l'annonce, ajoute un message neutre du type : "N'hésitez pas à me contacter via la messagerie si vous avez des questions."

INFORMATIONS SUR LE BIEN :
Type de bien : ${typeBien}
Meublé ou vide : ${meubleVide}
Localisation : ${localisation}
${quartier ? `Quartier/Secteur : ${quartier}` : ""}
Surface : ${surface}m²
Nombre de pièces : ${nombrePieces} (${typeAppartement})
${etage != null ? `Étage : ${etage}${hasAscenseur ? " (avec ascenseur)" : ""}` : ""}
${residenceSecurisee ? "Résidence sécurisée : Oui" : ""}
Loyer hors charges : ${loyerHC}€ par mois
Charges mensuelles : ${charges}€ par mois
Total charges comprises : ${totalCC}€ CC par mois
Caution : ${caution} ${caution === 1 ? "mois" : "mois"} de loyer
Disponibilité : ${disponibiliteText}
${tagsText ? `Points forts : ${tagsText}` : ""}
${contraintesText ? `Contraintes : ${contraintesText}` : ""}
${pois.length > 0 ? `Points d'intérêt à proximité (utiliser les libellés exacts fournis) :\n${pois.map((p: PoiItem) => p.label_annonce ? `- ${p.label_annonce}` : `- ${p.label ?? ""}: ${p.name ?? ""} (${p.distance_text ?? ""}${p.walk_min != null && p.walk_min <= 20 ? `, ${p.walk_min} min à pied` : ""})`).join("\n")}` : ""}

${longueurInstructions}

Rédige maintenant l'annonce de manière neutre et factuelle. Présente les informations sans appréciations ni jugements de valeur.`;

    const promptTitres = `Propose 3 variantes de titres percutants pour cette annonce immobilière.

Type de bien : ${typeBien} ${typeAppartement} ${surface}m² ${meubleVide.toLowerCase()} - ${localisation}
${tagsText ? `Points forts : ${tagsText}` : ""}

Génère 3 titres différents, chacun sur une seule ligne, factuels mais accrocheurs. Pas d'emojis. Format : un titre par ligne, numérotés 1, 2, 3.`;

    // Générer l'annonce et les titres en parallèle
    const [annonceResponse, titresResponse] = await Promise.all([
      fetch("https://api.openai.com/v1/chat/completions", {
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
            content: "Tu rédiges des annonces immobilières neutres et factuelles. Tu utilises 'L'appartement', 'Le studio', 'La maison', 'La chambre' au lieu de 'Ce/Cette/Cet'. Tu restes factuel, sans enjoliver.",
          },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: styleAnnonce === "Court" ? 400 : styleAnnonce === "Détaillé" ? 800 : 600,
          temperature: 0.4,
        }),
      }),
      fetch("https://api.openai.com/v1/chat/completions", {
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
              content: "Tu es un expert en rédaction de titres d'annonces immobilières. Tu proposes des titres factuels, accrocheurs et sans emojis.",
            },
            {
              role: "user",
              content: promptTitres,
            },
          ],
          max_tokens: 150,
          temperature: 0.5,
        }),
      }),
    ]);

    if (!annonceResponse.ok || !titresResponse.ok) {
      const errorText = await annonceResponse.text();
      console.error("OpenAI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération de l'annonce" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [annonceData, titresData] = await Promise.all([
      annonceResponse.json(),
      titresResponse.json(),
    ]);

    const annonce = annonceData.choices?.[0]?.message?.content?.trim() || "Erreur lors de la génération";
    const titresText = titresData.choices?.[0]?.message?.content?.trim() || "";
    const titres = titresText.split("\n")
      .map((t: string) => t.replace(/^\d+\.\s*/, "").trim())
      .filter((t: string) => t.length > 0)
      .slice(0, 3);

    return new Response(
      JSON.stringify({ annonce, titres }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
