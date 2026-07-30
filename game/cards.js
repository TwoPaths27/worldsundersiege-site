"use strict";

/*
 * Worlds Under Siege — Card subsystem
 *
 * Card and hand rendering will be moved here incrementally.
 */

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
  stats.textContent = card.previewHideCost || isArmy(card)
    ? "Army"
    : isAction(card)
      ? `${hasCounterKeyword(card) ? "Counter Action" : "Action · Sorcery Speed"} · Cost ${card.cost}`
      : isItem(card)
        ? `Item · Cost ${card.cost}`
        : isEvent(card)
          ? "Event · Free"
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

function renderHand() {
  const playerId = getInteractionPlayerId();
  const player = GameState.players[playerId];
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
    elements.hand.appendChild(
      createHandCard(card, player)
    );
  }
}


function createHandCard(card, player) {
  const playerId = getInteractionPlayerId();
  const cardButton = document.createElement("button");
  cardButton.type = "button";
  cardButton.className = "hand-card";
  cardButton.dataset.cardId = card.id;
  const isSelected = GameState.selectedCardId === card.id;
  const hasPriority =
    !GameState.priority.active ||
    GameState.priority.playerId === getInteractionPlayerId();
  const legalActionTiming =
    !isAction(card) ||
    canPlayActionAtCurrentSpeed(card, playerId, getActionPlayabilityContext(card, playerId));
  const legalDuringPriority =
    !GameState.priority.active || (isAction(card) && hasCounterKeyword(card));
  const isPlayable =
    (isEvent(card) || card.cost <= player.energy) &&
    hasPriority &&
    legalDuringPriority &&
    legalActionTiming &&
    !GameState.priority.resolving;

  cardButton.disabled = !isPlayable;
  cardButton.classList.toggle("is-selected", isSelected);
  cardButton.classList.toggle("is-playable", isPlayable);
  cardButton.classList.toggle("is-unplayable", !isPlayable);
  cardButton.setAttribute("aria-pressed", String(isSelected));
  cardButton.setAttribute("aria-label", `${card.name}, cost ${card.cost}, ${isPlayable ? "playable" : `needs ${card.cost - player.energy} more Energy`}`);
  cardButton.title = isPlayable ? `${card.name} can be played for ${card.cost} Energy` : `${card.name} requires ${card.cost} Energy; you have ${player.energy}`;
  if (card.cardImage) {
    cardButton.classList.add("hand-card--art");
    cardButton.style.backgroundImage=`linear-gradient(to top, rgba(0,0,0,.76), rgba(0,0,0,.03) 64%), url("${card.cardImage}")`;
    cardButton.style.backgroundPosition="center";
    cardButton.style.backgroundRepeat="no-repeat";
    cardButton.style.backgroundSize="cover";
  }
  const cost=document.createElement("span"); cost.className="hand-card__cost"; cost.textContent=String(card.cost);
  const name=document.createElement("strong"); name.className="hand-card__name"; name.textContent=card.name;
  const stats=document.createElement("span"); stats.className="hand-card__stats";
  if(isAction(card)){cardButton.classList.add("hand-card--action"); stats.textContent=hasCounterKeyword(card)?"ACTION · COUNTER":"ACTION · SORCERY";}
  else if(isEvent(card)){cardButton.classList.add("hand-card--event"); stats.textContent="EVENT · FREE";}
  else if(isItem(card)){stats.textContent="ITEM";}
  else{stats.textContent=`ATK ${card.attack} · HP ${card.hp} · RNG ${card.range} · SPD ${card.speed}`;}
  cardButton.append(cost,stats,name);
  cardButton.addEventListener("click",()=>selectCard(card.id));
  cardButton.addEventListener("mouseenter",()=>renderHandCardPreview(card));
  cardButton.addEventListener("mouseleave",()=>{const s=getSelectedCard(); s?renderHandCardPreview(s):renderCardPreview();});
  return cardButton;
}



/* v18.8 Action timing ----------------------------------------------------- */

const COUNTER_ACTION_IDS = new Set([
  "BOA-141",
  "BOA-155",
  "BOA-156",
  "BOA-157",
]);

function hasCounterKeyword(card) {
  if (!card) return false;

  const words = [
    ...(Array.isArray(card.keywords) ? card.keywords : []),
    ...(Array.isArray(card.characteristics) ? card.characteristics : []),
  ].map((value) => String(value).trim().toLowerCase());

  return words.includes("counter") ||
    COUNTER_ACTION_IDS.has(card.databaseId ?? card.gameplayId ?? card.id);
}

function getTopStackEntry() {
  return GameState.actionStack.at(-1) ?? null;
}

function stackEntryTargetsUnit(entry, unitId) {
  if (!entry || !unitId) return false;
  const payload = entry.payload ?? {};
  return entry.targetId === unitId ||
    payload.targetId === unitId ||
    payload.defenderId === unitId ||
    (Array.isArray(payload.targetIds) && payload.targetIds.includes(unitId));
}

function counterTimingConditionMatches(card, playerId, context = {}) {
  if (!GameState.priority.active || GameState.priority.playerId !== playerId) {
    return false;
  }

  const id = card.databaseId ?? card.gameplayId ?? card.id;
  const top = getTopStackEntry();
  const opponentId = playerId === 1 ? 2 : 1;

  switch (id) {
    case "BOA-141":
      return GameState.priority.reason === PRIORITY.ATTACK || top?.type === "attack";

    case "BOA-155": {
      const user = context.user ?? null;
      if (user) {
        return user.owner === playerId &&
          (top?.controller ?? top?.owner) === opponentId &&
          stackEntryTargetsUnit(top, user.id);
      }

      return GameState.units.some((unit) =>
        unit.owner === playerId &&
        (top?.controller ?? top?.owner) === opponentId &&
        stackEntryTargetsUnit(top, unit.id)
      );
    }

    case "BOA-156":
      return top?.type === "action";

    case "BOA-157":
      return GameState.priority.reason === PRIORITY.RECRUIT ||
        top?.type === "recruit" ||
        top?.payload?.eventType === "permanentEntered" ||
        top?.payload?.eventType === "cardPlayed";

    default:
      return true;
  }
}

function canPlayActionAtCurrentSpeed(card, playerId, context = {}) {
  if (!card || !isAction(card) || !GameState.players[playerId]) return false;

  if (hasCounterKeyword(card)) {
    return counterTimingConditionMatches(card, playerId, context);
  }

  return playerId === GameState.activePlayer &&
    GameState.turnFlow?.step === "main" &&
    !GameState.turnFlow?.transitioning &&
    !GameState.priority.active &&
    !GameState.priority.resolving &&
    GameState.actionStack.length === 0;
}

/* Action-card playability inspection */

function getActionPlayabilityContext(card, playerId, extra = {}) {
  const player = GameState.players[playerId] ?? null;

  return {
    game: GameState,
    card,
    playerId,
    owner: playerId,
    player,
    opponent: GameState.players[playerId === 1 ? 2 : 1] ?? null,
    priorityReason: GameState.priority.reason,
    pendingEvent: GameState.pendingEvent,
    ...extra,
  };
}

function getPlayableActionOption(card, playerId) {
  const player = GameState.players[playerId];

  if (
    !player ||
    !card ||
    !isAction(card) ||
    player.energy < card.cost ||
    !getAbility(card)
  ) {
    return null;
  }

  const baseContext = getActionPlayabilityContext(card, playerId);

  if (!canPlayActionAtCurrentSpeed(card, playerId, baseContext)) {
    return null;
  }

  if (!canPlayAbility(card, baseContext)) {
    return null;
  }

  const ability = getAbility(card);
  const requiresUser = ability?.requiresUser !== false;
  const targetMode = getAbilityTargetMode(card);
  const users = requiresUser
    ? GameState.units.filter((unit) =>
        isEligibleAbilityUser(
          card,
          unit,
          getActionPlayabilityContext(card, playerId, { user: unit })
        )
      )
    : [null];

  for (const user of users) {
    const userContext = getActionPlayabilityContext(card, playerId, { user });

    if (!canPlayAbility(card, userContext)) {
      continue;
    }

    if (targetMode === "none" || targetMode === "user") {
      return { card, user, target: targetMode === "user" ? user : null };
    }

    const target = GameState.units.find((candidate) =>
      isEligibleAbilityTarget(
        card,
        candidate,
        getActionPlayabilityContext(card, playerId, {
          user,
          target: candidate,
        })
      )
    );

    if (target) {
      return { card, user, target };
    }
  }

  return null;
}

function getPlayableActions(playerId) {
  const player = GameState.players[playerId];

  if (!player || GameState.gameOver || GameState.priority.resolving) {
    return [];
  }

  return player.hand
    .filter((card) => isAction(card))
    .map((card) => getPlayableActionOption(card, playerId))
    .filter(Boolean);
}

function playerHasPlayableAction(playerId) {
  return getPlayableActions(playerId).length > 0;
}

/* Action-card selection state */

function getSelectedActionContext(extra = {}) {
  const card = getSelectedCard();
  const playerId = getInteractionPlayerId();
  const player = GameState.players[playerId];

  return {
    game: GameState,
    card,
    playerId,
    player,
    opponent: GameState.players[playerId === 1 ? 2 : 1],
    ...extra,
  };
}

function isChoosingActionUser() {
  const { card, player } = getSelectedActionContext();

  return Boolean(
    card &&
    isAction(card) &&
    !GameState.pendingActionUserId &&
    player.energy >= card.cost &&
    getAbility(card)
  );
}

function isChoosingActionTarget() {
  const card = getSelectedCard();

  if (
    !card ||
    !isAction(card) ||
    !GameState.pendingActionUserId
  ) {
    return false;
  }

  const targetMode = getAbilityTargetMode(card);

  return (
    targetMode !== "user" &&
    targetMode !== "none"
  );
}
function isEligibleActionUser(unit) {
  const context = getSelectedActionContext({ user: unit });
  return canPlayActionAtCurrentSpeed(context.card, context.playerId, context) &&
    isEligibleAbilityUser(context.card, unit, context);
}

function getEligibleActionUsers() {
  return GameState.units.filter(isEligibleActionUser);
}

function getActionTargetMode(card) {
  return getAbilityTargetMode(card);
}

function isEligibleActionTarget(target) {
  const card = getSelectedCard();

  if (!card || !isAction(card)) {
    return false;
  }

  const user = getUnitById(
    GameState.pendingActionUserId
  );

  if (!user) {
    return false;
  }

  const targetMode = getAbilityTargetMode(card);

  if (targetMode === "user") {
    return target?.id === user.id;
  }

  if (targetMode === "none") {
    return target == null;
  }

  const context = getSelectedActionContext({
    user,
    target,
  });

  return isEligibleAbilityTarget(
    card,
    target,
    context
  );
}
function chooseActionUser(user) {
  const card = getSelectedCard();

  if (
    GameState.gameOver ||
    GameState.isAnimating ||
    GameState.priority.resolving
  ) {
    return;
  }

  if (
    GameState.priority.active &&
    GameState.priority.playerId !==
      getInteractionPlayerId()
  ) {
    addLog(
      "That player does not currently have priority."
    );
    renderGame();
    return;
  }

  if (
    !card ||
    !isAction(card) ||
    !isEligibleActionUser(user)
  ) {
    return;
  }

  GameState.pendingActionUserId = user.id;
  GameState.pendingActionTargetId = null;

  const targetMode = getAbilityTargetMode(card);

  /*
   * User-targeted Actions resolve immediately after choosing
   * the User. The affected object is available through context.user.
   */
  if (targetMode === "user") {
    commitSelectedAction(null);
    return;
  }

  /*
   * Targetless Actions also resolve immediately after choosing
   * their User.
   */
  if (targetMode === "none") {
    commitSelectedAction(null);
    return;
  }

  const ability = getAbility(card);
  const context = getSelectedActionContext({
    user,
  });

  GameState.actionSelectionMessage =
    ability.getTargetPrompt(context);

  addLog(
    `${user.name} will use ${card.name}. Choose its target.`
  );

  renderGame();
}


function createActionStackEntry({
  card,
  ability,
  owner,
  user,
  target = null,
  targetMode = "user",
}) {
  if (!card || !ability || !user || !GameState.players[owner]) {
    throw new TypeError(
      "An Action stack entry requires a card, ability, owner, and User."
    );
  }

  const requiresSeparateTarget =
    targetMode !== "user" &&
    targetMode !== "none";

  return {
    stackId: `action-${GameState.nextActionStackId}`,
    type: "action",
    card,
    abilityId: ability.id ?? getAbilityId(card),
    targetMode,
    userId: user.id,
    targetId:
      requiresSeparateTarget && target
        ? target.id
        : null,
    owner,
    status: "waiting",
    createdAt: Date.now(),
    resolutionStartedAt: null,
    resolutionFinishedAt: null,
    resolution: null,
  };
}

function commitSelectedAction(targetId = null) {
  if (
    GameState.gameOver ||
    GameState.isAnimating ||
    GameState.priority.resolving
  ) {
    return false;
  }

  const playerId = getInteractionPlayerId();

  if (
    GameState.priority.active &&
    GameState.priority.playerId !== playerId
  ) {
    addLog(
      "That player does not currently have priority."
    );
    renderGame();
    return false;
  }

  const player = GameState.players[playerId];
  const card = getSelectedCard();

  if (!player || !card || !isAction(card)) {
    return false;
  }

  const ability = getAbility(card);

  if (!ability) {
    addLog(
      `${card.name} has no registered ability and cannot be played.`
    );
    renderGame();
    return false;
  }

  const user = getUnitById(
    GameState.pendingActionUserId
  );

  if (!user) {
    addLog(
      `${card.name} needs a Character to use it.`
    );
    renderGame();
    return false;
  }

  const targetMode = getAbilityTargetMode(card);
  const target =
    targetMode === "user"
      ? user
      : targetId
        ? getUnitById(targetId)
        : null;

  const context = getSelectedActionContext({
    user,
    target,
  });

  if (!canPlayActionAtCurrentSpeed(card, playerId, context)) {
    addLog(
      hasCounterKeyword(card)
        ? `${card.name} cannot respond to the current event.`
        : `${card.name} can only be played during your Main Step while the stack is empty.`
    );
    renderGame();
    return false;
  }

  if (!isEligibleAbilityUser(card, user, context)) {
    addLog(
      `${user.name} cannot currently use ${card.name}.`
    );
    renderGame();
    return false;
  }

  if (!canPlayAbility(card, context)) {
    addLog(
      `${card.name} cannot be played right now.`
    );
    renderGame();
    return false;
  }

  const requiresSeparateTarget =
    targetMode !== "user" &&
    targetMode !== "none";

  if (
    requiresSeparateTarget &&
    (
      !target ||
      !isEligibleAbilityTarget(
        card,
        target,
        context
      )
    )
  ) {
    addLog(
      `Choose a valid target for ${card.name}.`
    );
    renderGame();
    return false;
  }

  if (!isEvent(card) && player.energy < card.cost) {
    addLog(
      `${card.name} costs ${card.cost} Energy.`
    );
    renderGame();
    return false;
  }

  /*
   * Recheck that this exact card is still in this player's
   * hand before charging Energy.
   */
  const cardIndex = player.hand.findIndex(
    (handCard) => handCard.id === card.id
  );

  if (cardIndex < 0) {
    addLog(
      `${card.name} is no longer in ${player.name}'s hand.`
    );
    renderGame();
    return false;
  }

  /*
   * All validation is complete. State mutation begins here.
   */
  player.energy -= card.cost;
  player.hand.splice(cardIndex, 1);
  card.zone = ZoneTypes.STACK;

  const stackEntry = createActionStackEntry({
    card,
    ability,
    owner: playerId,
    user,
    target,
    targetMode,
  });

  stackEntry.zone = ZoneTypes.STACK;
  stackEntry.costsPaid = {
    resource: "energy",
    amount: card.cost,
    paidAt: Date.now(),
  };

  if (typeof addStackEntry !== "function") {
    throw new Error("The Stack Manager is unavailable; the Action cannot be cast.");
  }

  const queuedStackEntry = addStackEntry(stackEntry, {
    announce: false,
    openPriority: false,
  });

  emitGameEvent(
    "cardPlayed",
    {
      card,
      playerId,
      user,
      target,
      stackEntry: queuedStackEntry,
    },
    {
      source: card,
    }
  );

  emitGameEvent(
    "actionAddedToStack",
    {
      stackEntry,
      card,
      playerId,
    },
    {
      source: card,
    }
  );

  clearPendingActionSelection();
  GameState.actionSelectionMessage = "";

  addLog(
    `${user.name} plays ${card.name}.`
  );

  if (requiresSeparateTarget) {
    addLog(
      `${card.name} targets ${target.name}.`
    );
  }

  addLog(
    `${card.name} enters the Action Stack.`
  );

  playOneShot(gameplayAudio.energy);

  /*
   * The Action's controller receives priority first, matching the normal
   * priority sequence. Smart auto-pass makes this feel like MTG Arena unless
   * that player has Full Control enabled.
   */
  beginPriorityWindow({
    // Only Counter Actions may be added during this window. The opponent of
    // the Action's controller receives the first chance to respond.
    playerId: playerId === 1 ? 2 : 1,
    reason: PRIORITY.ACTION,
    sourcePlayerId: playerId,
  });

  renderGame();
  return true;
}



/* Card selection */

function getDefaultActionSelectionMessage() {
  return GameState.priority.active
    ? `${GameState.players[GameState.priority.playerId].name} has priority. Play an Action or pass.`
    : "";
}

function clearSelectedCardInteraction({
  preserveSelection = false,
  preserveMessage = false,
} = {}) {
  if (!preserveSelection) {
    GameState.selectedCardId = null;
  }

  GameState.pendingActionUserId = null;
  GameState.pendingActionTargetId = null;

  if (!preserveMessage) {
    GameState.actionSelectionMessage =
      getDefaultActionSelectionMessage();
  }
}

function prepareForCardSelection(cardId) {
  /*
   * Selecting a hand card replaces every previous battlefield/card
   * interaction cleanly. This prevents stale movement, attack, Action,
   * Item, and Construct highlights from surviving a card switch.
   */
  GameState.selectedUnitId = null;
  GameState.selectedUnitAction = "move";
  GameState.reachableSpaces = new Map();
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;
  GameState.constructOperatorIds = new Set();
  GameState.pendingConstructOperatorId = null;

  clearSelectedCardInteraction();
  GameState.selectedCardId = cardId;
  GameState.actionSelectionMessage = "";
}

function rejectSelectedCard(message) {
  if (message) {
    addLog(message);
  }

  clearSelectedCardInteraction();
  renderGame();
}

function selectCard(cardId) {
  if (
    GameState.gameOver ||
    GameState.isAnimating ||
    GameState.priority.resolving
  ) {
    return;
  }

  const playerId = getInteractionPlayerId();

  if (
    GameState.priority.active &&
    GameState.priority.playerId !== playerId
  ) {
    addLog("That player does not currently have priority.");
    renderGame();
    return;
  }

  const player = GameState.players[playerId];
  const card = player.hand.find(
    (handCard) => handCard.id === cardId
  );

  if (!card) {
    return;
  }

  if (GameState.priority.active && !isAction(card)) {
    addLog("Only Action cards may be played while priority is open.");
    renderGame();
    return;
  }

  /*
   * Clicking the currently selected card toggles it off.
   */
  if (GameState.selectedCardId === card.id) {
    clearSelectedCardInteraction();
    renderGame();
    return;
  }

  /*
   * Clicking a different card immediately switches selection and clears
   * every stale interaction/highlight from the previous selection.
   */
  prepareForCardSelection(card.id);

  if (isEvent(card)) {
    playEventCard(card, playerId);
    return;
  }

  if (player.energy < card.cost) {
    rejectSelectedCard(
      `${card.name} requires ${card.cost} Energy, but ${player.name} has ${player.energy}.`
    );
    return;
  }

  if (isAction(card)) {
    const speedContext = getSelectedActionContext();

    if (!canPlayActionAtCurrentSpeed(card, playerId, speedContext)) {
      rejectSelectedCard(
        hasCounterKeyword(card)
          ? `${card.name} cannot respond to the current event.`
          : `${card.name} is Sorcery Speed and may only be played during your Main Step while the stack is empty.`
      );
      return;
    }

    if (!getAbility(card)) {
      rejectSelectedCard(`${card.name} has no registered ability.`);
      return;
    }

    if (!canPlayAbility(card, getSelectedActionContext())) {
      rejectSelectedCard(`${card.name} cannot be played right now.`);
      return;
    }

    if (!getEligibleActionUsers().length) {
      rejectSelectedCard(
        `${player.name} must control a Character to play ${card.name}.`
      );
      return;
    }

    const ability = getAbility(card);

    GameState.actionSelectionMessage =
      ability.getUserPrompt(getSelectedActionContext());

    addLog(
      `${card.name} selected. Choose who you wish to use the Action.`
    );

    renderGame();
    return;
  }

  if (isItem(card)) {
    const eligibleHosts = GameState.units.filter((unit) =>
      canAttachItemToHost(card, unit, { playerId })
    );

    if (!eligibleHosts.length) {
      rejectSelectedCard(`${card.name} has no eligible host.`);
      return;
    }

    addLog(
      `${card.name} selected. Choose a highlighted Character to equip it.`
    );
    renderGame();
    return;
  }

  addLog(
    `${card.name} selected. Choose a highlighted recruiting space.`
  );
  renderGame();
}


function auditCurrentActionCards() {
  const sources = [
    typeof GameState !== "undefined" ? GameState.players : null,
    typeof GameState !== "undefined" ? GameState.actionStack : null,
    typeof CardDatabase !== "undefined" ? CardDatabase : null,
    window.WUSCardDatabase?.cards ?? window.WUS_CARD_DATABASE ?? null,
  ].filter(Boolean);

  const audit = auditActionAbilityRegistrations(sources);

  if (audit.invalid.length) {
    console.warn(
      "Action cards with missing or unknown abilities:",
      audit.invalid
    );
  } else {
    console.info(
      `Action ability audit passed for ${audit.total} Action cards.`
    );
  }

  return audit;
}
