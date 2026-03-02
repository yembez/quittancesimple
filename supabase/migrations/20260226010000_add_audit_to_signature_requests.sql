alter table if exists public.signature_requests
  add column if not exists audit jsonb not null default '{}'::jsonb;
