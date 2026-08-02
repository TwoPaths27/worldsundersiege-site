"use strict";

/*
 * Worlds Under Siege — V19.9.1 Zone Engine
 *
 * Centralizes card movement for private and public card zones.  The UI pass
 * comes later; this module establishes authoritative state, validation,
 * event emission, logging, and deck-out handling.
 */

const ZoneTypes = Object.freeze({
  DECK: "deck",
  HAND: "hand",
  STACK: "stack",
  BATTLEFIELD: "battlefield",
  DISCARD: "discard",
  BANISH: "banish",
  EXILE: "banish", // compatibility alias for older effects
  ARMY: "army",
  EVENT: "event",
});

const PLAYER_ARRAY_ZONES = Object.freeze([
  ZoneTypes.DECK,
  ZoneTypes.HAND,
  ZoneTypes.DISCARD,
  ZoneTypes.BANISH,
  ZoneTypes.ARMY,
]);

function getPlayerId(playerOrId) {
  if (Number.isInteger(playerOrId)) return playerOrId;
  if (!playerOrId || typeof playerOrId !== "object") return null;
  for (const [id, player] of Object.entries(GameState.players ?? {})) {
    if (player === playerOrId) return Number(id);
  }
  return Number(playerOrId.id ?? playerOrId.playerId ?? playerOrId.owner) || null;
}

function getPlayer(playerOrId) {
  const id = getPlayerId(playerOrId);
  return id ? GameState.players?.[id] ?? null : null;
}

function ensurePlayerZones(playerOrId) {
  const player = getPlayer(playerOrId);
  if (!player) return null;

  player.deck ??= [];
  player.hand ??= [];
  player.discard ??= [];
  player.banish ??= [];
  player.armyZone ??= [];
  player.discardCount = player.discard.length;
  player.banishCount = player.banish.length;
  player.deckCount = player.deck.length;
  return player;
}

function ensureZones() {
  for (const id of Object.keys(GameState.players ?? {})) {
    ensurePlayerZones(Number(id));
  }
  GameState.zoneHistory ??= [];
  return true;
}

function normalizeZoneName(zoneName) {
  if (zoneName === "exile" || zoneName === ZoneTypes.EXILE) return ZoneTypes.BANISH;
  return String(zoneName ?? "").toLowerCase();
}

function getZone(zoneName, playerOrId = null) {
  const zone = normalizeZoneName(zoneName);
  const player = playerOrId == null ? null : ensurePlayerZones(playerOrId);

  if (PLAYER_ARRAY_ZONES.includes(zone)) {
    if (!player) return null;
    if (zone === ZoneTypes.ARMY) return player.armyZone;
    return player[zone];
  }

  if (zone === ZoneTypes.STACK) return GameState.actionStack ?? null;
  if (zone === ZoneTypes.BATTLEFIELD) return GameState.units ?? null;
  if (zone === ZoneTypes.EVENT) {
    if (!player) return null;
    const playerId = getPlayerId(player);
    return GameState.playerEvents?.[playerId] ?? null;
  }
  return null;
}

function inferCardPlayerId(card, preferredPlayerId = null) {
  const preferred = getPlayerId(preferredPlayerId);
  if (preferred && GameState.players?.[preferred]) return preferred;

  const candidates = [card?.controller, card?.owner, card?.playerId]
    .map(Number)
    .filter((id) => GameState.players?.[id]);
  if (candidates.length) return candidates[0];

  for (const [id, player] of Object.entries(GameState.players ?? {})) {
    ensurePlayerZones(Number(id));
    if (PLAYER_ARRAY_ZONES.some((zone) => {
      const list = zone === ZoneTypes.ARMY ? player.armyZone : player[zone];
      return list?.some((entry) => entry === card || entry?.id === card?.id);
    })) return Number(id);
  }
  return null;
}

function findCardIndex(zone, card) {
  if (!Array.isArray(zone) || !card) return -1;
  return zone.findIndex((entry) => entry === card || (
    card.id != null && entry?.id === card.id
  ));
}

function removeFromZone(cardOrId, zoneName, playerOrId = null) {
  const card = typeof cardOrId === "object" ? cardOrId : { id: cardOrId };
  const zone = normalizeZoneName(zoneName);
  const playerId = inferCardPlayerId(card, playerOrId);
  const collection = getZone(zone, playerId);

  if (!Array.isArray(collection)) return null;
  const index = findCardIndex(collection, card);
  if (index < 0) return null;

  const removed = collection.splice(index, 1)[0];
  syncZoneCounts(playerId);
  return removed;
}

function addToZone(card, zoneName, playerOrId = null, options = {}) {
  if (!card || typeof card !== "object") return false;
  const zone = normalizeZoneName(zoneName);
  const playerId = inferCardPlayerId(card, playerOrId);
  const collection = getZone(zone, playerId);

  if (!Array.isArray(collection)) return false;
  if (!options.allowDuplicate && findCardIndex(collection, card) >= 0) return true;

  if (options.position === "top") collection.unshift(card);
  else collection.push(card);

  card.zone = zone;
  card.owner ??= playerId;
  syncZoneCounts(playerId);
  return true;
}

function syncZoneCounts(playerOrId) {
  const player = getPlayer(playerOrId);
  if (!player) return;
  ensurePlayerZones(player);
  player.deckCount = player.deck.length;
  player.discardCount = player.discard.length;
  player.banishCount = player.banish.length;
}

function recordZoneMove(card, from, to, playerId, reason) {
  const entry = {
    cardId: card?.id ?? null,
    cardName: card?.name ?? "Unknown card",
    playerId,
    from,
    to,
    reason,
    timestamp: Date.now(),
  };
  GameState.zoneHistory ??= [];
  GameState.zoneHistory.push(entry);
  if (GameState.zoneHistory.length > 250) GameState.zoneHistory.shift();

  if (typeof addLog === "function" && reason !== "setup" && reason !== "silent") {
    const playerName = GameState.players?.[playerId]?.name ?? `Player ${playerId}`;
    addLog(`${playerName}: ${entry.cardName} moved from ${from} to ${to}.`);
  }

  if (typeof emitGameEvent === "function") {
    const payload = { card, playerId, from, to, reason };
    emitGameEvent("cardMoved", payload, { source: card });
    emitGameEvent("leftZone", { card, playerId, zone: from, to, reason }, { source: card });
    emitGameEvent("enteredZone", { card, playerId, zone: to, from, reason }, { source: card });
  }
}

function moveCard(card, options = {}) {
  if (!card || typeof card !== "object") return false;
  const from = normalizeZoneName(options.from ?? card.zone);
  const to = normalizeZoneName(options.to);
  const playerId = inferCardPlayerId(card, options.playerId ?? options.owner ?? options.controller);
  const reason = options.reason ?? "move";

  if (!from || !to || !playerId) return false;
  if (from === to) return true;

  const removed = removeFromZone(card, from, playerId);
  if (!removed) return false;

  if (!addToZone(removed, to, playerId, { position: options.position })) {
    addToZone(removed, from, playerId, { position: options.rollbackPosition });
    return false;
  }

  recordZoneMove(removed, from, to, playerId, reason);
  return removed;
}

function endGameByDeckOut(playerOrId) {
  const playerId = getPlayerId(playerOrId);
  const player = getPlayer(playerId);
  if (!player || GameState.gameOver) return false;

  const opponentId = Object.keys(GameState.players ?? {})
    .map(Number)
    .find((id) => id !== playerId) ?? null;

  player.hasLost = true;
  player.lossReason = "deck-out";

  if (typeof addLog === "function") {
    addLog(`${player.name} tried to draw from an empty Deck and loses the game.`);
  }
  if (typeof emitGameEvent === "function") {
    emitGameEvent("playerLost", { playerId, reason: "deck-out", winnerPlayerId: opponentId }, { source: player });
    emitGameEvent("gameEnded", { winnerPlayerId: opponentId, loserPlayerId: playerId, reason: "deck-out" }, { source: GameState });
  }

  // Deck-out uses the same cinematic end-game pipeline as a destroyed
  // Stronghold. Do not merely freeze the state after writing to the log.
  if (typeof endGame === "function" && opponentId != null) {
    Promise.resolve(endGame(opponentId, playerId, { reason: "deck-out" })).catch(console.error);
  } else {
    GameState.gameOver = true;
    GameState.winnerPlayerId = opponentId;
    if (typeof renderGame === "function") renderGame();
  }
  return true;
}

function drawCard(playerOrId, options = {}) {
  const playerId = getPlayerId(playerOrId);
  const player = ensurePlayerZones(playerId);
  if (!player || GameState.gameOver) return null;

  if (player.deck.length === 0) {
    endGameByDeckOut(playerId);
    return null;
  }

  const card = player.deck.shift();
  card.zone = ZoneTypes.DECK;
  const moved = addToZone(card, ZoneTypes.HAND, playerId);
  if (!moved) {
    player.deck.unshift(card);
    syncZoneCounts(playerId);
    return null;
  }

  GameState.lastDrawnCard = {
    card,
    playerId,
    drawnAt: Date.now(),
  };
  syncZoneCounts(playerId);
  recordZoneMove(card, ZoneTypes.DECK, ZoneTypes.HAND, playerId, options.reason ?? "draw");
  if (typeof emitGameEvent === "function") {
    emitGameEvent("cardDrawn", { card, playerId }, { source: card });
  }
  return card;
}

function drawCards(playerOrId, amount = 1, options = {}) {
  const cards = [];
  const count = Math.max(0, Math.floor(Number(amount) || 0));
  for (let i = 0; i < count; i += 1) {
    const card = drawCard(playerOrId, options);
    if (!card) break;
    cards.push(card);
  }
  return cards;
}

function discardCard(card, from = ZoneTypes.HAND, options = {}) {
  return moveCard(card, {
    ...options,
    from,
    to: ZoneTypes.DISCARD,
    reason: options.reason ?? "discard",
  });
}

function banishCard(card, from = card?.zone, options = {}) {
  return moveCard(card, {
    ...options,
    from,
    to: ZoneTypes.BANISH,
    reason: options.reason ?? "banish",
  });
}

function exileCard(card, from = card?.zone, options = {}) {
  return banishCard(card, from, options);
}

function returnCardToHand(card, from = card?.zone, options = {}) {
  return moveCard(card, {
    ...options,
    from,
    to: ZoneTypes.HAND,
    reason: options.reason ?? "return-to-hand",
  });
}

function putOnTopOfDeck(card, from = card?.zone, options = {}) {
  return moveCard(card, {
    ...options,
    from,
    to: ZoneTypes.DECK,
    position: "top",
    reason: options.reason ?? "top-deck",
  });
}

function putOnBottomOfDeck(card, from = card?.zone, options = {}) {
  return moveCard(card, {
    ...options,
    from,
    to: ZoneTypes.DECK,
    position: "bottom",
    reason: options.reason ?? "bottom-deck",
  });
}

function shuffleDeck(playerOrId, random = Math.random) {
  const playerId = getPlayerId(playerOrId);
  const player = ensurePlayerZones(playerId);
  if (!player) return false;

  for (let i = player.deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
  }
  if (typeof addLog === "function") addLog(`${player.name} shuffled their Deck.`);
  if (typeof emitGameEvent === "function") {
    emitGameEvent("deckShuffled", { playerId, count: player.deck.length }, { source: player });
  }
  return true;
}

function validateZones(options = {}) {
  ensureZones();
  const errors = [];
  const seen = new Map();

  for (const [idText, player] of Object.entries(GameState.players ?? {})) {
    const playerId = Number(idText);
    ensurePlayerZones(playerId);
    for (const zoneName of PLAYER_ARRAY_ZONES) {
      const list = zoneName === ZoneTypes.ARMY ? player.armyZone : player[zoneName];
      if (!Array.isArray(list)) {
        errors.push(`Player ${playerId} ${zoneName} is not an array.`);
        continue;
      }
      for (const card of list) {
        if (!card || typeof card !== "object") {
          errors.push(`Player ${playerId} ${zoneName} contains an invalid card.`);
          continue;
        }
        const key = card.id ?? card;
        if (seen.has(key)) {
          errors.push(`${card.name ?? card.id ?? "Card"} appears in both ${seen.get(key)} and P${playerId} ${zoneName}.`);
        } else {
          seen.set(key, `P${playerId} ${zoneName}`);
        }
        if (options.repair) {
          card.zone = zoneName;
          card.owner ??= playerId;
        }
      }
    }
    syncZoneCounts(playerId);
  }

  if (errors.length && options.log !== false && typeof console !== "undefined") {
    console.warn("Zone validation found problems:", errors);
  }
  return { valid: errors.length === 0, errors };
}


/* V19.9.4 — Army Zone --------------------------------------------------- */
const MAX_ARMY_TYPES = 3;

function getArmyTypeKey(cardOrType) {
  if (typeof cardOrType === "string") return cardOrType.trim().toLowerCase();
  const card = cardOrType ?? {};
  return String(
    card.armyType ??
    card.subtype ??
    card.faction ??
    card.name ??
    card.id ??
    "army"
  ).trim().toLowerCase();
}

function getArmyTypeName(cardOrType) {
  if (typeof cardOrType === "string") return cardOrType.trim() || "Army";
  const card = cardOrType ?? {};
  return String(card.armyType ?? card.subtype ?? card.name ?? "Army").trim() || "Army";
}

function isArmyCardForZone(card) {
  if (!card || typeof card !== "object") return false;
  if (typeof isArmy === "function") return isArmy(card);
  const types = Array.isArray(card.types) ? card.types : [card.type, card.cardType];
  return types.some((type) => String(type ?? "").toLowerCase() === "army");
}

function findArmyEntry(playerOrId, armyType) {
  const player = ensurePlayerZones(playerOrId);
  if (!player) return null;
  const key = getArmyTypeKey(armyType);
  return player.armyZone.find((entry) => getArmyTypeKey(entry) === key) ?? null;
}

function createArmyEntry(playerId, armyCard, amount = 0) {
  const armyType = getArmyTypeName(armyCard);
  return {
    id: `p${playerId}-army-${getArmyTypeKey(armyCard).replace(/[^a-z0-9]+/g, "-")}`,
    name: armyType,
    armyType,
    amount: Math.max(0, Math.floor(Number(amount) || 0)),
    owner: playerId,
    controller: playerId,
    zone: ZoneTypes.ARMY,
    types: ["Army"],
    sourceCardId: armyCard?.id ?? null,
    sourceCard: armyCard ?? null,
    cardImage: armyCard?.cardImage ?? armyCard?.image ?? "",
    effectText: armyCard?.effectText ?? armyCard?.text ?? "",
  };
}

function amassArmy(playerOrId, armyCardOrType, amount = 1, options = {}) {
  const playerId = getPlayerId(playerOrId);
  const player = ensurePlayerZones(playerId);
  const growth = Math.max(0, Math.floor(Number(amount) || 0));
  if (!player || !armyCardOrType || growth <= 0) return null;

  const isCardObject = typeof armyCardOrType === "object";
  if (isCardObject && !isArmyCardForZone(armyCardOrType)) {
    if (typeof addLog === "function") addLog(`${armyCardOrType.name ?? "That card"} is not an Army card.`);
    return null;
  }

  let entry = findArmyEntry(playerId, armyCardOrType);
  if (!entry) {
    if (player.armyZone.length >= MAX_ARMY_TYPES) {
      if (typeof addLog === "function") {
        addLog(`${player.name} already controls three different Army types and cannot create another.`);
      }
      if (typeof emitGameEvent === "function") {
        emitGameEvent("armyTypeLimitReached", {
          playerId,
          armyType: getArmyTypeName(armyCardOrType),
          limit: MAX_ARMY_TYPES,
        }, { source: isCardObject ? armyCardOrType : player });
      }
      return null;
    }
    entry = createArmyEntry(playerId, isCardObject ? armyCardOrType : { armyType: armyCardOrType }, 0);
    player.armyZone.push(entry);
    if (typeof emitGameEvent === "function") {
      emitGameEvent("armyCreated", { playerId, army: entry }, { source: isCardObject ? armyCardOrType : entry });
    }
  }

  const previousAmount = Math.max(0, Math.floor(Number(entry.amount) || 0));
  entry.amount = previousAmount + growth;
  entry.zone = ZoneTypes.ARMY;
  entry.owner ??= playerId;
  entry.controller = playerId;
  entry.lastAmassedAt = Date.now();

  if (typeof addLog === "function" && options.silent !== true) {
    addLog(`${player.name} amasses ${growth} ${entry.armyType} (${entry.amount} total).`);
  }
  if (typeof emitGameEvent === "function") {
    emitGameEvent("armyAmassed", {
      playerId,
      army: entry,
      amount: growth,
      previousAmount,
      total: entry.amount,
      sourceCard: isCardObject ? armyCardOrType : null,
    }, { source: options.source ?? (isCardObject ? armyCardOrType : entry) });
  }
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return entry;
}

function deployArmyCard(card, playerOrId = null, options = {}) {
  if (!isArmyCardForZone(card)) return false;
  const playerId = getPlayerId(playerOrId) ?? inferCardPlayerId(card);
  const from = normalizeZoneName(options.from ?? card.zone ?? ZoneTypes.HAND);
  const player = ensurePlayerZones(playerId);
  if (!player) return false;

  const existing = findArmyEntry(playerId, card);
  if (!existing && player.armyZone.length >= MAX_ARMY_TYPES) {
    if (typeof addLog === "function") addLog(`${player.name} cannot deploy ${card.name}; the Army Zone already has three different Army types.`);
    return false;
  }

  const removed = removeFromZone(card, from, playerId);
  if (!removed) return false;
  const entry = amassArmy(playerId, removed, options.amount ?? 1, {
    ...options,
    source: options.source ?? removed,
    render: false,
  });
  if (!entry) {
    addToZone(removed, from, playerId, { position: options.rollbackPosition });
    return false;
  }

  removed.zone = ZoneTypes.ARMY;
  recordZoneMove(removed, from, ZoneTypes.ARMY, playerId, options.reason ?? "deploy-army");
  if (typeof emitGameEvent === "function") {
    emitGameEvent("armyCardDeployed", { playerId, card: removed, army: entry }, { source: removed });
  }
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return entry;
}

function reduceArmy(playerOrId, armyType, amount = 1, options = {}) {
  const playerId = getPlayerId(playerOrId);
  const player = ensurePlayerZones(playerId);
  const entry = findArmyEntry(playerId, armyType);
  const loss = Math.max(0, Math.floor(Number(amount) || 0));
  if (!player || !entry || loss <= 0) return null;

  const previousAmount = entry.amount;
  entry.amount = Math.max(0, previousAmount - loss);
  if (typeof emitGameEvent === "function") {
    emitGameEvent("armyReduced", { playerId, army: entry, amount: Math.min(loss, previousAmount), previousAmount, total: entry.amount }, { source: options.source ?? entry });
  }
  if (entry.amount === 0 && options.keepEmpty !== true) {
    player.armyZone = player.armyZone.filter((candidate) => candidate !== entry);
    if (typeof emitGameEvent === "function") emitGameEvent("armyRemoved", { playerId, army: entry }, { source: options.source ?? entry });
  }
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return entry;
}

ensureZones();
validateZones({ repair: true, log: false });

window.ZoneTypes = ZoneTypes;
window.WUSZones = Object.freeze({
  ensureZones,
  ensurePlayerZones,
  getZone,
  addToZone,
  removeFromZone,
  moveCard,
  drawCard,
  drawCards,
  discardCard,
  banishCard,
  exileCard,
  returnCardToHand,
  putOnTopOfDeck,
  putOnBottomOfDeck,
  shuffleDeck,
  validateZones,
  endGameByDeckOut,
  MAX_ARMY_TYPES,
  getArmyTypeKey,
  getArmyTypeName,
  findArmyEntry,
  amassArmy,
  deployArmyCard,
  reduceArmy,
});
window.ensureZones = ensureZones;
window.getZone = getZone;
window.addToZone = addToZone;
window.removeFromZone = removeFromZone;
window.moveCard = moveCard;
window.drawCard = drawCard;
window.drawCards = drawCards;
window.discardCard = discardCard;
window.banishCard = banishCard;
window.exileCard = exileCard;
window.returnCardToHand = returnCardToHand;
window.putOnTopOfDeck = putOnTopOfDeck;
window.putOnBottomOfDeck = putOnBottomOfDeck;
window.shuffleDeck = shuffleDeck;
window.validateZones = validateZones;

window.MAX_ARMY_TYPES = MAX_ARMY_TYPES;
window.getArmyTypeKey = getArmyTypeKey;
window.findArmyEntry = findArmyEntry;
window.amassArmy = amassArmy;
window.deployArmyCard = deployArmyCard;
window.reduceArmy = reduceArmy;
