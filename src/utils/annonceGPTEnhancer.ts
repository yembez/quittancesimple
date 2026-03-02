export type StyleAnnonce = 'sobre' | 'chaleureux' | 'dynamique';

const SYSTEM_PROMPT = `Tu es un expert en rédaction d'annonces immobilières attractives.
Ton rôle est d'améliorer une annonce tout en gardant EXACTEMENT les mêmes informations factuelles.

RÈGLES STRICTES :
- Ne change AUCUN chiffre (loyer, charges, surface, etc.)
- Ne change AUCUNE date
- Ne change AUCUNE adresse
- Garde toutes les proximités mentionnées
- Garde toutes les contraintes (garant, etc.)
- Garde la structure en sections avec **Titre en gras**
- Ne change pas les libellés des sections (**Informations pratiques**, **Proximités**, **À noter**)

CE QUE TU PEUX FAIRE :
- Améliorer les tournures de phrases
- Rendre plus attractif et vendeur
- Utiliser des synonymes appropriés
- Ajouter des mots de liaison
- Améliorer la fluidité du texte

LONGUEUR : Maximum 250 mots (sans compter les sections pratiques et contraintes)`;

const STYLE_PROMPTS: Record<StyleAnnonce, string> = {
  sobre: 'Style sobre et professionnel, neutre et factuel.',
  chaleureux: 'Style chaleureux et convivial, accueillant et rassurant.',
  dynamique: 'Style dynamique et moderne, énergique et attractif.',
};

export async function enhanceAnnonceWithGPT(
  templateAnnonce: string,
  style: StyleAnnonce = 'sobre'
): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const userPrompt = `Améliore cette annonce en style ${style} (${STYLE_PROMPTS[style]}) :

${templateAnnonce}

Rappel : Garde TOUS les chiffres, dates et informations factuelles identiques. Garde la structure avec les sections en gras.`;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/enhance-annonce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        annonce: templateAnnonce,
        style,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'amélioration');
    }

    const data = await response.json();
    return data.annonce || templateAnnonce;
  } catch (error: any) {
    console.error('Erreur GPT:', error);
    throw error;
  }
}
