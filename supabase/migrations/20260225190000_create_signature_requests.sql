-- Signature électronique des baux (max 3 signataires)

create table if not exists public.signature_requests (
  id uuid primary key default gen_random_uuid(),
  bail_id uuid not null,
  document_hash text not null,
  document_url text not null,
  token text not null unique,
  token_expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'signed', 'expired')),
  signers jsonb not null,
  owner_signature jsonb not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  constraint signature_requests_signers_is_array check (
    jsonb_typeof(signers) = 'array'
    and jsonb_array_length(signers) <= 3
    and jsonb_array_length(signers) >= 1
  )
);

create index if not exists idx_signature_requests_token on public.signature_requests(token);
create index if not exists idx_signature_requests_bail_id on public.signature_requests(bail_id);
create index if not exists idx_signature_requests_status on public.signature_requests(status);
create index if not exists idx_signature_requests_expires on public.signature_requests(token_expires_at);

alter table if exists public.baux
  add column if not exists signature_status text default 'draft';

alter table if exists public.baux
  add column if not exists signed_document_url text;

alter table if exists public.baux
  add constraint baux_signature_status_check
  check (signature_status in ('draft', 'pending', 'signed'))
  not valid;

alter table public.signature_requests enable row level security;

drop policy if exists "signature_requests_select_owner" on public.signature_requests;
create policy "signature_requests_select_owner"
on public.signature_requests
for select
to authenticated
using (
  (owner_signature ->> 'owner_user_id') = auth.uid()::text
);

drop policy if exists "signature_requests_update_owner" on public.signature_requests;
create policy "signature_requests_update_owner"
on public.signature_requests
for update
to authenticated
using (
  (owner_signature ->> 'owner_user_id') = auth.uid()::text
)
with check (
  (owner_signature ->> 'owner_user_id') = auth.uid()::text
);

drop policy if exists "signature_requests_insert_owner" on public.signature_requests;
create policy "signature_requests_insert_owner"
on public.signature_requests
for insert
to authenticated
with check (
  (owner_signature ->> 'owner_user_id') = auth.uid()::text
);
