"use strict";

/*
 * Worlds Under Siege
 * Gameplay Prototype — Interactive Battlefield
 *
 * This first working build includes:
 * - 6 × 7 battlefield generation
 * - Two sample Units
 * - Unit selection
 * - Orthogonal movement
 * - Occupied-space blocking
 * - Remaining Speed
 * - Legal movement highlighting
 * - End Turn
 */

const BOARD_COLUMNS = 6;
const BOARD_ROWS = 7;

const GameState = {
  turn: 1,
  activePlayer: 1,
  selectedUnitId: null,
  reachableSpaces: new Map(),

  players: {
    1: {
      name: "Player 1",
      energy: 1,
      maxEnergy: 1,
      strongholdHP: 30,
      hand: [],
    },

    2: {
      name: "Player 2",
      energy: 1,
      maxEnergy: 1,
      strongholdHP: 30,
      hand: [],
    },
  },

  units: [
    createUnit({
      id: "player-1-knight",
      name: "Knight",
      owner: 1,
      x: 2,
      y: 5,
      attack: 3,
      hp: 6,
      range: 1,
      speed: 3,
      cost: 2,
    }),

    createUnit({
      id: "player-2-guard",
      name: "Guard",
      owner: 2,
      x: 3,
      y: 1,
      attack: 2,
      hp: 7,
      range: 1,
      speed: 2,
      cost: 2,
    }),
  ],

  log: ["Battlefield initialized."],
};

const elements = {
  battlefield: document.querySelector("#battlefield"),
  activePlayer: document.querySelector("#activePlayer"),
  turnNumber: document.querySelector("#turnNumber"),
  currentEnergy: document.querySelector("#currentEnergy"),
  maxEnergy: document.querySelector("#maxEnergy"),
  endTurnButton: document.querySelector("#endTurnButton"),

  playerStrongholdHP: document.querySelector("#playerStrongholdHP"),
  enemyStrongholdHP: document.querySelector("#enemyStrongholdHP"),

  selectedUnitPanel: document.querySelector("#selectedUnitPanel"),
  cardPreview: document.querySelector("#cardPreview"),
  gameLog: document.querySelector("#gameLog"),

  handOwnerLabel: document.querySelector("#handOwnerLabel"),
  handCount: document.querySelector("#handCount"),
  hand: document.querySelector("#hand"),
};

initializeGame();

function initializeGame() {
  validateRequiredElements();
  bindEvents();
  renderGame();
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
  };
}

function validateRequiredElements() {
  const missingElements = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    throw new Error(
      `The game page is missing required elements: ${missingElements.join(", ")}`
    );
  }
}

function
