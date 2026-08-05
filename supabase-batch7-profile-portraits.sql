-- Worlds Under Siege — Batch 7 cloud profile portrait update
-- Run once after the Batch 6 starter deck SQL.

alter table public.profiles
add column if not exists selected_portrait_card_id text;

-- Existing profile RLS from Phase 1 already permits each authenticated player
-- to update only their own profile row.

-- Make every currently owned card available in the portrait unlock table.
insert into public.portrait_unlocks (user_id, card_id)
select player_cards.user_id, player_cards.card_id
from public.player_cards
where player_cards.quantity > 0
on conflict (user_id, card_id) do nothing;

-- Automatically unlock a card portrait whenever its quantity is inserted or increased.
create or replace function public.unlock_owned_card_portrait()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.quantity > 0 then
    insert into public.portrait_unlocks (user_id, card_id)
    values (new.user_id, new.card_id)
    on conflict (user_id, card_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists player_cards_unlock_portrait on public.player_cards;
create trigger player_cards_unlock_portrait
after insert or update of quantity on public.player_cards
for each row execute procedure public.unlock_owned_card_portrait();
