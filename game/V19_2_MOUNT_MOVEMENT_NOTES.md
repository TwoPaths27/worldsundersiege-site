# V19.2 — Mount State & Movement Integration

- Added persistent `mountedOn`, `riderId`, and `mountChangeUsed` state to units.
- Replaced the Mount stub with validated Character-to-Animal/Construct Mount helpers.
- Mounting requires a friendly, adjacent, face-up Mount with no rider.
- Mounting preserves movement already spent by either member of the pair.
- A mounted Character uses the Mount's effective Speed.
- Moving a Mount synchronizes its rider's battlefield position and movement spent.
- Mount/Dismount usage resets at the start of the controller's turn.
- Recruitment now copies card keywords onto battlefield units so the Mount keyword is available to the engine.

UI buttons, rider rendering, combat restrictions, damage recipient choice, and Construct Range activation remain for later passes.
