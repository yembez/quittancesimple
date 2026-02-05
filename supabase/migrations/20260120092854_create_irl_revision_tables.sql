/*
  # Création des tables pour la révision de loyer IRL

  1. Nouvelles tables
    - `indices_irl`: Stocke les indices IRL par trimestre et année
      - `id` (uuid, primary key)
      - `annee` (integer) : Année de l'indice
      - `trimestre` (integer) : Trimestre (1, 2, 3, 4)
      - `valeur` (numeric) : Valeur de l'indice IRL
      - `created_at` (timestamptz)
    
    - `revisions_loyer`: Stocke les calculs de révision effectués
      - `id` (uuid, primary key)
      - `user_email` (text, nullable) : Email de l'utilisateur (si fourni)
      - `loyer_actuel` (numeric) : Loyer actuel
      - `nouveau_loyer` (numeric) : Nouveau loyer calculé
      - `date_bail` (date) : Date du bail
      - `trimestre_irl` (integer) : Trimestre IRL utilisé
      - `irl_ancien` (numeric) : Ancien indice IRL
      - `irl_nouveau` (numeric) : Nouvel indice IRL
      - `gain_mensuel` (numeric) : Gain mensuel
      - `gain_annuel` (numeric) : Gain annuel
      - `bailleur_nom` (text, nullable)
      - `bailleur_adresse` (text, nullable)
      - `bailleur_email` (text, nullable)
      - `locataire_nom` (text, nullable)
      - `locataire_adresse` (text, nullable)
      - `locataire_email` (text, nullable)
      - `lettre_pdf_url` (text, nullable) : URL du PDF généré
      - `created_at` (timestamptz)
    
    - `rappels_nouveau_loyer`: Stocke les rappels pour appliquer le nouveau loyer
      - `id` (uuid, primary key)
      - `revision_id` (uuid) : Référence à la révision
      - `email` (text) : Email pour le rappel
      - `nouveau_loyer` (numeric) : Nouveau loyer
      - `date_rappel` (date) : Date prévue du rappel
      - `envoye` (boolean) : Statut d'envoi
      - `date_envoi` (timestamptz, nullable)
      - `created_at` (timestamptz)
    
    - `commandes_recommande`: Stocke les commandes d'envoi en recommandé
      - `id` (uuid, primary key)
      - `revision_id` (uuid) : Référence à la révision
      - `type_envoi` (text) : 'electronique' ou 'postal'
      - `prix_ht` (numeric)
      - `prix_ttc` (numeric)
      - `statut` (text) : 'pending', 'paid', 'sent', 'delivered', 'failed'
      - `stripe_payment_intent_id` (text, nullable)
      - `suivi_numero` (text, nullable) : Numéro de suivi
      - `preuve_envoi_url` (text, nullable)
      - `preuve_reception_url` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour permettre l'insertion publique (anonyme) avec restrictions
    - Politiques de lecture selon l'email de l'utilisateur
*/

-- Table des indices IRL
CREATE TABLE IF NOT EXISTS indices_irl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  annee integer NOT NULL,
  trimestre integer NOT NULL CHECK (trimestre >= 1 AND trimestre <= 4),
  valeur numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(annee, trimestre)
);

ALTER TABLE indices_irl ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tout le monde peut lire les indices IRL"
  ON indices_irl FOR SELECT
  TO public
  USING (true);

-- Table des révisions de loyer
CREATE TABLE IF NOT EXISTS revisions_loyer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  loyer_actuel numeric NOT NULL,
  nouveau_loyer numeric NOT NULL,
  date_bail date NOT NULL,
  trimestre_irl integer NOT NULL CHECK (trimestre_irl >= 1 AND trimestre_irl <= 4),
  irl_ancien numeric NOT NULL,
  irl_nouveau numeric NOT NULL,
  gain_mensuel numeric NOT NULL,
  gain_annuel numeric NOT NULL,
  bailleur_nom text,
  bailleur_adresse text,
  bailleur_email text,
  locataire_nom text,
  locataire_adresse text,
  locataire_email text,
  lettre_pdf_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE revisions_loyer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent créer des révisions"
  ON revisions_loyer FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Utilisateurs peuvent voir leurs révisions"
  ON revisions_loyer FOR SELECT
  TO public
  USING (user_email = current_setting('request.jwt.claims', true)::json->>'email' OR user_email IS NULL);

-- Table des rappels
CREATE TABLE IF NOT EXISTS rappels_nouveau_loyer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id uuid REFERENCES revisions_loyer(id) ON DELETE CASCADE,
  email text NOT NULL,
  nouveau_loyer numeric NOT NULL,
  date_rappel date NOT NULL,
  envoye boolean DEFAULT false,
  date_envoi timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rappels_nouveau_loyer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent créer des rappels"
  ON rappels_nouveau_loyer FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Utilisateurs peuvent voir leurs rappels"
  ON rappels_nouveau_loyer FOR SELECT
  TO public
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Table des commandes recommandé
CREATE TABLE IF NOT EXISTS commandes_recommande (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id uuid REFERENCES revisions_loyer(id) ON DELETE SET NULL,
  type_envoi text NOT NULL CHECK (type_envoi IN ('electronique', 'postal')),
  prix_ht numeric NOT NULL,
  prix_ttc numeric NOT NULL,
  statut text DEFAULT 'pending' CHECK (statut IN ('pending', 'paid', 'sent', 'delivered', 'failed')),
  stripe_payment_intent_id text,
  suivi_numero text,
  preuve_envoi_url text,
  preuve_reception_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commandes_recommande ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent créer des commandes"
  ON commandes_recommande FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Utilisateurs peuvent voir leurs commandes via revision"
  ON commandes_recommande FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM revisions_loyer r
      WHERE r.id = commandes_recommande.revision_id
      AND (r.user_email = current_setting('request.jwt.claims', true)::json->>'email' OR r.bailleur_email = current_setting('request.jwt.claims', true)::json->>'email')
    )
  );

-- Insérer les indices IRL (données mock - à jour jusqu'en 2025)
INSERT INTO indices_irl (annee, trimestre, valeur) VALUES
  (2022, 1, 133.93),
  (2022, 2, 135.67),
  (2022, 3, 137.14),
  (2022, 4, 138.59),
  (2023, 1, 139.30),
  (2023, 2, 139.98),
  (2023, 3, 140.59),
  (2023, 4, 141.47),
  (2024, 1, 142.18),
  (2024, 2, 142.80),
  (2024, 3, 143.48),
  (2024, 4, 144.23),
  (2025, 1, 144.90),
  (2025, 2, 145.50),
  (2025, 3, 146.10),
  (2025, 4, 146.70)
ON CONFLICT (annee, trimestre) DO NOTHING;
