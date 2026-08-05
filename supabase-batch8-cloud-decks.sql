-- Worlds Under Siege — Batch 8 cloud deck saving
-- Run this once in Supabase: SQL Editor → New query → Run.

create table if not exists public.player_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 48),
  deck_data jsonb not null default
    '{"mainDeck":{},"stronghold":null,"armies":[]}'::jsonb,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists player_decks_user_updated_idx
on public.player_decks (user_id, updated_at desc);

alter table public.player_decks enable row level security;

grant select, insert, update, delete
on public.player_decks
to authenticated;

drop policy if exists "Players read own decks" on public.player_decks;
create policy "Players read own decks"
on public.player_decks
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players create own decks" on public.player_decks;
create policy "Players create own decks"
on public.player_decks
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Players update own decks" on public.player_decks;
create policy "Players update own decks"
on public.player_decks
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Players delete own decks" on public.player_decks;
create policy "Players delete own decks"
on public.player_decks
for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_player_deck_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists player_decks_set_updated_at
on public.player_decks;

create trigger player_decks_set_updated_at
before update on public.player_decks
for each row execute procedure public.set_player_deck_updated_at();

create or replace function public.enforce_player_deck_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  select count(*)
  into current_count
  from public.player_decks
  where user_id = new.user_id;

  if current_count >= 10 then
    raise exception 'A player may save no more than 10 decks';
  end if;

  return new;
end;
$$;

drop trigger if exists player_decks_limit
on public.player_decks;

create trigger player_decks_limit
before insert on public.player_decks
for each row execute procedure public.enforce_player_deck_limit();
