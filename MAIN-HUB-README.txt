WORLDS UNDER SIEGE — MAIN HUB

REPLACE/UPLOAD
- index.html
- hub.css
- hub.js

ALSO INCLUDED UNCHANGED FOR EASY TESTING
- logo.png
- banner.jpg
- Main Menu.png
- collection-store.js
- supabase-config.js
- auth-common.js
- auth-guard.js

CURRENT PROFILE PORTRAIT
The player tile starts with logo.png as a temporary portrait.
The portrait button already opens a profile dialog.
The owned-card tile chooser will be connected when cloud collections are built.

CURRENT GOLD
The hub reads Gold from the existing WUSCollection browser storage.
Later this will be switched to the logged-in player's Supabase wallet.

NEWS
The panel cycles five development-news entries and links to news.html.

IMPORTANT
The main page still requires onboarding_complete=true.
Until the onboarding flow is built, test accounts remain routed to onboarding.html.
