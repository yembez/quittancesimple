-- Suivi des envois de campagne correctif J+2
ALTER TABLE public.proprietaires
ADD COLUMN IF NOT EXISTS campaign_j2_fix_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_proprietaires_campaign_j2_fix_sent_at
ON public.proprietaires (campaign_j2_fix_sent_at);

