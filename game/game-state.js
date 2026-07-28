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

  // Turn-step priority windows.
  BEGINNING: "beginning",
  DRAW: "draw",
  MAIN: "main",
  END: "end",

  // Gameplay reaction windows.
  RECRUIT: "recruit",
  MOVE: "move",
  ATTACK: "attack",
  DAMAGE: "damage",
  ACTION: "action",
  END_TURN: "end_turn",
});

const PRIORITY_STATE = Object.freeze({
  IDLE: "idle",
  OPEN: "open",
  WAITING: "waiting_for_player",
  PASSING: "passing",
  RESOLVING: "resolving",
  CLOSED: "closed",
});

function createDefaultPrioritySettings() {
  return {
    fullControl: false,
    // Retained for save compatibility. v18.8 no longer opens phase priority.
    phaseStops: {},
    reactionStops: {
      recruit: false,
      move: false,
      attack: true,
      damage: false,
      action: true,
      end_turn: false,
      trigger: true,
      ability: true,
      cardPlayed: true,
      permanentEntered: false,
      unitDestroyed: false,
    },
  };
}
const GameState = {
  turn: 1,
  activePlayer: 1,
  firstPlayerId: null,
  openingHandPhase: { active: false, completed: false, handSize: 6 },
  selectedUnitId: null,
selectedCardId: null,
selectedUnitAction: "move",
actionSelectionMessage: "",
actionStack: [],

/*
 * Generic runtime ID source for every stack entry. nextActionStackId remains
 * available for compatibility with older card code and saved test fixtures.
 */
nextStackEntryId: 1,
nextActionStackId: 1,
priority: {
  active: false,
  state: PRIORITY_STATE.IDLE,
  reason: PRIORITY.NONE,
  playerId: null,
  passes: 0,
  openedAt: 0,
  resolving: false,
  windowId: 0,
  sourcePlayerId: null,
  mandatory: false,
  autoPassQueued: false,
},
prioritySettings: {
  1: createDefaultPrioritySettings(),
  2: createDefaultPrioritySettings(),
},

pendingEvent: null,
pendingEventChoice: null,

turnFlow: {
  step: "setup",
  transitioning: false,
  endTurnRequestedBy: null,
},

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
      usedMulligan: false,
      mulliganDecisionMade: false,
      mulliganAvailable: true,
      energy: 1,
      maxEnergy: 1,
      strongholdHP: 15,
      deck: normalizeCards(createPlayerOneStartingDeck()),
      deckCount: 60,
      discard: [],
      discardCount: 0,
      banish: [],
      banishCount: 0,
      armyZone: [],
      hand: normalizeCards(createPlayerOneStartingHand()),
    },

    2: {
      name: "Player 2",
      usedMulligan: false,
      mulliganDecisionMade: false,
      mulliganAvailable: true,
      energy: 0,
      maxEnergy: 0,
      strongholdHP: 15,
      deck: normalizeCards(createPlayerTwoStartingDeck()),
      deckCount: 60,
      discard: [],
      discardCount: 0,
      banish: [],
      banishCount: 0,
      armyZone: [],
      hand: normalizeCards(createPlayerTwoStartingHand()),
    },
  },

  units: normalizeCards(createStartingUnits()),
  items: [],
  nextItemId: 1,
  playerEvents: { 1: null, 2: null },
  nextEventId: 1,

  zoneHistory: [],
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
  const occupants = GameState.units.filter(
    (unit) => unit.x === x && unit.y === y
  );

  // A mounted Character shares the Mount's coordinates but does not occupy
  // a separate battlefield space. Prefer the Mount for cell occupancy.
  return occupants.find((unit) => !unit.mountedOn) ?? occupants[0] ?? null;
}

function getCoordinateKey(x, y) {
  return `${x},${y}`;
}


// Battlefield inspection is independent from gameplay selection.
GameState.inspectedUnitId = null;
