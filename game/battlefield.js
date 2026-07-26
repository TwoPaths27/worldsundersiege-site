"use strict";

/*
 * Worlds Under Siege — Battlefield subsystem
 *
 * Owns battlefield rendering and interaction, unit selection, movement,
 * recruiting placement, combat targeting/resolution, battlefield animation,
 * selected-unit UI, card preview, and stronghold rendering.
 */

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
    (selectedCard.type === "Unit" ||
      selectedCard.type === "Character") &&
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

    if (GameState.inspectedUnitId === occupant.id) {
      cell.classList.add("cell-inspected");
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
  token.classList.toggle(
    "is-inspected-unit",
    GameState.inspectedUnitId === unit.id
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
    isChoosingActionTarget() && isEligibleActionTarget(unit)
  );
  token.classList.toggle(
    "is-trigger-target-choice",
    typeof isChoosingTriggeredTarget === "function" &&
      isChoosingTriggeredTarget() &&
      isEligibleTriggeredTarget(unit)
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

  if (
    typeof isChoosingTriggeredTarget === "function" &&
    isChoosingTriggeredTarget()
  ) {
    if (clickedUnit) {
      chooseTriggeredTarget(clickedUnit);
    } else {
      addLog("Choose a highlighted Unit as the triggered ability target.");
      renderGame();
    }
    return;
  }

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
      if (clickedUnit && isEligibleActionTarget(clickedUnit)) {
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

    toggleInspection(clickedUnit);
    renderGame();
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
clearInspection();
clearSelection();
}

function clearSelection() {
  if (GameState.gameOver || GameState.isAnimating) {
    return;
  }

  GameState.selectedUnitId = null;
  GameState.selectedCardId = null;
  GameState.selectedUnitAction = "move";
  GameState.pendingActionUserId = null;
  GameState.pendingActionTargetId = null;
  GameState.actionSelectionMessage = GameState.priority.active
    ? `${GameState.players[GameState.priority.playerId].name} has priority. Play an Action or pass.`
    : "";
  GameState.reachableSpaces = new Map();
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;

  clearAttackHoverState();
  renderGame();
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
GameState.inspectedUnitId = unit.id;
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
    registerTriggersForSource(unit);

    emitGameEvent(
      "unitEnteredPlay",
      {
        unit,
        card,
        playerId: GameState.activePlayer,
        x,
        y,
      },
      { source: unit }
    );

    emitGameEvent(
      "unitSummoned",
      {
        unit,
        card,
        playerId: GameState.activePlayer,
        x,
        y,
      },
      { source: unit }
    );
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


function getRecruitingSpacesForPlayer(playerId) {
  return playerId === 1
    ? PLAYER_RECRUITING_SPACES
    : ENEMY_RECRUITING_SPACES;
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
  emitGameEvent("unitMoved", { unit, from: { x: previousX, y: previousY }, to: { x: destinationX, y: destinationY }, movementCost }, { source: unit });

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

    const strongholdResult = applyStrongholdDamage(
      targetPlayerId,
      attacker.currentAttack
    );
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

    if (strongholdResult.destroyed) {
      await endGame(attacker.owner, targetPlayerId);
    }
  } finally {
    GameState.isAnimating = false;
    setInteractionLock(GameState.gameOver);
  }
}


async function endGame(winnerPlayerId, losingPlayerId) {
  GameState.gameOver = true;
  GameState.winnerPlayerId = winnerPlayerId;
  GameState.selectedUnitId = null;
  GameState.inspectedUnitId = null;
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

    const canRetaliate = canUnitRetaliate(attacker, defender);

// Show the defender's retaliation before resolving deaths.
// The defender can retaliate even when the incoming attack is lethal.
if (canRetaliate) {
  playOneShot(gameplayAudio.attack);
  await animateAttack(defenderToken, attackerToken, defender, attacker);
}

// Apply all combat damage before checking whether either unit died.
const combatResult = applyUnitCombatDamage(
  attacker,
  defender,
  canRetaliate
);

addLog(
  `⚔ Player ${attacker.owner}'s ${attacker.name} attacked ${defender.name} for ${attacker.currentAttack} damage.`
);

if (canRetaliate) {
  addLog(
    `↩ Player ${defender.owner}'s ${defender.name} retaliated against ${attacker.name} for ${defender.currentAttack} damage.`
  );
}

const { defenderDestroyed, attackerDestroyed } = combatResult;

// Resolve the defender's result after all combat damage has been applied.
if (defenderDestroyed) {
  playOneShot(gameplayAudio.death);
  await animateUnitToDiscard(defenderToken, defender.owner);

  destroyUnit(defender);

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

  destroyUnit(attacker);

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

// Keep a surviving defender visible in the inspection UI after combat.
GameState.inspectedUnitId = defenderDestroyed ? null : defender.id;

renderGame();
  } finally {
    GameState.isAnimating = false;
    setInteractionLock(false);
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

function renderSelectedUnitPanel() {
  const unit = getSelectedUnit() ?? getInspectedUnit();

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
  const previewUnit = unit ?? getSelectedUnit() ?? getInspectedUnit();

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


// Battlefield inspection helpers
function getInspectedUnit() {
  if (!GameState.inspectedUnitId) {
    return null;
  }

  const unit = getUnitById(GameState.inspectedUnitId);

  if (!unit) {
    GameState.inspectedUnitId = null;
    return null;
  }

  return unit;
}

function inspectUnit(unit) {
  GameState.inspectedUnitId = unit?.id ?? null;
}

function clearInspection() {
  GameState.inspectedUnitId = null;
}

function toggleInspection(unit) {
  if (!unit || GameState.inspectedUnitId === unit.id) {
    clearInspection();
    return;
  }

  inspectUnit(unit);
}
