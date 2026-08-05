-- Worlds Under Siege — Starter Deck three-copy limit
-- Run after the Batch 6 starter deck SQL.

alter table public.player_starter_decks
add column if not exists purchase_count integer not null default 1;

alter table public.player_starter_decks
drop constraint if exists player_starter_decks_purchase_count_check;

alter table public.player_starter_decks
add constraint player_starter_decks_purchase_count_check
check (purchase_count between 1 and 3);

create or replace function public.purchase_starter_deck(
  requested_starter_deck_id text
)
returns table (
  ok boolean,
  reason text,
  gold integer,
  added integer,
  converted integer,
  gold_earned integer,
  purchase_count integer,
  remaining integer
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
  existing_purchase_count integer := 0;
  new_purchase_count integer;
  added_total integer := 0;
  converted_total integer := 0;
  earned_total integer := 0;
  card_row record;
  owned_quantity integer;
  add_quantity integer;
  extra_quantity integer;
begin
  if current_user_id is null then
    return query select false, 'not-authenticated', 0, 0, 0, 0, 0, 3;
    return;
  end if;

  select price, commander_card_id
  into deck_price, commander_id
  from public.starter_decks
  where id = requested_starter_deck_id;

  if deck_price is null then
    return query select false, 'invalid-starter-deck', 0, 0, 0, 0, 0, 3;
    return;
  end if;

  select coalesce(psd.purchase_count, 0)
  into existing_purchase_count
  from public.player_starter_decks psd
  where psd.user_id = current_user_id
    and psd.starter_deck_id = requested_starter_deck_id;

  existing_purchase_count := coalesce(existing_purchase_count, 0);

  if existing_purchase_count >= 3 then
    select w.gold into wallet_gold
    from public.player_wallets w
    where w.user_id = current_user_id;

    return query
    select false, 'sold-out', coalesce(wallet_gold, 0), 0, 0, 0, 3, 0;
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
    return query
    select false, 'insufficient-gold', wallet_gold, 0, 0, 0,
           existing_purchase_count, 3 - existing_purchase_count;
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
      insert into public.player_cards (
        user_id,
        card_id,
        quantity,
        updated_at
      )
      values (
        current_user_id,
        card_row.card_id,
        add_quantity,
        now()
      )
      on conflict (user_id, card_id) do update
      set quantity = public.player_cards.quantity + excluded.quantity,
          updated_at = now();

      added_total := added_total + add_quantity;
    end if;

    if extra_quantity > 0 then
      converted_total := converted_total + extra_quantity;
      earned_total :=
        earned_total + (extra_quantity * card_row.duplicate_gold);
    end if;
  end loop;

  if earned_total > 0 then
    update public.player_wallets
    set gold = gold + earned_total,
        updated_at = now()
    where user_id = current_user_id;
  end if;

  new_purchase_count := existing_purchase_count + 1;

  insert into public.player_starter_decks (
    user_id,
    starter_deck_id,
    purchase_count,
    purchased_at
  )
  values (
    current_user_id,
    requested_starter_deck_id,
    new_purchase_count,
    now()
  )
  on conflict (user_id, starter_deck_id) do update
  set purchase_count = excluded.purchase_count,
      purchased_at = now();

  insert into public.portrait_unlocks (user_id, card_id)
  values (current_user_id, commander_id)
  on conflict (user_id, card_id) do nothing;

  select w.gold into wallet_gold
  from public.player_wallets w
  where w.user_id = current_user_id;

  return query
  select true,
         null::text,
         wallet_gold,
         added_total,
         converted_total,
         earned_total,
         new_purchase_count,
         3 - new_purchase_count;
end;
$$;

revoke all on function public.purchase_starter_deck(text) from public;
grant execute on function public.purchase_starter_deck(text) to authenticated;
