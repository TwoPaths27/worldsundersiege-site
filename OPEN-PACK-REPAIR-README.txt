OPEN PACK SECOND-PACK REPAIR

FIXED
- Removed the isOwned ReferenceError in the Starter Deck store.
- Restored the missing revealAllStarterCards function.
- Restored Starter Deck reveal helper functions.
- Opening another booster after the first pack now works again.
- Added Back to Pack Selector after completing a single booster.
- The same button still returns to remaining packs during a booster box.
- Revealed Starter Deck cards now work with the existing enlarged-card viewer.

FILES CHANGED
- open-packs.js
- open-packs.html
- open-packs.css

NOTE
The cloud starter warning and Supabase 404 messages mean the related SQL tables
have not been installed yet. The page safely falls back to local testing mode.
