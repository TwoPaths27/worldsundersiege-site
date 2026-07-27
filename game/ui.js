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
  floatingStack: document.querySelector("#floatingStack"),
  floatingStackEntries: document.querySelector("#floatingStackEntries"),
  floatingStackCards: document.querySelector("#floatingStackCards"),
  floatingStackCount: document.querySelector("#floatingStackCount"),
  playerEventZone: document.querySelector("#playerEventZone"),
  enemyEventZone: document.querySelector("#enemyEventZone"),
  actionPrompt: document.querySelector("#actionPrompt"),
  actionPromptText: document.querySelector("#actionPromptText"),
  triggerChoiceControls: document.querySelector("#triggerChoiceControls"),
  acceptTriggerButton: document.querySelector("#acceptTriggerButton"),
  declineTriggerButton: document.querySelector("#declineTriggerButton"),
  passPriorityButton: document.querySelector("#passPriorityButton"),
  priorityStatusText: document.querySelector("#priorityStatusText"),
  actionArrowLayer: document.querySelector("#actionArrowLayer"),
  fullControlButton: document.querySelector("#fullControlButton"),
  prioritySettingsButton: document.querySelector("#prioritySettingsButton"),
  prioritySettingsPanel: document.querySelector("#prioritySettingsPanel"),
  priorityDebugButton: document.querySelector("#priorityDebugButton"),
  priorityDebugPanel: document.querySelector("#priorityDebugPanel"),
  priorityDebugState: document.querySelector("#priorityDebugState"),
  priorityDebugPlayer: document.querySelector("#priorityDebugPlayer"),
  priorityDebugReason: document.querySelector("#priorityDebugReason"),
  priorityDebugStack: document.querySelector("#priorityDebugStack"),
  priorityDebugPending: document.querySelector("#priorityDebugPending"),
  priorityDebugPasses: document.querySelector("#priorityDebugPasses"),

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

  eventChoiceModal: document.querySelector("#eventChoiceModal"),
  eventChoiceMessage: document.querySelector("#eventChoiceMessage"),
  keepCurrentEventButton: document.querySelector("#keepCurrentEventButton"),
  keepIncomingEventButton: document.querySelector("#keepIncomingEventButton"),
  cancelEventChoiceButton: document.querySelector("#cancelEventChoiceButton"),

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

  elements.fullControlButton?.addEventListener("click", () => {
    setFullControl(1, !getPrioritySettings(1).fullControl);
    renderGame();
  });

  elements.prioritySettingsButton?.addEventListener("click", () => {
    const expanded = elements.prioritySettingsPanel.hidden;
    elements.prioritySettingsPanel.hidden = !expanded;
    elements.prioritySettingsButton.setAttribute("aria-expanded", String(expanded));
  });


  elements.priorityDebugButton?.addEventListener("click", () => {
    const expanded = elements.priorityDebugPanel.hidden;
    elements.priorityDebugPanel.hidden = !expanded;
    elements.priorityDebugButton.setAttribute("aria-expanded", String(expanded));
  });

  elements.playerEventZone.addEventListener("click", () => inspectControlledEvent(1));
  elements.enemyEventZone.addEventListener("click", () => inspectControlledEvent(2));
  elements.keepCurrentEventButton.addEventListener("click", () => resolveEventReplacementChoice("existing"));
  elements.keepIncomingEventButton.addEventListener("click", () => resolveEventReplacementChoice("incoming"));
  elements.cancelEventChoiceButton.addEventListener("click", cancelEventReplacementChoice);

  elements.acceptTriggerButton?.addEventListener(
    "click",
    acceptPendingTriggeredChoice
  );

  elements.declineTriggerButton?.addEventListener(
    "click",
    declinePendingTriggeredChoice
  );

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
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      setFullControl(1, !getPrioritySettings(1).fullControl);
      renderGame();
      return;
    }

    if (event.key === "Escape") {
      const pendingTriggerChoice =
        typeof getPendingTriggeredChoice === "function"
          ? getPendingTriggeredChoice()
          : null;

      if (pendingTriggerChoice?.kind === "optional") {
        declinePendingTriggeredChoice();
        return;
      }

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
