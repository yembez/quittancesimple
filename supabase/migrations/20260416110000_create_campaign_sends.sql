-- Idempotence / anti-doublons pour les envois de campagnes (incl. segment trial_auto_incomplete_lt20).
-- Objectif : empêcher qu'une même adresse reçoive plusieurs fois la même campagne, même si l'admin relance,
-- si un cron est exécuté deux fois, ou en cas de retries.

create table if not exists public.campaign_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_key text not null,
  email text not null,
  sent_at timestamptz not null default now()
);

-- Un même (campaign_key, email) ne doit exister qu'une fois.
create unique index if not exists uq_campaign_sends_campaign_email
  on public.campaign_sends (campaign_key, email);

create index if not exists idx_campaign_sends_campaign_key on public.campaign_sends (campaign_key);
create index if not exists idx_campaign_sends_email on public.campaign_sends (email);
create index if not exists idx_campaign_sends_sent_at on public.campaign_sends (sent_at);

alter table public.campaign_sends enable row level security;
-- Aucune policy : seules les Edge Functions (service role) peuvent insérer/lire.

comment on table public.campaign_sends is 'Enregistrements d’envoi (idempotence) pour éviter les doublons par campagne et destinataire.';
comment on column public.campaign_sends.campaign_key is 'Identifiant de campagne/segment (ex: j2, j5, j8, trial_auto_incomplete_lt20).';
comment on column public.campaign_sends.email is 'Adresse e-mail du destinataire (idéalement normalisée en minuscule).';
comment on column public.campaign_sends.sent_at is 'Date/heure UTC où l’envoi a été accepté par Resend.';

