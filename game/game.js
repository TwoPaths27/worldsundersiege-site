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
function createCard({
  id,
  name,
  cost,
  attack,
  hp,
  range,
  speed,
}) {
  return {
    id,
    name,
    type: "Unit",
    cost,
    attack,
    hp,
    range,
    speed,
  };
}
const GameState = {
  turn: 1,
  activePlayer: 1,
  selectedUnitId: null,
  selectedCardId: null,
  reachableSpaces: new Map(),
  nextUnitId: 1,
  isAnimating: false,
  lastSpawnedUnitId: null,

  players: {
    1: {
      name: "Player 1",
      energy: 1,
      maxEnergy: 1,
      strongholdHP: 30,
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

  createCard({
    id: "p1-knight",
    name: "Knight",
    cost: 3,
    attack: 4,
    hp: 6,
    range: 1,
    speed: 2,
  }),
],
    },

    2: {
      name: "Player 2",
      energy: 0,
      maxEnergy: 0,
      strongholdHP: 30,
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
  turnNumber: document.querySelector("#turnNumber"),

  // Battlefield Energy Displays
  playerCurrentEnergy: document.querySelector("#playerCurrentEnergy"),
  playerMaxEnergy: document.querySelector("#playerMaxEnergy"),
  enemyCurrentEnergy: document.querySelector("#enemyCurrentEnergy"),
  enemyMaxEnergy: document.querySelector("#enemyMaxEnergy"),

  endTurnButton: document.querySelector("#endTurnButton"),

  playerStronghold: document.querySelector("#playerStronghold"),
  enemyStronghold: document.querySelector("#enemyStronghold"),
  playerStrongholdHP: document.querySelector("#playerStrongholdHP"),
  enemyStrongholdHP: document.querySelector("#enemyStrongholdHP"),

  selectedUnitPanel: document.querySelector("#selectedUnitPanel"),
  cardPreview: document.querySelector("#cardPreview"),
  gameLog: document.querySelector("#gameLog"),

  chatForm: document.querySelector("#chatForm"),
  chatInput: document.querySelector("#chatInput"),
  chatMessages: document.querySelector("#chatMessages"),

  handDock: document.querySelector("#handDock"),
  handPanel: document.querySelector("#handPanel"),
  toggleHandButton: document.querySelector("#toggleHandButton"),
  handOwnerLabel: document.querySelector("#handOwnerLabel"),
  handCount: document.querySelector("#handCount"),
  hand: document.querySelector("#hand"),

  exitGameButton: document.querySelector("#exitGameButton"),
  exitModal: document.querySelector("#exitModal"),
  cancelExitButton: document.querySelector("#cancelExitButton"),
  confirmExitButton: document.querySelector("#confirmExitButton"),
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

  elements.exitGameButton.addEventListener("click", openExitModal);
  elements.cancelExitButton.addEventListener("click", closeExitModal);
  elements.confirmExitButton.addEventListener("click", () => {
    window.location.href = "https://worldsundersiege.com";
  });

  elements.exitModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-exit-close]")) {
      closeExitModal();
    }
  });

  elements.chatForm.addEventListener("submit", handleChatSubmit);

  elements.toggleHandButton.addEventListener("click", () => {
    const isCollapsed =
      elements.handDock.classList.toggle("is-collapsed");

    document.body.classList.toggle("is-hand-collapsed", isCollapsed);

    elements.toggleHandButton.setAttribute(
      "aria-expanded",
      String(!isCollapsed)
    );

    elements.toggleHandButton.textContent =
      isCollapsed ? "Show Hand" : "Hand";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!elements.exitModal.hidden) {
        closeExitModal();
        return;
      }

      clearSelection();
    }
  });
}

function handleChatSubmit(event) {
  event.preventDefault();

  const message = elements.chatInput.value.trim();

  if (!message) {
    return;
  }

  appendChatMessage(getActivePlayer().name, message);
  elements.chatInput.value = "";
  elements.chatInput.focus();
}

function appendChatMessage(sender, message) {
  const entry = document.createElement("p");
  const senderLabel = document.createElement("strong");
  const messageText = document.createElement("span");

  entry.className = `chat-message chat-message--player-${GameState.activePlayer}`;
  senderLabel.textContent = `${sender}: `;
  messageText.textContent = message;

  entry.append(senderLabel, messageText);
  elements.chatMessages.appendChild(entry);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function openExitModal() {
  elements.exitModal.hidden = false;
  document.body.classList.add("modal-open");
  elements.cancelExitButton.focus();
}

function closeExitModal() {
  elements.exitModal.hidden = true;
  document.body.classList.remove("modal-open");
  elements.exitGameButton.focus();
}

function renderGame() {
  renderStatusBar();
  renderBattlefield();
  renderSelectedUnitPanel();

  const selectedCard = getSelectedCard();

  if (selectedCard) {
    renderHandCardPreview(selectedCard);
  } else {
    renderCardPreview();
  }

  renderStrongholds();
  renderHand();
  renderGameLog();
}

function renderStatusBar() {
  const playerOne = GameState.players[1];
  const playerTwo = GameState.players[2];

  elements.turnNumber.textContent = String(GameState.turn);

  elements.playerCurrentEnergy.textContent = String(playerOne.energy);
  elements.playerMaxEnergy.textContent = String(playerOne.maxEnergy);
  elements.enemyCurrentEnergy.textContent = String(playerTwo.energy);
  elements.enemyMaxEnergy.textContent = String(playerTwo.maxEnergy);

  elements.playerStronghold.classList.toggle(
    "is-active-player",
    GameState.activePlayer === 1
  );
  elements.enemyStronghold.classList.toggle(
    "is-active-player",
    GameState.activePlayer === 2
  );

  elements.handPanel.classList.toggle(
    "is-player-one-turn",
    GameState.activePlayer === 1
  );
  elements.handPanel.classList.toggle(
    "is-player-two-turn",
    GameState.activePlayer === 2
  );
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
  const selectedCard = getSelectedCard();
  const activeRecruitingSpaces = getRecruitingSpacesForPlayer(
    GameState.activePlayer
  );
  const canRecruitSelectedCard =
    selectedCard &&
    selectedCard.type === "Unit" &&
    getActivePlayer().energy >= selectedCard.cost;

  if (ENEMY_RECRUITING_SPACES.has(coordinateKey)) {
    cell.classList.add("cell-recruit-enemy");
    cell.dataset.recruitOwner = "2";
  }

  if (PLAYER_RECRUITING_SPACES.has(coordinateKey)) {
    cell.classList.add("cell-recruit-player");
    cell.dataset.recruitOwner = "1";
  }

  if (
    canRecruitSelectedCard &&
    activeRecruitingSpaces.has(coordinateKey) &&
    !occupant
  ) {
    cell.classList.add("cell-recruit-available");
    cell.title = `Recruit ${selectedCard.name} here for ${selectedCard.cost} Energy`;

    const ghost = createRecruitGhost(selectedCard, GameState.activePlayer);
    cell.appendChild(ghost);

    cell.addEventListener("mouseenter", () => {
      cell.classList.add("is-recruit-preview");
    });

    cell.addEventListener("mouseleave", () => {
      cell.classList.remove("is-recruit-preview");
    });
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
  token.className = "unit-token";
  token.classList.toggle(
    "unit-spawn",
    GameState.lastSpawnedUnitId === unit.id
  );
  token.classList.toggle(
    "is-selected-unit",
    GameState.selectedUnitId === unit.id
  );
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
  if (GameState.isAnimating) {
    return;
  }

  const clickedUnit = getUnitAt(x, y);
  const selectedUnit = getSelectedUnit();
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    recruitSelectedCard(x, y);
    return;
  }

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
  if (GameState.isAnimating) {
    return;
  }

  const unit = getUnitById(unitId);

  if (!unit) {
    return;
  }

  if (unit.owner !== GameState.activePlayer) {
    return;
  }

  GameState.selectedCardId = null;
  GameState.selectedUnitId = unit.id;
  GameState.reachableSpaces = findReachableSpaces(unit);

  addLog(`${unit.name} selected.`);
  renderGame();
}

function selectCard(cardId) {
  if (GameState.isAnimating) {
    return;
  }

  const player = getActivePlayer();

  const card = player.hand.find(
    (handCard) => handCard.id === cardId
  );

  if (!card) {
    return;
  }

  if (GameState.selectedCardId === card.id) {
    GameState.selectedCardId = null;
    renderGame();
    return;
  }

  GameState.selectedUnitId = null;
  GameState.reachableSpaces = new Map();
  GameState.selectedCardId = card.id;

  if (player.energy < card.cost) {
    addLog(
      `${card.name} selected, but it requires ${card.cost} Energy and ${player.name} has ${player.energy}.`
    );
  } else {
    addLog(
      `${card.name} selected. Choose a highlighted recruiting space.`
    );
  }

  renderGame();
}

async function recruitSelectedCard(x, y) {
  if (GameState.isAnimating) {
    return;
  }

  const card = getSelectedCard();

  if (!card) {
    return;
  }

  const player = getActivePlayer();
  const destinationKey = getCoordinateKey(x, y);
  const recruitingSpaces = getRecruitingSpacesForPlayer(
    GameState.activePlayer
  );

  if (card.type !== "Unit") {
    addLog(`${card.name} cannot be recruited as a Unit.`);
    renderGame();
    return;
  }

  if (player.energy < card.cost) {
    addLog(
      `${card.name} costs ${card.cost} Energy, but ${player.name} only has ${player.energy}.`
    );
    renderGame();
    return;
  }

  if (!recruitingSpaces.has(destinationKey)) {
    addLog(
      `Choose one of ${player.name}'s highlighted recruiting spaces.`
    );
    renderGame();
    return;
  }

  if (getUnitAt(x, y)) {
    addLog("That recruiting space is occupied.");
    renderGame();
    return;
  }

  const sourceCard = elements.hand.querySelector(
    `[data-card-id="${CSS.escape(card.id)}"]`
  );
  const destinationCell = getBattlefieldCell(x, y);

  GameState.isAnimating = true;
  setInteractionLock(true);

  try {
    await animateCardToCell(sourceCard, destinationCell);

    player.energy -= card.cost;

    const cardIndex = player.hand.findIndex(
      (handCard) => handCard.id === card.id
    );

    if (cardIndex >= 0) {
      player.hand.splice(cardIndex, 1);
    }

    const unit = createUnit({
      id: `player-${GameState.activePlayer}-recruit-${GameState.nextUnitId}`,
      name: card.name,
      owner: GameState.activePlayer,
      x,
      y,
      attack: card.attack,
      hp: card.hp,
      range: card.range,
      speed: card.speed,
      cost: card.cost,
    });

    GameState.nextUnitId += 1;
    GameState.units.push(unit);
    GameState.selectedCardId = null;
    GameState.lastSpawnedUnitId = unit.id;

    addLog(`⚔ ${player.name} recruited ${card.name}.`);
    addLog(`🔋 −${card.cost} Energy.`);
    addLog(`📍 Deployed to ${formatCoordinate(x, y)}.`);

    renderGame();
    flashRecruitingCell(x, y, GameState.activePlayer);
    pulseActiveEnergy(GameState.activePlayer);

    window.setTimeout(() => {
      if (GameState.lastSpawnedUnitId === unit.id) {
        GameState.lastSpawnedUnitId = null;
      }
    }, 650);
  } finally {
    GameState.isAnimating = false;
    setInteractionLock(false);
  }
}

function createRecruitGhost(card, owner) {
  const ghost = document.createElement("div");
  ghost.className = `recruit-ghost recruit-ghost--player-${owner}`;
  ghost.setAttribute("aria-hidden", "true");

  const name = document.createElement("strong");
  name.textContent = card.name;

  const stats = document.createElement("span");
  stats.textContent = `ATK ${card.attack} · HP ${card.hp}`;

  ghost.append(name, stats);
  return ghost;
}

function getBattlefieldCell(x, y) {
  return elements.battlefield.querySelector(
    `.battlefield-cell[data-x="${x}"][data-y="${y}"]`
  );
}

function setInteractionLock(isLocked) {
  document.body.classList.toggle("is-game-animating", isLocked);
  elements.endTurnButton.disabled = isLocked;
  elements.toggleHandButton.disabled = isLocked;
}

async function animateCardToCell(sourceCard, destinationCell) {
  if (!sourceCard || !destinationCell) {
    await wait(180);
    return;
  }

  const sourceRect = sourceCard.getBoundingClientRect();
  const destinationRect = destinationCell.getBoundingClientRect();
  const flyingCard = sourceCard.cloneNode(true);

  flyingCard.classList.remove("is-selected", "is-playable", "is-unplayable");
  flyingCard.classList.add("recruit-flying-card");
  flyingCard.setAttribute("aria-hidden", "true");
  flyingCard.style.left = `${sourceRect.left}px`;
  flyingCard.style.top = `${sourceRect.top}px`;
  flyingCard.style.width = `${sourceRect.width}px`;
  flyingCard.style.height = `${sourceRect.height}px`;

  document.body.appendChild(flyingCard);
  sourceCard.classList.add("is-being-recruited");

  const destinationX =
    destinationRect.left + destinationRect.width / 2 - sourceRect.width / 2;
  const destinationY =
    destinationRect.top + destinationRect.height / 2 - sourceRect.height / 2;
  const deltaX = destinationX - sourceRect.left;
  const deltaY = destinationY - sourceRect.top;
  const destinationScale = Math.min(
    0.72,
    destinationRect.width / sourceRect.width,
    destinationRect.height / sourceRect.height
  );

  try {
    const animation = flyingCard.animate(
      [
        { transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate3d(${deltaX * 0.55}px, ${deltaY * 0.35 - 45}px, 0) scale(1.08) rotate(-2deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${destinationScale}) rotate(1deg)`, opacity: 0.12 },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(.2,.8,.2,1)",
        fill: "forwards",
      }
    );

    await animation.finished;
  } catch (error) {
    await wait(520);
  } finally {
    flyingCard.remove();
    sourceCard.classList.remove("is-being-recruited");
  }
}

function flashRecruitingCell(x, y, playerId) {
  const cell = getBattlefieldCell(x, y);

  if (!cell) {
    return;
  }

  cell.classList.add(
    "recruit-flash",
    playerId === 1 ? "recruit-flash--player-one" : "recruit-flash--player-two"
  );

  window.setTimeout(() => {
    cell.classList.remove(
      "recruit-flash",
      "recruit-flash--player-one",
      "recruit-flash--player-two"
    );
  }, 650);
}

function pulseActiveEnergy(playerId) {
  const energyElement =
    playerId === 1
      ? elements.playerCurrentEnergy
      : elements.enemyCurrentEnergy;

  energyElement.classList.remove("energy-spent-pulse");
  void energyElement.offsetWidth;
  energyElement.classList.add("energy-spent-pulse");

  window.setTimeout(() => {
    energyElement.classList.remove("energy-spent-pulse");
  }, 600);
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function getRecruitingSpacesForPlayer(playerId) {
  return playerId === 1
    ? PLAYER_RECRUITING_SPACES
    : ENEMY_RECRUITING_SPACES;
}

function clearSelection() {
  if (GameState.isAnimating) {
    return;
  }

  GameState.selectedUnitId = null;
  GameState.selectedCardId = null;
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
  if (GameState.isAnimating) {
    return;
  }

  const previousPlayer = GameState.activePlayer;
  const nextPlayer = previousPlayer === 1 ? 2 : 1;

  GameState.activePlayer = nextPlayer;
  GameState.selectedUnitId = null;
  GameState.selectedCardId = null;
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

  const handHeading = elements.handPanel.querySelector(".hand-panel__header h2");

  if (handHeading) {
    handHeading.textContent = `${player.name} Hand`;
  }

  // Kept for screen readers and older HTML builds. The compact desktop
  // layout visually hides this duplicate owner line.
  elements.handOwnerLabel.textContent = player.name;
  elements.handCount.textContent =
    `${cardCount} ${cardCount === 1 ? "card" : "cards"}`;

  elements.hand.replaceChildren();

  if (cardCount === 0) {
    const message = document.createElement("p");

    message.textContent = "Your hand is empty.";
    message.style.color = "#bfbfbf";

    elements.hand.appendChild(message);
    return;
  }

  for (const card of player.hand) {
    const cardButton = document.createElement("button");

    cardButton.type = "button";
    cardButton.className = "hand-card";
    cardButton.dataset.cardId = card.id;

    const isSelected = GameState.selectedCardId === card.id;
    const isPlayable = card.cost <= player.energy;

    cardButton.classList.toggle("is-selected", isSelected);
    cardButton.classList.toggle("is-playable", isPlayable);
    cardButton.classList.toggle("is-unplayable", !isPlayable);
    cardButton.setAttribute("aria-pressed", String(isSelected));
    cardButton.setAttribute(
      "aria-label",
      `${card.name}, cost ${card.cost}, ${
        isPlayable ? "playable" : `needs ${card.cost - player.energy} more Energy`
      }`
    );
    cardButton.title = isPlayable
      ? `${card.name} can be played for ${card.cost} Energy`
      : `${card.name} requires ${card.cost} Energy; you have ${player.energy}`;

    const cost = document.createElement("span");
    cost.className = "hand-card__cost";
    cost.textContent = String(card.cost);

    const name = document.createElement("strong");
    name.className = "hand-card__name";
    name.textContent = card.name;

    const stats = document.createElement("span");
    stats.className = "hand-card__stats";
    stats.textContent =
      `ATK ${card.attack} · HP ${card.hp} · ` +
      `RNG ${card.range} · SPD ${card.speed}`;

    cardButton.append(cost, stats, name);

    cardButton.addEventListener("click", () => {
      selectCard(card.id);
    });

    cardButton.addEventListener("mouseenter", () => {
      renderHandCardPreview(card);
    });

    cardButton.addEventListener("mouseleave", () => {
      const selectedCard = getSelectedCard();

      if (selectedCard) {
        renderHandCardPreview(selectedCard);
      } else {
        renderCardPreview();
      }
    });

    elements.hand.appendChild(cardButton);
  }
}

function renderHandCardPreview(card) {
  elements.cardPreview.replaceChildren();
  elements.cardPreview.className = "card-preview";

  const name = document.createElement("h3");
  name.textContent = card.name;

  const type = document.createElement("p");
  type.textContent = card.type;

  const cost = document.createElement("p");
  cost.textContent = `Cost: ${card.cost}`;

  const stats = document.createElement("p");
  stats.textContent =
    `Attack ${card.attack} · ` +
    `HP ${card.hp} · ` +
    `Range ${card.range} · ` +
    `Speed ${card.speed}`;

  elements.cardPreview.append(
    name,
    type,
    cost,
    stats
  );
}
function renderGameLog() {
  elements.gameLog.replaceChildren();

  const visibleEntries = GameState.log.slice(-60);

  for (const entry of visibleEntries) {
    const paragraph = document.createElement("p");
    paragraph.className = `game-log__entry ${getLogEntryClass(entry)}`;
    paragraph.textContent = entry;
    elements.gameLog.appendChild(paragraph);
  }

  elements.gameLog.scrollTop = elements.gameLog.scrollHeight;
}

function getLogEntryClass(entry) {
  if (/Player 1|player-1/i.test(entry)) {
    return "game-log__entry--player-one";
  }

  if (/Player 2|player-2/i.test(entry)) {
    return "game-log__entry--player-two";
  }

  if (/turn|energy|battlefield initialized|deployed/i.test(entry)) {
    return "game-log__entry--system";
  }

  return "game-log__entry--neutral";
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

function formatCoordinate(x, y) {
  return `(${x + 1}, ${y + 1})`;
}
