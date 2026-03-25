-- Optimisation safe Disk IO : index composites pour stats par campagne + date
-- (aucun changement fonctionnel, uniquement perf)

create index if not exists idx_campaign_cta_clicks_campaign_clicked_at
  on campaign_cta_clicks (campaign_key, clicked_at);

create index if not exists idx_campaign_opens_campaign_opened_at
  on campaign_opens (campaign_key, opened_at);

