-- Table pour suivre les ouvertures des e-mails de campagne (J+2, J+5, J+8)

create table if not exists public.campaign_opens (
  id bigint generated always as identity primary key,
  email text not null,
  campaign_key text not null check (campaign_key in ('j2', 'j5', 'j8')),
  opened_at timestamptz not null default now()
);

create index if not exists idx_campaign_opens_campaign_key on public.campaign_opens (campaign_key);
create index if not exists idx_campaign_opens_email on public.campaign_opens (email);

comment on table public.campaign_opens is 'Événements d''ouverture des e-mails de campagne (J+2, J+5, J+8).';
comment on column public.campaign_opens.email is 'Adresse e-mail du destinataire (normalisée en minuscule).';
comment on column public.campaign_opens.campaign_key is 'Clé de campagne : j2, j5 ou j8.';
comment on column public.campaign_opens.opened_at is 'Date/heure UTC de l''ouverture de l''e-mail.';

