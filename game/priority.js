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


function canPassPriority(playerId = GameState.priority.playerId) {
  return Boolean(
    GameState.priority.active &&
    !GameState.priority.resolving &&
    !GameState.gameOver &&
    playerId &&
    playerId === GameState.priority.playerId &&
    GameState.players[playerId]
  );
}

function passPriority() {
  if (!canPassPriority()) {
    return false;
  }

  const passingPlayer = GameState.priority.playerId;
  const passingPlayerState = GameState.players[passingPlayer];

  if (!passingPlayerState) {
    console.warn(`Cannot pass priority for unknown player ${passingPlayer}.`);
    closePriorityWindow();
    renderGame();
    return false;
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
  return true;
}


function createTriggeredAbilityStackEntry({
  trigger,
  context = {},
  originalEvent = null,
}) {
  if (!trigger?.abilityId) {
    throw new TypeError(
      "A triggered stack entry requires a trigger with an abilityId."
    );
  }

  const source = trigger.source ?? context.source ?? null;
  const owner =
    trigger.owner ??
    context.owner ??
    source?.owner ??
    null;

  return {
    stackId: `trigger-${trigger.id}-${Date.now()}`,
    type: "trigger",
    card: null,
    name:
      source?.name
        ? `${source.name} — Trigger`
        : `Triggered Ability (${trigger.abilityId})`,
    abilityId: trigger.abilityId,
    triggerId: trigger.id,
    originalEventId: originalEvent?.id ?? null,
    source,
    optional: Boolean(trigger.optional),
    triggerPrompt: trigger.prompt ?? null,
    optionalDecision: trigger.optional ? null : true,
    pendingChoiceKind: null,
    interveningCondition: trigger.interveningCondition ?? null,
    owner,
    userId: context.user?.id ?? null,
    targetId: context.target?.id ?? null,
    targetMode: getAbilityTargetMode(trigger.abilityId),
    triggerContext: {
      ...context,
      originalEvent,
    },
    status: "waiting",
    createdAt: Date.now(),
    resolutionStartedAt: null,
    resolutionFinishedAt: null,
    resolution: null,
  };
}

function queueTriggeredAbility({
  trigger,
  context = {},
  originalEvent = null,
  openPriority = true,
}) {
  const entry = createTriggeredAbilityStackEntry({
    trigger,
    context,
    originalEvent,
  });

  GameState.actionStack.push(entry);

  addLog(`${entry.name} is added to the stack.`);

  /*
   * Batch callers pass openPriority:false and open one shared priority window
   * after all simultaneous triggers have entered the stack.
   */
  if (openPriority && !GameState.priority.resolving) {
    openPriorityForQueuedTriggers({
      event: originalEvent,
      entries: [entry],
    });
  }

  return entry;
}

function openPriorityForQueuedTriggers({
  event = null,
  entries = [],
} = {}) {
  if (!entries.length) {
    return false;
  }

  /*
   * Triggers created during resolution remain waiting. The current resolver
   * will reopen priority after the resolving entry leaves the stack.
   */
  if (GameState.priority.resolving) {
    renderGame();
    return false;
  }

  const startingPlayer =
    GameState.players[GameState.activePlayer]
      ? GameState.activePlayer
      : 1;

  const opened = beginPriorityWindow({
    playerId: startingPlayer,
    reason: PRIORITY.ACTION,
  });

  if (opened !== false) {
    const triggerWord =
      entries.length === 1
        ? "triggered ability is"
        : "triggered abilities are";

    GameState.actionSelectionMessage =
      `${entries.length} ${triggerWord} on the stack. ` +
      `${GameState.players[startingPlayer].name} has priority.`;

    addLog(
      `${entries.length} simultaneous ` +
      `${entries.length === 1 ? "trigger" : "triggers"} entered the stack.`
    );
  }

  renderGame();
  return opened !== false;
}

function getStackEntryName(entry) {
  return (
    entry?.card?.name ??
    entry?.name ??
    entry?.source?.name ??
    "Unknown Ability"
  );
}

function resolveTriggeredAbility(entry) {
  const source = entry.abilityId;
  const storedContext = entry.triggerContext ?? {};

  if (typeof entry.interveningCondition === "function") {
    let stillLegal = false;

    try {
      stillLegal =
        entry.interveningCondition({
          ...storedContext,
          game: GameState,
          stackEntry: entry,
          source: entry.source,
        }) !== false;
    } catch (error) {
      console.error(
        `Intervening condition failed for trigger "${entry.triggerId}".`,
        error
      );

      return createResolutionResult(
        false,
        "intervening-condition-error"
      );
    }

    if (!stillLegal) {
      addLog(
        `${getStackEntryName(entry)} fizzles because its trigger condition is no longer true.`
      );

      return createResolutionResult(
        false,
        "intervening-condition-false"
      );
    }
  }

  const owner =
    entry.owner ??
    storedContext.owner ??
    entry.source?.owner ??
    null;

  const user =
    entry.userId
      ? getUnitById(entry.userId)
      : storedContext.user ?? null;

  const target =
    entry.targetId
      ? getUnitById(entry.targetId)
      : storedContext.target ?? null;

  const context = createAbilityContext({
    ...storedContext,
    source: entry.source ?? source,
    stackEntry: entry,
    card: entry.source?.cardType === "Action"
      ? entry.source
      : null,
    owner,
    user,
    target,
    trigger: storedContext.trigger ?? null,
  });

  return executeAbility(source, context);
}

function resolveStackEntry(entry) {
  if (entry?.type === "trigger") {
    if (entry.optional && entry.optionalDecision === false) {
      return createResolutionResult(
        false,
        entry.choiceCancellationReason ?? "optional-trigger-declined"
      );
    }

    return resolveTriggeredAbility(entry);
  }

  return resolveActionEffect(entry);
}



function getPendingTriggeredChoice() {
  return GameState.pendingTriggeredChoice ?? null;
}

function clearPendingTriggeredChoice() {
  GameState.pendingTriggeredChoice = null;
}

function getTriggeredEntryAbility(entry) {
  return getAbility(entry?.abilityId ?? entry?.source);
}

function triggeredEntryRequiresTarget(entry) {
  if (!entry || entry.type !== "trigger") {
    return false;
  }

  const ability = getTriggeredEntryAbility(entry);
  const targetMode =
    entry.targetMode ??
    ability?.targetMode ??
    "none";

  const requiresTarget =
    ability?.requiresTarget ??
    (
      targetMode !== "none" &&
      targetMode !== "user"
    );

  return Boolean(requiresTarget);
}

function isChoosingTriggeredTarget() {
  const choice = getPendingTriggeredChoice();

  return Boolean(
    choice &&
    choice.kind === "target" &&
    GameState.actionStack.at(-1)?.stackId === choice.stackId
  );
}

function getPendingTriggeredEntry() {
  const choice = getPendingTriggeredChoice();

  if (!choice) {
    return null;
  }

  return GameState.actionStack.find(
    (entry) => entry.stackId === choice.stackId
  ) ?? null;
}

function isEligibleTriggeredTarget(target) {
  const entry = getPendingTriggeredEntry();

  if (!entry || !target || entry.type !== "trigger") {
    return false;
  }

  const ability = getTriggeredEntryAbility(entry);

  if (!ability) {
    return false;
  }

  const storedContext = entry.triggerContext ?? {};
  const owner =
    entry.owner ??
    storedContext.owner ??
    entry.source?.owner ??
    null;

  const user =
    entry.userId
      ? getUnitById(entry.userId)
      : storedContext.user ?? null;

  const context = createAbilityContext({
    ...storedContext,
    game: GameState,
    source: entry.source ?? entry.abilityId,
    stackEntry: entry,
    owner,
    playerId: owner,
    player: owner ? GameState.players[owner] ?? null : null,
    opponent:
      owner
        ? GameState.players[owner === 1 ? 2 : 1] ?? null
        : null,
    user,
    target,
  });

  return isEligibleAbilityTarget(
    entry.abilityId,
    target,
    context
  );
}

function beginTriggeredOptionalChoice(entry) {
  GameState.priority.active = false;
  GameState.priority.resolving = false;

  entry.pendingChoiceKind = "optional";
  GameState.pendingTriggeredChoice = {
    stackId: entry.stackId,
    kind: "optional",
    playerId: entry.owner ?? GameState.activePlayer,
  };

  GameState.actionSelectionMessage =
    entry.triggerPrompt ??
    `Use ${getStackEntryName(entry)}?`;

  addLog(
    `${getStackEntryName(entry)} is waiting for a Yes or No decision.`
  );

  renderGame();
  return false;
}

function beginTriggeredTargetChoice(entry) {
  GameState.priority.active = false;
  GameState.priority.resolving = false;

  entry.pendingChoiceKind = "target";
  GameState.pendingTriggeredChoice = {
    stackId: entry.stackId,
    kind: "target",
    playerId: entry.owner ?? GameState.activePlayer,
  };

  const ability = getTriggeredEntryAbility(entry);
  const storedContext = entry.triggerContext ?? {};

  GameState.actionSelectionMessage =
    typeof ability?.getTargetPrompt === "function"
      ? ability.getTargetPrompt({
          ...storedContext,
          game: GameState,
          stackEntry: entry,
          source: entry.source,
        })
      : `Choose a highlighted target for ${getStackEntryName(entry)}.`;

  addLog(
    `${getStackEntryName(entry)} is waiting for a target.`
  );

  renderGame();
  return false;
}

function acceptPendingTriggeredChoice() {
  const entry = getPendingTriggeredEntry();
  const choice = getPendingTriggeredChoice();

  if (!entry || !choice || choice.kind !== "optional") {
    return false;
  }

  entry.optionalDecision = true;
  entry.pendingChoiceKind = null;
  clearPendingTriggeredChoice();

  addLog(`${getStackEntryName(entry)} was accepted.`);

  if (triggeredEntryRequiresTarget(entry) && !entry.targetId) {
    return beginTriggeredTargetChoice(entry);
  }

  GameState.actionSelectionMessage =
    `${getStackEntryName(entry)} is resolving...`;

  renderGame();
  beginResolveTopAction();
  return true;
}

function declinePendingTriggeredChoice() {
  const entry = getPendingTriggeredEntry();
  const choice = getPendingTriggeredChoice();

  if (!entry || !choice || choice.kind !== "optional") {
    return false;
  }

  entry.optionalDecision = false;
  entry.pendingChoiceKind = null;
  clearPendingTriggeredChoice();

  addLog(`${getStackEntryName(entry)} was declined.`);
  renderGame();
  beginResolveTopAction();
  return true;
}

function chooseTriggeredTarget(target) {
  const entry = getPendingTriggeredEntry();
  const choice = getPendingTriggeredChoice();

  if (
    !entry ||
    !choice ||
    choice.kind !== "target"
  ) {
    return false;
  }

  if (!isEligibleTriggeredTarget(target)) {
    addLog("Choose a highlighted legal target.");
    renderGame();
    return false;
  }

  entry.targetId = target.id;
  entry.triggerContext = {
    ...(entry.triggerContext ?? {}),
    target,
  };
  entry.pendingChoiceKind = null;
  clearPendingTriggeredChoice();

  addLog(
    `${target.name} was chosen as the target for ${getStackEntryName(entry)}.`
  );

  GameState.actionSelectionMessage =
    `${getStackEntryName(entry)} is resolving...`;

  renderGame();
  beginResolveTopAction();
  return true;
}

function cancelPendingTriggeredChoice(reason = "cancelled") {
  const entry = getPendingTriggeredEntry();

  if (!entry) {
    clearPendingTriggeredChoice();
    return false;
  }

  entry.optionalDecision = false;
  entry.pendingChoiceKind = null;
  entry.choiceCancellationReason = reason;
  clearPendingTriggeredChoice();

  addLog(`${getStackEntryName(entry)} was declined.`);
  renderGame();
  beginResolveTopAction();
  return true;
}

function recordStackResolution(entry, resolution) {
  GameState.stackResolutionHistory ??= [];

  GameState.stackResolutionHistory.push({
    stackId: entry.stackId,
    type: entry.type,
    name: getStackEntryName(entry),
    abilityId: entry.abilityId ?? null,
    triggerId: entry.triggerId ?? null,
    owner: entry.owner ?? null,
    status: entry.status,
    resolution,
    createdAt: entry.createdAt ?? null,
    resolutionStartedAt: entry.resolutionStartedAt ?? null,
    resolutionFinishedAt: entry.resolutionFinishedAt ?? Date.now(),
  });

  const maximumHistory = 100;

  if (GameState.stackResolutionHistory.length > maximumHistory) {
    GameState.stackResolutionHistory.splice(
      0,
      GameState.stackResolutionHistory.length - maximumHistory
    );
  }
}

async function beginResolveTopAction() {
  /*
   * Resolution is asynchronous. The global resolving flag and the entry
   * status form a two-part lock against double clicks and re-entrant calls.
   */
  if (GameState.priority.resolving) {
    return false;
  }

  const entry = GameState.actionStack.at(-1);

  if (!entry) {
    closePriorityWindow();
    resumePendingEvent();
    renderGame();
    return false;
  }

  if (entry.status === "resolving") {
    return false;
  }

  if (
    entry.type === "trigger" &&
    entry.optional &&
    entry.optionalDecision === null
  ) {
    return beginTriggeredOptionalChoice(entry);
  }

  if (
    entry.type === "trigger" &&
    entry.optionalDecision !== false &&
    triggeredEntryRequiresTarget(entry) &&
    !entry.targetId
  ) {
    const ability = getTriggeredEntryAbility(entry);
    const storedContext = entry.triggerContext ?? {};
    const owner =
      entry.owner ??
      storedContext.owner ??
      entry.source?.owner ??
      null;
    const user =
      entry.userId
        ? getUnitById(entry.userId)
        : storedContext.user ?? null;

    const legalTargets = GameState.units.filter((target) =>
      isEligibleAbilityTarget(
        entry.abilityId,
        target,
        createAbilityContext({
          ...storedContext,
          game: GameState,
          source: entry.source ?? entry.abilityId,
          stackEntry: entry,
          owner,
          playerId: owner,
          player: owner ? GameState.players[owner] ?? null : null,
          opponent:
            owner
              ? GameState.players[owner === 1 ? 2 : 1] ?? null
              : null,
          user,
          target,
        })
      )
    );

    if (legalTargets.length === 1) {
      entry.targetId = legalTargets[0].id;
      entry.triggerContext = {
        ...storedContext,
        target: legalTargets[0],
      };
    } else if (legalTargets.length > 1) {
      return beginTriggeredTargetChoice(entry);
    }
  }

  const cardName = getStackEntryName(entry);
  const eventSource = entry.card ?? entry.source ?? entry;
  let resolution = {
    resolved: false,
    reason: "resolution-interrupted",
  };

  GameState.priority.resolving = true;
  GameState.priority.active = false;
  clearPendingActionSelection();

  entry.status = "resolving";
  entry.resolutionStartedAt = Date.now();
  GameState.actionSelectionMessage = `${cardName} is resolving...`;
  addLog(`${cardName} begins resolving.`);
  renderGame();

  try {
    // Keep the Action and User connection visible long enough to read.
    const elapsed = Date.now() - GameState.priority.openedAt;
    const remainingPresentationTime = Math.max(0, 3000 - elapsed);

    if (remainingPresentationTime > 0) {
      await delayPriorityPresentation(remainingPresentationTime);
    }

    emitGameEvent(
      "beforeAbilityResolved",
      { entry },
      { source: eventSource }
    );

    resolution =
      resolveStackEntry(entry) ?? {
        resolved: false,
        reason: "missing-resolution-result",
      };

    entry.resolution = resolution;
    entry.status =
      resolution.resolved
        ? "resolved"
        : "fizzled";
    entry.resolutionFinishedAt = Date.now();

    emitGameEvent(
      "abilityResolved",
      { entry, resolution },
      { source: eventSource }
    );

    if (entry.type === "trigger") {
      emitGameEvent(
        "triggerResolved",
        {
          triggerId: entry.triggerId,
          abilityId: entry.abilityId,
          source: entry.source,
          originalEvent: entry.triggerContext?.originalEvent ?? null,
          entry,
          resolution,
        },
        { source: eventSource }
      );
    }

    if (resolution.resolved) {
      addLog(`${cardName} finished resolving.`);
    }

    renderGame();
    await delayPriorityPresentation(1000);
  } catch (error) {
    console.error(`Unexpected failure while resolving ${cardName}.`, error);

    resolution = {
      resolved: false,
      reason: "resolution-error",
      error,
    };

    entry.resolution = resolution;
    entry.status = "fizzled";
    entry.resolutionFinishedAt = Date.now();

    addLog(
      `${cardName} fizzles because stack resolution encountered an error.`
    );
  } finally {
    recordStackResolution(entry, resolution);

    if (entry.type === "action") {
      const owner = GameState.players[entry.owner];

      if (owner) {
        if (typeof discardCard === "function" && entry.card) {
          discardCard(
            entry.card,
            ZoneTypes.STACK,
            entry.owner,
            "action-resolved"
          );
        } else {
          owner.discardCount = (owner.discardCount ?? 0) + 1;
        }

        addLog(`${cardName} moves to the discard pile.`);
      } else {
        console.warn(
          `${cardName} left the stack without a valid owner; ` +
          "discard count was not updated."
        );
      }
    } else {
      addLog(`${cardName} leaves the stack.`);
    }

    if (
      GameState.pendingTriggeredChoice?.stackId === entry.stackId
    ) {
      clearPendingTriggeredChoice();
    }

    removeActionStackEntry(entry);

    try {
      emitGameEvent(
        "actionRemovedFromStack",
        { entry, resolution },
        { source: eventSource }
      );
    } catch (error) {
      console.error(
        `Failed to emit actionRemovedFromStack for ${cardName}.`,
        error
      );
    }

    GameState.priority.resolving = false;

    if (GameState.actionStack.length) {
      reopenPriorityWindowAfterResolution();
    } else {
      closePriorityWindow();

      try {
        emitGameEvent(
          "stackResolved",
          { lastEntry: entry, resolution },
          { source: eventSource }
        );
      } catch (error) {
        console.error("Failed to emit stackResolved.", error);
      }

      resumePendingEvent();
    }

    renderGame();
  }

  return resolution.resolved;
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

  const pendingTriggerChoice =
    getPendingTriggeredChoice();

  if (elements.triggerChoiceControls) {
    elements.triggerChoiceControls.hidden =
      pendingTriggerChoice?.kind !== "optional";
  }

  if (elements.acceptTriggerButton) {
    elements.acceptTriggerButton.disabled =
      pendingTriggerChoice?.kind !== "optional";
  }

  if (elements.declineTriggerButton) {
    elements.declineTriggerButton.disabled =
      pendingTriggerChoice?.kind !== "optional";
  }

  /*
   * Passing is hidden while an optional decision or target selection is
   * pending. Stack order itself is never player-controlled.
   */
  elements.passPriorityButton.hidden =
    Boolean(pendingTriggerChoice);
  elements.passPriorityButton.disabled =
    Boolean(pendingTriggerChoice) ||
    !canPassPriority();

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
      `${getStackEntryName(entry)}, used by ${user?.name ?? "no Character"}, ` +
      `${targetDescription}, ${statusLabel}`
    );
    const previewSource =
      entry.card ??
      entry.source ??
      null;

    const showStackCardPreview = () => {
      if (previewSource && typeof renderHandCardPreview === "function") {
        renderHandCardPreview(previewSource);
      }
    };

    const restorePreviewAfterStackCard = () => {
      const selectedCard =
        typeof getSelectedCard === "function"
          ? getSelectedCard()
          : null;

      if (
        selectedCard &&
        typeof renderHandCardPreview === "function"
      ) {
        renderHandCardPreview(selectedCard);
        return;
      }

      if (typeof renderCardPreview === "function") {
        renderCardPreview();
      }
    };

    actionCard.addEventListener("mouseenter", showStackCardPreview);
    actionCard.addEventListener("mouseleave", restorePreviewAfterStackCard);
    actionCard.addEventListener("focus", showStackCardPreview);
    actionCard.addEventListener("blur", restorePreviewAfterStackCard);

    const image =
      entry.card?.cardImage ??
      entry.source?.cardImage ??
      entry.source?.image ??
      "";

    if (image) {
      actionCard.style.backgroundImage =
        `linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,.08)), ` +
        `url("${image}")`;
    }

    const label = document.createElement("strong");
    label.textContent = getStackEntryName(entry);

    const userLabel = document.createElement("span");
    userLabel.textContent =
      user
        ? `User: ${user.name}`
        : entry.type === "trigger"
          ? "Triggered ability"
          : "User unavailable";

    const inspector = document.createElement("div");
    inspector.className = "action-stack-inspector";

    const inspectorTitle = document.createElement("strong");
    inspectorTitle.textContent = getStackEntryName(entry);

    const inspectorUser = document.createElement("span");
    inspectorUser.textContent =
      user
        ? `User: ${user.name}`
        : entry.type === "trigger"
          ? "User: Not required"
          : "User: Unavailable";

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
