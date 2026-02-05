/*
  # Cr\u00e9ation de la table des demandes d'envoi recommand\u00e9

  1. Nouvelle Table
    - `registered_mail_requests`
      - `id` (uuid, primary key)
      - `proprietaire_id` (uuid, r\u00e9f\u00e9rence vers proprietaires)
      - `baillor_name` (text) - Nom du bailleur
      - `baillor_address` (text) - Adresse du bailleur
      - `locataire_name` (text) - Nom du locataire
      - `locataire_address` (text) - Adresse du locataire
      - `logement_address` (text) - Adresse du logement
      - `ancien_loyer` (numeric) - Ancien loyer
      - `nouveau_loyer` (numeric) - Nouveau loyer
      - `irl_ancien` (numeric) - IRL ancien
      - `irl_nouveau` (numeric) - IRL nouveau
      - `trimestre` (integer) - Trimestre de r\u00e9f\u00e9rence
      - `annee_ancienne` (integer) - Ann\u00e9e ancienne
      - `annee_nouvelle` (integer) - Ann\u00e9e nouvelle
      - `date_bail` (text) - Date de signature du bail
      - `send_mode` (text) - Mode d'envoi (electronique ou postal)
      - `pdf_url` (text) - URL du PDF g\u00e9n\u00e9r\u00e9
      - `stripe_payment_intent` (text) - ID du paiement Stripe
      - `status` (text) - Statut (pending, processing, sent, failed)
      - `created_at` (timestamptz) - Date de cr\u00e9ation
      - `processed_at` (timestamptz) - Date de traitement
      - `tracking_number` (text) - Num\u00e9ro de suivi (une fois trait\u00e9)

  2. S\u00e9curit\u00e9
    - Enable RLS
    - Policy pour permettre aux utilisateurs authentifi\u00e9s de cr\u00e9er leurs demandes
    - Policy pour permettre aux utilisateurs de voir leurs propres demandes
    - Policy pour permettre au service role d'acc\u00e9der \u00e0 toutes les demandes
*/

CREATE TABLE IF NOT EXISTS registered_mail_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proprietaire_id uuid REFERENCES proprietaires(id) ON DELETE CASCADE,
  baillor_name text NOT NULL,
  baillor_address text NOT NULL,
  locataire_name text NOT NULL,
  locataire_address text NOT NULL,
  logement_address text NOT NULL,
  ancien_loyer numeric NOT NULL,
  nouveau_loyer numeric NOT NULL,
  irl_ancien numeric NOT NULL,
  irl_nouveau numeric NOT NULL,
  trimestre integer NOT NULL,
  annee_ancienne integer NOT NULL,
  annee_nouvelle integer NOT NULL,
  date_bail text,
  send_mode text NOT NULL CHECK (send_mode IN ('electronique', 'postal')),
  pdf_url text,
  stripe_payment_intent text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  tracking_number text
);

ALTER TABLE registered_mail_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own registered mail requests"
  ON registered_mail_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = proprietaire_id);

CREATE POLICY "Users can view their own registered mail requests"
  ON registered_mail_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = proprietaire_id);

CREATE POLICY "Service role can access all registered mail requests"
  ON registered_mail_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);