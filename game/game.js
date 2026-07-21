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
  x: 3,
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

  handDock: document.querySelector("#handDock"),
toggleHandButton: document.querySelector("#toggleHandButton"),
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

function bindEvents() {
  elements.endTurnButton.addEventListener("click", endTurn);

  elements.toggleHandButton.addEventListener("click", () => {
    const isCollapsed =
      elements.handDock.classList.toggle("is-collapsed");

    elements.toggleHandButton.setAttribute(
      "aria-expanded",
      String(!isCollapsed)
    );

    elements.toggleHandButton.textContent =
      isCollapsed ? "Show Hand" : "Hand";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearSelection();
    }
  });
}

function renderGame() {
  renderStatusBar();
  renderBattlefield();
  renderSelectedUnitPanel();
  renderCardPreview();
  renderStrongholds();
  renderHand();
  renderGameLog();
}

function renderStatusBar() {
  const activePlayer = getActivePlayer();

  elements.activePlayer.textContent = activePlayer.name;
  elements.turnNumber.textContent = String(GameState.turn);
  elements.currentEnergy.textContent = String(activePlayer.energy);
  elements.maxEnergy.textContent = String(activePlayer.maxEnergy);
}

function renderBattlefield() {
  elements.battlefield.replaceChildren();

  for (let y = 0; y < BOARD_ROWS; y += 1) {
    for (let x = 0; x < BOARD_COLUMNS; x += 1) {
      const cell = createBattlefieldCell(x, y);
      elements.battlefield.appendChild(cell);
    }
  }
}

function createBattlefieldCell(x, y) {
  const cell = document.createElement("button");

  cell.type = "button";
  cell.className = "battlefield-cell";
  cell.dataset.x = String(x);
  cell.dataset.y = String(y);
  cell.setAttribute(
    "aria-label",
    `Battlefield space column ${x + 1}, row ${y + 1}`
  );

  const occupant = getUnitAt(x, y);
  const selectedUnit = getSelectedUnit();
  const coordinateKey = getCoordinateKey(x, y);
  const moveDistance = GameState.reachableSpaces.get(coordinateKey);
  if (ENEMY_RECRUITING_SPACES.has(coordinateKey)) {
  cell.classList.add("cell-recruit-enemy");
  cell.dataset.recruitOwner = "2";
}

if (PLAYER_RECRUITING_SPACES.has(coordinateKey)) {
  cell.classList.add("cell-recruit-player");
  cell.dataset.recruitOwner = "1";
}

  if (occupant) {
    cell.appendChild(createUnitToken(occupant));

    if (selectedUnit?.id === occupant.id) {
      cell.classList.add("cell-selected");
    }
  } else {
    const coordinateLabel = document.createElement("span");

    coordinateLabel.textContent = `${x + 1},${y + 1}`;
    coordinateLabel.style.fontSize = "11px";
    coordinateLabel.style.opacity = "0.45";

    cell.appendChild(coordinateLabel);
  }

  if (moveDistance !== undefined && moveDistance > 0 && !occupant) {
    cell.classList.add("cell-move");
    cell.title = `Move here — costs ${moveDistance} Speed`;
  }

  cell.addEventListener("click", () => {
    handleBattlefieldClick(x, y);
  });

  return cell;
}

function createUnitToken(unit) {
  const token = document.createElement("div");

  token.dataset.unitId = unit.id;
  token.title = `${unit.name} — Player ${unit.owner}`;

  token.style.width = "calc(100% - 8px)";
  token.style.height = "calc(100% - 8px)";
  token.style.borderRadius = "8px";
  token.style.padding = "6px";
  token.style.display = "flex";
  token.style.flexDirection = "column";
  token.style.justifyContent = "space-between";
  token.style.textAlign = "center";
  token.style.fontSize = "12px";
  token.style.fontWeight = "700";
  token.style.background =
    unit.owner === 1
      ? "linear-gradient(145deg, #174d89, #0f2948)"
      : "linear-gradient(145deg, #8a2929, #481414)";
  token.style.border =
    unit.owner === GameState.activePlayer
      ? "2px solid rgba(255, 255, 255, 0.8)"
      : "2px solid rgba(255, 255, 255, 0.3)";

  const name = document.createElement("span");
  name.textContent = unit.name;

  const stats = document.createElement("span");
  stats.textContent =
    `ATK ${unit.currentAttack} · ` +
    `HP ${unit.currentHP} · ` +
    `SPD ${unit.remainingSpeed}`;

  token.append(name, stats);

  token.addEventListener("mouseenter", () => {
    renderCardPreview(unit);
  });

  token.addEventListener("mouseleave", () => {
    renderCardPreview();
  });

  return token;
}

function handleBattlefieldClick(x, y) {
  const clickedUnit = getUnitAt(x, y);
  const selectedUnit = getSelectedUnit();

  if (clickedUnit) {
    if (
      selectedUnit &&
      clickedUnit.id === selectedUnit.id
    ) {
      clearSelection();
      return;
    }

    if (clickedUnit.owner !== GameState.activePlayer) {
      addLog(
        `${clickedUnit.name} belongs to Player ${clickedUnit.owner}.`
      );
      return;
    }

    selectUnit(clickedUnit.id);
    return;
  }

  if (!selectedUnit) {
    addLog("Select one of your Units before choosing a destination.");
    return;
  }

  moveSelectedUnit(x, y);
}

function selectUnit(unitId) {
  const unit = getUnitById(unitId);

  if (!unit) {
    return;
  }

  if (unit.owner !== GameState.activePlayer) {
    return;
  }

  GameState.selectedUnitId = unit.id;
  GameState.reachableSpaces = findReachableSpaces(unit);

  addLog(`${unit.name} selected.`);
  renderGame();
}

function clearSelection() {
  GameState.selectedUnitId = null;
  GameState.reachableSpaces = new Map();
  renderGame();
}

function moveSelectedUnit(destinationX, destinationY) {
  const unit = getSelectedUnit();

  if (!unit) {
    return;
  }

  const destinationKey = getCoordinateKey(destinationX, destinationY);
  const movementCost = GameState.reachableSpaces.get(destinationKey);

  if (movementCost === undefined || movementCost <= 0) {
    addLog("That space cannot be reached.");
    return;
  }

  if (getUnitAt(destinationX, destinationY)) {
    addLog("That space is occupied.");
    return;
  }

  const previousX = unit.x;
  const previousY = unit.y;

  unit.x = destinationX;
  unit.y = destinationY;
  unit.remainingSpeed -= movementCost;

  addLog(
    `${unit.name} moved from ` +
      `${formatCoordinate(previousX, previousY)} to ` +
      `${formatCoordinate(destinationX, destinationY)}. ` +
      `${unit.remainingSpeed} Speed remains.`
  );

  if (unit.remainingSpeed > 0) {
    GameState.reachableSpaces = findReachableSpaces(unit);
  } else {
    GameState.selectedUnitId = null;
    GameState.reachableSpaces = new Map();
  }

  renderGame();
}

function findReachableSpaces(unit) {
  const reachable = new Map();
  const queue = [
    {
      x: unit.x,
      y: unit.y,
      distance: 0,
    },
  ];

  reachable.set(getCoordinateKey(unit.x, unit.y), 0);

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current) {
      continue;
    }

    if (current.distance >= unit.remainingSpeed) {
      continue;
    }

    const neighbors = getOrthogonalNeighbors(current.x, current.y);

    for (const neighbor of neighbors) {
      const key = getCoordinateKey(neighbor.x, neighbor.y);

      if (reachable.has(key)) {
        continue;
      }

      const occupant = getUnitAt(neighbor.x, neighbor.y);

      if (occupant && occupant.id !== unit.id) {
        continue;
      }

      const nextDistance = current.distance + 1;

      reachable.set(key, nextDistance);

      queue.push({
        x: neighbor.x,
        y: neighbor.y,
        distance: nextDistance,
      });
    }
  }

  return reachable;
}

function getOrthogonalNeighbors(x, y) {
  const candidates = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
  ];

  return candidates.filter(({ x: nextX, y: nextY }) => {
    return (
      nextX >= 0 &&
      nextX < BOARD_COLUMNS &&
      nextY >= 0 &&
      nextY < BOARD_ROWS
    );
  });
}

function endTurn() {
  const previousPlayer = GameState.activePlayer;
  const nextPlayer = previousPlayer === 1 ? 2 : 1;

  GameState.activePlayer = nextPlayer;
  GameState.selectedUnitId = null;
  GameState.reachableSpaces = new Map();

  if (nextPlayer === 1) {
    GameState.turn += 1;
  }

  const player = GameState.players[nextPlayer];

  player.maxEnergy = Math.min(player.maxEnergy + 1, 10);
  player.energy = player.maxEnergy;

  for (const unit of GameState.units) {
    if (unit.owner === nextPlayer) {
      unit.remainingSpeed = unit.currentSpeed;
      unit.hasAttacked = false;
    }
  }

  addLog(
    `Player ${previousPlayer} ended their turn. ` +
      `Player ${nextPlayer} is now active.`
  );

  renderGame();
}

function renderSelectedUnitPanel() {
  const unit = getSelectedUnit();

  elements.selectedUnitPanel.replaceChildren();

  if (!unit) {
    elements.selectedUnitPanel.className = "empty-panel";
    elements.selectedUnitPanel.textContent =
      "Select one of the active player's Units.";
    return;
  }

  elements.selectedUnitPanel.className = "";

  const name = document.createElement("h3");
  name.textContent = unit.name;

  const owner = document.createElement("p");
  owner.textContent = `Controller: Player ${unit.owner}`;

  const position = document.createElement("p");
  position.textContent =
    `Position: ${formatCoordinate(unit.x, unit.y)}`;

  const attack = document.createElement("p");
  attack.textContent = `Attack: ${unit.currentAttack}`;

  const hp = document.createElement("p");
  hp.textContent =
    `HP: ${unit.currentHP} / ${unit.printedHP}`;

  const range = document.createElement("p");
  range.textContent = `Range: ${unit.currentRange}`;

  const speed = document.createElement("p");
  speed.textContent =
    `Remaining Speed: ${unit.remainingSpeed} / ${unit.currentSpeed}`;

  const cost = document.createElement("p");
  cost.textContent = `Cost: ${unit.currentCost}`;

  elements.selectedUnitPanel.append(
    name,
    owner,
    position,
    attack,
    hp,
    range,
    speed,
    cost
  );
}

function renderCardPreview(unit = null) {
  const previewUnit = unit ?? getSelectedUnit();

  elements.cardPreview.replaceChildren();

  if (!previewUnit) {
    elements.cardPreview.className = "empty-panel card-preview";
    elements.cardPreview.textContent =
      "Hover over a Unit to inspect it.";
    return;
  }

  elements.cardPreview.className = "card-preview";

  const name = document.createElement("h3");
  name.textContent = previewUnit.name;

  const type = document.createElement("p");
  type.textContent = `Player ${previewUnit.owner} Unit`;

  const printedStats = document.createElement("p");
  printedStats.textContent =
    `Printed — Cost ${previewUnit.printedCost}, ` +
    `ATK ${previewUnit.printedAttack}, ` +
    `HP ${previewUnit.printedHP}, ` +
    `Range ${previewUnit.printedRange}, ` +
    `Speed ${previewUnit.printedSpeed}`;

  const currentStats = document.createElement("p");
  currentStats.textContent =
    `Current — Cost ${previewUnit.currentCost}, ` +
    `ATK ${previewUnit.currentAttack}, ` +
    `HP ${previewUnit.currentHP}, ` +
    `Range ${previewUnit.currentRange}, ` +
    `Speed ${previewUnit.currentSpeed}`;

  elements.cardPreview.append(
    name,
    type,
    printedStats,
    currentStats
  );
}

function renderStrongholds() {
  elements.playerStrongholdHP.textContent = String(
    GameState.players[1].strongholdHP
  );

  elements.enemyStrongholdHP.textContent = String(
    GameState.players[2].strongholdHP
  );
}

function renderHand() {
  const player = getActivePlayer();
  const cardCount = player.hand.length;

  elements.handOwnerLabel.textContent = player.name;
  elements.handCount.textContent =
    `${cardCount} ${cardCount === 1 ? "card" : "cards"}`;

  elements.hand.replaceChildren();

  if (cardCount === 0) {
    const message = document.createElement("p");

    message.textContent =
      "Hand cards will be added after battlefield movement is verified.";
    message.style.color = "#bfbfbf";

    elements.hand.appendChild(message);
  }
}

function renderGameLog() {
  elements.gameLog.replaceChildren();

  const visibleEntries = GameState.log.slice(-8).reverse();

  for (const entry of visibleEntries) {
    const paragraph = document.createElement("p");
    paragraph.textContent = entry;
    elements.gameLog.appendChild(paragraph);
  }
}

function addLog(message) {
  GameState.log.push(message);
}

function getActivePlayer() {
  return GameState.players[GameState.activePlayer];
}

function getSelectedUnit() {
  if (!GameState.selectedUnitId) {
    return null;
  }

  return getUnitById(GameState.selectedUnitId);
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

function formatCoordinate(x, y) {
  return `(${x + 1}, ${y + 1})`;
}
