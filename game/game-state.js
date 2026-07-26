"use strict";

/*
 * Worlds Under Siege — Module 1
 * Core constants, factories, initial state, and state lookup helpers.
 */

const BOARD_COLUMNS = 7;
const BOARD_ROWS = 6;

const ENEMY_RECRUITING_SPACES = new Set([
  "2,0",
  "3,0",
  "4,0",
]);

const PLAYER_RECRUITING_SPACES = new Set([
  "2,5",
  "3,5",
  "4,5",
]);
const PRIORITY = Object.freeze({
  NONE: "none",
  RECRUIT: "recruit",
  MOVE: "move",
  ATTACK: "attack",
  DAMAGE: "damage",
  ACTION: "action",
  END_TURN: "end_turn",
});
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
  };
}

const CARD_DATABASE = Array.isArray(window.WUS_CARD_DATABASE)
  ? window.WUS_CARD_DATABASE
  : [];

function getCardDatabaseEntry(cardId) {
  return CARD_DATABASE.find(
    (entry) =>
      entry.id === cardId ||
      entry.gameplayId === cardId
  ) ?? null;
}
function getPlayerStrongholdCard() {
  const databaseCard = getCardDatabaseEntry("BOA-211");

  if (!databaseCard) {
    console.warn(
      "Camelot BOA-211 was not found. Make sure " +
      "card-database.js loads before game.js."
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
      `Load card-database.js before game.js.`
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
    ...overrides,
  });
}

function createUnitFromDatabase(cardId, unitOptions) {
  const entry = getCardDatabaseEntry(cardId);

  if (!entry) {
    throw new Error(
      `Card database entry not found for ${cardId}. ` +
      `Load card-database.js before game.js.`
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
  });
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
  cardImage = null,
  tileImage = null,
  effectText = "",
  databaseId = null,
}) {
  return {
    id,
    name,
    owner,
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

    cardImage,
    tileImage,
    effectText,
    databaseId,
  };
}

const GameState = {
  turn: 1,
  activePlayer: 1,
  selectedUnitId: null,
selectedCardId: null,
selectedUnitAction: "move",
actionSelectionMessage: "",
actionStack: [],
nextActionStackId: 1,
priority: {
  active: false,
  reason: PRIORITY.NONE,
  playerId: null,
  passes: 0,
  openedAt: 0,
  resolving: false,
},

pendingEvent: null,

pendingActionUserId: null,
pendingActionTargetId: null,
reachableSpaces: new Map(),
attackableUnitIds: new Set(),
attackableStrongholdPlayerId: null,
  gameOver: false,
  winnerPlayerId: null,
  nextUnitId: 1,
  isAnimating: false,
  lastSpawnedUnitId: null,

  players: {
    1: {
      name: "Player 1",
      energy: 1,
      maxEnergy: 1,
      strongholdHP: 15,
      discardCount: 0,
      hand: [
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

    (
    getCardDatabaseEntry("BOA-146")
      ? createCardFromDatabase("BOA-146")
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
        })
    ),

    (
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
          effectText:
            "Other Units you control gain +2 Attack and +1 Speed.",
          databaseId: "BOA-001",
        })
  ),
],
    },

    2: {
      name: "Player 2",
      energy: 0,
      maxEnergy: 0,
      strongholdHP: 15,
      discardCount: 0,
      hand: [
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
],
    },
  },

  units: [
        (
      getCardDatabaseEntry("BOA-001")
        ? createUnitFromDatabase("BOA-001", {
            id: "player-1-king-arthur",
            owner: 1,
            x: 3,
            y: 5,
          })
        : createUnit({
            id: "player-1-king-arthur",
            name: "King Arthur",
            owner: 1,
            x: 3,
            y: 5,
            attack: 6,
            hp: 6,
            range: 1,
            speed: 2,
            cost: 5,
            cardImage: "../cards/BOA-001 King Arthur.jpg",
            tileImage: "../tile/BOA-001 King Arthur.jpg",
            effectText:
              "Other Units you control gain +2 Attack and +1 Speed.",
            databaseId: "BOA-001",
          })
    ),

createUnit({
  id: "player-2-guard",
  name: "Guard",
  owner: 2,
  x: 3,
  y: 0,
  attack: 2,
  hp: 7,
  range: 1,
  speed: 2,
  cost: 2,
}),
  ],

  log: ["Battlefield initialized."],
};

function getInteractionPlayerId() {
  return GameState.priority.active && GameState.priority.playerId
    ? GameState.priority.playerId
    : GameState.activePlayer;
}

function getActivePlayer() {
  return GameState.players[getInteractionPlayerId()];
}

function getSelectedUnit() {
  if (!GameState.selectedUnitId) {
    return null;
  }

  return getUnitById(GameState.selectedUnitId);
}

function getSelectedCard() {
  const player = getActivePlayer();

  return (
    player.hand.find(
      (card) => card.id === GameState.selectedCardId
    ) ?? null
  );
}

function getUnitById(unitId) {
  return (
    GameState.units.find((unit) => unit.id === unitId) ?? null
  );
}

function getUnitAt(x, y) {
  return (
    GameState.units.find(
      (unit) => unit.x === x && unit.y === y
    ) ?? null
  );
}

function getCoordinateKey(x, y) {
  return `${x},${y}`;
}
