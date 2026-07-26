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

  if (!passingPlayer || !GameState.players[passingPlayer]) {
    closePriorityWindow();
    renderGame();
    return;
  }

  GameState.priority.passes += 1;

  addLog(`${GameState.players[passingPlayer].name} passes priority.`);

  if (GameState.priority.passes >= 2) {
    beginResolveTopAction();
    return;
  }

  GameState.priority.playerId = passingPlayer === 1 ? 2 : 1;
  GameState.selectedCardId = null;
  GameState.pendingActionUserId = null;
  GameState.pendingActionTargetId = null;

  GameState.actionSelectionMessage =
    `${GameState.players[GameState.priority.playerId].name} has priority. Play an Action or pass.`;

  renderGame();
}

async function beginResolveTopAction() {
  const entry = GameState.actionStack.at(-1);

  if (!entry || GameState.priority.resolving) {
    closePriorityWindow();

    if (!GameState.actionStack.length) {
      resumePendingEvent();
    }

    renderGame();
    return;
  }

  GameState.priority.resolving = true;
  GameState.priority.active = false;
  GameState.selectedCardId = null;
  GameState.pendingActionUserId = null;
  GameState.pendingActionTargetId = null;

  entry.status = "resolving";
  GameState.actionSelectionMessage = `${entry.card.name} is resolving...`;

  renderGame();

  // Keep the Action and User connection visible long enough to read.
  const elapsed = Date.now() - GameState.priority.openedAt;
  const remainingPresentationTime = Math.max(0, 3000 - elapsed);

  if (remainingPresentationTime > 0) {
    await new Promise((resolve) =>
      window.setTimeout(resolve, remainingPresentationTime)
    );
  }

  resolveActionEffect(entry);
  entry.status = "resolved";

  renderGame();

  await new Promise((resolve) => window.setTimeout(resolve, 1000));

  GameState.players[entry.owner].discardCount += 1;
  GameState.actionStack.pop();
  GameState.priority.resolving = false;

  if (GameState.actionStack.length) {
    openPriorityWindow(
      GameState.activePlayer,
      PRIORITY.ACTION
    );
  } else {
    closePriorityWindow();
    resumePendingEvent();
  }

  renderGame();
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

function resolveActionEffect(entry) {
  const actionId = entry.card.databaseId ?? entry.card.id;
  const user = getUnitById(entry.userId);

  switch (actionId) {
    case "BOA-146":
      resolveTakingAim(entry, user);
      break;

    default:
      addLog(`${entry.card.name} resolves.`);
      break;
  }
}

function resolveTakingAim(entry, user) {
  if (!user) {
    addLog(`${entry.card.name} resolves without a User.`);
    return;
  }

  user.temporaryRangeBonus =
    (user.temporaryRangeBonus ?? 0) + 2;
  user.currentRange =
    user.printedRange + user.temporaryRangeBonus;

  addLog(
    `${entry.card.name} resolves. ${user.name} gains +2 Range until the end of the turn.`
  );

  showUnitActionFeedback(user, "+2 RNG");
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

function renderActionStacks() {
  renderActionStackForPlayer(1, elements.playerActionStack);
  renderActionStackForPlayer(2, elements.enemyActionStack);

  const promptText =
  GameState.actionSelectionMessage ||
  (GameState.priority.active && GameState.priority.playerId
    ? `${GameState.players[GameState.priority.playerId].name} has priority.`
    : "");

elements.actionPrompt.hidden = !promptText;
elements.actionPromptText.textContent = promptText;
elements.passPriorityButton.hidden =
  !GameState.priority.active || GameState.priority.resolving;

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
    const target = entry.targetId
      ? getUnitById(entry.targetId)
      : null;

    actionCard.className = "action-stack-card";
    actionCard.classList.toggle(
      "is-resolving",
      entry.status === "resolving"
    );
    actionCard.classList.toggle(
      "is-resolved",
      entry.status === "resolved"
    );
    actionCard.dataset.actionStackId = entry.stackId;
    actionCard.style.setProperty("--stack-index", String(index));
    actionCard.setAttribute("tabindex", "0");
    actionCard.setAttribute(
      "aria-label",
      `${entry.card.name}, used by ${user?.name ?? "unknown Character"}`
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
    inspectorTarget.textContent =
      target
        ? `Target: ${target.name}`
        : "Target: User";

    const inspectorStatus = document.createElement("span");
    inspectorStatus.textContent =
      `Status: ${entry.status === "waiting" ? "Waiting for responses" : entry.status}`;

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
