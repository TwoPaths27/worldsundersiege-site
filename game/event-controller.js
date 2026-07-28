"use strict";

/*
 * Worlds Under Siege — V19.9.5 Event Zone
 *
 * One public Event slot per player. Events resolve before the one-Event
 * limit is applied; when a player would control two Events, that player
 * chooses which one remains. The other is sent to its owner's Discard by
 * default. Each Event can register its own removal-condition predicate.
 */

function ensureEventState() {
  GameState.playerEvents ??= { 1: null, 2: null };
  GameState.nextEventId ??= 1;
  GameState.pendingEventChoice ??= null;
  GameState.eventRemovalConditions ??= new Map();
  GameState.eventHistory ??= [];
  return GameState.playerEvents;
}

function getControlledEvent(playerId) {
  ensureEventState();
  return GameState.playerEvents[Number(playerId)] ?? null;
}

function findEventInHand(playerId, eventId) {
  return GameState.players?.[Number(playerId)]?.hand?.find(
    (card) => card?.id === eventId
  ) ?? null;
}

function getEventOwnerId(eventCard, fallbackPlayerId = null) {
  return Number(eventCard?.owner ?? eventCard?.controller ?? fallbackPlayerId) || null;
}

function pushEventHistory(type, eventCard, playerId, details = {}) {
  ensureEventState();
  GameState.eventHistory.push({
    type,
    eventId: eventCard?.id ?? null,
    eventName: eventCard?.name ?? "Unknown Event",
    playerId: Number(playerId) || null,
    timestamp: Date.now(),
    ...details,
  });
  if (GameState.eventHistory.length > 150) GameState.eventHistory.shift();
}

function clearEventInteractionState() {
  GameState.pendingEventChoice = null;
  if (GameState.selectedCardId && (typeof getSelectedCard !== "function" || !getSelectedCard())) {
    GameState.selectedCardId = null;
  }
  GameState.actionSelectionMessage = "";
}

function sendEventToDiscard(eventCard, options = {}) {
  if (!eventCard || !isEvent(eventCard)) return false;
  const ownerId = getEventOwnerId(eventCard, options.playerId);
  const owner = typeof ensurePlayerZones === "function"
    ? ensurePlayerZones(ownerId)
    : GameState.players?.[ownerId];
  if (!owner) return false;

  if (!Array.isArray(owner.discard)) owner.discard = [];
  if (!owner.discard.some((card) => card === eventCard || card?.id === eventCard.id)) {
    owner.discard.push(eventCard);
  }
  eventCard.zone = typeof ZoneTypes !== "undefined" ? ZoneTypes.DISCARD : "discard";
  eventCard.controller = ownerId;
  owner.discardCount = owner.discard.length;
  if (typeof syncZoneCounts === "function") syncZoneCounts(ownerId);
  return true;
}

function removeEventFromPlay(eventCard, options = {}) {
  if (!eventCard || !isEvent(eventCard)) return false;
  ensureEventState();

  const controllerId = Number(eventCard.controller ?? eventCard.owner);
  if (GameState.playerEvents[controllerId]?.id === eventCard.id) {
    GameState.playerEvents[controllerId] = null;
  }

  GameState.eventRemovalConditions.delete(eventCard.id);
  const cause = options.cause ?? "removed";
  const destination = options.destination ?? (
    typeof ZoneTypes !== "undefined" ? ZoneTypes.DISCARD : "discard"
  );

  if (typeof emitGameEvent === "function") {
    emitGameEvent("eventLeavingPlay", {
      event: eventCard,
      playerId: controllerId,
      cause,
      destination,
    }, { source: options.source ?? eventCard });
  }

  if (typeof leavePermanent === "function") {
    leavePermanent(eventCard, {
      cause,
      source: options.source,
      destroyed: options.destroyed === true,
      destination,
    });
  }

  if (destination === (typeof ZoneTypes !== "undefined" ? ZoneTypes.BANISH : "banish")) {
    const ownerId = getEventOwnerId(eventCard, controllerId);
    const owner = typeof ensurePlayerZones === "function"
      ? ensurePlayerZones(ownerId)
      : GameState.players?.[ownerId];
    owner?.banish?.push(eventCard);
    eventCard.zone = destination;
    if (owner) owner.banishCount = owner.banish.length;
  } else {
    sendEventToDiscard(eventCard, { playerId: controllerId });
  }

  pushEventHistory("left", eventCard, controllerId, { cause, destination });
  if (typeof recordZoneMove === "function") {
    recordZoneMove(eventCard, "event", destination, getEventOwnerId(eventCard, controllerId), cause);
  }

  if (typeof emitGameEvent === "function") {
    emitGameEvent(options.destroyed ? "eventDestroyed" : "eventLeftPlay", {
      event: eventCard,
      playerId: controllerId,
      cause,
      destination,
    }, { source: options.source ?? eventCard });
  }
  return true;
}

function beginEventReplacementChoice(playerId, existingEvent, incomingEvent) {
  ensureEventState();
  GameState.pendingEventChoice = {
    playerId: Number(playerId),
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
  clearEventInteractionState();
  if (typeof renderGame === "function") renderGame();
  return true;
}

function resolveEventCardText(card, playerId) {
  if (typeof emitGameEvent === "function") {
    emitGameEvent("eventPlayed", { event: card, playerId }, { source: card });
  }

  const ability = typeof getAbility === "function" ? getAbility(card) : null;
  if (ability && typeof ability.resolve === "function") {
    ability.resolve({
      source: card,
      card,
      playerId,
      controllerId: playerId,
      gameState: GameState,
    });
  } else if (typeof card.resolve === "function") {
    card.resolve({ source: card, card, playerId, gameState: GameState });
  }

  if (typeof emitGameEvent === "function") {
    emitGameEvent("eventResolved", { event: card, playerId }, { source: card });
  }
  return true;
}

function putEventIntoZone(card, playerId) {
  card.id ||= `player-${playerId}-event-${GameState.nextEventId++}`;
  card.owner ??= playerId;
  card.controller = playerId;
  card.zone = typeof ZoneTypes !== "undefined" ? ZoneTypes.EVENT : "event";
  GameState.playerEvents[playerId] = card;

  if (typeof enterPermanent === "function") {
    enterPermanent(card, {
      owner: card.owner,
      controller: playerId,
      cause: "played",
      zone: card.zone,
    });
  }

  pushEventHistory("entered", card, playerId, { cause: "played" });
  if (typeof recordZoneMove === "function") {
    recordZoneMove(card, "hand", "event", card.owner, "played");
  }
  if (typeof emitGameEvent === "function") {
    emitGameEvent("eventEnteredPlay", { event: card, playerId }, { source: card });
  }
  return card;
}

function commitEventPlay(card, playerId, existing = null, keepIncoming = true) {
  const player = GameState.players?.[playerId];
  const index = player?.hand?.findIndex((candidate) => candidate.id === card.id) ?? -1;
  if (!player || index < 0) return false;

  player.hand.splice(index, 1); // Events currently cost 0 Energy.
  card.owner ??= playerId;
  card.controller = playerId;

  // The new Event resolves before the one-Event state rule is applied.
  resolveEventCardText(card, playerId);

  if (existing && !keepIncoming) {
    sendEventToDiscard(card, { playerId });
    pushEventHistory("not-kept", card, playerId, { keptEventId: existing.id });
    if (typeof recordZoneMove === "function") {
      recordZoneMove(card, "hand", "discard", card.owner, "event-not-kept");
    }
    if (typeof emitGameEvent === "function") {
      emitGameEvent("eventChosenToDiscard", {
        event: card,
        kept: existing,
        playerId,
      }, { source: card });
    }
    if (typeof addLog === "function") {
      addLog(`${player.name} keeps ${existing.name}; ${card.name} resolves, then is discarded.`);
    }
  } else {
    if (existing) {
      if (typeof emitGameEvent === "function") {
        emitGameEvent("eventWouldBeReplaced", {
          existing,
          incoming: card,
          playerId,
        }, { source: card });
      }
      removeEventFromPlay(existing, { cause: "replaced", source: card });
    }

    putEventIntoZone(card, playerId);
    if (existing && typeof emitGameEvent === "function") {
      emitGameEvent("eventReplaced", {
        removed: existing,
        kept: card,
        playerId,
      }, { source: card });
    }
    if (typeof addLog === "function") {
      addLog(`🌐 ${player.name} plays Event ${card.name}.`);
    }
  }

  clearEventInteractionState();
  if (typeof validateEventState === "function" && typeof reportValidation === "function") {
    reportValidation(validateEventState(), "Event state");
  }
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
  if (GameState.gameOver) return false;
  if (GameState.priority.active) {
    if (typeof addLog === "function") addLog("Events cannot be played while a priority window is open.");
    return false;
  }
  if (GameState.pendingEventChoice) return false;

  const player = GameState.players?.[playerId];
  const index = player?.hand?.findIndex((candidate) => candidate.id === card.id) ?? -1;
  if (!player || index < 0) return false;

  const existing = getControlledEvent(playerId);
  return existing
    ? beginEventReplacementChoice(playerId, existing, card)
    : commitEventPlay(card, playerId, null, true);
}

function completeEvent(eventCard, options = {}) {
  if (!eventCard || !isEvent(eventCard)) return false;
  if (typeof emitGameEvent === "function") {
    emitGameEvent("eventCompleted", {
      event: eventCard,
      playerId: eventCard.controller ?? eventCard.owner,
    }, { source: options.source ?? eventCard });
  }
  return removeEventFromPlay(eventCard, {
    cause: options.cause ?? "completed",
    source: options.source ?? eventCard,
    destination: options.destination,
  });
}

function registerEventRemovalCondition(eventCard, predicate, options = {}) {
  ensureEventState();
  if (!eventCard?.id || typeof predicate !== "function") return false;
  GameState.eventRemovalConditions.set(eventCard.id, {
    predicate,
    cause: options.cause ?? "condition-met",
    destination: options.destination,
  });
  return true;
}

function checkEventRemovalConditions(context = {}) {
  ensureEventState();
  const removed = [];
  for (const playerId of [1, 2]) {
    const eventCard = getControlledEvent(playerId);
    if (!eventCard) continue;
    const condition = GameState.eventRemovalConditions.get(eventCard.id);
    if (!condition) continue;

    let shouldRemove = false;
    try {
      shouldRemove = Boolean(condition.predicate({
        event: eventCard,
        playerId,
        gameState: GameState,
        ...context,
      }));
    } catch (error) {
      console.error(`Event removal condition failed for ${eventCard.name}.`, error);
    }

    if (shouldRemove && removeEventFromPlay(eventCard, {
      cause: condition.cause,
      destination: condition.destination,
      source: context.source ?? eventCard,
    })) {
      removed.push(eventCard);
    }
  }
  if (removed.length && typeof renderGame === "function") renderGame();
  return removed;
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
    if (!zone) continue;
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
      ? `linear-gradient(to top, rgba(0,0,0,.88), rgba(0,0,0,.14)), url("${eventCard.cardImage}")`
      : "";
    zone.setAttribute("aria-label", eventCard
      ? `${title.textContent}: ${eventCard.name}. Click to inspect.`
      : `${title.textContent}: empty`);
  }
}

function renderEventReplacementChoice() {
  const pending = GameState.pendingEventChoice;
  if (!elements.eventChoiceModal) return;
  elements.eventChoiceModal.hidden = !pending;
  if (!pending) return;

  const existing = getControlledEvent(pending.playerId);
  const incoming = findEventInHand(pending.playerId, pending.incomingEventId);
  if (!existing || !incoming) {
    cancelEventReplacementChoice();
    return;
  }

  elements.eventChoiceMessage.textContent = `${GameState.players[pending.playerId].name} may control only one Event. The new Event resolves, then the Event not kept is discarded.`;
  configureEventChoiceButton(elements.keepCurrentEventButton, existing, "Keep current Event");
  configureEventChoiceButton(elements.keepIncomingEventButton, incoming, "Keep new Event");
}

function configureEventChoiceButton(button, card, label) {
  if (!button) return;
  button.replaceChildren();
  const heading = document.createElement("span");
  heading.className = "event-choice-card__label";
  heading.textContent = label;
  const name = document.createElement("strong");
  name.textContent = card.name;
  const text = document.createElement("span");
  text.textContent = card.effectText || card.rulesText || "No rules text.";
  button.append(heading, name, text);
  button.style.backgroundImage = card.cardImage
    ? `linear-gradient(to top, rgba(0,0,0,.92), rgba(0,0,0,.26)), url("${card.cardImage}")`
    : "";
}

ensureEventState();
