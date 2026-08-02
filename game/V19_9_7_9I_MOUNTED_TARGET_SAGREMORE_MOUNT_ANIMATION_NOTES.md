# V19.9.7.9i — Mounted Target, Sagremore, and Mount Animation Fix

- Mounted attack target buttons now consume pointer/touch events and begin combat from the modal callback before the overlay is removed.
- Added a short transparent pointer shield to prevent synthetic follow-up taps from selecting the enemy rider or Mount.
- The chosen mounted damage target is stored in both the queue and preferred-target state before combat begins.
- Sir Sagremore's reveal presentation is delayed until his battlefield token exists and forced past duplicate-feedback suppression.
- Mounting now captures the rider's original tile and animates the Character flying into the Mount tile with a blue equip-style finish.
