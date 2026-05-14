-- Archive public market participant wallet lists into a private table, then
-- clear the public markets.participants column.
--
-- Run this from the Supabase SQL editor or via your normal migration runner.
-- The new table intentionally has RLS enabled with no client read/write policy;
-- use the backend service role for wallet-scoped position discovery instead.

begin;

create table if not exists public.private_market_participants (
  market_id text not null,
  wallet_address text not null,
  archived_from_public_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (market_id, wallet_address)
);

alter table public.private_market_participants enable row level security;

revoke all on table public.private_market_participants from anon;
revoke all on table public.private_market_participants from authenticated;

do $$
declare
  participants_type text;
  participants_udt text;
begin
  select data_type, udt_name
    into participants_type, participants_udt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'markets'
    and column_name = 'participants';

  if participants_type is null then
    raise notice 'public.markets.participants does not exist; nothing to archive.';
    return;
  end if;

  if participants_type = 'ARRAY' and participants_udt = '_text' then
    insert into public.private_market_participants (market_id, wallet_address)
    select
      market_id::text,
      lower(trim(wallet_address))
    from public.markets
    cross join lateral unnest(participants) as wallet_address
    where wallet_address is not null
      and trim(wallet_address) <> ''
    on conflict (market_id, wallet_address) do nothing;

    update public.markets
      set participants = '{}'::text[]
    where participants is not null
      and cardinality(participants) > 0;

    return;
  end if;

  if participants_type = 'jsonb' then
    insert into public.private_market_participants (market_id, wallet_address)
    select
      market_id::text,
      lower(trim(wallet_address))
    from public.markets
    cross join lateral jsonb_array_elements_text(participants) as wallet_address
    where jsonb_typeof(participants) = 'array'
      and trim(wallet_address) <> ''
    on conflict (market_id, wallet_address) do nothing;

    update public.markets
      set participants = '[]'::jsonb
    where participants is not null
      and jsonb_typeof(participants) = 'array'
      and jsonb_array_length(participants) > 0;

    return;
  end if;

  raise notice 'public.markets.participants has unsupported type %.%, leaving it unchanged.',
    participants_type,
    participants_udt;
end $$;

comment on table public.private_market_participants is
  'Private archive of wallet-to-market participation. Do not expose through public market metadata.';

commit;
