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
  playerDeckZone: document.querySelector("#playerDeckZone"),
  enemyDeckZone: document.querySelector("#enemyDeckZone"),
  playerDeckCount: document.querySelector("#playerDeckCount"),
  enemyDeckCount: document.querySelector("#enemyDeckCount"),
  playerDiscardCount: document.querySelector("#playerDiscardCount"),
  enemyDiscardCount: document.querySelector("#enemyDiscardCount"),
  playerBanishCount: document.querySelector("#playerBanishCount"),
  enemyBanishCount: document.querySelector("#enemyBanishCount"),
  playerDiscardZone: document.querySelector("#playerDiscardZone"),
  enemyDiscardZone: document.querySelector("#enemyDiscardZone"),
  playerBanishZone: document.querySelector("#playerBanishZone"),
  enemyBanishZone: document.querySelector("#enemyBanishZone"),
  publicZoneModal: document.querySelector("#publicZoneModal"),
  publicZoneTitle: document.querySelector("#publicZoneTitle"),
  publicZoneOwner: document.querySelector("#publicZoneOwner"),
  publicZoneCount: document.querySelector("#publicZoneCount"),
  publicZoneCards: document.querySelector("#publicZoneCards"),
  closePublicZoneButton: document.querySelector("#closePublicZoneButton"),
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




  elements.playerDeckZone.addEventListener("click", () => inspectDeckPile(1));
  elements.enemyDeckZone.addEventListener("click", () => inspectDeckPile(2));
  elements.playerDiscardZone.addEventListener("click", () => openPublicZoneBrowser(1, ZoneTypes.DISCARD));
  elements.enemyDiscardZone.addEventListener("click", () => openPublicZoneBrowser(2, ZoneTypes.DISCARD));
  elements.playerBanishZone.addEventListener("click", () => openPublicZoneBrowser(1, ZoneTypes.BANISH));
  elements.enemyBanishZone.addEventListener("click", () => openPublicZoneBrowser(2, ZoneTypes.BANISH));
  elements.closePublicZoneButton.addEventListener("click", closePublicZoneBrowser);
  elements.publicZoneModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-public-zone-close]")) closePublicZoneBrowser();
  });
  elements.playerEventZone.addEventListener("click", () => inspectControlledEvent(1));
  elements.enemyEventZone.addEventListener("click", () => inspectControlledEvent(2));
  elements.playerEventZone.addEventListener("mouseenter", () => inspectControlledEvent(1));
  elements.enemyEventZone.addEventListener("mouseenter", () => inspectControlledEvent(2));
  elements.playerEventZone.addEventListener("focus", () => inspectControlledEvent(1));
  elements.enemyEventZone.addEventListener("focus", () => inspectControlledEvent(2));
  elements.playerEventZone.addEventListener("mouseleave", () => renderCardPreview());
  elements.enemyEventZone.addEventListener("mouseleave", () => renderCardPreview());
  elements.playerEventZone.addEventListener("blur", () => renderCardPreview());
  elements.enemyEventZone.addEventListener("blur", () => renderCardPreview());
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

  document.addEventListener("click", (event) => {
    if (!GameState.selectedCardId) return;
    if (event.target.closest(".hand-card, #battlefield, #deploymentChoiceModal, #eventChoiceModal")) return;
    clearSelectedCardInteraction();
    renderGame();
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
      if (window.PublicZoneBrowser?.isOpen) {
        closePublicZoneBrowser();
        return;
      }
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


function inspectDeckPile(playerId) {
  const player = GameState.players[playerId];
  if (!player) return;
  elements.cardPreview.replaceChildren();
  elements.cardPreview.className = "card-preview deck-preview";

  const heading = document.createElement("h3");
  heading.textContent = `${player.name} Deck`;
  const count = document.createElement("p");
  count.textContent = `${player.deck.length} ${player.deck.length === 1 ? "card" : "cards"} remaining.`;
  const note = document.createElement("p");
  note.className = "card-preview__effect";
  note.textContent = playerId === getInteractionPlayerId()
    ? "A card is drawn automatically during this player's Draw Step."
    : "Deck contents are hidden.";
  elements.cardPreview.append(heading, count, note);
}

function renderZoneCounts() {
  for (const playerId of [1, 2]) {
    if (typeof syncZoneCounts === "function") syncZoneCounts(playerId);
  }
  const p1 = GameState.players[1];
  const p2 = GameState.players[2];
  elements.playerDeckCount.textContent = String(p1.deck.length);
  elements.enemyDeckCount.textContent = String(p2.deck.length);
  elements.playerDiscardCount.textContent = String(p1.discard.length);
  elements.enemyDiscardCount.textContent = String(p2.discard.length);
  elements.playerBanishCount.textContent = String(p1.banish.length);
  elements.enemyBanishCount.textContent = String(p2.banish.length);

  elements.playerDeckZone.classList.toggle("is-empty", p1.deck.length === 0);
  elements.enemyDeckZone.classList.toggle("is-empty", p2.deck.length === 0);
  elements.playerDeckZone.setAttribute("aria-label", `Player 1 Deck, ${p1.deck.length} cards remaining`);
  elements.enemyDeckZone.setAttribute("aria-label", `Player 2 Deck, ${p2.deck.length} cards remaining`);
}
