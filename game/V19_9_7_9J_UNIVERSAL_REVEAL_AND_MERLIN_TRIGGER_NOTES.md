# V19.9.7.9j — Universal Reveal Presentation and Merlin Trigger

- Every true `when/whenever ... revealed` Unit effect now automatically receives the shared gold flare, fireworks, sky beam, and Activate sound when face-up recruitment or Conceal reveal emits `unitRevealed`.
- Merlin is explicitly excluded because Magical Prowess is not an on-reveal effect.
- Merlin no longer plays his premium audio when recruited or revealed.
- Merlin now glows and plays `Merlin.mp3` plus `Merlin 2.mp3` only when Magical Prowess actually makes an Action cost 0.
- Added the `merlinFreeActionUsed` event for presentation and future logging/UI hooks.
