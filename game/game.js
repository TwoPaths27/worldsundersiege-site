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
  playerDiscardCount: document.querySelector("#playerDiscardCount"),
  enemyDiscardCount: document.querySelector("#enemyDiscardCount"),

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

  victoryModal: document.querySelector("#victoryModal"),
  victoryEyebrow: document.querySelector("#victoryEyebrow"),
  victoryTitle: document.querySelector("#victoryTitle"),
  victoryMessage: document.querySelector("#victoryMessage"),
  playAgainButton: document.querySelector("#playAgainButton"),
  victoryHomeButton: document.querySelector("#victoryHomeButton"),
};

const endGameAudio = {
  collapse: createGameAudio("../sounds/stronghold-collapse.mp3", 1),
  victory: createGameAudio("../sounds/victory-fanfare.mp3", 0.9),
  defeatVoice: createGameAudio("../sounds/defeat-voice.mp3", 0.86),
  defeatStinger: createGameAudio("../sounds/defeat-stinger.mp3", 0.86),
};

const GAMEPLAY_SFX_VOLUME = 0.78;
const gameplayAudio = {
  mouseClick: createGameAudio("../sounds/mouse-click.mp3", GAMEPLAY_SFX_VOLUME),
  energy: createGameAudio("../sounds/energy.mp3", GAMEPLAY_SFX_VOLUME),
  placement: createGameAudio("../sounds/placement.mp3", GAMEPLAY_SFX_VOLUME),
  move: createGameAudio("../sounds/move.mp3", GAMEPLAY_SFX_VOLUME),
  attack: createGameAudio("../sounds/attack.mp3", GAMEPLAY_SFX_VOLUME),
  death: createGameAudio("../sounds/death.mp3", GAMEPLAY_SFX_VOLUME),
  strongholdHit: createGameAudio("../sounds/stronghold-hit.mp3", GAMEPLAY_SFX_VOLUME),
};


const ambienceAudio = createGameAudio("../sounds/ambience.mp3", 0.25);
ambienceAudio.loop = true;
let ambienceStarted = false;
function startAmbience(){
 if(ambienceStarted) return;
 ambienceStarted=true;
 try{const pb=ambienceAudio.play(); if(pb?.catch) pb.catch(()=>{});}catch{}
}
document.addEventListener("pointerdown", startAmbience, {once:true});
function createGameAudio(source, volume) {
  const audio = new Audio(source);
  audio.preload = "auto";
  audio.volume = volume;
  return audio;
}

function playGameAudio(audio) {
  if (!audio) return Promise.resolve();

  audio.pause();
  audio.currentTime = 0;

  try {
    const playback = audio.play();
    return playback?.catch ? playback.catch(() => {}) : Promise.resolve();
  } catch {
    return Promise.resolve();
  }
}

function playGameAudioGroup(...tracks) {
  const playableTracks = tracks.filter(Boolean);

  playableTracks.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });

  // Start every track in the same JavaScript task so layered sounds stay synchronized.
  return Promise.allSettled(
    playableTracks.map((audio) => {
      try {
        const playback = audio.play();
        return playback?.catch ? playback.catch(() => {}) : Promise.resolve();
      } catch {
        return Promise.resolve();
      }
    })
  );
}

function playOneShot(audio) {
  if (!audio) return;
  const instance = audio.cloneNode();
  instance.volume = audio.volume;
  instance.currentTime = 0;
  try {
    const playback = instance.play();
    if (playback?.catch) playback.catch(() => {});
  } catch {
    // Optional/missing sound files never interrupt gameplay.
  }
}

function playRepeatedSound(audio, count, interval = 150) {
  const repeatCount = Math.max(0, Math.floor(count));
  for (let index = 0; index < repeatCount; index += 1) {
    window.setTimeout(() => playOneShot(audio), index * interval);
  }
}

let endGameAudioPrimed = false;

function primeEndGameAudio() {
  if (endGameAudioPrimed) return;
  endGameAudioPrimed = true;

  [...Object.values(endGameAudio), ...Object.values(gameplayAudio)].forEach((audio) => {
    const originalVolume = audio.volume;
    audio.volume = 0;
    audio.currentTime = 0;

    try {
      const playback = audio.play();
      if (playback?.then) {
        playback
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = originalVolume;
          })
          .catch(() => {
            audio.volume = originalVolume;
          });
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = originalVolume;
      }
    } catch {
      audio.volume = originalVolume;
    }
  });
}

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
  // Prime the cinematic tracks during the first real user gesture. This keeps
  // defeat audio available even when the final blow is resolved by delayed AI.
  document.addEventListener("pointerdown", primeEndGameAudio, { once: true, capture: true });
  document.addEventListener("keydown", primeEndGameAudio, { once: true, capture: true });
  document.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button === 0) {
      playOneShot(gameplayAudio.mouseClick);
    }
  });

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

  elements.playerStronghold.addEventListener("click", () => handleStrongholdClick(1));
  elements.enemyStronghold.addEventListener("click", () => handleStrongholdClick(2));
  elements.playerStronghold.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleStrongholdClick(1);
    }
  });
  elements.enemyStronghold.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleStrongholdClick(2);
    }
  });

  elements.playAgainButton.addEventListener("click", () => window.location.reload());
  elements.victoryHomeButton.addEventListener("click", () => {
    window.location.href = "https://worldsundersiege.com";
  });

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

let activeAttackPreviewTarget = null;

function getAttackPreviewBadge() {
  let badge = document.getElementById("attackDamagePreviewBadge");

  if (!badge) {
    badge = document.createElement("div");
    badge.id = "attackDamagePreviewBadge";
    badge.className = "attack-damage-preview-badge";
    badge.setAttribute("role", "status");
    badge.setAttribute("aria-live", "polite");
    document.body.appendChild(badge);
  }

  return badge;
}

function positionAttackPreviewBadge(target) {
  const badge = getAttackPreviewBadge();
  const rect = target.getBoundingClientRect();
  const margin = 12;
  const viewportPadding = 8;

  // Measure after text/class changes so the fallback position is accurate.
  const badgeRect = badge.getBoundingClientRect();
  const preferredTop = rect.top - badgeRect.height - margin;
  const placeBelow = preferredTop < viewportPadding;

  let left = rect.left + rect.width / 2;
  let top = placeBelow
    ? rect.bottom + margin
    : preferredTop;

  const halfWidth = badgeRect.width / 2;
  left = Math.max(
    viewportPadding + halfWidth,
    Math.min(window.innerWidth - viewportPadding - halfWidth, left)
  );

  top = Math.max(
    viewportPadding,
    Math.min(window.innerHeight - viewportPadding - badgeRect.height, top)
  );

  badge.style.left = `${left}px`;
  badge.style.top = `${top}px`;
  badge.classList.toggle("is-below-target", placeBelow);
}

function showAttackPreviewBadge(target, damage, isLethal) {
  const badge = getAttackPreviewBadge();
  activeAttackPreviewTarget = target;

  badge.textContent = isLethal
    ? `LETHAL · −${damage} HP`
    : `−${damage} HP`;
  badge.classList.toggle("is-lethal", isLethal);
  badge.classList.add("is-visible");

  requestAnimationFrame(() => positionAttackPreviewBadge(target));
}

function hideAttackPreviewBadge() {
  activeAttackPreviewTarget = null;

  const badge = document.getElementById("attackDamagePreviewBadge");
  if (badge) {
    badge.classList.remove("is-visible", "is-lethal", "is-below-target");
  }
}

function setAttackHoverState(isHovering) {
  document.body.classList.toggle("is-hovering-attack-target", isHovering);
}

function clearAttackHoverState() {
  setAttackHoverState(false);
  hideAttackPreviewBadge();
}

window.addEventListener("resize", () => {
  if (activeAttackPreviewTarget) {
    positionAttackPreviewBadge(activeAttackPreviewTarget);
  }
});

window.addEventListener("scroll", () => {
  if (activeAttackPreviewTarget) {
    positionAttackPreviewBadge(activeAttackPreviewTarget);
  }
}, true);

function configureStrongholdAttackPreview(stronghold, targetPlayerId) {
  const attacker = getSelectedUnit();
  const isTarget =
    attacker &&
    !GameState.gameOver &&
    GameState.attackableStrongholdPlayerId === targetPlayerId;

  stronghold.classList.toggle("has-attack-preview", Boolean(isTarget));

  if (isTarget) {
    stronghold.dataset.predictedDamage = `−${attacker.currentAttack} HP`;
    stronghold.dataset.lethal =
      GameState.players[targetPlayerId].strongholdHP <= attacker.currentAttack
        ? "LETHAL"
        : "";
  } else {
    delete stronghold.dataset.predictedDamage;
    delete stronghold.dataset.lethal;
  }

  stronghold.onmouseenter = () => {
    if (stronghold.classList.contains("is-attack-target")) {
      stronghold.classList.add("is-attack-hovered");
      setAttackHoverState(true);
      showAttackPreviewBadge(
        stronghold,
        attacker.currentAttack,
        GameState.players[targetPlayerId].strongholdHP <= attacker.currentAttack
      );
    }
  };
  stronghold.onmouseleave = () => {
    stronghold.classList.remove("is-attack-hovered");
    clearAttackHoverState();
  };
  stronghold.onfocus = stronghold.onmouseenter;
  stronghold.onblur = stronghold.onmouseleave;
}

function renderStatusBar() {
  const playerOne = GameState.players[1];
  const playerTwo = GameState.players[2];

  elements.turnNumber.textContent = String(GameState.turn);

  elements.playerCurrentEnergy.textContent = String(playerOne.energy);
  elements.playerMaxEnergy.textContent = String(playerOne.maxEnergy);
  elements.enemyCurrentEnergy.textContent = String(playerTwo.energy);
  elements.enemyMaxEnergy.textContent = String(playerTwo.maxEnergy);
  elements.playerDiscardCount.textContent = String(playerOne.discardCount);
  elements.enemyDiscardCount.textContent = String(playerTwo.discardCount);

  elements.playerStronghold.classList.toggle(
    "is-active-player",
    GameState.activePlayer === 1
  );
  elements.enemyStronghold.classList.toggle(
    "is-active-player",
    GameState.activePlayer === 2
  );

  elements.playerStronghold.classList.toggle(
    "is-attack-target",
    GameState.attackableStrongholdPlayerId === 1 && !GameState.gameOver
  );
  elements.enemyStronghold.classList.toggle(
    "is-attack-target",
    GameState.attackableStrongholdPlayerId === 2 && !GameState.gameOver
  );

  configureStrongholdAttackPreview(elements.playerStronghold, 1);
  configureStrongholdAttackPreview(elements.enemyStronghold, 2);

  elements.playerStronghold.setAttribute(
    "aria-disabled",
    String(GameState.gameOver || GameState.attackableStrongholdPlayerId !== 1)
  );
  elements.enemyStronghold.setAttribute(
    "aria-disabled",
    String(GameState.gameOver || GameState.attackableStrongholdPlayerId !== 2)
  );
  elements.endTurnButton.disabled = GameState.gameOver || GameState.isAnimating;

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

  const isAttackTarget =
    occupant &&
    selectedUnit &&
    GameState.attackableUnitIds.has(occupant.id);

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

    if (isAttackTarget) {
      const isLethal = occupant.currentHP <= selectedUnit.currentAttack;

      cell.classList.add("cell-attack", "cell-attack-target");
      cell.dataset.predictedDamage = `−${selectedUnit.currentAttack} HP`;
      cell.dataset.lethal = isLethal ? "LETHAL" : "";
      cell.title = isLethal
        ? `Attack ${occupant.name} for ${selectedUnit.currentAttack} damage — lethal`
        : `Attack ${occupant.name} for ${selectedUnit.currentAttack} damage`;

      const beginAttackPreview = () => {
        cell.classList.add("is-attack-hovered");
        setAttackHoverState(true);
        showAttackPreviewBadge(
          cell,
          selectedUnit.currentAttack,
          isLethal
        );
      };
      const endAttackPreview = () => {
        cell.classList.remove("is-attack-hovered");
        clearAttackHoverState();
      };

      cell.addEventListener("mouseenter", beginAttackPreview);
      cell.addEventListener("mouseleave", endAttackPreview);
      cell.addEventListener("focus", beginAttackPreview);
      cell.addEventListener("blur", endAttackPreview);
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

function unitHasLegalAttackTarget(unit) {
  if (!unit || unit.hasAttacked) {
    return false;
  }

  return (
    findAttackableUnits(unit).size > 0 ||
    findAttackableStronghold(unit) !== null
  );
}

function isUnitExhausted(unit) {
  return (
    unit.remainingSpeed <= 0 &&
    !unitHasLegalAttackTarget(unit)
  );
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
  token.classList.toggle("has-attacked", unit.hasAttacked);
  const exhausted = isUnitExhausted(unit);
  token.classList.toggle("is-exhausted", exhausted);
  token.classList.toggle(
    "is-attack-target",
    GameState.attackableUnitIds.has(unit.id)
  );
  token.title = exhausted
    ? `${unit.name} — Player ${unit.owner} — no actions remaining`
    : `${unit.name} — Player ${unit.owner}`;
  token.setAttribute("aria-disabled", String(exhausted));

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
  clearAttackHoverState();

  if (GameState.gameOver || GameState.isAnimating) {
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
      if (
        selectedUnit &&
        GameState.attackableUnitIds.has(clickedUnit.id)
      ) {
        attackUnit(selectedUnit, clickedUnit);
        return;
      }

      addLog(
        selectedUnit?.hasAttacked
          ? `${selectedUnit.name} has already attacked this turn.`
          : `${clickedUnit.name} is not within attack range.`
      );
      renderGame();
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
  if (GameState.gameOver || GameState.isAnimating) {
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
  GameState.attackableUnitIds = findAttackableUnits(unit);
  GameState.attackableStrongholdPlayerId = findAttackableStronghold(unit);

  addLog(
    unit.hasAttacked
      ? `${unit.name} selected. Its attack has already been used this turn.`
      : `${unit.name} selected.`
  );
  renderGame();
}

function selectCard(cardId) {
  if (GameState.gameOver || GameState.isAnimating) {
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
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;
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
    pulseActiveEnergy(GameState.activePlayer);
    playOneShot(gameplayAudio.energy);
    await animateEnergyToCard(
      GameState.activePlayer,
      sourceCard,
      card.cost
    );
    playOneShot(gameplayAudio.placement);
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
    GameState.attackableUnitIds = new Set();
    GameState.lastSpawnedUnitId = unit.id;

    addLog(`⚔ ${player.name} recruited ${card.name}.`);
    addLog(`🔋 −${card.cost} Energy.`);
    addLog(`📍 Deployed to ${formatCoordinate(x, y)}.`);

    renderGame();
    flashRecruitingCell(x, y, GameState.activePlayer);

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

async function animateEnergyToCard(playerId, targetCard, energyCost) {
  const energyElement =
    playerId === 1
      ? elements.playerCurrentEnergy
      : elements.enemyCurrentEnergy;
  const energyFrame = energyElement.closest(".battlefield-energy");

  if (!energyFrame || !targetCard || energyCost <= 0) {
    await wait(120);
    return;
  }

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    targetCard.classList.add("energy-absorbed");
    await wait(80);
    targetCard.classList.remove("energy-absorbed");
    return;
  }

  const sourceRect = energyFrame.getBoundingClientRect();
  const targetRect = targetCard.getBoundingClientRect();
  const sourceX = sourceRect.left + sourceRect.width / 2;
  const sourceY = sourceRect.top + sourceRect.height / 2;
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;
  const orbCount = Math.max(1, Math.min(energyCost, 8));
  const travelPromises = [];

  targetCard.classList.add("is-receiving-energy");

  for (let index = 0; index < orbCount; index += 1) {
    const orb = document.createElement("span");
    const angle = (index / Math.max(orbCount, 1)) * Math.PI * 2;
    const spreadX = Math.cos(angle) * 11;
    const spreadY = Math.sin(angle) * 8;
    const deltaX = targetX - sourceX;
    const deltaY = targetY - sourceY;
    const arcDirection = playerId === 1 ? -1 : 1;
    const arcHeight = Math.min(150, Math.max(65, Math.abs(deltaY) * 0.24));
    const delay = index * 95;

    orb.className = `energy-transfer-orb energy-transfer-orb--player-${playerId}`;
    orb.setAttribute("aria-hidden", "true");
    orb.style.left = `${sourceX - 7 + spreadX}px`;
    orb.style.top = `${sourceY - 7 + spreadY}px`;
    document.body.appendChild(orb);

    const animation = orb.animate(
      [
        {
          transform: "translate3d(0, 0, 0) scale(.45)",
          opacity: 0,
          offset: 0,
        },
        {
          transform: `translate3d(${spreadX * 0.8}px, ${spreadY * 0.8}px, 0) scale(1.15)`,
          opacity: 1,
          offset: 0.12,
        },
        {
          transform: `translate3d(${deltaX * 0.48}px, ${deltaY * 0.42 + arcDirection * arcHeight}px, 0) scale(.9)`,
          opacity: 1,
          offset: 0.56,
        },
        {
          transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(.2)`,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration: 580,
        delay,
        easing: "cubic-bezier(.18,.75,.2,1)",
        fill: "forwards",
      }
    );

    travelPromises.push(
      animation.finished
        .catch(() => wait(580 + delay))
        .finally(() => orb.remove())
    );
  }

  await Promise.all(travelPromises);

  targetCard.classList.remove("is-receiving-energy");
  targetCard.classList.add("energy-absorbed");
  await wait(230);
  targetCard.classList.remove("energy-absorbed");
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
  const energyFrame = energyElement.closest(".battlefield-energy");

  energyElement.classList.remove("energy-spent-pulse");
  energyFrame?.classList.remove(
    "energy-frame-pulse",
    "energy-frame-pulse--player-one",
    "energy-frame-pulse--player-two"
  );

  void energyElement.offsetWidth;

  energyElement.classList.add("energy-spent-pulse");
  energyFrame?.classList.add(
    "energy-frame-pulse",
    playerId === 1
      ? "energy-frame-pulse--player-one"
      : "energy-frame-pulse--player-two"
  );

  window.setTimeout(() => {
    energyElement.classList.remove("energy-spent-pulse");
    energyFrame?.classList.remove(
      "energy-frame-pulse",
      "energy-frame-pulse--player-one",
      "energy-frame-pulse--player-two"
    );
  }, 700);
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
  if (GameState.gameOver || GameState.isAnimating) {
    return;
  }

  GameState.selectedUnitId = null;
  GameState.selectedCardId = null;
  GameState.reachableSpaces = new Map();
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;

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

  playRepeatedSound(gameplayAudio.move, movementCost);

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
    GameState.attackableUnitIds = findAttackableUnits(unit);
    GameState.attackableStrongholdPlayerId = findAttackableStronghold(unit);
  } else {
    GameState.selectedUnitId = null;
    GameState.reachableSpaces = new Map();
    GameState.attackableUnitIds = new Set();
    GameState.attackableStrongholdPlayerId = null;
  }

  renderGame();
}

function findAttackableUnits(unit) {
  const targets = new Set();

  if (!unit || unit.hasAttacked) {
    return targets;
  }

  for (const candidate of GameState.units) {
    if (candidate.owner === unit.owner) {
      continue;
    }

    const distance =
      Math.abs(candidate.x - unit.x) +
      Math.abs(candidate.y - unit.y);

    if (distance > 0 && distance <= unit.currentRange) {
      targets.add(candidate.id);
    }
  }

  return targets;
}

function findAttackableStronghold(unit) {
  if (!unit || unit.hasAttacked || GameState.gameOver) {
    return null;
  }

  const enemyPlayerId = unit.owner === 1 ? 2 : 1;
  const strongholdY = enemyPlayerId === 2 ? -1 : BOARD_ROWS;
  const strongholdColumns = [2, 3, 4];

  const minimumDistance = Math.min(
    ...strongholdColumns.map((column) =>
      Math.abs(unit.x - column) + Math.abs(unit.y - strongholdY)
    )
  );

  return minimumDistance <= unit.currentRange ? enemyPlayerId : null;
}

function handleStrongholdClick(targetPlayerId) {
  clearAttackHoverState();

  if (GameState.gameOver || GameState.isAnimating) {
    return;
  }

  const attacker = getSelectedUnit();

  if (!attacker) {
    addLog("Select one of your Units before attacking a Stronghold.");
    renderGame();
    return;
  }

  if (targetPlayerId === attacker.owner) {
    addLog("You cannot attack your own Stronghold.");
    return;
  }

  if (attacker.hasAttacked) {
    addLog(`${attacker.name} has already attacked this turn.`);
    renderGame();
    return;
  }

  if (GameState.attackableStrongholdPlayerId !== targetPlayerId) {
    addLog(`The enemy Stronghold is outside ${attacker.name}'s attack range.`);
    renderGame();
    return;
  }

  attackStronghold(attacker, targetPlayerId);
}

async function attackStronghold(attacker, targetPlayerId) {
  const targetStronghold = targetPlayerId === 1
    ? elements.playerStronghold
    : elements.enemyStronghold;
  const attackerToken = elements.battlefield.querySelector(
    `[data-unit-id="${CSS.escape(attacker.id)}"]`
  );

  GameState.isAnimating = true;
  setInteractionLock(true);

  try {
    const targetPlayer = GameState.players[targetPlayerId];
    playOneShot(gameplayAudio.strongholdHit);

    await animateStrongholdAttack(attackerToken, targetStronghold, attacker);

    targetPlayer.strongholdHP = Math.max(0, targetPlayer.strongholdHP - attacker.currentAttack);
    attacker.hasAttacked = true;

    addLog(
      `🏰 Player ${attacker.owner}'s ${attacker.name} struck Player ${targetPlayerId}'s Stronghold for ${attacker.currentAttack} damage.`
    );
    addLog(`❤ Player ${targetPlayerId}'s Stronghold has ${targetPlayer.strongholdHP} HP remaining.`);

    GameState.attackableUnitIds = new Set();
    GameState.attackableStrongholdPlayerId = null;
    renderGame();

    if (targetPlayer.strongholdHP <= 0) {
      await endGame(attacker.owner, targetPlayerId);
    }
  } finally {
    GameState.isAnimating = false;
    setInteractionLock(GameState.gameOver);
  }
}

async function animateStrongholdAttack(attackerToken, stronghold, attacker) {
  if (!stronghold) {
    await wait(260);
    return;
  }

  const strongholdRect = stronghold.getBoundingClientRect();
  const damageNumber = document.createElement("span");
  damageNumber.className = "floating-damage-number floating-damage-number--stronghold";
  damageNumber.textContent = `−${attacker.currentAttack}`;
  damageNumber.style.left = `${strongholdRect.left + strongholdRect.width / 2}px`;
  damageNumber.style.top = `${strongholdRect.top + strongholdRect.height / 2}px`;
  document.body.appendChild(damageNumber);

  const animations = [];

  if (attackerToken) {
    const attackerRect = attackerToken.getBoundingClientRect();
    const deltaX = (strongholdRect.left + strongholdRect.width / 2) -
      (attackerRect.left + attackerRect.width / 2);
    const deltaY = (strongholdRect.top + strongholdRect.height / 2) -
      (attackerRect.top + attackerRect.height / 2);
    const length = Math.max(1, Math.hypot(deltaX, deltaY));
    animations.push(attackerToken.animate(
      [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: `translate3d(${deltaX / length * 34}px,${deltaY / length * 34}px,0) scale(1.1)`, offset: .48 },
        { transform: "translate3d(0,0,0) scale(1)" },
      ],
      { duration: 400, easing: "cubic-bezier(.2,.8,.25,1)" }
    ).finished);
  }

  animations.push(stronghold.animate(
    [
      { transform: "translateX(0) scale(1)", filter: "brightness(1)" },
      { transform: "translateX(-7px) scale(1.025)", filter: "brightness(2.2)", offset: .35 },
      { transform: "translateX(7px) scale(.99)", filter: "brightness(1.5)", offset: .58 },
      { transform: "translateX(0) scale(1)", filter: "brightness(1)" },
    ],
    { duration: 520, easing: "ease-out" }
  ).finished);

  animations.push(damageNumber.animate(
    [
      { opacity: 0, transform: "translate(-50%, -10%) scale(.65)" },
      { opacity: 1, transform: "translate(-50%, -80%) scale(1.35)", offset: .28 },
      { opacity: 0, transform: "translate(-50%, -165%) scale(1)" },
    ],
    { duration: 720, easing: "ease-out", fill: "forwards" }
  ).finished);

  document.body.classList.add("stronghold-impact");
  try {
    await Promise.allSettled(animations);
  } finally {
    document.body.classList.remove("stronghold-impact");
    damageNumber.remove();
  }
}

async function endGame(winnerPlayerId, losingPlayerId) {
  GameState.gameOver = true;
  GameState.winnerPlayerId = winnerPlayerId;
  GameState.selectedUnitId = null;
  GameState.selectedCardId = null;
  GameState.reachableSpaces = new Map();
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;

  clearAttackHoverState();
  addLog(`🏆 Player ${winnerPlayerId} destroyed Player ${losingPlayerId}'s Stronghold and won the match!`);
  renderGame();

  const winningStronghold = winnerPlayerId === 1
    ? elements.playerStronghold
    : elements.enemyStronghold;
  const losingStronghold = losingPlayerId === 1
    ? elements.playerStronghold
    : elements.enemyStronghold;

  document.body.classList.add("game-ending", "game-is-over");
  winningStronghold.classList.add("stronghold--victorious");
  animateDestroyedStronghold(losingStronghold, losingPlayerId);
  createStrongholdDebris(losingStronghold);
  playGameAudio(endGameAudio.collapse);

  await wait(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 350 : 2150);

  const isLocalVictory = winnerPlayerId === 1;
  elements.victoryModal.classList.toggle("victory-modal--win", isLocalVictory);
  elements.victoryModal.classList.toggle("victory-modal--defeat", !isLocalVictory);
  elements.victoryEyebrow.textContent = isLocalVictory ? "Stronghold Conquered" : "Stronghold Lost";
  elements.victoryTitle.textContent = isLocalVictory ? "Victory" : "Defeat";
  elements.victoryMessage.textContent = isLocalVictory
    ? "The enemy Stronghold has fallen. The battlefield is yours."
    : "Your Stronghold has fallen. The siege is over.";

  elements.victoryModal.hidden = false;
  document.body.classList.add("modal-open", "end-screen-visible");

  if (isLocalVictory) {
    playGameAudio(endGameAudio.victory);
  } else {
    // Let the collapse rumble breathe before the defeat music starts.
    window.setTimeout(() => {
      playGameAudioGroup(endGameAudio.defeatVoice, endGameAudio.defeatStinger);
    }, 1000);
  }

  window.setTimeout(() => elements.playAgainButton.focus(), 80);
}

function animateDestroyedStronghold(stronghold, playerId) {
  if (!stronghold) return;

  stronghold.setAttribute("aria-label", `Player ${playerId} Stronghold destroyed`);

  // Restart the CSS animation reliably for either Stronghold.
  stronghold.classList.remove("stronghold--collapsing");
  void stronghold.offsetWidth;
  stronghold.classList.add("stronghold--collapsing");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  // The Web Animations fallback guarantees the player Stronghold visibly
  // collapses even if another transform rule overrides the CSS animation.
  stronghold.animate(
    [
      { transform: "translate(0,0) rotate(0) scale(1)", filter: "brightness(1)", opacity: 1 },
      { transform: "translate(-8px,1px) rotate(-1deg) scale(1.02)", filter: "brightness(1.8)", offset: 0.07 },
      { transform: "translate(9px,-2px) rotate(1.2deg) scale(.99)", offset: 0.14 },
      { transform: "translate(-10px,3px) rotate(-1.5deg) scale(1.01)", offset: 0.22 },
      { transform: "translate(8px,1px) rotate(1deg) scale(.99)", filter: "brightness(.92)", offset: 0.31 },
      { transform: "translate(-6px,5px) rotate(-1deg) scale(.98)", offset: 0.43 },
      { transform: "translate(5px,12px) rotate(1.8deg) scale(.96,.91)", filter: "brightness(.7) saturate(.65)", opacity: 0.92, offset: 0.58 },
      { transform: "translate(-3px,34px) rotate(-3deg) scale(.92,.7)", filter: "brightness(.5) saturate(.35)", opacity: 0.72, offset: 0.74 },
      { transform: "translate(2px,92px) rotate(5deg) scale(.82,.24)", filter: "brightness(.25) grayscale(.72)", opacity: 0 },
    ],
    {
      duration: 2050,
      easing: "cubic-bezier(.32,.02,.22,1)",
      fill: "forwards",
    }
  );
}

function createStrongholdDebris(stronghold) {
  if (!stronghold || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const rect = stronghold.getBoundingClientRect();
  const debrisLayer = document.createElement("div");
  debrisLayer.className = "stronghold-debris-layer";
  debrisLayer.setAttribute("aria-hidden", "true");

  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement("span");
    const startX = rect.left + rect.width * (0.14 + Math.random() * 0.72);
    const startY = rect.top + rect.height * (0.3 + Math.random() * 0.52);
    const driftX = (Math.random() - 0.5) * 170;
    const fallY = 80 + Math.random() * 150;
    const rotation = (Math.random() - 0.5) * 520;
    const size = 4 + Math.random() * 10;

    piece.style.left = `${startX}px`;
    piece.style.top = `${startY}px`;
    piece.style.width = `${size}px`;
    piece.style.height = `${Math.max(3, size * 0.58)}px`;
    piece.style.setProperty("--debris-x", `${driftX}px`);
    piece.style.setProperty("--debris-y", `${fallY}px`);
    piece.style.setProperty("--debris-rotation", `${rotation}deg`);
    piece.style.animationDelay = `${120 + Math.random() * 460}ms`;
    debrisLayer.appendChild(piece);
  }

  document.body.appendChild(debrisLayer);
  window.setTimeout(() => debrisLayer.remove(), 2600);
}

async function attackUnit(attacker, defender) {
  if (GameState.isAnimating || !attacker || !defender) {
    return;
  }

  if (attacker.hasAttacked) {
    addLog(`${attacker.name} has already attacked this turn.`);
    renderGame();
    return;
  }

  if (!GameState.attackableUnitIds.has(defender.id)) {
    addLog(`${defender.name} is outside ${attacker.name}'s attack range.`);
    renderGame();
    return;
  }

  const attackerToken = elements.battlefield.querySelector(
    `[data-unit-id="${CSS.escape(attacker.id)}"]`
  );
  const defenderToken = elements.battlefield.querySelector(
    `[data-unit-id="${CSS.escape(defender.id)}"]`
  );

  GameState.isAnimating = true;
  setInteractionLock(true);

  try {
    playOneShot(gameplayAudio.attack);
    await animateAttack(attackerToken, defenderToken, attacker, defender);

    defender.currentHP -= attacker.currentAttack;
    attacker.hasAttacked = true;

    addLog(
      `⚔ Player ${attacker.owner}'s ${attacker.name} attacked ${defender.name} for ${attacker.currentAttack} damage.`
    );

    if (defender.currentHP <= 0) {
      playOneShot(gameplayAudio.death);
      await animateUnitToDiscard(defenderToken, defender.owner);
      GameState.players[defender.owner].discardCount += 1;
      GameState.units = GameState.units.filter((unit) => unit.id !== defender.id);
      addLog(`💀 Player ${defender.owner}'s ${defender.name} was destroyed.`);
    } else {
      addLog(`❤ ${defender.name} has ${defender.currentHP} HP remaining.`);

      // A surviving defender retaliates once when the attacker is inside the
      // defender's own range. Retaliation never triggers another retaliation.
      const retaliationDistance =
        Math.abs(attacker.x - defender.x) +
        Math.abs(attacker.y - defender.y);
      const canRetaliate =
        retaliationDistance > 0 &&
        retaliationDistance <= defender.currentRange;

      if (canRetaliate) {
        playOneShot(gameplayAudio.attack);
        await animateAttack(defenderToken, attackerToken, defender, attacker);

        attacker.currentHP -= defender.currentAttack;
        addLog(
          `↩ Player ${defender.owner}'s ${defender.name} retaliated against ${attacker.name} for ${defender.currentAttack} damage.`
        );

        if (attacker.currentHP <= 0) {
          playOneShot(gameplayAudio.death);
          await animateUnitToDiscard(attackerToken, attacker.owner);
          GameState.players[attacker.owner].discardCount += 1;
          GameState.units = GameState.units.filter((unit) => unit.id !== attacker.id);
          GameState.selectedUnitId = null;
          addLog(`💀 Player ${attacker.owner}'s ${attacker.name} was destroyed by the counterattack.`);
        } else {
          addLog(`❤ ${attacker.name} has ${attacker.currentHP} HP remaining.`);
        }
      }
    }

    const attackerStillExists = GameState.units.some((unit) => unit.id === attacker.id);
    if (attackerStillExists) {
      GameState.attackableUnitIds = findAttackableUnits(attacker);
      GameState.attackableStrongholdPlayerId = findAttackableStronghold(attacker);
      GameState.reachableSpaces = findReachableSpaces(attacker);
    } else {
      GameState.reachableSpaces = new Map();
      GameState.attackableUnitIds = new Set();
      GameState.attackableStrongholdPlayerId = null;
    }
    renderGame();
  } finally {
    GameState.isAnimating = false;
    setInteractionLock(false);
  }
}

async function animateUnitToDiscard(unitToken, ownerPlayerId) {
  const discardZone = document.querySelector(
    ownerPlayerId === 1 ? "#playerDiscardZone" : "#enemyDiscardZone"
  );

  if (!unitToken || !discardZone) {
    await wait(180);
    return;
  }

  const sourceRect = unitToken.getBoundingClientRect();
  const targetRect = discardZone.getBoundingClientRect();
  const flyingUnit = unitToken.cloneNode(true);
  flyingUnit.classList.add("unit-to-discard");
  flyingUnit.setAttribute("aria-hidden", "true");
  flyingUnit.style.left = `${sourceRect.left}px`;
  flyingUnit.style.top = `${sourceRect.top}px`;
  flyingUnit.style.width = `${sourceRect.width}px`;
  flyingUnit.style.height = `${sourceRect.height}px`;
  document.body.appendChild(flyingUnit);
  unitToken.style.visibility = "hidden";

  const deltaX = targetRect.left + targetRect.width / 2 -
    (sourceRect.left + sourceRect.width / 2);
  const deltaY = targetRect.top + targetRect.height / 2 -
    (sourceRect.top + sourceRect.height / 2);

  try {
    const animation = flyingUnit.animate(
      [
        { transform: "translate3d(0,0,0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate3d(${deltaX * .48}px,${deltaY * .38 - 38}px,0) scale(.82) rotate(-7deg)`, opacity: .92, offset: .52 },
        { transform: `translate3d(${deltaX}px,${deltaY}px,0) scale(.18) rotate(18deg)`, opacity: 0 },
      ],
      { duration: 620, easing: "cubic-bezier(.2,.78,.2,1)", fill: "forwards" }
    );
    await animation.finished;
  } catch {
    await wait(620);
  } finally {
    flyingUnit.remove();
  }
}

async function animateAttack(attackerToken, defenderToken, attacker, defender) {
  if (!attackerToken || !defenderToken) {
    await wait(260);
    return;
  }

  const attackerRect = attackerToken.getBoundingClientRect();
  const defenderRect = defenderToken.getBoundingClientRect();
  const deltaX = (defenderRect.left + defenderRect.width / 2) -
    (attackerRect.left + attackerRect.width / 2);
  const deltaY = (defenderRect.top + defenderRect.height / 2) -
    (attackerRect.top + attackerRect.height / 2);
  const length = Math.max(1, Math.hypot(deltaX, deltaY));
  const lungeDistance = Math.min(30, length * 0.32);
  const lungeX = deltaX / length * lungeDistance;
  const lungeY = deltaY / length * lungeDistance;

  const damageNumber = document.createElement("span");
  damageNumber.className = "floating-damage-number";
  damageNumber.textContent = `−${attacker.currentAttack}`;
  damageNumber.style.left = `${defenderRect.left + defenderRect.width / 2}px`;
  damageNumber.style.top = `${defenderRect.top + defenderRect.height / 2}px`;
  document.body.appendChild(damageNumber);

  const animations = [
    attackerToken.animate(
      [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: `translate3d(${lungeX}px,${lungeY}px,0) scale(1.08)`, offset: 0.46 },
        { transform: "translate3d(0,0,0) scale(1)" },
      ],
      { duration: 360, easing: "cubic-bezier(.2,.8,.25,1)" }
    ).finished,
    defenderToken.animate(
      [
        { transform: "translateX(0)", filter: "brightness(1)" },
        { transform: "translateX(-5px)", filter: "brightness(2.3) saturate(1.6)", offset: 0.45 },
        { transform: "translateX(5px)", filter: "brightness(1.6)", offset: 0.65 },
        { transform: "translateX(0)", filter: "brightness(1)" },
      ],
      { duration: 430, easing: "ease-out" }
    ).finished,
    damageNumber.animate(
      [
        { opacity: 0, transform: "translate(-50%, -20%) scale(.65)" },
        { opacity: 1, transform: "translate(-50%, -70%) scale(1.25)", offset: 0.25 },
        { opacity: 0, transform: "translate(-50%, -145%) scale(1)" },
      ],
      { duration: 620, easing: "ease-out", fill: "forwards" }
    ).finished,
  ];

  try {
    await Promise.allSettled(animations);
  } finally {
    damageNumber.remove();
  }
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

  const attackStatus = document.createElement("p");
  attackStatus.className = unit.hasAttacked ? "unit-action-used" : "unit-action-ready";
  attackStatus.textContent = unit.hasAttacked ? "Attack: Used" : "Attack: Ready";

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
    attackStatus,
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

  const playerStrongholdDamaged =
    GameState.players[1].strongholdHP > 0 &&
    GameState.players[1].strongholdHP <= 5;
  const enemyStrongholdDamaged =
    GameState.players[2].strongholdHP > 0 &&
    GameState.players[2].strongholdHP <= 5;

  elements.playerStronghold.classList.toggle(
    "stronghold--critical-damage",
    playerStrongholdDamaged && !GameState.gameOver
  );
  elements.enemyStronghold.classList.toggle(
    "stronghold--critical-damage",
    enemyStrongholdDamaged && !GameState.gameOver
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
