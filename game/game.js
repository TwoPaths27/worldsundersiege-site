"use strict";

/* Worlds Under Siege — V19.9.6.4b startup flow stabilization. */
(async function bootstrapMatch() {
  const log = (message, details) => {
    const entry = details === undefined ? message : `${message} ${JSON.stringify(details)}`;
    console.log("[Startup]", message, details ?? "");
    window.__startupLog = window.__startupLog || [];
    window.__startupLog.push(entry);
  };

  try {
    log("Waiting for deck selection");
    if (typeof runPregameLobby !== "function") {
      throw new Error("runPregameLobby is not available. Check script load order.");
    }

    // User-controlled dialogs must not use short timeouts. A player may take as
    // long as needed to inspect and choose a deck.
    const lobbyResult = await runPregameLobby();
    log("Deck selection complete", lobbyResult);

    if (typeof runCoinFlip !== "function") {
      throw new Error("runCoinFlip is not available. Check script load order.");
    }

    log("Starting coin flip");
    const coinResult = await runCoinFlip();
    log("Coin flip complete", coinResult);

    if (typeof runOpeningHandPhase === "function") {
      log("Starting opening-hand phase");
      const ready = await runOpeningHandPhase();
      log("Opening-hand phase complete", { ready });
      if (ready === false || GameState.gameOver) return;
    } else {
      log("Opening-hand phase unavailable; continuing without it");
    }

    log("Initializing match");
    initializeGame();
    log("Match initialized");
  } catch (error) {
    console.error("[Startup] Failed", error);
    const message = error instanceof Error ? error.message : String(error);
    alert(`Startup failed: ${message}\nSee browser console.`);
  }
})();
