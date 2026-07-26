"use strict";

/*
 * Core state and lookup helpers are loaded from game-state.js.
 */

/*
 * Priority windows and Action Stack behavior are loaded from priority.js.
 */


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
  playerActionStack: document.querySelector("#playerActionStack"),
  enemyActionStack: document.querySelector("#enemyActionStack"),
  actionPrompt: document.querySelector("#actionPrompt"),
  actionPromptText: document.querySelector("#actionPromptText"),
  passPriorityButton: document.querySelector("#passPriorityButton"),
  actionArrowLayer: document.querySelector("#actionArrowLayer"),

  endTurnButton: document.querySelector("#endTurnButton"),

  playerStronghold: document.querySelector("#playerStronghold"),
enemyStronghold: document.querySelector("#enemyStronghold"),
playerStrongholdHP: document.querySelector("#playerStrongholdHP"),
enemyStrongholdHP: document.querySelector("#enemyStrongholdHP"),
playerStrongholdEffect: document.querySelector(
  "#playerStrongholdEffect"
),

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
  elements.passPriorityButton.addEventListener("click", passPriority);

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

elements.playerStronghold.addEventListener("mouseenter", () => {
  renderStrongholdCardPreview(getPlayerStrongholdCard());
});

elements.playerStronghold.addEventListener("mouseleave", () => {
  renderCardPreview();
});

elements.playerStronghold.addEventListener("focus", () => {
  renderStrongholdCardPreview(getPlayerStrongholdCard());
});

elements.playerStronghold.addEventListener("blur", () => {
  renderCardPreview();
});

elements.playerStronghold.addEventListener(
  "click",
  () => handleStrongholdClick(1)
);

elements.enemyStronghold.addEventListener(
  "click",
  () => handleStrongholdClick(2)
);

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

  window.addEventListener("resize", () => {
    window.requestAnimationFrame(renderActionArrows);
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
  renderActionStacks();
  renderHand();
  renderGameLog();
}

function renderStrongholdCardPreview(strongholdCard) {
  elements.cardPreview.replaceChildren();
  elements.cardPreview.className = "card-preview";

  const art = createCardArtPreview(
    strongholdCard.cardImage,
    `${strongholdCard.name} Stronghold card`
  );

  const details = document.createElement("div");
  details.className = "card-preview__details";

  const name = document.createElement("h3");
  name.textContent = strongholdCard.name;

  details.appendChild(name);

  if (strongholdCard.effectText) {
    const effect = document.createElement("p");
    effect.className = "card-preview__effect";
    effect.textContent = strongholdCard.effectText;
    details.appendChild(effect);
  }

  if (art) {
    elements.cardPreview.append(art, details);
  } else {
    elements.cardPreview.append(details);
  }
}
let activeAttackPreviewTargets = null;

function getAttackPreviewBadge(kind) {
  const id =
    kind === "attacker"
      ? "attackPreviewAttackerBadge"
      : "attackPreviewDefenderBadge";

  let badge = document.getElementById(id);

  if (!badge) {
    badge = document.createElement("div");
    badge.id = id;
    badge.className =
      `attack-damage-preview-badge attack-damage-preview-badge--${kind}`;
    badge.setAttribute("role", "status");
    badge.setAttribute("aria-live", "polite");
    document.body.appendChild(badge);
  }

  return badge;
}

function positionAttackPreviewBadge(badge, target, placement) {
  if (!badge || !target) return;

  const rect = target.getBoundingClientRect();
  const badgeRect = badge.getBoundingClientRect();
  const margin = 12;
  const viewportPadding = 8;

  let left = rect.left + rect.width / 2;
  let top =
    placement === "below"
      ? rect.bottom + margin
      : rect.top - badgeRect.height - margin;

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
  badge.classList.toggle("is-below-target", placement === "below");
}

function positionActiveAttackPreviewBadges() {
  if (!activeAttackPreviewTargets) return;

  const {
    defenderTarget,
    attackerTarget,
  } = activeAttackPreviewTargets;

  positionAttackPreviewBadge(
    getAttackPreviewBadge("defender"),
    defenderTarget,
    "above"
  );

  if (attackerTarget) {
    positionAttackPreviewBadge(
      getAttackPreviewBadge("attacker"),
      attackerTarget,
      "below"
    );
  }
}

function formatPreviewHP(currentHP, remainingHP) {
  const result = remainingHP <= 0 ? "💀" : `${remainingHP} HP`;
  return `${currentHP} HP → ${result}`;
}

function showUnitAttackPreview(
  defenderTarget,
  attackerTarget,
  combatPreview
) {
  const defenderBadge = getAttackPreviewBadge("defender");
  const attackerBadge = getAttackPreviewBadge("attacker");

  activeAttackPreviewTargets = {
    defenderTarget,
    attackerTarget,
  };

  defenderBadge.textContent = formatPreviewHP(
    combatPreview.defenderCurrentHP,
    combatPreview.defenderRemainingHP
  );
  defenderBadge.classList.toggle(
    "is-lethal",
    combatPreview.defenderRemainingHP <= 0
  );

  attackerBadge.textContent = formatPreviewHP(
    combatPreview.attackerCurrentHP,
    combatPreview.attackerRemainingHP
  );
  attackerBadge.classList.toggle(
    "is-lethal",
    combatPreview.attackerRemainingHP <= 0
  );

  defenderBadge.classList.add("is-visible");
  attackerBadge.classList.add("is-visible");

  requestAnimationFrame(positionActiveAttackPreviewBadges);
}

function showStrongholdAttackPreview(target, damage, isLethal) {
  const defenderBadge = getAttackPreviewBadge("defender");
  const attackerBadge = getAttackPreviewBadge("attacker");

  activeAttackPreviewTargets = {
    defenderTarget: target,
    attackerTarget: null,
  };

  defenderBadge.textContent = isLethal
    ? `LETHAL · −${damage} HP`
    : `−${damage} HP`;
  defenderBadge.classList.toggle("is-lethal", isLethal);
  defenderBadge.classList.add("is-visible");
  attackerBadge.classList.remove("is-visible", "is-lethal");

  requestAnimationFrame(positionActiveAttackPreviewBadges);
}

function hideAttackPreviewBadge() {
  activeAttackPreviewTargets = null;

  for (const kind of ["defender", "attacker"]) {
    const badge = getAttackPreviewBadge(kind);
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

window.addEventListener("resize", positionActiveAttackPreviewBadges);
window.addEventListener("scroll", positionActiveAttackPreviewBadges, true);

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
      showStrongholdAttackPreview(
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
function setSelectedUnitAction(action) {
  const unit = getSelectedUnit();

  if (
    !unit ||
    GameState.gameOver ||
    GameState.isAnimating ||
    (action !== "move" && action !== "attack")
  ) {
    return;
  }

  if (action === "move") {
    if (unit.remainingSpeed <= 0) {
      return;
    }

    GameState.selectedUnitAction = "move";
    GameState.reachableSpaces = findReachableSpaces(unit);
    GameState.attackableUnitIds = new Set();
    GameState.attackableStrongholdPlayerId = null;
  }

  if (action === "attack") {

    const hasAttackTarget =
        findAttackableUnits(unit).size > 0 ||
        findAttackableStronghold(unit) !== null;

    if (unit.hasAttacked || !hasAttackTarget) {
        return;
    }

    GameState.selectedUnitAction = "attack";
    GameState.reachableSpaces = new Map();
    GameState.attackableUnitIds = findAttackableUnits(unit);
    GameState.attackableStrongholdPlayerId =
      findAttackableStronghold(unit);
  }

  clearAttackHoverState();
  renderGame();
}

function createSelectedUnitControls(unit) {
  const controls = document.createElement("div");

  controls.className = "selected-unit-controls";
  controls.setAttribute(
    "aria-label",
    `${unit.name} statistics and actions`
  );

  const canMove = unit.remainingSpeed > 0;
  const canAttack = !unit.hasAttacked;

  const topRow = document.createElement("div");
  topRow.className =
    "selected-unit-controls__row " +
    "selected-unit-controls__row--top";

  const bottomRow = document.createElement("div");
  bottomRow.className =
    "selected-unit-controls__row " +
    "selected-unit-controls__row--bottom";

  /*
   * RNG is always orange and is not an attack button.
   * Hovering it temporarily displays the Unit's range.
   */
  const rangeControl = createSelectedUnitControl({
    label: "RNG",
    value: unit.currentRange,
    kind: "range",
    action: null,
    isActive: false,
    isDisabled: false,
    modifierState: getStatModifierState(
      unit.currentRange,
      unit.printedRange
    ),
  });

  rangeControl.classList.add("is-range-preview-control");
  rangeControl.setAttribute("role", "button");
  rangeControl.setAttribute(
    "aria-label",
    `Show ${unit.name}'s range: ${unit.currentRange}`
  );
  rangeControl.tabIndex = 0;

  rangeControl.addEventListener("mouseenter", () => {
    showSelectedUnitRangePreview(unit);
  });

  rangeControl.addEventListener("mouseleave", () => {
    hideSelectedUnitRangePreview();
  });

  rangeControl.addEventListener("focus", () => {
    showSelectedUnitRangePreview(unit);
  });

  rangeControl.addEventListener("blur", () => {
    hideSelectedUnitRangePreview();
  });

  const speedControl = createSelectedUnitControl({
    label: "SPD",
    value: unit.remainingSpeed,
    kind: "speed",
    action: "move",
    isActive: GameState.selectedUnitAction === "move",
    isDisabled: !canMove,
    modifierState: getStatModifierState(
      unit.currentSpeed,
      unit.printedSpeed
    ),
  });

  /*
   * ATK stays red until this Unit has used its attack.
   * Clicking it enters attack mode.
   */
  const attackControl = createSelectedUnitControl({
    label: "ATK",
    value: unit.currentAttack,
    kind: "attack",
    action: "attack",
    isActive: GameState.selectedUnitAction === "attack",
    isDisabled: !canAttack,
    modifierState: getStatModifierState(
      unit.currentAttack,
      unit.printedAttack
    ),
  });

  /*
   * HP is display-only, but it is never disabled or gray.
   */
  const healthControl = createSelectedUnitControl({
    label: "HP",
    value: unit.currentHP,
    kind: "health",
    action: null,
    isActive: false,
    isDisabled: false,
    isDamaged: unit.currentHP < unit.printedHP,
  });

  topRow.append(rangeControl, speedControl);
  bottomRow.append(attackControl, healthControl);
  controls.append(topRow, bottomRow);

  controls.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  controls.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  return controls;
}
function showSelectedUnitRangePreview(unit) {
  if (!unit) {
    return;
  }

  const cells =
    elements.battlefield.querySelectorAll(".battlefield-cell");

  cells.forEach((cell) => {
    const x = Number(cell.dataset.x);
    const y = Number(cell.dataset.y);

    const distance =
      Math.abs(unit.x - x) +
      Math.abs(unit.y - y);

    const isWithinRange =
      distance > 0 &&
      distance <= unit.currentRange;

    cell.classList.toggle(
      "cell-range-preview",
      isWithinRange
    );
  });
}

function hideSelectedUnitRangePreview() {
  elements.battlefield
    .querySelectorAll(".cell-range-preview")
    .forEach((cell) => {
      cell.classList.remove("cell-range-preview");
    });
}

function getStatModifierState(currentValue, printedValue) {
  if (currentValue > printedValue) {
    return "raised";
  }

  if (currentValue < printedValue) {
    return "lowered";
  }

  return "normal";
}

function createSelectedUnitControl({
  label,
  value,
  kind,
  action,
  isActive,
  isDisabled,
  isDamaged = false,
  modifierState = "normal",
}) {
  const control = document.createElement("span");

  control.className =
    `selected-unit-control selected-unit-control--${kind}`;

  control.setAttribute("role", action ? "button" : "status");
  control.setAttribute("aria-label", `${label} ${value}`);
  control.setAttribute("aria-disabled", String(isDisabled));
  control.tabIndex = action && !isDisabled ? 0 : -1;

  control.classList.toggle("is-active", isActive);
  control.classList.toggle("is-disabled", isDisabled);
  control.classList.toggle("is-damaged", isDamaged);
  control.classList.toggle("is-stat-raised", modifierState === "raised");
  control.classList.toggle("is-stat-lowered", modifierState === "lowered");

  const labelElement = document.createElement("span");
  labelElement.className = "selected-unit-control__label";
  labelElement.textContent = label;

  const valueElement = document.createElement("strong");
  valueElement.className = "selected-unit-control__value";
  valueElement.textContent = String(value);

  control.append(labelElement, valueElement);

  if (action) {
    const activate = (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!isDisabled) {
        setSelectedUnitAction(action);
      }
    };

    control.addEventListener("click", activate);
    control.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        activate(event);
      }
    });
  }

  return control;
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

  if (GameState.selectedUnitAction === "selected") {
    cell.appendChild(createSelectedUnitControls(occupant));
  }
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

  const retaliationDistance =
    Math.abs(selectedUnit.x - occupant.x) +
    Math.abs(selectedUnit.y - occupant.y);

  const canRetaliate =
    retaliationDistance > 0 &&
    retaliationDistance <= occupant.currentRange;

  const attackerRemainingHP =
    selectedUnit.currentHP -
    (canRetaliate ? occupant.currentAttack : 0);

  const defenderRemainingHP =
    occupant.currentHP -
    selectedUnit.currentAttack;

  const attackerCell = getBattlefieldCell(
    selectedUnit.x,
    selectedUnit.y
  );

  showUnitAttackPreview(
    cell,
    attackerCell,
    {
      attackerCurrentHP: selectedUnit.currentHP,
      attackerRemainingHP,
      defenderCurrentHP: occupant.currentHP,
      defenderRemainingHP,
    }
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

  if (!occupant && selectedUnit) {

  if (GameState.selectedUnitAction === "move") {

    const isMoveSpace =
      moveDistance !== undefined && moveDistance > 0;

    if (isMoveSpace) {
      cell.classList.add("cell-move");
      cell.title = `Move here — costs ${moveDistance} Speed`;
    }

  } else if (GameState.selectedUnitAction === "attack") {
  const rangeDistance =
    Math.abs(selectedUnit.x - x) +
    Math.abs(selectedUnit.y - y);

  if (
    rangeDistance > 0 &&
    rangeDistance <= selectedUnit.currentRange
  ) {
    cell.classList.add("cell-range");
    cell.title = "Within Attack Range";
  }
}

}

  cell.addEventListener("click", () => {
    handleBattlefieldClick(x, y);
  });

  return cell;
}
function getUnitActionAvailability(unit) {
  if (!unit) {
    return {
      canMove: false,
      canAttack: false,
    };
  }

  const canMove =
    unit.remainingSpeed > 0;

  const canAttack =
    !unit.hasAttacked &&
    unitHasLegalAttackTarget(unit);

  return {
    canMove,
    canAttack,
  };
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
  const {
    canMove,
    canAttack,
  } = getUnitActionAvailability(unit);

  return !canMove && !canAttack;
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

  const {
    canMove,
    canAttack,
  } = getUnitActionAvailability(unit);

  const exhausted =
    !canMove &&
    !canAttack;

  token.classList.toggle("can-move", canMove);
  token.classList.toggle("can-attack", canAttack);
  token.classList.toggle("is-exhausted", exhausted);
  token.classList.toggle(
    "is-action-user-choice",
    isChoosingActionUser() && isEligibleActionUser(unit)
  );
  token.classList.toggle(
    "is-action-target-choice",
    isChoosingActionTarget()
  );
  token.classList.toggle(
    "is-attack-target",
    GameState.attackableUnitIds.has(unit.id)
  );

  token.title = "";
  token.setAttribute("aria-disabled", String(exhausted));
  token.setAttribute(
    "aria-label",
    `${unit.name}. RNG ${unit.currentRange}. ` +
    `SPD ${unit.remainingSpeed}. ` +
    `ATK ${unit.currentAttack}. ` +
    `HP ${unit.currentHP}.`
  );

  token.style.width = "calc(100% - 8px)";
  token.style.height = "calc(100% - 8px)";
  token.style.borderRadius = "8px";
  token.style.padding = "0";
  token.style.display = "block";

  if (unit.tileImage) {
    token.classList.add("unit-token--art");
    token.style.backgroundImage =
      `linear-gradient(to bottom, rgba(0, 0, 0, 0.01), rgba(0, 0, 0, 0.12)), ` +
      `url("${unit.tileImage}")`;
    token.style.backgroundPosition = "center";
    token.style.backgroundRepeat = "no-repeat";
    token.style.backgroundSize = "cover";
  } else {
    token.style.background =
      unit.owner === 1
        ? "linear-gradient(145deg, #174d89, #0f2948)"
        : "linear-gradient(145deg, #8a2929, #481414)";
  }

  token.style.border =
    unit.owner === GameState.activePlayer
      ? "2px solid rgba(255, 255, 255, 0.9)"
      : "2px solid rgba(255, 255, 255, 0.35)";

  const nameBanner = document.createElement("span");
  nameBanner.className = "unit-name-banner";
  nameBanner.textContent = unit.name;
  nameBanner.setAttribute("aria-hidden", "true");
  token.appendChild(nameBanner);

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

  if (selectedCard?.type === "Action") {
    if (!GameState.pendingActionUserId) {
      if (clickedUnit && isEligibleActionUser(clickedUnit)) {
        chooseActionUser(clickedUnit);
      } else {
        addLog("Choose one of your highlighted Characters to use the Action.");
        renderGame();
      }
      return;
    }

    if (getActionTargetMode(selectedCard) === "unit") {
      if (clickedUnit) {
        commitSelectedAction(clickedUnit.id);
      } else {
        addLog("Choose a highlighted Unit as the Action target.");
        renderGame();
      }
      return;
    }
  }

  if (selectedCard) {
    recruitSelectedCard(x, y);
    return;
  }

  if (clickedUnit) {
   if (
  selectedUnit &&
  clickedUnit.id === selectedUnit.id
) {
  GameState.selectedUnitAction = "selected";
  GameState.reachableSpaces = new Map();
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;

  clearAttackHoverState();
  renderGame();
  return;
}

  if (clickedUnit.owner !== GameState.activePlayer) {
  const isValidAttack =
    selectedUnit &&
    GameState.selectedUnitAction === "attack" &&
    GameState.attackableUnitIds.has(clickedUnit.id);

  if (isValidAttack) {
    attackUnit(selectedUnit, clickedUnit);
    return;
  }

  if (selectedUnit) {
    addLog("Invalid attack target. Selection cleared.");
    clearSelection();
  }

  return;
}

    selectUnit(clickedUnit.id);
    return;
  }

  if (!selectedUnit) {
  return;
}

const destinationKey = getCoordinateKey(x, y);
const movementCost =
  GameState.reachableSpaces.get(destinationKey);

const isValidMove =
  GameState.selectedUnitAction === "move" &&
  movementCost !== undefined &&
  movementCost > 0;

if (isValidMove) {
  moveSelectedUnit(x, y);
  return;
}

addLog("Selection cleared.");
clearSelection();
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
GameState.selectedUnitAction = "selected";

GameState.reachableSpaces = new Map();
GameState.attackableUnitIds = new Set();
GameState.attackableStrongholdPlayerId = null;

addLog(
  unit.hasAttacked
    ? `${unit.name} selected. Its attack has already been used this turn.`
    : `${unit.name} selected. Choose RNG, SPD, or ATK.`
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
    GameState.pendingActionUserId = null;
    GameState.pendingActionTargetId = null;
    GameState.actionSelectionMessage =
  GameState.priority.active
    ? `${GameState.players[GameState.priority.playerId].name} has priority. Play an Action or pass.`
    : "";
    renderGame();
    return;
  }

  GameState.selectedUnitId = null;
  GameState.reachableSpaces = new Map();
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;
  GameState.selectedCardId = card.id;
  GameState.actionSelectionMessage = "";

  if (player.energy < card.cost) {
    addLog(
      `${card.name} selected, but it requires ${card.cost} Energy and ${player.name} has ${player.energy}.`
    );
  } else if (card.type === "Action") {
  if (
    GameState.priority.active &&
    GameState.priority.playerId !== getInteractionPlayerId()
  ) {
    addLog("That player does not currently have priority.");
    GameState.selectedCardId = null;
  } else if (!getEligibleActionUsers().length) {
    addLog(`${player.name} must control a Character to play ${card.name}.`);
  } else {
    GameState.pendingActionUserId = null;
    GameState.pendingActionTargetId = null;
    GameState.actionSelectionMessage =
      `Choose who you wish to use ${card.name}.`;

    addLog(
      `${card.name} selected. Choose who you wish to use the Action.`
    );
  }

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

  const recruitableCardTypes = new Set(["Unit", "Character"]);

  if (!recruitableCardTypes.has(card.type)) {
    addLog(`${card.name} cannot be recruited to the battlefield.`);
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
      cardType: card.type,
      cardImage: card.cardImage,
      tileImage: card.tileImage,
      effectText: card.effectText,
      databaseId: card.databaseId,
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
  GameState.selectedUnitAction = "move";
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
  GameState.selectedUnitAction = "move";
  GameState.reachableSpaces = findReachableSpaces(unit);
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;
} else {
  GameState.selectedUnitId = null;
  GameState.selectedUnitAction = "move";
  GameState.reachableSpaces = new Map();
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;
}

  renderGame();
}
function greatestCommonDivisor(a, b) {
  let first = Math.abs(a);
  let second = Math.abs(b);

  while (second !== 0) {
    const remainder = first % second;
    first = second;
    second = remainder;
  }

  return first;
}

function isUnitProtected(attacker, target) {
  if (!attacker || !target) {
    return false;
  }

  const deltaX = target.x - attacker.x;
  const deltaY = target.y - attacker.y;

  const steps = greatestCommonDivisor(
    Math.abs(deltaX),
    Math.abs(deltaY)
  );

  // There is no space between adjacent Units.
  if (steps <= 1) {
    return false;
  }

  const stepX = deltaX / steps;
  const stepY = deltaY / steps;

  for (let step = 1; step < steps; step += 1) {
    const blocker = getUnitAt(
      attacker.x + stepX * step,
      attacker.y + stepY * step
    );

    // Only the target's friendly Units provide protection.
    if (blocker) {
  return true;
}
  }

  return false;
}

function isStrongholdLaneProtected(
  attacker,
  strongholdColumn,
  defenderOwner
) {
  const strongholdY =
    defenderOwner === 1 ? BOARD_ROWS : -1;

  const deltaX = strongholdColumn - attacker.x;
  const deltaY = strongholdY - attacker.y;

  const steps = greatestCommonDivisor(
    Math.abs(deltaX),
    Math.abs(deltaY)
  );

  if (steps <= 1) {
    return false;
  }

  const stepX = deltaX / steps;
  const stepY = deltaY / steps;

  for (let step = 1; step < steps; step += 1) {
    const blocker = getUnitAt(
      attacker.x + stepX * step,
      attacker.y + stepY * step
    );

    if (blocker) {
      return true;
    }
  }

  return false;
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

    const isWithinRange =
      distance > 0 &&
      distance <= unit.currentRange;

    const isProtected =
      isUnitProtected(unit, candidate);

    if (isWithinRange && !isProtected) {
      targets.add(candidate.id);
    }
  }

  return targets;
}function findAttackableStronghold(unit) {

  if (!unit || unit.hasAttacked || GameState.gameOver) {
    return null;
  }

  const enemyPlayerId =
    unit.owner === 1 ? 2 : 1;

  const strongholdY =
    enemyPlayerId === 2 ? -1 : BOARD_ROWS;

  const strongholdColumns = [2, 3, 4];

  for (const column of strongholdColumns) {

    const distance =
      Math.abs(unit.x - column) +
      Math.abs(unit.y - strongholdY);

    if (
      distance > 0 &&
      distance <= unit.currentRange &&
      !isStrongholdLaneProtected(
        unit,
        column,
        enemyPlayerId
      )
    ) {
      return enemyPlayerId;
    }

  }

  return null;
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

    if (attacker.remainingSpeed > 0) {
  GameState.selectedUnitAction = "move";
  GameState.reachableSpaces = findReachableSpaces(attacker);
} else {
  GameState.selectedUnitId = null;
  GameState.selectedUnitAction = "move";
  GameState.reachableSpaces = new Map();
}

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
  GameState.actionSelectionMessage = "";
  GameState.pendingActionUserId = null;
  GameState.pendingActionTargetId = null;
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

    const retaliationDistance =
  Math.abs(attacker.x - defender.x) +
  Math.abs(attacker.y - defender.y);

const canRetaliate =
  retaliationDistance > 0 &&
  retaliationDistance <= defender.currentRange;

// Show the defender's retaliation before resolving deaths.
// The defender can retaliate even when the incoming attack is lethal.
if (canRetaliate) {
  playOneShot(gameplayAudio.attack);
  await animateAttack(defenderToken, attackerToken, defender, attacker);
}

// Apply all combat damage before checking whether either unit died.
defender.currentHP -= attacker.currentAttack;

if (canRetaliate) {
  attacker.currentHP -= defender.currentAttack;
}

attacker.hasAttacked = true;

addLog(
  `⚔ Player ${attacker.owner}'s ${attacker.name} attacked ${defender.name} for ${attacker.currentAttack} damage.`
);

if (canRetaliate) {
  addLog(
    `↩ Player ${defender.owner}'s ${defender.name} retaliated against ${attacker.name} for ${defender.currentAttack} damage.`
  );
}

const defenderDestroyed = defender.currentHP <= 0;
const attackerDestroyed = attacker.currentHP <= 0;

// Resolve the defender's result after all combat damage has been applied.
if (defenderDestroyed) {
  playOneShot(gameplayAudio.death);
  await animateUnitToDiscard(defenderToken, defender.owner);

  GameState.players[defender.owner].discardCount += 1;
  GameState.units = GameState.units.filter(
    (unit) => unit.id !== defender.id
  );

  addLog(
    `💀 Player ${defender.owner}'s ${defender.name} was destroyed.`
  );
} else {
  addLog(`❤ ${defender.name} has ${defender.currentHP} HP remaining.`);
}

// Resolve the attacker's result separately, allowing both units to die.
if (attackerDestroyed) {
  playOneShot(gameplayAudio.death);
  await animateUnitToDiscard(attackerToken, attacker.owner);

  GameState.players[attacker.owner].discardCount += 1;
  GameState.units = GameState.units.filter(
    (unit) => unit.id !== attacker.id
  );

  GameState.selectedUnitId = null;

  addLog(
    `💀 Player ${attacker.owner}'s ${attacker.name} was destroyed by the counterattack.`
  );
} else if (canRetaliate) {
  addLog(`❤ ${attacker.name} has ${attacker.currentHP} HP remaining.`);
}

    const attackerStillExists = GameState.units.some(
  (unit) => unit.id === attacker.id
);

if (attackerStillExists && attacker.remainingSpeed > 0) {
  GameState.selectedUnitAction = "move";
  GameState.reachableSpaces = findReachableSpaces(attacker);
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;
} else {
  GameState.selectedUnitId = null;
  GameState.selectedUnitAction = "move";
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


function isChoosingActionUser() {
  const card = getSelectedCard();

  return Boolean(
    card &&
    card.type === "Action" &&
    !GameState.pendingActionUserId &&
    getActivePlayer().energy >= card.cost
  );
}

function isChoosingActionTarget() {
  const card = getSelectedCard();

  return Boolean(
    card &&
    card.type === "Action" &&
    GameState.pendingActionUserId &&
    getActionTargetMode(card) !== "user"
  );
}

function isEligibleActionUser(unit) {
  return Boolean(
    unit &&
    unit.owner === getInteractionPlayerId() &&
    unit.cardType === "Character"
  );
}

function getEligibleActionUsers() {
  return GameState.units.filter(isEligibleActionUser);
}

function getActionTargetMode(card) {
  switch (card?.databaseId ?? card?.id) {
    case "BOA-146":
      return "user";

    default:
      return card?.targetMode ?? "user";
  }
}

function chooseActionUser(user) {
  const card = getSelectedCard();

  if (!card || !isEligibleActionUser(user)) {
    return;
  }

  GameState.pendingActionUserId = user.id;

  if (getActionTargetMode(card) === "user") {
    commitSelectedAction(user.id);
    return;
  }

  GameState.actionSelectionMessage =
    `Choose a target for ${card.name}.`;

  addLog(
    `${user.name} will use ${card.name}. Choose its target.`
  );

  renderGame();
}

function commitSelectedAction(targetId = null) {
  const card = getSelectedCard();
  const playerId = getInteractionPlayerId();
  const player = GameState.players[playerId];
  const user = getUnitById(GameState.pendingActionUserId);

  if (
    !card ||
    card.type !== "Action" ||
    !user ||
    !isEligibleActionUser(user)
  ) {
    return;
  }

  if (player.energy < card.cost) {
    addLog(`${card.name} costs ${card.cost} Energy.`);
    renderGame();
    return;
  }

  const cardIndex = player.hand.findIndex(
    (handCard) => handCard.id === card.id
  );

  if (cardIndex < 0) {
    return;
  }

  player.energy -= card.cost;
  player.hand.splice(cardIndex, 1);

  const stackEntry = {
    stackId: `action-${GameState.nextActionStackId}`,
    card,
    userId: user.id,
    targetId,
    owner: playerId,
    status: "waiting",
  };

  GameState.nextActionStackId += 1;
  GameState.actionStack.push(stackEntry);
  GameState.selectedCardId = null;
  GameState.pendingActionUserId = null;
  GameState.pendingActionTargetId = null;
  GameState.actionSelectionMessage = "";

  addLog(`${user.name} uses ${card.name}.`);
  playOneShot(gameplayAudio.energy);

  openPriorityWindow(playerId === 1 ? 2 : 1);
  renderGame();
}

function endTurn() {
  if (
  GameState.isAnimating ||
  GameState.priority.active ||
  GameState.priority.resolving ||
  GameState.actionStack.length
) {
    addLog("Resolve the current Action stack before ending the turn.");
    renderGame();
    return;
  }

  const previousPlayer = GameState.activePlayer;
  const nextPlayer = previousPlayer === 1 ? 2 : 1;

  for (const unit of GameState.units) {
    if (unit.owner === previousPlayer && unit.temporaryRangeBonus) {
      unit.temporaryRangeBonus = 0;
      unit.currentRange = unit.printedRange;
    }
  }

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

function createCardArtPreview(imageSource, altText) {
  if (!imageSource) return null;

  const image = document.createElement("img");
  image.className = "card-preview__art";
  image.src = imageSource;
  image.alt = altText;
  image.loading = "eager";
  return image;
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

  const art = createCardArtPreview(
    previewUnit.cardImage,
    `${previewUnit.name} card`
  );

  const details = document.createElement("div");
  details.className = "card-preview__details";

  const name = document.createElement("h3");
  name.textContent = previewUnit.name;

  const printedStats = document.createElement("p");
  printedStats.textContent =
    `Cost ${previewUnit.printedCost} · ` +
    `ATK ${previewUnit.printedAttack} · ` +
    `HP ${previewUnit.printedHP} · ` +
    `RNG ${previewUnit.printedRange} · ` +
    `SPD ${previewUnit.printedSpeed}`;

  details.append(name, printedStats);

  if (previewUnit.effectText) {
    const effect = document.createElement("p");
    effect.className = "card-preview__effect";
    effect.textContent = previewUnit.effectText;
    details.appendChild(effect);
  }

  if (art) {
    elements.cardPreview.append(art, details);
  } else {
    elements.cardPreview.append(details);
  }
}

function renderStrongholds() {
const playerStrongholdCard = getPlayerStrongholdCard();

elements.playerStrongholdEffect.textContent =
  playerStrongholdCard.effectText;
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

    if (card.cardImage) {
      cardButton.classList.add("hand-card--art");
      cardButton.style.backgroundImage =
        `linear-gradient(to top, rgba(0, 0, 0, 0.76), rgba(0, 0, 0, 0.03) 64%), ` +
        `url("${card.cardImage}")`;
      cardButton.style.backgroundPosition = "center";
      cardButton.style.backgroundRepeat = "no-repeat";
      cardButton.style.backgroundSize = "cover";
    }

    const cost = document.createElement("span");
    cost.className = "hand-card__cost";
    cost.textContent = String(card.cost);

    const name = document.createElement("strong");
    name.className = "hand-card__name";
    name.textContent = card.name;

    const stats = document.createElement("span");
    stats.className = "hand-card__stats";

    if (card.type === "Action") {
      cardButton.classList.add("hand-card--action");
      stats.textContent = "ACTION";
    } else {
      stats.textContent =
        `ATK ${card.attack} · HP ${card.hp} · ` +
        `RNG ${card.range} · SPD ${card.speed}`;
    }

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

  const art = createCardArtPreview(
    card.cardImage,
    `${card.name} card`
  );

  const details = document.createElement("div");
  details.className = "card-preview__details";

  const name = document.createElement("h3");
  name.textContent = card.name;

  const stats = document.createElement("p");
  stats.textContent =
    card.type === "Action"
      ? `Action · Cost ${card.cost}`
      : `Cost ${card.cost} · ATK ${card.attack} · HP ${card.hp} · ` +
        `RNG ${card.range} · SPD ${card.speed}`;

  details.append(name, stats);

  if (card.effectText) {
    const effect = document.createElement("p");
    effect.className = "card-preview__effect";
    effect.textContent = card.effectText;
    details.appendChild(effect);
  }

  if (art) {
    elements.cardPreview.append(art, details);
  } else {
    elements.cardPreview.append(details);
  }
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


function formatCoordinate(x, y) {
  return `(${x + 1}, ${y + 1})`;
}