"use strict";

/* Worlds Under Siege — V19.9.6.1a saved-deck loader foundation. */
(function initSavedDeckLoader(global) {
  const DECKS_KEY = "wus-saved-decks-v2";
  const LEGACY_DECKS_KEY = "wus-saved-decks-v1";
  const ACTIVE_KEY = "wus-active-deck-v2";
  const LEGACY_ACTIVE_KEY = "wus-active-deck-v1";
  const MAIN_DECK_SIZE = 60;
  const ARMY_LIMIT = 3;

  function readJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(`Could not read saved deck storage key ${key}.`, error);
      return fallback;
    }
  }

  function getEntry(cardId) {
    if (!cardId) return null;
    return typeof getCardDatabaseEntry === "function"
      ? getCardDatabaseEntry(cardId)
      : global.WUSCardDatabase?.getById(cardId) || null;
  }

  function cardTypes(entry) {
    return Array.isArray(entry?.types)
      ? entry.types
      : entry?.type ? [entry.type] : [];
  }

  function isType(entry, type) {
    return cardTypes(entry).includes(type);
  }

  function normalizeSavedDeck(raw = {}) {
    if (raw.mainDeck || raw.stronghold !== undefined || raw.armies) {
      return {
        name: raw.name || "Untitled Deck",
        mainDeck: { ...(raw.mainDeck || {}) },
        stronghold: raw.stronghold || null,
        armies: [...(raw.armies || [])].slice(0, ARMY_LIMIT),
        updated: raw.updated || 0,
      };
    }

    const legacy = raw.deck || raw.cards || raw || {};
    const deck = { name: raw.name || "Untitled Deck", mainDeck: {}, stronghold: null, armies: [], updated: raw.updated || 0 };
    if (Array.isArray(legacy)) {
      for (const item of legacy) {
        const id = typeof item === "string" ? item : item?.cardId || item?.id;
        const quantity = typeof item === "string" ? 1 : Number(item?.quantity || 1);
        if (id) deck.mainDeck[id] = (deck.mainDeck[id] || 0) + Math.max(0, quantity);
      }
    } else {
      for (const [id, quantity] of Object.entries(legacy)) {
        const entry = getEntry(id);
        const qty = Math.max(0, Number(quantity) || 0);
        if (!entry || !qty) continue;
        if (isType(entry, "Stronghold")) deck.stronghold ||= id;
        else if (isType(entry, "Army")) {
          if (deck.armies.length < ARMY_LIMIT && !deck.armies.includes(id)) deck.armies.push(id);
        } else deck.mainDeck[id] = qty;
      }
    }
    return deck;
  }

  function getSavedDecks() {
    const current = readJSON(DECKS_KEY, null);
    const source = current && typeof current === "object" ? current : readJSON(LEGACY_DECKS_KEY, {});
    return Object.fromEntries(Object.entries(source || {}).map(([id, deck]) => [id, normalizeSavedDeck(deck)]));
  }

  function getActiveSavedDeck() {
    const active = readJSON(ACTIVE_KEY, null) || readJSON(LEGACY_ACTIVE_KEY, null);
    return active ? normalizeSavedDeck(active) : null;
  }

  function validateSavedDeck(rawDeck) {
    const deck = normalizeSavedDeck(rawDeck);
    const errors = [];
    let total = 0;

    for (const [id, rawQuantity] of Object.entries(deck.mainDeck)) {
      const quantity = Number(rawQuantity);
      const entry = getEntry(id);
      if (!entry) errors.push(`Unknown main-deck card: ${id}`);
      else if (isType(entry, "Stronghold") || isType(entry, "Army")) errors.push(`${id} cannot be in the main deck.`);
      if (!Number.isInteger(quantity) || quantity <= 0) errors.push(`${id} has an invalid quantity.`);
      else total += quantity;
    }

    if (total !== MAIN_DECK_SIZE) errors.push(`Main deck must contain exactly ${MAIN_DECK_SIZE} cards (${total}/${MAIN_DECK_SIZE}).`);
    const stronghold = getEntry(deck.stronghold);
    if (!deck.stronghold) errors.push("Exactly one Stronghold is required.");
    else if (!stronghold) errors.push(`Unknown Stronghold: ${deck.stronghold}`);
    else if (!isType(stronghold, "Stronghold")) errors.push(`${deck.stronghold} is not a Stronghold.`);

    if (deck.armies.length > ARMY_LIMIT) errors.push(`No more than ${ARMY_LIMIT} Army cards may be selected.`);
    if (new Set(deck.armies).size !== deck.armies.length) errors.push("Army selections must be different cards.");
    for (const id of deck.armies) {
      const entry = getEntry(id);
      if (!entry) errors.push(`Unknown Army: ${id}`);
      else if (!isType(entry, "Army")) errors.push(`${id} is not an Army card.`);
    }

    return { valid: errors.length === 0, errors, total, deck };
  }

  function createRuntimeCard(cardId, playerId, serial, zone = "deck") {
    const card = createCardFromDatabase(cardId);
    card.id = `${card.databaseId || cardId}-p${playerId}-${zone}-${serial}`;
    card.gameplayId = getEntry(cardId)?.gameplayId || card.databaseId || cardId;
    card.owner = playerId;
    card.controller = playerId;
    card.zone = zone;
    card.keywords = [...(card.keywords || [])];
    card.characteristics = [...(card.characteristics || [])];
    if (typeof normalizeCard === "function") normalizeCard(card);
    return card;
  }

  function createRuntimeDeck(rawDeck, playerId = 1) {
    const result = validateSavedDeck(rawDeck);
    if (!result.valid) return { ...result, cards: [] };
    const cards = [];
    let serial = 1;
    for (const [id, quantity] of Object.entries(result.deck.mainDeck)) {
      for (let copy = 0; copy < quantity; copy += 1) cards.push(createRuntimeCard(id, playerId, serial++, "deck"));
    }
    return { ...result, cards };
  }

  function shuffle(cards) {
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[other]] = [cards[other], cards[index]];
    }
    return cards;
  }

  function getGameState() {
    // GameState is declared with top-level const in game-state.js, so browsers do
    // not expose it as window.GameState. Prefer the lexical binding and only
    // fall back to the window property for compatibility.
    if (typeof GameState !== "undefined") return GameState;
    return global.GameState || null;
  }

  function applySavedDeckToPlayer(rawDeck, playerId = 1, options = {}) {
    const gameState = getGameState();
    if (!gameState?.players?.[playerId]) {
      return { valid: false, errors: [`Unknown player ${playerId}.`] };
    }
    const runtime = createRuntimeDeck(rawDeck, playerId);
    if (!runtime.valid) return runtime;

    const player = gameState.players[playerId];
    player.deck = options.shuffle === false ? runtime.cards : shuffle(runtime.cards);
    player.deckCount = player.deck.length;
    player.hand = [];
    player.selectedStrongholdId = runtime.deck.stronghold;
    player.selectedStrongholdCard = createRuntimeCard(runtime.deck.stronghold, playerId, 1, "stronghold");
    player.armyZone = runtime.deck.armies.map((id, index) => {
      const card = createRuntimeCard(id, playerId, index + 1, "army");
      return { ...card, id: `${card.databaseId}-p${playerId}-army-type-${index + 1}`, armyType: card.name, amount: 0 };
    });
    player.loadedDeckName = runtime.deck.name;
    player.loadedDeckSource = options.source || "saved-deck";
    return runtime;
  }

  function loadSavedDeck(id, playerId = 1, options = {}) {
    const deck = getSavedDecks()[id];
    return deck ? applySavedDeckToPlayer(deck, playerId, { ...options, source: id }) : { valid: false, errors: [`Saved deck not found: ${id}`] };
  }

  function loadActiveDeck(playerId = 1, options = {}) {
    const deck = getActiveSavedDeck();
    return deck ? applySavedDeckToPlayer(deck, playerId, { ...options, source: ACTIVE_KEY }) : { valid: false, errors: ["No active saved deck was found."] };
  }

  global.WUSDeckLoader = Object.freeze({
    keys: Object.freeze({ decks: DECKS_KEY, active: ACTIVE_KEY }),
    getSavedDecks,
    getActiveSavedDeck,
    normalizeSavedDeck,
    validateSavedDeck,
    createRuntimeDeck,
    applySavedDeckToPlayer,
    loadSavedDeck,
    loadActiveDeck,
  });
})(window);
