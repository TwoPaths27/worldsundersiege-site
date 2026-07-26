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
    const stronghold = normalizeCard({ ...base, type: CardTypes.STRONGHOLD, types: [CardTypes.STRONGHOLD] });
    stronghold.id = `${base.id}-player-${playerId}`;
    stronghold.owner = playerId;
    stronghold.controller = playerId;
    GameState.strongholds[playerId] = stronghold;
    enterPermanent(stronghold, { owner: playerId, controller: playerId, cause: "match-start" });
  }
}

function initializeGame() {
  validateRequiredElements();
  bindEvents();

  for (const unit of GameState.units) {
    if (typeof normalizeUnitBaseStats === "function") {
      normalizeUnitBaseStats(unit);
    }
    enterPermanent(unit, { owner: unit.owner, controller: unit.owner, cause: "initial-battlefield" });
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
  emitGameEvent("turnStarted", { playerId: GameState.activePlayer, turn: GameState.turn });
  renderGame();
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
  if (
    GameState.isAnimating ||
    GameState.priority.active ||
    GameState.priority.resolving ||
    GameState.actionStack.length
  ) {
    addLog("Resolve the current Action stack before ending the turn.");
    renderGame();
    return;
  }

  const previousPlayer = GameState.activePlayer;
  const nextPlayer = previousPlayer === 1 ? 2 : 1;

  emitGameEvent("turnEnding", { playerId: previousPlayer, turn: GameState.turn });
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
  emitGameEvent("turnEnded", { playerId: previousPlayer, nextPlayerId: nextPlayer, turn: GameState.turn });
  emitGameEvent("turnStarted", { playerId: nextPlayer, previousPlayerId: previousPlayer, turn: GameState.turn });

  addLog(
    `Player ${previousPlayer} ended their turn. ` +
      `Player ${nextPlayer} is now active.`
  );

  renderGame();
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
