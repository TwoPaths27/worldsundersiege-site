OPEN PACKS CLICK SOUND + CLOUD COLLECTION UPDATE

OPEN PACKS AUDIO
- The generic mouse-click.mp3 is disabled for the entire open-packs.html page.
- Clicking Open Packs on the Main Hub can still make the normal navigation click.
- Once Open Packs loads, only its dedicated pack/card sound effects play.

COLLECTION
- cards.html reads the logged-in player's player_cards rows from Supabase.
- Cards with quantity 0 are gray and cannot be clicked or opened.
- Owned cards remain clickable and display their owned quantity.
- The cloud collection mirrors into WUSCollection for compatibility with
  the Deck Builder and existing local code.
- If Supabase is unavailable, the page falls back to the local collection mirror.

SUPABASE REQUIREMENT
The player_cards table from the Batch 6 SQL must already exist.

FILES ADDED
- global-click-sound.js
- collection-cloud.js

FILES CHANGED
- All HTML pages load global-click-sound.js.
- cards.html loads and displays the player's actual collection.
