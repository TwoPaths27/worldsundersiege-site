"use strict";

/*
 * Worlds Under Siege — Priority and Action Stack subsystem
 *
 * Owns priority windows, pending-event resumption, Action resolution,
 * Action Stack rendering, stack previews, and Action-to-User arrows.
 */

function beginPriorityWindow({
  playerId = GameState.activePlayer,
  reason = PRIORITY.NONE,
  event = null,
} = {}) {
  if (GameState.priority.resolving) {
    console.warn("Cannot open a priority window while the stack is resolving.");
    return false;
  }

  if (!GameState.players[playerId]) {
    console.warn(`Cannot open priority for unknown player ${playerId}.`);
    return false;
  }

  GameState.priority.active = true;
  GameState.priority.reason = reason;
  GameState.priority.playerId = playerId;
  GameState.priority.passes = 0;
  GameState.priority.openedAt = Date.now();
  GameState.priority.resolving = false;

  if (event !== null) {
    setPendingEvent(event);
  }

  GameState.actionSelectionMessage =
    `${GameState.players[playerId].name} has priority. Play an Action or pass.`;

  return true;
}

/*
 * Backward-compatible wrapper.
 *
 * Existing calls such as:
 *
 * openPriorityWindow(2);
 *
 * continue to work. Later builds can supply a reason and pending event.
 */
function openPriorityWindow(
  playerId = GameState.activePlayer,
  reason = PRIORITY.ACTION,
  event = null
) {
  return beginPriorityWindow({
    playerId,
    reason,
    event,
  });
}

function passPriority() {
  if (!GameState.priority.active || GameState.priority.resolving) {
    return;
  }

  const passingPlayer = GameState.priority.playerId;
  const passingPlayerState = GameState.players[passingPlayer];

  if (!passingPlayerState) {
    console.warn(`Cannot pass priority for unknown player ${passingPlayer}.`);
    closePriorityWindow();
    renderGame();
    return;
  }

  GameState.priority.passes += 1;

  emitGameEvent(
    "priorityPassed",
    {
      playerId: passingPlayer,
      passes: GameState.priority.passes,
    },
    { source: passingPlayer }
  );

  addLog(`${passingPlayerState.name} passes priority.`);

  if (GameState.priority.passes >= 2) {
    addLog("Both players passed priority.");
    beginResolveTopAction();
    return;
  }

  const nextPlayer = passingPlayer === 1 ? 2 : 1;

  if (!GameState.players[nextPlayer]) {
    console.warn(`Cannot give priority to unknown player ${nextPlayer}.`);
    closePriorityWindow();
    renderGame();
    return;
  }

  GameState.priority.playerId = nextPlayer;
  clearPendingActionSelection();

  GameState.actionSelectionMessage =
    `${GameState.players[nextPlayer].name} has priority. Play an Action or pass.`;

  renderGame();
}

async function beginResolveTopAction() {
  // Resolution is asynchronous. Ignore repeated clicks while one entry is
  // already resolving instead of accidentally closing the priority window.
  if (GameState.priority.resolving) {
    return;
  }

  const entry = GameState.actionStack.at(-1);

  if (!entry) {
    closePriorityWindow();
    resumePendingEvent();
    renderGame();
    return;
  }

  if (entry.status === "resolving") {
    return;
  }

  GameState.priority.resolving = true;
  GameState.priority.active = false;
  clearPendingActionSelection();

  const cardName = entry.card?.name ?? "Unknown Action";
  entry.status = "resolving";
  GameState.actionSelectionMessage = `${cardName} is resolving...`;
  addLog(`${cardName} begins resolving.`);

  renderGame();

  // Keep the Action and User connection visible long enough to read.
  const elapsed = Date.now() - GameState.priority.openedAt;
  const remainingPresentationTime = Math.max(0, 3000 - elapsed);

  if (remainingPresentationTime > 0) {
    await delayPriorityPresentation(remainingPresentationTime);
  }

  const eventSource = entry.card ?? entry;
  emitGameEvent("beforeAbilityResolved", { entry }, { source: eventSource });

  const resolution = resolveActionEffect(entry);
  entry.status = resolution?.resolved ? "resolved" : "fizzled";

  emitGameEvent(
    "abilityResolved",
    { entry, resolution },
    { source: eventSource }
  );

  if (resolution?.resolved) {
    addLog(`${cardName} finished resolving.`);
  }

  renderGame();
  await delayPriorityPresentation(1000);

  const owner = GameState.players[entry.owner];

  if (owner) {
    owner.discardCount = (owner.discardCount ?? 0) + 1;
    addLog(`${cardName} moves to the discard pile.`);
  } else {
    console.warn(
      `${cardName} left the stack without a valid owner; discard count was not updated.`
    );
  }

  removeActionStackEntry(entry);
  emitGameEvent(
    "actionRemovedFromStack",
    { entry, resolution },
    { source: eventSource }
  );

  GameState.priority.resolving = false;

  if (GameState.actionStack.length) {
    reopenPriorityWindowAfterResolution();
  } else {
    closePriorityWindow();
    emitGameEvent(
      "stackResolved",
      { lastEntry: entry, resolution },
      { source: eventSource }
    );
    resumePendingEvent();
  }

  renderGame();
}

function delayPriorityPresentation(milliseconds) {
  return new Promise((resolve) =>
    window.setTimeout(resolve, Math.max(0, milliseconds))
  );
}

function clearPendingActionSelection() {
  GameState.selectedCardId = null;
  GameState.pendingActionUserId = null;
  GameState.pendingActionTargetId = null;
}

function removeActionStackEntry(entry) {
  const index = GameState.actionStack.lastIndexOf(entry);

  if (index >= 0) {
    GameState.actionStack.splice(index, 1);
    return true;
  }

  return false;
}

function getPriorityPlayerAfterResolution() {
  return GameState.players[GameState.activePlayer]
    ? GameState.activePlayer
    : Object.keys(GameState.players)
        .map(Number)
        .find((playerId) => GameState.players[playerId]) ?? null;
}

function reopenPriorityWindowAfterResolution() {
  if (!GameState.actionStack.length) {
    closePriorityWindow();
    return false;
  }

  const playerId = getPriorityPlayerAfterResolution();

  if (!playerId) {
    console.warn("The Action Stack could not reopen priority: no valid player.");
    closePriorityWindow();
    return false;
  }

  return openPriorityWindow(playerId, PRIORITY.ACTION);
}

function closePriorityWindow() {
  GameState.priority.active = false;
  GameState.priority.reason = PRIORITY.NONE;
  GameState.priority.playerId = null;
  GameState.priority.passes = 0;
  GameState.priority.openedAt = 0;
  GameState.priority.resolving = false;
  GameState.actionSelectionMessage = "";
}

function setPendingEvent(event) {
  if (event === null) {
    GameState.pendingEvent = null;
    return;
  }

  if (typeof event !== "object") {
    throw new TypeError("A pending game event must be an object or null.");
  }

  GameState.pendingEvent = {
    type: event.type ?? "unknown",
    payload: event.payload ?? null,
    resume:
      typeof event.resume === "function"
        ? event.resume
        : null,
  };
}

function clearPendingEvent() {
  const previousEvent = GameState.pendingEvent;
  GameState.pendingEvent = null;
  return previousEvent;
}

function resumePendingEvent() {
  const event = clearPendingEvent();

  if (!event || typeof event.resume !== "function") {
    return false;
  }

  try {
    event.resume(event.payload);
    return true;
  } catch (error) {
    console.error(
      `Failed to resume pending event "${event.type}".`,
      error
    );

    addLog(
      `The pending ${event.type} event could not resume.`
    );

    return false;
  }
}

function hasPriority() {
  return GameState.priority.active;
}

function getPriorityPlayerId() {
  return GameState.priority.playerId;
}

function getPriorityReason() {
  return GameState.priority.reason;
}

function isResolvingActionStack() {
  return GameState.priority.resolving;
}

function canInteractDuringPriority() {
  return Boolean(
    GameState.priority.active &&
    !GameState.priority.resolving &&
    !GameState.gameOver
  );
}

function canInteractWithBattlefield() {
  return Boolean(
    !GameState.priority.active &&
    !GameState.priority.resolving &&
    !GameState.gameOver
  );
}

function resolveActionEffect(entry) {
  if (!entry || typeof entry !== "object" || !entry.card) {
    addLog("An invalid Action fizzles and leaves the stack.");
    return createResolutionResult(false, "invalid-entry");
  }

  const cardName = entry.card.name ?? "Unknown Action";
  const abilitySource = entry.abilityId || entry.card;
  const ability = getAbility(abilitySource);

  if (!ability) {
    addLog(`${cardName} fizzles because it has no registered ability.`);
    return createResolutionResult(false, "unknown-ability");
  }

  const player = GameState.players[entry.owner];

  if (!player) {
    addLog(`${cardName} fizzles because its controller is unavailable.`);
    return createResolutionResult(false, "missing-player");
  }

  const opponent = GameState.players[entry.owner === 1 ? 2 : 1] ?? null;
  const user = entry.userId ? getUnitById(entry.userId) : null;

  if (!user) {
    addLog(`${cardName} fizzles because its User left the battlefield.`);
    return createResolutionResult(false, "missing-user");
  }

  const targetMode =
    entry.targetMode ?? getAbilityTargetMode(abilitySource);

  const target =
    targetMode === "user"
      ? user
      : entry.targetId
        ? getUnitById(entry.targetId)
        : null;

  const context = createAbilityContext({
    source: abilitySource,
    stackEntry: entry,
    card: entry.card,
    owner: entry.owner,
    playerId: entry.owner,
    player,
    opponent,
    user,
    target,
  });

  const result = executeAbility(abilitySource, context);

  if (!result.resolved) {
    const reasonText = {
      "illegal-user": "its User is no longer legal",
      "missing-target": "its target disappeared",
      "illegal-target": "its target is no longer legal",
      "resolution-error": "its effect encountered an error",
      "ability-returned-false": "its effect could not complete",
    }[result.reason];

    addLog(
      reasonText
        ? `${cardName} fizzles because ${reasonText}.`
        : `${cardName} fizzles.`
    );
  }

  return result;
}

function showUnitActionFeedback(unit, message) {
  const token = elements.battlefield.querySelector(
    `[data-unit-id="${CSS.escape(unit.id)}"]`
  );

  if (!token) {
    return;
  }

  token.classList.add("is-action-resolving-user");

  const feedback = document.createElement("span");
  feedback.className = "unit-action-feedback";
  feedback.textContent = message;
  token.appendChild(feedback);

  window.setTimeout(() => {
    feedback.remove();
    token.classList.remove("is-action-resolving-user");
  }, 1150);
}


function getActionStackTarget(entry) {
  const targetMode =
    entry.targetMode ?? getAbilityTargetMode(entry.abilityId || entry.card);

  if (targetMode === "user") {
    return {
      mode: targetMode,
      unit: entry.userId ? getUnitById(entry.userId) : null,
      label: "User",
    };
  }

  if (targetMode === "none") {
    return {
      mode: targetMode,
      unit: null,
      label: "None",
    };
  }

  return {
    mode: targetMode,
    unit: entry.targetId ? getUnitById(entry.targetId) : null,
    label: "Target",
  };
}

function getActionStackStatusLabel(status) {
  return {
    waiting: "Waiting for responses",
    resolving: "Resolving",
    resolved: "Resolved",
    fizzled: "Fizzled",
  }[status] ?? "Waiting";
}

function renderActionStacks() {
  renderActionStackForPlayer(1, elements.playerActionStack);
  renderActionStackForPlayer(2, elements.enemyActionStack);

  const priorityPlayer =
    GameState.priority.playerId
      ? GameState.players[GameState.priority.playerId]
      : null;

  const promptText =
    GameState.actionSelectionMessage ||
    (GameState.priority.active && priorityPlayer
      ? `${priorityPlayer.name} has priority. Play an Action or pass.`
      : "");

  elements.actionPrompt.hidden = !promptText;
  elements.actionPromptText.textContent = promptText;

  /*
   * Keep the control visible so the layout does not jump, but disable it
   * whenever passing is not legal.
   */
  elements.passPriorityButton.hidden = false;
  elements.passPriorityButton.disabled =
    !GameState.priority.active ||
    GameState.priority.resolving ||
    GameState.gameOver;

  elements.passPriorityButton.textContent =
    GameState.priority.resolving
      ? "Resolving..."
      : GameState.priority.active && priorityPlayer
        ? `${priorityPlayer.name}: Pass Priority`
        : "Pass Priority";

  window.requestAnimationFrame(renderActionArrows);
}

function renderActionStackForPlayer(playerId, container) {
  container.replaceChildren();

  const entries = GameState.actionStack.filter(
    (entry) => entry.owner === playerId
  );

  if (!entries.length) {
    container.classList.add("is-empty");
    container.setAttribute(
      "aria-label",
      `Player ${playerId} Action stack empty`
    );
    return;
  }

  container.classList.remove("is-empty");

  entries.forEach((entry, index) => {
    const actionCard = document.createElement("article");
    const user = getUnitById(entry.userId);
    const targetInfo = getActionStackTarget(entry);
    const target = targetInfo.unit;
    const statusLabel = getActionStackStatusLabel(entry.status);

    actionCard.className = "action-stack-card";
    actionCard.classList.toggle(
      "is-resolving",
      entry.status === "resolving"
    );
    actionCard.classList.toggle(
      "is-resolved",
      entry.status === "resolved"
    );
    actionCard.classList.toggle(
      "is-fizzled",
      entry.status === "fizzled"
    );
    actionCard.dataset.actionStackId = entry.stackId;
    actionCard.style.setProperty("--stack-index", String(index));
    actionCard.setAttribute("tabindex", "0");
    const targetDescription =
      targetInfo.mode === "none"
        ? "no target"
        : target
          ? `${targetInfo.label.toLowerCase()} ${target.name}`
          : `${targetInfo.label.toLowerCase()} unavailable`;

    actionCard.setAttribute(
      "aria-label",
      `${entry.card.name}, used by ${user?.name ?? "unknown Character"}, ` +
      `${targetDescription}, ${statusLabel}`
    );
const showStackCardPreview = () => {
  renderHandCardPreview(entry.card);
};

const restorePreviewAfterStackCard = () => {
  const selectedCard = getSelectedCard();

  if (selectedCard) {
    renderHandCardPreview(selectedCard);
    return;
  }

  renderCardPreview();
};

actionCard.addEventListener(
  "mouseenter",
  showStackCardPreview
);

actionCard.addEventListener(
  "mouseleave",
  restorePreviewAfterStackCard
);

actionCard.addEventListener(
  "focus",
  showStackCardPreview
);

actionCard.addEventListener(
  "blur",
  restorePreviewAfterStackCard
);

    if (entry.card.cardImage) {
      actionCard.style.backgroundImage =
        `linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.08)), ` +
        `url("${entry.card.cardImage}")`;
    }

    const label = document.createElement("strong");
    label.textContent = entry.card.name;

    const userLabel = document.createElement("span");
    userLabel.textContent =
      user ? `User: ${user.name}` : "User unavailable";

    const inspector = document.createElement("div");
    inspector.className = "action-stack-inspector";

    const inspectorTitle = document.createElement("strong");
    inspectorTitle.textContent = entry.card.name;

    const inspectorUser = document.createElement("span");
    inspectorUser.textContent =
      `User: ${user?.name ?? "Unavailable"}`;

    const inspectorTarget = document.createElement("span");

    if (targetInfo.mode === "none") {
      inspectorTarget.textContent = "Target: None";
    } else if (target) {
      inspectorTarget.textContent =
        `${targetInfo.label}: ${target.name}`;
    } else {
      inspectorTarget.textContent =
        `${targetInfo.label}: Unavailable`;
    }

    const inspectorStatus = document.createElement("span");
    inspectorStatus.textContent = `Status: ${statusLabel}`;

    inspector.append(
      inspectorTitle,
      inspectorUser,
      inspectorTarget,
      inspectorStatus
    );

    actionCard.append(label, userLabel, inspector);
    container.appendChild(actionCard);
  });
}

function renderActionArrows() {
  const svg = elements.actionArrowLayer;
  const stage = document.querySelector(".battlefield-stage");

  if (!svg || !stage) {
    return;
  }

  svg.replaceChildren();

  const stageRect = stage.getBoundingClientRect();
  svg.setAttribute(
    "viewBox",
    `0 0 ${stageRect.width} ${stageRect.height}`
  );

  for (const entry of GameState.actionStack) {
    const userToken = elements.battlefield.querySelector(
      `[data-unit-id="${CSS.escape(entry.userId)}"]`
    );
    const actionCard = document.querySelector(
      `[data-action-stack-id="${CSS.escape(entry.stackId)}"]`
    );

    if (!userToken || !actionCard) {
      continue;
    }

    const from = userToken.getBoundingClientRect();
    const to = actionCard.getBoundingClientRect();

    const line = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );

    line.setAttribute(
      "x1",
      String(from.left + from.width / 2 - stageRect.left)
    );
    line.setAttribute(
      "y1",
      String(from.top + from.height / 2 - stageRect.top)
    );
    line.setAttribute(
      "x2",
      String(to.left + to.width / 2 - stageRect.left)
    );
    line.setAttribute(
      "y2",
      String(to.top + to.height / 2 - stageRect.top)
    );
    line.setAttribute(
      "marker-end",
      "url(#actionArrowHead)"
    );
    line.classList.add(
      "action-user-arrow",
      entry.status === "resolved"
        ? "is-resolved"
        : "is-pending"
    );

    svg.appendChild(line);
  }
}


// Module 14 compatibility alias
const renderEffectStack = renderActionStacks;
