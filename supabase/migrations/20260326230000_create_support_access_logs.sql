-- Journalisation des accès support (impersonation via magic link).
-- Aucun accès public : uniquement Edge Functions avec service_role.

create table if not exists public.support_access_logs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  admin_label text not null default 'admin_support',
  target_email text not null,
  reason text not null default '',
  redirect_path text not null default '/dashboard',
  link_type text not null default 'magiclink',
  user_agent text not null default ''
);

create index if not exists idx_support_access_logs_target_email_created_at
on public.support_access_logs (target_email, created_at desc);

alter table public.support_access_logs enable row level security;
-- Pas de policy : lecture/écriture uniquement via service_role (Edge Functions).

