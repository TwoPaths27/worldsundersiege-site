"use strict";

/*
 * Worlds Under Siege — UI shell
 *
 * Owns DOM element lookup, required-element validation, global event binding,
 * chat, modal controls, hand collapse behavior, and match-log rendering.
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


function updatePriorityBanner() {
  if (!elements.actionPromptText) return;
  if (!GameState.priority?.active) return;
  const active = GameState.priority.currentPlayer;
  elements.actionPromptText.textContent =
    GameState.priority.resolving
      ? "Resolving Action..."
      : `Priority: Player ${active} - Play an Action or Pass`;
}
