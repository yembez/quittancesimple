-- Table pour enregistrer les clics sur les CTA des e-mails de campagne (J+2, J+5, J+8).
-- Permet de mesurer l’efficacité des campagnes depuis l’admin.
CREATE TABLE IF NOT EXISTS campaign_cta_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_key text NOT NULL CHECK (campaign_key IN ('j2', 'j5', 'j8')),
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_cta_clicks_campaign_key ON campaign_cta_clicks(campaign_key);
CREATE INDEX IF NOT EXISTS idx_campaign_cta_clicks_clicked_at ON campaign_cta_clicks(clicked_at);

ALTER TABLE campaign_cta_clicks ENABLE ROW LEVEL SECURITY;

-- Aucune politique : seules les Edge Functions (service role) peuvent insérer/lire.

COMMENT ON TABLE campaign_cta_clicks IS 'Enregistrement des clics sur les liens CTA des e-mails de campagne (J+2, J+5, J+8).';
