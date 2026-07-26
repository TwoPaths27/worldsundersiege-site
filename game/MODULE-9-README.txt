WORLDS UNDER SIEGE — MODULE 9 VALIDATION NOTES
=================================================

MODULE
------
Animation Engine (`animation.js`)

RESPONSIBILITIES MOVED OUT OF battlefield.js
---------------------------------------------
- Global interaction locking during visual sequences
- Energy-to-card transfer animation
- Card-to-battlefield deployment animation
- Recruiting-space and Energy pulse effects
- Unit attack and floating-damage animation
- Unit-to-discard animation
- Stronghold attack, collapse, and debris effects
- Shared asynchronous animation delay helper

BOUNDARIES PRESERVED
--------------------
- `battlefield.js` still validates player input and coordinates combat/recruitment.
- `rules.js` still applies damage, destruction, targeting, and other game rules.
- `audio.js` still owns sound playback.
- Animation functions do not decide legal moves, targets, damage, or winners.

SCRIPT LOAD ORDER
-----------------
card-database.js
game-state.js
rules.js
audio.js
ui.js
animation.js
priority.js
battlefield.js
cards.js
match.js
game.js

VALIDATION PERFORMED
--------------------
- Node syntax validation for every JavaScript module.
- Combined classic-script load-order syntax validation.
- Function ownership audit confirmed the extracted animation functions occur only in animation.js.
- Reference audit confirmed battlefield combat and recruitment continue calling the same global function names.

BROWSER TEST CHECKLIST
----------------------
1. Recruit a Unit and confirm Energy transfer, card flight, and deployment flash.
2. Move and attack a Unit; confirm lunge, damage number, retaliation, and discard flight.
3. Attack a Stronghold; confirm strike feedback.
4. Destroy a Stronghold; confirm collapse, debris, and end-game presentation.
5. During animations, confirm hand and End Turn controls stay locked.
6. Enable reduced motion and confirm sequences still resolve without blocking play.
