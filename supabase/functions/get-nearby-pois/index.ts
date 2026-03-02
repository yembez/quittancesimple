import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const USER_AGENT = "QuittanceSimple/1.0 (contact@quittancesimple.fr)";

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Arrondir à la dizaine inférieure
function roundDownToTen(m: number): number {
  return Math.floor(m / 10) * 10;
}

function distanceText(m: number): string {
  const rounded = roundDownToTen(m);
  if (rounded < 500) return `${rounded} m`;
  if (rounded < 1000) return `${(rounded / 1000).toFixed(1)} km`;
  return `${Math.round(rounded / 1000)} km`;
}

// Calculer le temps de marche approximatif
// 100m = 3 minutes, jamais 0 : on affiche toujours au moins "< 2 min" pour très courtes distances
function walkTimeMinutes(m: number): number {
  // 100m = 3 minutes, donc 1 minute ≈ 33.3 m
  const calculatedMinutes = Math.round(m / 33.3);
  // Jamais 0 : minimum 2 minutes (affichage "< 2 min" si très proche)
  return Math.max(2, calculatedMinutes);
}

// Texte affiché pour le temps de marche (jamais "0 minute")
function walkTimeDisplay(min: number): string {
  if (min < 1) return "< 2 min";
  return min === 1 ? "1 minute" : `${min} minutes`;
}

// Vérifier si la distance est avantageuse
// 15 min à pied ≈ 1.2 km (vitesse moyenne 5 km/h)
// 10 min en voiture ≈ 10 km (vitesse moyenne 60 km/h en zone rurale)
function isAdvantageous(distance_m: number, isRural: boolean = false): boolean {
  if (isRural) {
    return distance_m <= 10000; // 10 km en voiture
  }
  return distance_m <= 1200; // 1.2 km à pied (15 min)
}

// Libellés génériques pour l'annonce (pas de noms de lieux)
const TYPE_LABELS: Record<string, string> = {
  ecole: "Écoles",
  commerce: "Commerces",
  transport: "Bus, métro, gare",
  parc: "Parc",
  centre_ville: "Centre-ville",
};

interface PoiGeneric {
  type: string;
  distance_m: number;
  distance_text: string;
  walk_min?: number;
  label_annonce: string; // ex: "Écoles à 5 minutes à pied (50 m)"
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const adresse = (body.adresse || "").trim();
    const ville = (body.ville || "").trim();
    const quartier = (body.quartier || "").trim();

    // Priorité : adresse complète, sinon ville + quartier
    const query = adresse
      ? `${adresse}, France`
      : quartier
        ? `${quartier}, ${ville}, France`
        : ville
          ? `${ville}, France`
          : "";

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Adresse ou ville requise" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
    nominatimUrl.searchParams.set("q", query);
    nominatimUrl.searchParams.set("format", "json");
    nominatimUrl.searchParams.set("limit", "1");

    const geoRes = await fetch(nominatimUrl.toString(), {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!geoRes.ok) {
      return new Response(
        JSON.stringify({ error: "Géocodage impossible" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geoData = await geoRes.json();
    if (!Array.isArray(geoData) || geoData.length === 0) {
      return new Response(
        JSON.stringify({ error: "Adresse introuvable", pois: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lat, lon, address } = geoData[0];
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const cityFromGeo = address?.city || address?.town || address?.village || address?.municipality || ville || "";

    const radius = 2000;
    const overpassQuery = `
[out:json][timeout:25];
(
  node["amenity"="school"](around:${radius},${latNum},${lonNum});
  way["amenity"="school"](around:${radius},${latNum},${lonNum});
  relation["amenity"="school"](around:${radius},${latNum},${lonNum});
  node["amenity"="college"](around:${radius},${latNum},${lonNum});
  way["amenity"="college"](around:${radius},${latNum},${lonNum});
  relation["amenity"="college"](around:${radius},${latNum},${lonNum});
  node["amenity"="university"](around:${radius},${latNum},${lonNum});
  way["amenity"="university"](around:${radius},${latNum},${lonNum});
  relation["amenity"="university"](around:${radius},${latNum},${lonNum});
  node["shop"](around:${radius},${latNum},${lonNum});
  way["shop"](around:${radius},${latNum},${lonNum});
  relation["shop"](around:${radius},${latNum},${lonNum});
  node["amenity"="restaurant"](around:${radius},${latNum},${lonNum});
  way["amenity"="restaurant"](around:${radius},${latNum},${lonNum});
  relation["amenity"="restaurant"](around:${radius},${latNum},${lonNum});
  node["amenity"="cafe"](around:${radius},${latNum},${lonNum});
  way["amenity"="cafe"](around:${radius},${latNum},${lonNum});
  relation["amenity"="cafe"](around:${radius},${latNum},${lonNum});
  node["public_transport"="station"](around:${radius},${latNum},${lonNum});
  way["public_transport"="station"](around:${radius},${latNum},${lonNum});
  relation["public_transport"="station"](around:${radius},${latNum},${lonNum});
  node["railway"="station"](around:${radius},${latNum},${lonNum});
  way["railway"="station"](around:${radius},${latNum},${lonNum});
  relation["railway"="station"](around:${radius},${latNum},${lonNum});
  node["railway"="halt"](around:${radius},${latNum},${lonNum});
  way["railway"="halt"](around:${radius},${latNum},${lonNum});
  relation["railway"="halt"](around:${radius},${latNum},${lonNum});
  node["leisure"="park"](around:${radius},${latNum},${lonNum});
  way["leisure"="park"](around:${radius},${latNum},${lonNum});
  relation["leisure"="park"](around:${radius},${latNum},${lonNum});
  node["leisure"="recreation_ground"](around:${radius},${latNum},${lonNum});
  way["leisure"="recreation_ground"](around:${radius},${latNum},${lonNum});
  relation["leisure"="recreation_ground"](around:${radius},${latNum},${lonNum});
  node["leisure"="garden"](around:${radius},${latNum},${lonNum});
  way["leisure"="garden"](around:${radius},${latNum},${lonNum});
  relation["leisure"="garden"](around:${radius},${latNum},${lonNum});
  node["landuse"="recreation_ground"](around:${radius},${latNum},${lonNum});
  way["landuse"="recreation_ground"](around:${radius},${latNum},${lonNum});
  relation["landuse"="recreation_ground"](around:${radius},${latNum},${lonNum});
);
out center;
`;

    let overpassData: any = null;
    let elements: any[] = [];
    
    try {
      const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery,
        headers: { "Content-Type": "text/plain" },
      });

      if (overpassRes.ok) {
        overpassData = await overpassRes.json();
        elements = overpassData.elements || [];
        
        // Log pour debug
        console.log(`Found ${elements.length} POI elements near ${latNum}, ${lonNum}`);
      } else {
        const errorText = await overpassRes.text();
        console.error("Overpass API error:", errorText);
      }
    } catch (e) {
      console.error("Error fetching from Overpass:", e);
    }

    // Détecter si zone rurale (distance au centre-ville > 5 km)
    let isRural = false;
    let centreVilleDist = Infinity;
    const villeForCentre = (cityFromGeo || ville || query).replace(/,.*/, "").trim();
    if (villeForCentre) {
      try {
        const centreUrl = new URL("https://nominatim.openstreetmap.org/search");
        centreUrl.searchParams.set("q", `centre ${villeForCentre}, France`);
        centreUrl.searchParams.set("format", "json");
        centreUrl.searchParams.set("limit", "1");
        const centreRes = await fetch(centreUrl.toString(), { headers: { "User-Agent": USER_AGENT } });
        if (centreRes.ok) {
          const centreData = await centreRes.json();
          if (Array.isArray(centreData) && centreData.length > 0) {
            const c = centreData[0];
            if (c.lat && c.lon) {
              centreVilleDist = Math.round(haversineDistance(latNum, lonNum, parseFloat(c.lat), parseFloat(c.lon)));
              isRural = centreVilleDist > 5000; // > 5 km du centre-ville = zone rurale
            }
          }
        }
      } catch (e) {
        console.error("Error fetching centre-ville:", e);
        // En cas d'erreur, on considère comme urbain par défaut
        isRural = false;
      }
    }

    const minByTag: Record<string, { dist: number }> = {};

    if (elements.length > 0) {

      for (const el of elements) {
        // Pour les way et relation, utiliser le centre géographique
        let elLat: number | null = null;
        let elLon: number | null = null;
        
        if (el.type === "node") {
          elLat = el.lat;
          elLon = el.lon;
        } else if (el.type === "way" || el.type === "relation") {
          // Utiliser le centre si disponible, sinon calculer depuis les bounds
          if (el.center) {
            elLat = el.center.lat;
            elLon = el.center.lon;
          } else if (el.bounds) {
            // Calculer le centre depuis les bounds
            elLat = (el.bounds.minlat + el.bounds.maxlat) / 2;
            elLon = (el.bounds.minlon + el.bounds.maxlon) / 2;
          }
        }
        
        if (elLat == null || elLon == null) continue;

        const dist = Math.round(haversineDistance(latNum, lonNum, elLat, elLon));

        let tag = "autre";
        if (el.tags?.amenity === "school" || el.tags?.amenity === "college" || el.tags?.amenity === "university")
          tag = "ecole";
        else if (el.tags?.amenity === "restaurant" || el.tags?.amenity === "cafe" || el.tags?.shop) tag = "commerce";
        else if (el.tags?.public_transport === "station" || el.tags?.railway === "station" || el.tags?.railway === "halt")
          tag = "transport";
        else if (el.tags?.leisure === "park" || el.tags?.leisure === "recreation_ground" || el.tags?.leisure === "garden" || el.tags?.landuse === "recreation_ground")
          tag = "parc";

        if (!minByTag[tag] || dist < minByTag[tag].dist) minByTag[tag] = { dist };
      }
    }

    const results: PoiGeneric[] = [];
    const order = ["ecole", "commerce", "transport", "parc"];
    for (const tag of order) {
      const o = minByTag[tag];
      if (!o) continue;
      
      // Arrondir à la dizaine inférieure
      const distRounded = roundDownToTen(o.dist);
      
      // Filtrer selon critères d'avantageux
      if (!isAdvantageous(distRounded, isRural)) continue;
      
      const label = TYPE_LABELS[tag] || tag;
      const distance_text = distanceText(distRounded);
      const walkMin = walkTimeMinutes(distRounded);
      // Format : "Écoles à 5 minutes à pied (50 m)" si <= 15 min (jamais "0 minute")
      const label_annonce = walkMin <= 15 
        ? `${label} à ${walkTimeDisplay(walkMin)} à pied (${distance_text})`
        : `${label} à ${distance_text}`;
      
      results.push({
        type: tag,
        distance_m: distRounded,
        distance_text,
        walk_min: walkMin <= 15 ? walkMin : undefined,
        label_annonce,
      });
    }


    // Centre-ville : toujours ajouter si trouvé, même si un peu loin (jusqu'à 2 km en urbain, 10 km en rural)
    if (villeForCentre && centreVilleDist !== Infinity) {
      const distRounded = roundDownToTen(centreVilleDist);
      // En zone urbaine : jusqu'à 2 km, en zone rurale : jusqu'à 10 km
      const maxDistanceCentreVille = isRural ? 10000 : 2000;
      if (distRounded <= maxDistanceCentreVille) {
        const distance_text = distanceText(distRounded);
        const walkMin = walkTimeMinutes(distRounded);
        const label_annonce = walkMin <= 15 
          ? `Centre-ville à ${walkTimeDisplay(walkMin)} à pied (${distance_text})`
          : `Centre-ville à ${distance_text}`;
        results.push({
          type: "centre_ville",
          distance_m: distRounded,
          distance_text,
          walk_min: walkMin <= 15 ? walkMin : undefined,
          label_annonce,
        });
      }
    }

    results.sort((a, b) => a.distance_m - b.distance_m);

    // Log pour debug
    console.log(`Returning ${results.length} POIs:`, results.map(r => r.label_annonce));
    console.log(`Centre-ville distance: ${centreVilleDist !== Infinity ? centreVilleDist + 'm' : 'not found'}, isRural: ${isRural}`);

    return new Response(
      JSON.stringify({
        lat: latNum,
        lon: lonNum,
        query,
        pois: results,
        debug: {
          elementsFound: elements.length,
          isRural,
          centreVilleDist: centreVilleDist !== Infinity ? centreVilleDist : null,
          minByTag: Object.keys(minByTag).map(k => ({ type: k, dist: minByTag[k].dist })),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Error in get-nearby-pois:", e);
    return new Response(
      JSON.stringify({ 
        error: e.message || "Erreur serveur", 
        pois: [],
        details: e.stack || String(e)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
