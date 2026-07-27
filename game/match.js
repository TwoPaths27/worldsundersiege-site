"use strict";

/*
 * Worlds Under Siege — Match controller
 *
 * Owns match initialization, top-level rendering orchestration, and
 * turn transitions. Feature subsystems continue to own their individual
 * renderers and gameplay operations.
 */

function initializeStrongholdPermanents() {
  GameState.strongholds ??= {};
  for (const playerId of [1, 2]) {
    if (GameState.strongholds[playerId]) continue;
    const base = playerId === 1 ? getPlayerStrongholdCard() : {
      id: "enemy-stronghold",
      name: "Enemy Stronghold",
      effectText: "",
    };
    const stronghold = {
      ...base,
      type: CardTypes.STRONGHOLD,
      types: [CardTypes.STRONGHOLD],
    };

    normalizeCard(stronghold);
    stronghold.id = `${base.id}-player-${playerId}`;
    stronghold.owner = playerId;
    stronghold.controller = playerId;
    GameState.strongholds[playerId] = stronghold;
    enterPermanent(stronghold, { owner: playerId, controller: playerId, cause: "match-start" });
  }
}

function initializeGame() {
  GameState.prioritySettings ??= {};
  for (const playerId of [1, 2]) {
    GameState.prioritySettings[playerId] ??= createDefaultPrioritySettings();
  }

  validateRequiredElements();
  bindEvents();

  for (const unit of GameState.units) {
    /*
     * GameState.units is the authoritative battlefield Unit collection.
     * Older saved/setup objects may predate the unified card-type model, so
     * ensure they have a Unit type before entering the permanent lifecycle.
     */
    normalizeCard(unit);

    const unitType =
      typeof CardTypes !== "undefined"
        ? CardTypes.UNIT
        : "unit";

    unit.type ??= unitType;

    const unitTypes = Array.isArray(unit.types)
      ? unit.types
      : [];

    if (!unitTypes.includes(unitType)) {
      unitTypes.push(unitType);
    }

    unit.types = unitTypes;

    if (typeof normalizeUnitBaseStats === "function") {
      normalizeUnitBaseStats(unit);
    }

    enterPermanent(unit, {
      owner: unit.owner,
      controller: unit.controller ?? unit.owner,
      cause: "initial-battlefield",
    });
  }

  initializeStrongholdPermanents();

  emitGameEvent(
    "initialBattlefieldReady",
    {
      units: [...GameState.units],
      activePlayer: GameState.activePlayer,
    },
    { source: GameState }
  );

  emitGameEvent("matchStarted", { game: GameState, activePlayer: GameState.activePlayer });

  if (typeof auditCurrentActionCards === "function") {
    auditCurrentActionCards();
  }
  emitGameEvent("turnStarted", {
    playerId: GameState.activePlayer,
    turn: GameState.turn,
  });

  beginTurnStepSequence(GameState.activePlayer);
}


function beginTurnStepSequence(playerId = GameState.activePlayer) {
  if (!GameState.players[playerId]) {
    console.warn(`Cannot begin a turn for unknown player ${playerId}.`);
    return false;
  }

  GameState.turnFlow ??= {
    step: "setup",
    transitioning: false,
    endTurnRequestedBy: null,
  };

  GameState.turnFlow.transitioning = true;
  GameState.turnFlow.endTurnRequestedBy = null;

  return openTurnStepPriorityWindow("beginning", {
    playerId,
    resume: () => beginDrawStep(playerId),
  });
}

function beginDrawStep(playerId = GameState.activePlayer) {
  if (playerId !== GameState.activePlayer) {
    return false;
  }

  /*
   * The current project does not yet expose a deck-draw operation. The draw
   * step still exists as a real priority window and emits drawStepStarted so
   * deck support can be connected later without changing turn sequencing.
   */
  emitGameEvent(
    "drawStepStarted",
    {
      playerId,
      turn: GameState.turn,
    },
    { source: GameState.players[playerId] }
  );

  return openTurnStepPriorityWindow("draw", {
    playerId,
    resume: () => beginMainStep(playerId),
  });
}

function beginMainStep(playerId = GameState.activePlayer) {
  if (playerId !== GameState.activePlayer) {
    return false;
  }

  return openTurnStepPriorityWindow("main", {
    playerId,
    resume: () => {
      GameState.turnFlow.step = "main";
      GameState.turnFlow.transitioning = false;

      emitGameEvent(
        "mainStepReady",
        {
          playerId,
          turn: GameState.turn,
        },
        { source: GameState.players[playerId] }
      );

      addLog(`${GameState.players[playerId].name} may take main-step actions.`);
      renderGame();
    },
  });
}

function requestEndStep() {
  if (
    GameState.isAnimating ||
    GameState.priority.active ||
    GameState.priority.resolving ||
    GameState.actionStack.length
  ) {
    addLog("Resolve the current Action stack before ending the turn.");
    renderGame();
    return false;
  }

  if (GameState.turnFlow?.transitioning) {
    addLog("Finish the current turn-step priority window first.");
    renderGame();
    return false;
  }

  const endingPlayer = GameState.activePlayer;

  GameState.turnFlow.transitioning = true;
  GameState.turnFlow.endTurnRequestedBy = endingPlayer;

  return openTurnStepPriorityWindow("end", {
    playerId: endingPlayer,
    resume: () => finalizeEndTurn(endingPlayer),
  });
}

function renderGame() {
  renderStatusBar();
  renderBattlefield();
  renderSelectedUnitPanel();

  const selectedCard = getSelectedCard();

  if (selectedCard) {
    renderHandCardPreview(selectedCard);
  } else {
    renderCardPreview();
  }

  renderStrongholds();
  renderActionStacks();
  renderEventZones();
  renderEventReplacementChoice();
  renderHand();
  renderGameLog();
}

function endTurn() {
  return requestEndStep();
}

function finalizeEndTurn(expectedPlayerId = GameState.activePlayer) {
  if (expectedPlayerId !== GameState.activePlayer) {
    console.warn(
      "Ignored stale end-step completion because the active player changed."
    );
    return false;
  }

  if (
    GameState.priority.active ||
    GameState.priority.resolving ||
    GameState.actionStack.length
  ) {
    addLog("The turn cannot change while priority or the Action stack is active.");
    renderGame();
    return false;
  }

  const previousPlayer = GameState.activePlayer;
  const nextPlayer = previousPlayer === 1 ? 2 : 1;

  emitGameEvent("turnStepEnded", {
    playerId: previousPlayer,
    turn: GameState.turn,
    step: "end",
  });

  emitGameEvent("turnEnding", {
    playerId: previousPlayer,
    turn: GameState.turn,
  });

  clearEndOfTurnEffects(previousPlayer);

  if (typeof updateContinuousEffects === "function") {
    updateContinuousEffects({
      phase: "turnEnd",
      playerId: previousPlayer,
    });
  }

  resetMatchSelection();

  GameState.activePlayer = nextPlayer;

  if (nextPlayer === 1) {
    GameState.turn += 1;
  }

  refreshPlayerForTurn(nextPlayer);

  emitGameEvent("turnEnded", {
    playerId: previousPlayer,
    nextPlayerId: nextPlayer,
    turn: GameState.turn,
  });

  emitGameEvent("turnStarted", {
    playerId: nextPlayer,
    previousPlayerId: previousPlayer,
    turn: GameState.turn,
  });

  addLog(
    `Player ${previousPlayer} ended their turn. ` +
      `Player ${nextPlayer} is now active.`
  );

  return beginTurnStepSequence(nextPlayer);
}

function clearEndOfTurnEffects(playerId) {
  if (typeof triggerAbilities === "function") {
    triggerAbilities("endOfTurn", { game: GameState, playerId });
  }
  for (const unit of GameState.units) {
    if (unit.owner === playerId && unit.temporaryRangeBonus) {
      unit.temporaryRangeBonus = 0;
      unit.currentRange = unit.printedRange;
    }
  }
}

function resetMatchSelection() {
  GameState.selectedUnitId = null;
  GameState.selectedCardId = null;
  GameState.selectedUnitAction = "move";
  GameState.pendingActionUserId = null;
  GameState.pendingActionTargetId = null;
  GameState.pendingTriggeredChoice = null;
  GameState.targetRequests = [];
  GameState.actionSelectionMessage = "";
  GameState.reachableSpaces = new Map();
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;
}

function refreshPlayerForTurn(playerId) {
  const player = GameState.players[playerId];

  player.maxEnergy = Math.min(player.maxEnergy + 1, 10);
  player.energy = player.maxEnergy;

  for (const unit of GameState.units) {
    if (unit.owner === playerId) {
      unit.remainingSpeed =
        typeof getCurrentSpeed === "function"
          ? getCurrentSpeed(unit)
          : unit.currentSpeed;
      unit.hasAttacked = false;
    }
  }
}
