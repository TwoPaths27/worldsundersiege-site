"use strict";

/*
 * Worlds Under Siege — Module 1
 * Core constants, runtime match state, and state lookup helpers.
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
constructOperatorIds: new Set(),
pendingConstructOperatorId: null,
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
      hand: normalizeCards(createPlayerOneStartingHand()),
    },

    2: {
      name: "Player 2",
      energy: 0,
      maxEnergy: 0,
      strongholdHP: 15,
      discardCount: 0,
      hand: normalizeCards(createPlayerTwoStartingHand()),
    },
  },

  units: normalizeCards(createStartingUnits()),
  items: [],
  nextItemId: 1,

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


// Battlefield inspection is independent from gameplay selection.
GameState.inspectedUnitId = null;
