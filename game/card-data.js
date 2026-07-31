"use strict";

/*
 * Worlds Under Siege — Module 10
 * Card catalog, entity factories, and starter-match data.
 *
 * This module owns card/database normalization and the data used to build the
 * prototype's initial hands and units. Runtime match state remains in
 * game-state.js.
 */

function createCard({
  id,
  name,
  cost,
  attack,
  hp,
  range,
  speed,
  type = "Unit",
  cardImage = null,
  tileImage = null,
  effectText = "",
  databaseId = null,
  abilityId = null,
  targetMode = null,
  keywords = null,
  characteristics = null,
}) {
  return {
    id,
    name,
    type,
    cost,
    attack,
    hp,
    range,
    speed,
    cardImage,
    tileImage,
    effectText,
    databaseId,
    abilityId,
    targetMode,
    keywords: Array.isArray(keywords) ? [...keywords] : keywords ? [keywords] : [],
    characteristics: Array.isArray(characteristics) ? [...characteristics] : characteristics ? [characteristics] : [],
  };
}

function createUnit({
  id,
  name,
  owner,
  x,
  y,
  attack,
  hp,
  range,
  speed,
  cost,
  cardType = "Unit",
  type = cardType,
  types = null,
  traits = null,
  capabilities = null,
  capabilityOverrides = null,
  cardImage = null,
  tileImage = null,
  effectText = "",
  gameplayId = null,
  databaseId = null,
  isUnique = undefined,
  keywords = null,
  characteristics = null,
}) {
  return {
    id,
    name,
    owner,
    controller: owner,
    x,
    y,

    printedAttack: attack,
    printedHP: hp,
    printedRange: range,
    printedSpeed: speed,
    printedCost: cost,

    currentAttack: attack,
    currentHP: hp,
    currentRange: range,
    currentSpeed: speed,
    currentCost: cost,

    remainingSpeed: speed,
    hasAttacked: false,
    temporaryRangeBonus: 0,
    cardType,
    type,
    types: Array.isArray(types) && types.length ? [...types] : [type || cardType].filter(Boolean),
    traits: Array.isArray(traits) ? [...traits] : traits ? [traits] : [],
    capabilities: capabilities && typeof capabilities === "object" ? { ...capabilities } : {},
    capabilityOverrides: capabilityOverrides && typeof capabilityOverrides === "object" ? { ...capabilityOverrides } : {},

    cardImage,
    tileImage,
    effectText,
    gameplayId,
    databaseId,
    isUnique,
    keywords: Array.isArray(keywords) ? [...keywords] : keywords ? [keywords] : [],
    characteristics: Array.isArray(characteristics)
      ? [...characteristics]
      : characteristics
        ? [characteristics]
        : [],

    mountedOn: null,
    riderId: null,
    mountChangeUsed: false,

    isConcealed: false,
    concealedCost: 0,
    concealSource: null,
    movementSpent: 0,
    wasRevealed: false,
  };
}

function getCardDatabaseEntry(cardId) {
  return window.WUSCardDatabase?.getById(cardId)
    ?? window.getCardById?.(cardId)
    ?? null;
}

function normalizeGameAssetPath(path) {
  if (!path) return null;

  if (
    path.startsWith("../") ||
    path.startsWith("./") ||
    path.startsWith("/") ||
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  return `../${path}`;
}

function getDatabaseTilePath(entry) {
  if (!entry) return null;
  return `../tile/${entry.id} ${entry.name}.jpg`;
}

function createCardFromDatabase(cardId, overrides = {}) {
  const entry = getCardDatabaseEntry(cardId);

  if (!entry) {
    throw new Error(
      `Card database entry not found for ${cardId}. ` +
      `Load card-database.js before card-data.js.`
    );
  }

  return createCard({
    id: entry.gameplayId ?? entry.id,
    name: entry.name,
    cost: entry.cost,
    type: entry.type ?? entry.types?.[0] ?? "Unit",
    attack: entry.atk,
    hp: entry.hp,
    range: entry.range,
    speed: entry.spd,
    cardImage: normalizeGameAssetPath(entry.image),
    tileImage: getDatabaseTilePath(entry),
    effectText: entry.effectText ?? "",
    databaseId: entry.id,
    abilityId: entry.abilityId ?? entry.ability ?? null,
    targetMode: entry.targetMode ?? null,
    keywords: entry.keywords ?? [],
    characteristics: entry.characteristics ?? [],
    ...overrides,
  });
}

function createUnitFromDatabase(cardId, unitOptions) {
  const entry = getCardDatabaseEntry(cardId);

  if (!entry) {
    throw new Error(
      `Card database entry not found for ${cardId}. ` +
      `Load card-database.js before card-data.js.`
    );
  }

  return createUnit({
    ...unitOptions,
    name: entry.name,
    attack: entry.atk,
    hp: entry.hp,
    range: entry.range,
    speed: entry.spd,
    cost: entry.cost,
    cardType: entry.type ?? entry.types?.[0] ?? "Unit",
    cardImage: normalizeGameAssetPath(entry.image),
    tileImage: getDatabaseTilePath(entry),
    effectText: entry.effectText ?? "",
    databaseId: entry.id,
    characteristics: entry.characteristics ?? [],
  });
}

function getPlayerStrongholdCard(playerId = 1) {
  const selected = typeof GameState !== "undefined" ? GameState.players?.[playerId]?.selectedStrongholdCard : null;
  if (selected) return selected;
  const databaseCard = getCardDatabaseEntry("BOA-211");

  if (!databaseCard) {
    console.warn(
      "Camelot BOA-211 was not found. Make sure " +
      "card-database.js loads before card-data.js."
    );

    return {
      id: "BOA-211",
      name: "Camelot",
      cardImage: "../cards/BOA-211Camelot.jpg",
      effectText: "",
    };
  }

  return {
    id: databaseCard.id,
    name: databaseCard.name,
    cardImage: normalizeGameAssetPath(databaseCard.image),
    effectText: databaseCard.effectText ?? "",
  };
}

function createPlayerOneStartingHand() {
  return [
    createCard({
      id: "p1-swordsman",
      name: "Swordsman",
      cost: 1,
      attack: 2,
      hp: 3,
      range: 1,
      speed: 2,
    }),
    createCard({
      id: "p1-archer",
      name: "Archer",
      cost: 2,
      attack: 2,
      hp: 2,
      range: 3,
      speed: 2,
    }),
    getCardDatabaseEntry("BOA-146")
      ? createCardFromDatabase("BOA-146", { abilityId: "takingAim" })
      : createCard({
          id: "BOA-146",
          name: "Taking Aim",
          type: "Action",
          cost: 2,
          attack: null,
          hp: null,
          range: null,
          speed: null,
          cardImage: "../cards/BOA-146 Taking Aim.jpg",
          effectText: "The User gains +2 Range until the end of the turn.",
          databaseId: "BOA-146",
          abilityId: "takingAim",
          targetMode: "user",
        }),
    getCardDatabaseEntry("BOA-001")
      ? createCardFromDatabase("BOA-001")
      : createCard({
          id: "BOA-001",
          name: "King Arthur",
          cost: 5,
          attack: 6,
          hp: 6,
          range: 1,
          speed: 2,
          cardImage: "../cards/BOA-001 King Arthur.jpg",
          tileImage: "../tile/BOA-001 King Arthur.jpg",
          effectText: "Other Units you control gain +2 Attack and +1 Speed.",
          databaseId: "BOA-001",
        }),
  ];
}

function createPlayerTwoStartingHand() {
  return [
    createCard({
      id: "p2-guard",
      name: "Guard",
      cost: 1,
      attack: 1,
      hp: 5,
      range: 1,
      speed: 2,
    }),
    createCard({
      id: "p2-crossbowman",
      name: "Crossbowman",
      cost: 2,
      attack: 3,
      hp: 2,
      range: 3,
      speed: 1,
    }),
    createCard({
      id: "p2-raider",
      name: "Raider",
      cost: 3,
      attack: 4,
      hp: 4,
      range: 1,
      speed: 3,
    }),
  ];
}


function createPrototypeDeckFromCards(cards, playerId, size = 60) {
  const templates = Array.isArray(cards) ? cards : [];
  const deck = [];
  if (!templates.length) return deck;

  for (let index = 0; index < size; index += 1) {
    const template = templates[index % templates.length];
    const card = {
      ...template,
      id: `${template.id}-deck-${playerId}-${index + 1}`,
      keywords: Array.isArray(template.keywords) ? [...template.keywords] : [],
      characteristics: Array.isArray(template.characteristics) ? [...template.characteristics] : [],
      owner: playerId,
      controller: playerId,
      zone: "deck",
    };
    deck.push(card);
  }
  return deck;
}

function createPlayerOneStartingDeck() {
  return createPrototypeDeckFromCards(createPlayerOneStartingHand(), 1, 60);
}

function createPlayerTwoStartingDeck() {
  return createPrototypeDeckFromCards(createPlayerTwoStartingHand(), 2, 60);
}

function createStartingUnits() {
  return [];
}
