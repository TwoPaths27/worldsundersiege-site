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
  const cardButton = document.createElement("button");
  cardButton.type = "button";
  cardButton.className = "hand-card";
  cardButton.dataset.cardId = card.id;
  const isSelected = GameState.selectedCardId === card.id;
  const hasPriority =
    !GameState.priority.active ||
    GameState.priority.playerId === getInteractionPlayerId();
  const legalDuringPriority =
    !GameState.priority.active || card.type === "Action";
  const isPlayable =
    card.cost <= player.energy &&
    hasPriority &&
    legalDuringPriority &&
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
  if(card.type==="Action"){cardButton.classList.add("hand-card--action"); stats.textContent="ACTION";}
  else{stats.textContent=`ATK ${card.attack} · HP ${card.hp} · RNG ${card.range} · SPD ${card.speed}`;}
  cardButton.append(cost,stats,name);
  cardButton.addEventListener("click",()=>selectCard(card.id));
  cardButton.addEventListener("mouseenter",()=>renderHandCardPreview(card));
  cardButton.addEventListener("mouseleave",()=>{const s=getSelectedCard(); s?renderHandCardPreview(s):renderCardPreview();});
  return cardButton;
}


/* Action-card selection state */

function getSelectedActionContext(extra = {}) {
/* Card selection */

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
    return;
  }

  const player = GameState.players[playerId];

  const card = player.hand.find(
    (handCard) => handCard.id === cardId
  );

  if (!card) {
    return;
  }

  if (GameState.priority.active && card.type !== "Action") {
    addLog("Only Action cards may be played while priority is open.");
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
  } else if (!getAbility(card)) {
    addLog(`${card.name} has no registered ability.`);
    GameState.selectedCardId = null;
  } else if (!canPlayAbility(card, getSelectedActionContext())) {
    addLog(`${card.name} cannot be played right now.`);
    GameState.selectedCardId = null;
  } else if (!getEligibleActionUsers().length) {
    addLog(`${player.name} must control a Character to play ${card.name}.`);
  } else {
    GameState.pendingActionUserId = null;
    GameState.pendingActionTargetId = null;
    const ability = getAbility(card);
    GameState.actionSelectionMessage = ability.getUserPrompt(
      getSelectedActionContext()
    );

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
