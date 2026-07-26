"use strict";

/* Worlds Under Siege — v17 persistent Event controller. */
function ensureEventState() {
  GameState.playerEvents ??= { 1: null, 2: null };
  GameState.nextEventId ??= 1;
}

function getControlledEvent(playerId) {
  ensureEventState();
  return GameState.playerEvents[playerId] ?? null;
}

function removeEventFromPlay(eventCard, options = {}) {
  if (!eventCard || !isEvent(eventCard)) return false;
  ensureEventState();
  const playerId = eventCard.controller ?? eventCard.owner;
  if (GameState.playerEvents[playerId]?.id === eventCard.id) GameState.playerEvents[playerId] = null;
  emitGameEvent("eventLeavingPlay", { event: eventCard, playerId, cause: options.cause ?? "removed" }, { source: options.source ?? eventCard });
  leavePermanent(eventCard, { cause: options.cause ?? "removed", source: options.source, destroyed: options.destroyed === true });
  GameState.players[playerId].discardCount = (GameState.players[playerId].discardCount ?? 0) + 1;
  emitGameEvent(options.destroyed ? "eventDestroyed" : "eventLeftPlay", { event: eventCard, playerId, cause: options.cause ?? "removed" }, { source: options.source ?? eventCard });
  return true;
}

function chooseEventToKeep(playerId, existingEvent, incomingEvent) {
  if (typeof window !== "undefined" && typeof window.confirm === "function") {
    return window.confirm(`${GameState.players[playerId].name} already controls ${existingEvent.name}.\n\nOK: replace it with ${incomingEvent.name}.\nCancel: keep ${existingEvent.name} and discard ${incomingEvent.name}.`)
      ? incomingEvent : existingEvent;
  }
  return incomingEvent;
}

function playEventCard(card, playerId = getInteractionPlayerId()) {
  ensureEventState();
  normalizeCard(card);
  if (!isEvent(card)) throw new TypeError("playEventCard() requires an Event card.");
  if (GameState.priority.active) {
    addLog("Events cannot be played while a priority window is open.");
    return false;
  }
  const player = GameState.players[playerId];
  const index = player?.hand.findIndex((candidate) => candidate.id === card.id) ?? -1;
  if (!player || index < 0) return false;

  const existing = getControlledEvent(playerId);
  const keep = existing ? chooseEventToKeep(playerId, existing, card) : card;
  player.hand.splice(index, 1); // Events are free.
  card.id ||= `player-${playerId}-event-${GameState.nextEventId++}`;
  card.owner = playerId;
  card.controller = playerId;

  if (existing && keep === existing) {
    card.zone = typeof ZoneTypes !== "undefined" ? ZoneTypes.DISCARD : "discard";
    player.discardCount = (player.discardCount ?? 0) + 1;
    emitGameEvent("eventChosenToDiscard", { event: card, kept: existing, playerId }, { source: card });
    addLog(`${player.name} keeps ${existing.name}; ${card.name} is discarded.`);
  } else {
    if (existing) {
      emitGameEvent("eventWouldBeReplaced", { existing, incoming: card, playerId }, { source: card });
      removeEventFromPlay(existing, { cause: "replaced", source: card });
      emitGameEvent("eventReplaced", { removed: existing, kept: card, playerId }, { source: card });
    }
    GameState.playerEvents[playerId] = card;
    enterPermanent(card, { owner: playerId, controller: playerId, cause: "played" });
    emitGameEvent("eventEnteredPlay", { event: card, playerId }, { source: card });
    addLog(`🌐 ${player.name} plays Event ${card.name} for free.`);
  }

  GameState.selectedCardId = null;
  GameState.actionSelectionMessage = "";
  reportValidation(validateEventState(), "Event state");
  if (typeof renderGame === "function") renderGame();
  return true;
}

function completeEvent(eventCard, options = {}) {
  if (!eventCard || !isEvent(eventCard)) return false;
  emitGameEvent("eventCompleted", { event: eventCard, playerId: eventCard.controller ?? eventCard.owner }, { source: options.source ?? eventCard });
  return removeEventFromPlay(eventCard, { cause: "completed", source: options.source ?? eventCard });
}

ensureEventState();
