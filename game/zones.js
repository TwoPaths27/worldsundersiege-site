"use strict";

/*
 * Worlds Under Siege — v13 Zone Engine
 * Adapts the existing player hands, battlefield, stack, and pile counters to
 * one movement API without replacing the game's current state model.
 */

const ZoneTypes = Object.freeze({
  DECK: "deck",
  HAND: "hand",
  STACK: "stack",
  BATTLEFIELD: "battlefield",
  DISCARD: "discard",
  EXILE: "exile",
  BANISH: "banish",
});

function ensureZoneState() {
  GameState.zoneHistory ??= [];
  GameState.exile ??= { 1: [], 2: [] };
  GameState.discard ??= { 1: [], 2: [] };
}

function normalizeZoneName(zone) {
  return zone === ZoneTypes.BANISH ? ZoneTypes.EXILE : zone;
}

function getZone(zoneName, ownerId = null) {
  ensureZoneState();
  const zone = normalizeZoneName(zoneName);

  switch (zone) {
    case ZoneTypes.HAND:
      return GameState.players[ownerId]?.hand ?? null;
    case ZoneTypes.STACK:
      return GameState.actionStack;
    case ZoneTypes.BATTLEFIELD:
      return GameState.units;
    case ZoneTypes.DISCARD:
      return GameState.discard[ownerId] ?? null;
    case ZoneTypes.EXILE:
      return GameState.exile[ownerId] ?? null;
    default:
      return null;
  }
}

function findZoneObjectIndex(collection, object) {
  if (!Array.isArray(collection)) return -1;

  return collection.findIndex((candidate) =>
    candidate === object ||
    (
      candidate?.id != null &&
      object?.id != null &&
      candidate.id === object.id
    ) ||
    (
      candidate?.stackId != null &&
      object?.stackId != null &&
      candidate.stackId === object.stackId
    )
  );
}

function removeObjectFromZone(object, zoneName, ownerId) {
  const collection = getZone(zoneName, ownerId);
  const index = findZoneObjectIndex(collection, object);

  if (index < 0) return null;
  return collection.splice(index, 1)[0];
}

function addObjectToZone(object, zoneName, ownerId) {
  const collection = getZone(zoneName, ownerId);
  if (!Array.isArray(collection)) return false;

  if (findZoneObjectIndex(collection, object) < 0) {
    collection.push(object);
  }

  return true;
}

function moveCard(card, options = {}) {
  if (!card) return { moved: false, reason: "missing-card" };

  ensureZoneState();

  const ownerId =
    options.ownerId ??
    options.playerId ??
    card.owner ??
    card.controller ??
    null;

  const from = normalizeZoneName(options.from ?? card.zone ?? null);
  const to = normalizeZoneName(options.to);
  const reason = options.reason ?? "move";
  const allowDetached = options.allowDetached !== false;

  if (!to) return { moved: false, reason: "missing-destination" };
  if (from === to) return { moved: true, card, from, to, reason };

  let movedObject = card;

  if (from) {
    const removed = removeObjectFromZone(card, from, ownerId);

    if (removed) movedObject = removed;
    else if (!allowDetached) {
      return { moved: false, reason: "not-in-source-zone", card, from, to };
    }
  }

  const added = addObjectToZone(movedObject, to, ownerId);

  if (!added && !options.virtual) {
    return { moved: false, reason: "unsupported-destination", card, from, to };
  }

  movedObject.zone = to;

  if (to === ZoneTypes.DISCARD && GameState.players[ownerId]) {
    GameState.players[ownerId].discardCount =
      GameState.discard[ownerId]?.length ??
      (GameState.players[ownerId].discardCount ?? 0) + 1;
  }

  GameState.zoneHistory.push({
    cardId: movedObject.id ?? null,
    name: movedObject.name ?? null,
    ownerId,
    from,
    to,
    reason,
    turn: GameState.turn,
    timestamp: Date.now(),
  });

  if (typeof emitGameEvent === "function") {
    if (from) {
      emitGameEvent(
        "cardLeftZone",
        { card: movedObject, ownerId, zone: from, to, reason },
        { source: movedObject }
      );
    }

    emitGameEvent(
      "cardEnteredZone",
      { card: movedObject, ownerId, zone: to, from, reason },
      { source: movedObject }
    );

    emitGameEvent(
      "cardMoved",
      { card: movedObject, ownerId, from, to, reason },
      { source: movedObject }
    );
  }

  return { moved: true, card: movedObject, ownerId, from, to, reason };
}

function discardCard(card, from, ownerId = null, reason = "discard") {
  return moveCard(card, {
    from,
    to: ZoneTypes.DISCARD,
    ownerId,
    reason,
  });
}

function exileCard(card, from, ownerId = null, reason = "exile") {
  return moveCard(card, {
    from,
    to: ZoneTypes.EXILE,
    ownerId,
    reason,
  });
}

function returnCardToHand(card, from, ownerId = null) {
  return moveCard(card, {
    from,
    to: ZoneTypes.HAND,
    ownerId,
    reason: "return-to-hand",
  });
}

function resetZoneEngine() {
  GameState.zoneHistory = [];
  GameState.exile = { 1: [], 2: [] };
  GameState.discard = { 1: [], 2: [] };
}

ensureZoneState();

window.ZoneTypes = ZoneTypes;
window.getZone = getZone;
window.moveCard = moveCard;
window.discardCard = discardCard;
window.exileCard = exileCard;
window.returnCardToHand = returnCardToHand;
window.resetZoneEngine = resetZoneEngine;
