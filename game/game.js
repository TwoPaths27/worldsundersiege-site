"use strict";

/* Worlds Under Siege — V19.9.6.3 bootstrap. */
(async function bootstrapMatch() {
  if (typeof runPregameLobby === "function") await runPregameLobby();
  if (typeof runCoinFlip === "function") await runCoinFlip();
  if (typeof runOpeningHandPhase === "function") {
    const ready = await runOpeningHandPhase();
    if (ready === false || GameState.gameOver) return;
  }
  initializeGame();
})();
