# V19.9.7.7b — Sir Lancelot Active Effect Fix

- Fixed Sir Lancelot's reveal Speed modifier being registered without `active: true`.
- The continuous-effect engine ignores inactive or undefined-active effects, so the +3 SPD modifier existed but never applied.
- Face-up deployment and Conceal reveal now correctly grant +3 SPD until the end of the turn.
- Movement already spent remains deducted from the boosted Speed total.
