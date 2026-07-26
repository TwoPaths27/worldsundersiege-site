"use strict";

/* Worlds Under Siege — v17.1 persistent Event controller. */
function ensureEventState() {
  GameState.playerEvents ??= { 1: null, 2: null };
  GameState.nextEventId ??= 1;
  GameState.pendingEventChoice ??= null;
}

function getControlledEvent(playerId) {
  ensureEventState();
  return GameState.playerEvents[playerId] ?? null;
}

function findEventInHand(playerId, eventId) {
  return GameState.players[playerId]?.hand.find((card) => card.id === eventId) ?? null;
}

function removeEventFromPlay(eventCard, options = {}) {
  if (!eventCard || !isEvent(eventCard)) return false;
  ensureEventState();
  const playerId = eventCard.controller ?? eventCard.owner;
  if (GameState.playerEvents[playerId]?.id === eventCard.id) GameState.playerEvents[playerId] = null;
  emitGameEvent("eventLeavingPlay", { event: eventCard, playerId, cause: options.cause ?? "removed" }, { source: options.source ?? eventCard });
  leavePermanent(eventCard, { cause: options.cause ?? "removed", source: options.source, destroyed: options.destroyed === true });
  const owner = GameState.players[eventCard.owner ?? playerId];
  if (owner) owner.discardCount = (owner.discardCount ?? 0) + 1;
  emitGameEvent(options.destroyed ? "eventDestroyed" : "eventLeftPlay", { event: eventCard, playerId, cause: options.cause ?? "removed" }, { source: options.source ?? eventCard });
  return true;
}

function beginEventReplacementChoice(playerId, existingEvent, incomingEvent) {
  ensureEventState();
  GameState.pendingEventChoice = {
    playerId,
    existingEventId: existingEvent.id,
    incomingEventId: incomingEvent.id,
  };
  GameState.selectedCardId = incomingEvent.id;
  GameState.actionSelectionMessage = `${GameState.players[playerId].name} must choose which Event to keep.`;
  if (typeof renderGame === "function") renderGame();
  return true;
}

function cancelEventReplacementChoice() {
  if (!GameState.pendingEventChoice) return false;
  GameState.pendingEventChoice = null;
  GameState.selectedCardId = null;
  GameState.actionSelectionMessage = "";
  if (typeof renderGame === "function") renderGame();
  return true;
}

function commitEventPlay(card, playerId, existing = null, keepIncoming = true) {
  const player = GameState.players[playerId];
  const index = player?.hand.findIndex((candidate) => candidate.id === card.id) ?? -1;
  if (!player || index < 0) return false;

  player.hand.splice(index, 1); // Events are free.
  card.id ||= `player-${playerId}-event-${GameState.nextEventId++}`;
  card.owner = playerId;
  card.controller = playerId;

  if (existing && !keepIncoming) {
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

  GameState.pendingEventChoice = null;
  GameState.selectedCardId = null;
  GameState.actionSelectionMessage = "";
  reportValidation(validateEventState(), "Event state");
  if (typeof renderGame === "function") renderGame();
  return true;
}

function resolveEventReplacementChoice(choice) {
  ensureEventState();
  const pending = GameState.pendingEventChoice;
  if (!pending) return false;
  const existing = getControlledEvent(pending.playerId);
  const incoming = findEventInHand(pending.playerId, pending.incomingEventId);
  if (!existing || !incoming) {
    cancelEventReplacementChoice();
    return false;
  }
  return commitEventPlay(incoming, pending.playerId, existing, choice === "incoming");
}

function playEventCard(card, playerId = getInteractionPlayerId()) {
  ensureEventState();
  normalizeCard(card);
  if (!isEvent(card)) throw new TypeError("playEventCard() requires an Event card.");
  if (GameState.priority.active) {
    addLog("Events cannot be played while a priority window is open.");
    return false;
  }
  if (GameState.pendingEventChoice) return false;
  const player = GameState.players[playerId];
  const index = player?.hand.findIndex((candidate) => candidate.id === card.id) ?? -1;
  if (!player || index < 0) return false;
  const existing = getControlledEvent(playerId);
  return existing
    ? beginEventReplacementChoice(playerId, existing, card)
    : commitEventPlay(card, playerId, null, true);
}

function completeEvent(eventCard, options = {}) {
  if (!eventCard || !isEvent(eventCard)) return false;
  emitGameEvent("eventCompleted", { event: eventCard, playerId: eventCard.controller ?? eventCard.owner }, { source: options.source ?? eventCard });
  return removeEventFromPlay(eventCard, { cause: "completed", source: options.source ?? eventCard });
}

function inspectControlledEvent(playerId) {
  const eventCard = getControlledEvent(playerId);
  if (!eventCard) return false;
  if (typeof renderHandCardPreview === "function") renderHandCardPreview(eventCard);
  return true;
}

function renderEventZones() {
  ensureEventState();
  for (const playerId of [1, 2]) {
    const zone = playerId === 1 ? elements.playerEventZone : elements.enemyEventZone;
    const eventCard = getControlledEvent(playerId);
    zone.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = playerId === 1 ? "Player Event" : "Enemy Event";
    const detail = document.createElement("span");
    detail.textContent = eventCard?.name ?? "Empty";
    zone.append(title, detail);
    zone.classList.toggle("is-occupied", Boolean(eventCard));
    zone.disabled = !eventCard;
    zone.style.backgroundImage = eventCard?.cardImage
      ? `linear-gradient(to top, rgba(0,0,0,.84), rgba(0,0,0,.12)), url("${eventCard.cardImage}")`
      : "";
    zone.setAttribute("aria-label", eventCard ? `${title.textContent}: ${eventCard.name}` : `${title.textContent}: empty`);
  }
}

function renderEventReplacementChoice() {
  const pending = GameState.pendingEventChoice;
  elements.eventChoiceModal.hidden = !pending;
  if (!pending) return;
  const existing = getControlledEvent(pending.playerId);
  const incoming = findEventInHand(pending.playerId, pending.incomingEventId);
  if (!existing || !incoming) {
    cancelEventReplacementChoice();
    return;
  }
  elements.eventChoiceMessage.textContent = `${GameState.players[pending.playerId].name} may control only one Event. The other Event will be discarded.`;
  configureEventChoiceButton(elements.keepCurrentEventButton, existing, "Keep current Event");
  configureEventChoiceButton(elements.keepIncomingEventButton, incoming, "Keep new Event");
}

function configureEventChoiceButton(button, card, label) {
  button.replaceChildren();
  const heading = document.createElement("span");
  heading.className = "event-choice-card__label";
  heading.textContent = label;
  const name = document.createElement("strong");
  name.textContent = card.name;
  const text = document.createElement("span");
  text.textContent = card.effectText || "No rules text.";
  button.append(heading, name, text);
  button.style.backgroundImage = card.cardImage
    ? `linear-gradient(to top, rgba(0,0,0,.9), rgba(0,0,0,.24)), url("${card.cardImage}")`
    : "";
}

ensureEventState();
