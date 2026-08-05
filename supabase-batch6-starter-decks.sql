-- Worlds Under Siege — Batch 6 cloud starter deck storage
-- Run this entire file once in Supabase: SQL Editor → New query → Run.

create table if not exists public.player_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  gold integer not null default 0 check (gold >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  quantity integer not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.starter_decks (
  id text primary key,
  name text not null,
  commander_card_id text not null,
  price integer not null check (price >= 0)
);

create table if not exists public.starter_deck_cards (
  starter_deck_id text not null references public.starter_decks(id) on delete cascade,
  card_id text not null,
  quantity integer not null check (quantity > 0),
  display_order integer not null,
  max_owned integer not null default 3 check (max_owned > 0),
  duplicate_gold integer not null default 0 check (duplicate_gold >= 0),
  primary key (starter_deck_id, card_id)
);

create table if not exists public.player_starter_decks (
  user_id uuid not null references auth.users(id) on delete cascade,
  starter_deck_id text not null references public.starter_decks(id),
  purchased_at timestamptz not null default now(),
  primary key (user_id, starter_deck_id)
);

create table if not exists public.portrait_unlocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

insert into public.starter_decks (id, name, commander_card_id, price)
values
  ('eternal-night', 'Eternal Night', 'SD1-002', 1000),
  ('legends-of-camelot', 'Legends of Camelot', 'SD1-001', 1000),
  ('wild-dominion', 'Wild Dominion', 'SD1-003', 1000)
on conflict (id) do update
set name = excluded.name,
    commander_card_id = excluded.commander_card_id,
    price = excluded.price;

insert into public.starter_deck_cards (
  starter_deck_id,
  card_id,
  quantity,
  display_order,
  max_owned,
  duplicate_gold
)
values
  ('eternal-night', 'BOA-212', 1, 1, 1, 2),
  ('eternal-night', 'BOA-194', 1, 2, 1, 2),
  ('eternal-night', 'BOA-196', 1, 3, 3, 2),
  ('eternal-night', 'BOA-195', 1, 4, 1, 2),
  ('eternal-night', 'BOA-023', 1, 5, 3, 2),
  ('eternal-night', 'BOA-025', 1, 6, 3, 2),
  ('eternal-night', 'BOA-029', 2, 7, 3, 2),
  ('eternal-night', 'BOA-113', 2, 8, 3, 2),
  ('eternal-night', 'BOA-091', 2, 9, 3, 2),
  ('eternal-night', 'BOA-034', 2, 10, 3, 2),
  ('eternal-night', 'BOA-033', 2, 11, 3, 2),
  ('eternal-night', 'BOA-128', 2, 12, 3, 2),
  ('eternal-night', 'BOA-148', 2, 13, 3, 2),
  ('eternal-night', 'BOA-024', 2, 14, 3, 2),
  ('eternal-night', 'BOA-130', 2, 15, 3, 2),
  ('eternal-night', 'BOA-131', 2, 16, 3, 2),
  ('eternal-night', 'BOA-031', 2, 17, 3, 2),
  ('eternal-night', 'BOA-159', 1, 18, 3, 2),
  ('eternal-night', 'BOA-173', 2, 19, 3, 2),
  ('eternal-night', 'BOA-136', 1, 20, 3, 2),
  ('eternal-night', 'BOA-146', 1, 21, 3, 2),
  ('eternal-night', 'BOA-115', 2, 22, 3, 2),
  ('eternal-night', 'BOA-127', 2, 23, 3, 2),
  ('eternal-night', 'BOA-171', 1, 24, 3, 2),
  ('eternal-night', 'BOA-125', 1, 25, 3, 2),
  ('eternal-night', 'BOA-110', 2, 26, 3, 2),
  ('eternal-night', 'BOA-150', 1, 27, 3, 2),
  ('eternal-night', 'BOA-081', 1, 28, 3, 2),
  ('eternal-night', 'BOA-026', 2, 29, 3, 2),
  ('eternal-night', 'BOA-123', 2, 30, 3, 2),
  ('eternal-night', 'BOA-157', 2, 31, 3, 2),
  ('eternal-night', 'BOA-032', 2, 32, 3, 2),
  ('eternal-night', 'BOA-132', 1, 33, 3, 2),
  ('eternal-night', 'BOA-105', 1, 34, 3, 2),
  ('eternal-night', 'BOA-135', 1, 35, 3, 2),
  ('eternal-night', 'BOA-030', 1, 36, 3, 2),
  ('eternal-night', 'BOA-138', 1, 37, 3, 2),
  ('eternal-night', 'BOA-035', 1, 38, 3, 2),
  ('eternal-night', 'BOA-022', 1, 39, 3, 2),
  ('eternal-night', 'BOA-134', 1, 40, 3, 2),
  ('eternal-night', 'BOA-021', 1, 41, 3, 2),
  ('eternal-night', 'BOA-092', 1, 42, 3, 2),
  ('eternal-night', 'BOA-152', 1, 43, 3, 2),
  ('eternal-night', 'BOA-013', 1, 44, 3, 2),
  ('eternal-night', 'SD1-002', 1, 45, 3, 2),
  ('legends-of-camelot', 'BOA-211', 1, 1, 1, 2),
  ('legends-of-camelot', 'BOA-191', 1, 2, 1, 2),
  ('legends-of-camelot', 'BOA-192', 1, 3, 1, 2),
  ('legends-of-camelot', 'BOA-193', 1, 4, 1, 2),
  ('legends-of-camelot', 'BOA-155', 1, 5, 3, 2),
  ('legends-of-camelot', 'BOA-151', 1, 6, 3, 2),
  ('legends-of-camelot', 'BOA-101', 2, 7, 3, 2),
  ('legends-of-camelot', 'BOA-119', 2, 8, 3, 2),
  ('legends-of-camelot', 'BOA-177', 1, 9, 3, 2),
  ('legends-of-camelot', 'BOA-122', 2, 10, 3, 2),
  ('legends-of-camelot', 'BOA-103', 2, 11, 3, 2),
  ('legends-of-camelot', 'BOA-012', 2, 12, 3, 2),
  ('legends-of-camelot', 'BOA-201', 1, 13, 1, 2),
  ('legends-of-camelot', 'BOA-009', 2, 14, 3, 2),
  ('legends-of-camelot', 'BOA-019', 2, 15, 3, 2),
  ('legends-of-camelot', 'BOA-017', 2, 16, 3, 2),
  ('legends-of-camelot', 'BOA-006', 2, 17, 3, 2),
  ('legends-of-camelot', 'BOA-007', 2, 18, 3, 2),
  ('legends-of-camelot', 'BOA-010', 2, 19, 3, 2),
  ('legends-of-camelot', 'BOA-016', 2, 20, 3, 2),
  ('legends-of-camelot', 'BOA-129', 1, 21, 3, 2),
  ('legends-of-camelot', 'BOA-118', 2, 22, 3, 2),
  ('legends-of-camelot', 'BOA-116', 2, 23, 3, 2),
  ('legends-of-camelot', 'BOA-011', 2, 24, 3, 2),
  ('legends-of-camelot', 'BOA-170', 1, 25, 3, 2),
  ('legends-of-camelot', 'BOA-121', 2, 26, 3, 2),
  ('legends-of-camelot', 'BOA-018', 1, 27, 3, 2),
  ('legends-of-camelot', 'BOA-015', 1, 28, 3, 2),
  ('legends-of-camelot', 'BOA-005', 2, 29, 3, 2),
  ('legends-of-camelot', 'BOA-014', 2, 30, 3, 2),
  ('legends-of-camelot', 'BOA-123', 2, 31, 3, 2),
  ('legends-of-camelot', 'BOA-167', 1, 32, 3, 2),
  ('legends-of-camelot', 'BOA-102', 2, 33, 3, 2),
  ('legends-of-camelot', 'BOA-104', 1, 34, 3, 2),
  ('legends-of-camelot', 'BOA-166', 1, 35, 3, 2),
  ('legends-of-camelot', 'BOA-120', 1, 36, 3, 2),
  ('legends-of-camelot', 'BOA-168', 1, 37, 3, 2),
  ('legends-of-camelot', 'BOA-008', 1, 38, 3, 2),
  ('legends-of-camelot', 'BOA-004', 1, 39, 3, 2),
  ('legends-of-camelot', 'BOA-124', 1, 40, 3, 2),
  ('legends-of-camelot', 'BOA-158', 1, 41, 3, 2),
  ('legends-of-camelot', 'BOA-003', 1, 42, 3, 2),
  ('legends-of-camelot', 'BOA-169', 1, 43, 3, 2),
  ('legends-of-camelot', 'SD1-001', 1, 44, 3, 2),
  ('wild-dominion', 'BOA-218', 1, 1, 1, 2),
  ('wild-dominion', 'BOA-198', 1, 2, 1, 2),
  ('wild-dominion', 'BOA-196', 1, 3, 3, 2),
  ('wild-dominion', 'BOA-199', 1, 4, 1, 2),
  ('wild-dominion', 'BOA-155', 2, 5, 3, 2),
  ('wild-dominion', 'BOA-206', 1, 6, 1, 2),
  ('wild-dominion', 'BOA-037', 1, 7, 3, 2),
  ('wild-dominion', 'BOA-101', 2, 8, 3, 2),
  ('wild-dominion', 'BOA-205', 1, 9, 1, 2),
  ('wild-dominion', 'BOA-095', 2, 10, 3, 2),
  ('wild-dominion', 'BOA-099', 2, 11, 3, 2),
  ('wild-dominion', 'BOA-103', 2, 12, 3, 2),
  ('wild-dominion', 'BOA-055', 2, 13, 3, 2),
  ('wild-dominion', 'BOA-060', 2, 14, 3, 2),
  ('wild-dominion', 'BOA-117', 1, 15, 3, 2),
  ('wild-dominion', 'BOA-180', 1, 16, 3, 2),
  ('wild-dominion', 'BOA-147', 2, 17, 3, 2),
  ('wild-dominion', 'BOA-146', 2, 18, 3, 2),
  ('wild-dominion', 'BOA-096', 2, 19, 3, 2),
  ('wild-dominion', 'BOA-047', 1, 20, 3, 2),
  ('wild-dominion', 'BOA-145', 3, 21, 3, 2),
  ('wild-dominion', 'BOA-156', 1, 22, 3, 2),
  ('wild-dominion', 'BOA-069', 1, 23, 3, 2),
  ('wild-dominion', 'BOA-097', 2, 24, 3, 2),
  ('wild-dominion', 'BOA-041', 2, 25, 3, 2),
  ('wild-dominion', 'BOA-094', 2, 26, 3, 2),
  ('wild-dominion', 'BOA-106', 2, 27, 3, 2),
  ('wild-dominion', 'BOA-140', 2, 28, 3, 2),
  ('wild-dominion', 'BOA-044', 2, 29, 3, 2),
  ('wild-dominion', 'BOA-098', 2, 30, 3, 2),
  ('wild-dominion', 'BOA-123', 2, 31, 3, 2),
  ('wild-dominion', 'BOA-161', 1, 32, 3, 2),
  ('wild-dominion', 'BOA-142', 1, 33, 3, 2),
  ('wild-dominion', 'BOA-139', 1, 34, 3, 2),
  ('wild-dominion', 'BOA-093', 2, 35, 3, 2),
  ('wild-dominion', 'BOA-100', 2, 36, 3, 2),
  ('wild-dominion', 'BOA-164', 1, 37, 3, 2),
  ('wild-dominion', 'BOA-063', 1, 38, 3, 2),
  ('wild-dominion', 'BOA-088', 1, 39, 3, 2),
  ('wild-dominion', 'BOA-162', 1, 40, 3, 2),
  ('wild-dominion', 'BOA-092', 1, 41, 3, 2),
  ('wild-dominion', 'SD1-003', 1, 42, 3, 2)
on conflict (starter_deck_id, card_id) do update
set quantity = excluded.quantity,
    display_order = excluded.display_order,
    max_owned = excluded.max_owned,
    duplicate_gold = excluded.duplicate_gold;

alter table public.player_wallets enable row level security;
alter table public.player_cards enable row level security;
alter table public.player_starter_decks enable row level security;
alter table public.portrait_unlocks enable row level security;
alter table public.starter_decks enable row level security;
alter table public.starter_deck_cards enable row level security;

grant select on public.player_wallets to authenticated;
grant select on public.player_cards to authenticated;
grant select on public.player_starter_decks to authenticated;
grant select on public.portrait_unlocks to authenticated;
grant select on public.starter_decks to authenticated;
grant select on public.starter_deck_cards to authenticated;

drop policy if exists "Players read own wallet" on public.player_wallets;
create policy "Players read own wallet"
on public.player_wallets
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players read own cards" on public.player_cards;
create policy "Players read own cards"
on public.player_cards
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players read own starter decks" on public.player_starter_decks;
create policy "Players read own starter decks"
on public.player_starter_decks
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Players read own portraits" on public.portrait_unlocks;
create policy "Players read own portraits"
on public.portrait_unlocks
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users read starter catalog" on public.starter_decks;
create policy "Authenticated users read starter catalog"
on public.starter_decks
for select to authenticated
using (true);

drop policy if exists "Authenticated users read starter card catalog" on public.starter_deck_cards;
create policy "Authenticated users read starter card catalog"
on public.starter_deck_cards
for select to authenticated
using (true);

create or replace function public.ensure_player_wallet()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.player_wallets (user_id, gold)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_wallet_created on auth.users;
create trigger on_auth_user_wallet_created
after insert on auth.users
for each row execute procedure public.ensure_player_wallet();

insert into public.player_wallets (user_id, gold)
select id, 0
from auth.users
on conflict (user_id) do nothing;

create or replace function public.purchase_starter_deck(
  requested_starter_deck_id text
)
returns table (
  ok boolean,
  reason text,
  gold integer,
  added integer,
  converted integer,
  gold_earned integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  deck_price integer;
  commander_id text;
  wallet_gold integer;
  added_total integer := 0;
  converted_total integer := 0;
  earned_total integer := 0;
  card_row record;
  owned_quantity integer;
  add_quantity integer;
  extra_quantity integer;
begin
  if current_user_id is null then
    return query select false, 'not-authenticated', 0, 0, 0, 0;
    return;
  end if;

  select price, commander_card_id
  into deck_price, commander_id
  from public.starter_decks
  where id = requested_starter_deck_id;

  if deck_price is null then
    return query select false, 'invalid-starter-deck', 0, 0, 0, 0;
    return;
  end if;

  if exists (
    select 1
    from public.player_starter_decks
    where user_id = current_user_id
      and starter_deck_id = requested_starter_deck_id
  ) then
    select w.gold into wallet_gold
    from public.player_wallets w
    where w.user_id = current_user_id;

    return query select false, 'already-owned', coalesce(wallet_gold, 0), 0, 0, 0;
    return;
  end if;

  insert into public.player_wallets (user_id, gold)
  values (current_user_id, 0)
  on conflict (user_id) do nothing;

  select w.gold into wallet_gold
  from public.player_wallets w
  where w.user_id = current_user_id
  for update;

  if wallet_gold < deck_price then
    return query select false, 'insufficient-gold', wallet_gold, 0, 0, 0;
    return;
  end if;

  update public.player_wallets
  set gold = gold - deck_price,
      updated_at = now()
  where user_id = current_user_id;

  for card_row in
    select *
    from public.starter_deck_cards
    where starter_deck_id = requested_starter_deck_id
    order by display_order
  loop
    select coalesce(pc.quantity, 0)
    into owned_quantity
    from public.player_cards pc
    where pc.user_id = current_user_id
      and pc.card_id = card_row.card_id;

    owned_quantity := coalesce(owned_quantity, 0);
    add_quantity := greatest(
      0,
      least(card_row.quantity, card_row.max_owned - owned_quantity)
    );
    extra_quantity := card_row.quantity - add_quantity;

    if add_quantity > 0 then
      insert into public.player_cards (user_id, card_id, quantity, updated_at)
      values (current_user_id, card_row.card_id, add_quantity, now())
      on conflict (user_id, card_id) do update
      set quantity = public.player_cards.quantity + excluded.quantity,
          updated_at = now();

      added_total := added_total + add_quantity;
    end if;

    if extra_quantity > 0 then
      converted_total := converted_total + extra_quantity;
      earned_total := earned_total + (extra_quantity * card_row.duplicate_gold);
    end if;
  end loop;

  if earned_total > 0 then
    update public.player_wallets
    set gold = gold + earned_total,
        updated_at = now()
    where user_id = current_user_id;
  end if;

  insert into public.player_starter_decks (user_id, starter_deck_id)
  values (current_user_id, requested_starter_deck_id);

  insert into public.portrait_unlocks (user_id, card_id)
  values (current_user_id, commander_id)
  on conflict (user_id, card_id) do nothing;

  select w.gold into wallet_gold
  from public.player_wallets w
  where w.user_id = current_user_id;

  return query
  select true, null::text, wallet_gold, added_total, converted_total, earned_total;
end;
$$;

revoke all on function public.purchase_starter_deck(text) from public;
grant execute on function public.purchase_starter_deck(text) to authenticated;
