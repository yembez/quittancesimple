-- Ajoute un stockage "slots" (Option A) pour éviter tout parsing de body_html.
-- Le template email garde la mise en page fixe, et l'admin édite uniquement les textes.

ALTER TABLE public.campaign_templates
ADD COLUMN IF NOT EXISTS slots jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Index léger utile pour filtres éventuels, sans coût élevé.
CREATE INDEX IF NOT EXISTS idx_campaign_templates_slots_gin
ON public.campaign_templates
USING gin (slots);

