"use strict";

/*
 * Core state and lookup helpers are loaded from game-state.js.
 */

/*
 * Priority windows and Action Stack behavior are loaded from priority.js.
 */

/*
 * Battlefield rendering, movement, combat, and selection UI are loaded
 * from battlefield.js.
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