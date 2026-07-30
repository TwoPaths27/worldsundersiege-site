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
    (action !== "move" && action !== "attack" && action !== "mount" && action !== "dismount")
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
    if (isConstruct(unit)) {
      const operators = getEligibleConstructOperators(unit);
      const hasAttackTarget = constructHasLegalAttackTarget(unit);

      if (!operators.length || !hasAttackTarget) return;

      GameState.selectedUnitAction = "choose-construct-operator";
      GameState.constructOperatorIds = new Set(operators.map((operator) => operator.id));
      GameState.pendingConstructOperatorId = null;
      GameState.reachableSpaces = new Map();
      GameState.attackableUnitIds = new Set();
      GameState.attackableStrongholdPlayerId = null;
      addLog(`Choose an adjacent Character to operate ${unit.name}.`);
    } else {
      const hasAttackTarget =
        findAttackableUnits(unit).size > 0 ||
        findAttackableStronghold(unit) !== null;

      if (unit.hasAttacked || !hasAttackTarget) return;

      GameState.selectedUnitAction = "attack";
      GameState.reachableSpaces = new Map();
      GameState.attackableUnitIds = findAttackableUnits(unit);
      GameState.attackableStrongholdPlayerId = findAttackableStronghold(unit);
    }
  }

  if (action === "mount") {
    if (typeof canMount !== "function") return;
    const legalMounts = GameState.units.filter((candidate) => canMount(unit, candidate));
    if (!legalMounts.length) return;
    GameState.selectedUnitAction = "mount";
    GameState.mountTargetIds = new Set(legalMounts.map((candidate) => candidate.id));
    GameState.reachableSpaces = new Map();
    GameState.attackableUnitIds = new Set();
    GameState.attackableStrongholdPlayerId = null;
    addLog(`Choose a Mount for ${unit.name}.`);
  }

  if (action === "dismount") {
    if (typeof canDismount !== "function" || !canDismount(unit)) return;
    const mount = typeof getMount === "function" ? getMount(unit) : null;
    if (!mount) return;
    const spaces = new Map();
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const x = mount.x + dx;
      const y = mount.y + dy;
      if (x < 0 || x >= BOARD_COLUMNS || y < 0 || y >= BOARD_ROWS) continue;
      if (!getUnitAt(x, y)) spaces.set(getCoordinateKey(x, y), 1);
    }
    if (!spaces.size) {
      addLog(`${unit.name} has no legal space to dismount.`);
      return;
    }
    GameState.selectedUnitAction = "dismount";
    GameState.dismountSpaces = spaces;
    GameState.reachableSpaces = new Map();
    GameState.attackableUnitIds = new Set();
    GameState.attackableStrongholdPlayerId = null;
    addLog(`Choose an adjacent space for ${unit.name} to dismount.`);
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

  const canMove = !isConstruct(unit) && unit.remainingSpeed > 0;
  const attackAvailable = isConstruct(unit)
    ? constructHasLegalAttackTarget(unit)
    : canAttack(unit) && !unit.hasAttacked && unitHasLegalAttackTarget(unit);

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
    value: typeof getEffectiveRange === "function" ? getEffectiveRange(unit) : unit.currentRange,
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
    value: typeof getRemainingEffectiveSpeed === "function" ? getRemainingEffectiveSpeed(unit) : unit.remainingSpeed,
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
    isActive: GameState.selectedUnitAction === "attack" ||
      GameState.selectedUnitAction === "choose-construct-operator",
    isDisabled: !attackAvailable,
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

  const mountRow = document.createElement("div");
  mountRow.className = "selected-unit-controls__mount-row";
  const mounted = typeof isMounted === "function" && isMounted(unit);
  const legalMounts = !mounted && typeof canMount === "function"
    ? GameState.units.filter((candidate) => canMount(unit, candidate))
    : [];
  const canDismountNow = mounted && typeof canDismount === "function" && canDismount(unit);

  // Mounting is offered directly over each legal Mount on the battlefield.
  // A mounted Character keeps the explicit DISMOUNT control here.
  if (mounted) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "selected-unit-mount-control";
    button.textContent = "DISMOUNT";
    button.disabled = !canDismountNow;
    button.classList.toggle("is-active", GameState.selectedUnitAction === "dismount");
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!button.disabled) setSelectedUnitAction("dismount");
    });
    mountRow.appendChild(button);
    controls.appendChild(mountRow);
  }

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
      distance <= (typeof getEffectiveRange === "function" ? getEffectiveRange(unit) : unit.currentRange);

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

function getBattlefieldAnimationToken(unit) {
  if (!unit || !elements?.battlefield) return null;

  const directToken = elements.battlefield.querySelector(
    `[data-unit-id="${CSS.escape(unit.id)}"]`
  );
  if (directToken) return directToken;

  // Mounted Characters are rendered as an overlay inside the Mount token.
  // Animate the complete mounted pair so attacks look identical to ordinary
  // Unit attacks and the rider does not appear detached from the Mount.
  const riderOverlay = elements.battlefield.querySelector(
    `[data-rider-id="${CSS.escape(unit.id)}"]`
  );
  return riderOverlay?.closest(".unit-token") ?? null;
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
  const occupantRider = occupant && typeof getRider === "function" ? getRider(occupant) : null;
  const selectedUnit = getSelectedUnit();
  const coordinateKey = getCoordinateKey(x, y);
  const moveDistance = GameState.reachableSpaces.get(coordinateKey);
  const selectedCard = getSelectedCard();
  const activeRecruitingSpaces = getRecruitingSpacesForPlayer(
    GameState.activePlayer
  );
  const canRecruitSelectedCard =
    !GameState.priority.active &&
    selectedCard &&
    isBattlefieldCard(selectedCard) &&
    getActivePlayer().energy >= selectedCard.cost;

  const isAttackTarget =
    occupant &&
    selectedUnit &&
    GameState.attackableUnitIds.has(occupant.id);
  const isMountTarget =
    occupant &&
    GameState.selectedUnitAction === "mount" &&
    GameState.mountTargetIds?.has(occupant.id);
  const isDirectMountCandidate =
    occupant &&
    selectedUnit &&
    selectedUnit.id !== occupant.id &&
    GameState.selectedUnitAction === "selected" &&
    !GameState.gameOver &&
    !GameState.isAnimating &&
    typeof canMount === "function" &&
    canMount(selectedUnit, occupant);
  const isDismountTarget =
    !occupant &&
    GameState.selectedUnitAction === "dismount" &&
    GameState.dismountSpaces?.has(coordinateKey);

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

  if (isMountTarget || isDirectMountCandidate) {
    cell.classList.add("cell-mount-target");
    cell.title = `${selectedUnit?.name ?? "Character"} can mount ${occupant.name}`;
  }
  if (isDismountTarget) {
    cell.classList.add("cell-dismount-target");
    cell.title = "Dismount here";
  }

  if (occupant) {
    cell.appendChild(createUnitToken(occupant));

    if (isDirectMountCandidate) {
      const mountPrompt = document.createElement("button");
      mountPrompt.type = "button";
      mountPrompt.className = "mount-hover-prompt";
      mountPrompt.textContent = "MOUNT?";
      mountPrompt.setAttribute(
        "aria-label",
        `Mount ${selectedUnit.name} on ${occupant.name}`
      );

      const confirmMount = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (GameState.gameOver || GameState.isAnimating) return;

        const rider = getSelectedUnit();
        const mount = GameState.units.find((unit) => unit.id === occupant.id);
        if (!rider || !mount || typeof canMount !== "function" || !canMount(rider, mount)) {
          renderGame();
          return;
        }

        if (mountCharacter(rider, mount)) {
          GameState.selectedUnitAction = "selected";
          GameState.mountTargetIds = new Set();
          GameState.reachableSpaces = new Map();
          GameState.attackableUnitIds = new Set();
          GameState.attackableStrongholdPlayerId = null;
          addLog(`${rider.name} mounted ${mount.name}.`);
          renderGame();
        }
      };

      mountPrompt.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      mountPrompt.addEventListener("click", confirmMount);
      mountPrompt.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") confirmMount(event);
      });
      cell.appendChild(mountPrompt);

      const showMountPrompt = () => cell.classList.add("is-mount-hovered");
      const hideMountPrompt = (event) => {
        if (event?.relatedTarget && cell.contains(event.relatedTarget)) return;
        cell.classList.remove("is-mount-hovered");
      };
      cell.addEventListener("pointerenter", showMountPrompt);
      cell.addEventListener("pointerleave", hideMountPrompt);
      cell.addEventListener("focusin", showMountPrompt);
      cell.addEventListener("focusout", hideMountPrompt);
    }

    const selectedOccupant = selectedUnit?.id === occupant.id || selectedUnit?.id === occupantRider?.id;
    if (selectedOccupant) {
      cell.classList.add("cell-selected");

      if (GameState.selectedUnitAction === "selected") {
        // A mounted Character is the acting combat Unit. The Mount supplies
        // movement, but its rider supplies ATK, RNG, abilities, and attack use.
        cell.appendChild(createSelectedUnitControls(selectedUnit));
      }
    }

    if (GameState.inspectedUnitId === occupant.id || GameState.inspectedUnitId === occupantRider?.id) {
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
    rangeDistance <= (typeof getEffectiveRange === "function" ? getEffectiveRange(selectedUnit) : selectedUnit.currentRange)
  ) {
    cell.classList.add("cell-range");
    cell.title = "Within Attack Range";
  }
}

}

  cell.addEventListener("click", (event) => {
    // A highlighted legal Mount keeps the rider selected. Only the floating
    // MOUNT? control commits the mount action.
    if (isDirectMountCandidate) {
      event.preventDefault();
      event.stopPropagation();
      cell.classList.add("is-mount-hovered");
      cell.querySelector(".mount-hover-prompt")?.focus({ preventScroll: true });
      return;
    }
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
    !isConstruct(unit) && unit.remainingSpeed > 0;

  const canAttackNow = isConstruct(unit)
    ? constructHasLegalAttackTarget(unit)
    : canAttack(unit) &&
      !unit.hasAttacked &&
      unitHasLegalAttackTarget(unit);

  return {
    canMove,
    canAttack: canAttackNow,
  };
}

function unitHasLegalAttackTarget(unit) {
  if (!unit || !canAttack(unit) || unit.hasAttacked) {
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
  token.classList.toggle("unit-token--friendly", unit.owner === GameState.activePlayer);
  token.classList.toggle("unit-token--enemy", unit.owner !== GameState.activePlayer);
  if (typeof initializeConcealState === "function") initializeConcealState(unit);
  const viewerId = GameState.activePlayer;
  const visibleToViewer = typeof isVisibleToPlayer !== "function" || isVisibleToPlayer(unit, viewerId);
  token.classList.toggle("is-concealed", Boolean(unit.isConcealed));
  token.classList.toggle("is-concealed-opponent", Boolean(unit.isConcealed && !visibleToViewer));
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
  token.classList.toggle(
    "is-construct-operator-choice",
    GameState.constructOperatorIds.has(unit.id)
  );
  token.classList.toggle(
    "is-item-host-choice",
    isItem(getSelectedCard()) && canAttachItemToHost(getSelectedCard(), unit, { playerId: getInteractionPlayerId() })
  );

  token.title = "";
  token.setAttribute("aria-disabled", String(exhausted));
  token.setAttribute(
    "aria-label",
    visibleToViewer
      ? `${unit.name}. RNG ${typeof getEffectiveRange === "function" ? getEffectiveRange(unit) : unit.currentRange}. SPD ${typeof getRemainingEffectiveSpeed === "function" ? getRemainingEffectiveSpeed(unit) : unit.remainingSpeed}. ATK ${unit.currentAttack}. HP ${unit.currentHP}.`
      : `Concealed Unit. Cost ${unit.concealedCost ?? unit.currentCost ?? 0}.`
  );

  token.style.width = "calc(100% - 8px)";
  token.style.height = "calc(100% - 8px)";
  token.style.borderRadius = "8px";
  token.style.padding = "0";
  token.style.display = "block";

  if (unit.isConcealed && !visibleToViewer) {
    token.classList.add("unit-token--concealed-back");
  } else if (unit.tileImage) {
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
  nameBanner.textContent = visibleToViewer ? unit.name : `Concealed · ${unit.concealedCost ?? unit.currentCost ?? 0}`;
  nameBanner.setAttribute("aria-hidden", "true");
  token.appendChild(nameBanner);

  const rider = typeof getRider === "function" ? getRider(unit) : null;
  if (rider) {
    token.classList.add("has-rider");

    const riderOverlay = document.createElement("button");
    riderOverlay.type = "button";
    riderOverlay.className = "mounted-rider-overlay";
    riderOverlay.dataset.riderId = rider.id;
    riderOverlay.title = `${rider.name} — mounted on ${unit.name}`;
    riderOverlay.setAttribute("aria-label", `Select ${rider.name}, mounted on ${unit.name}`);
    const riderImage = rider.tileImage || rider.cardImage || "";
    if (riderImage) riderOverlay.style.backgroundImage = `url("${riderImage}")`;

    const riderName = document.createElement("span");
    riderName.className = "mounted-rider-overlay__name";
    riderName.textContent = rider.name;
    riderOverlay.appendChild(riderName);

    riderOverlay.addEventListener("pointerdown", (event) => event.stopPropagation());
    riderOverlay.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectUnit(rider.id);
    });
    riderOverlay.addEventListener("mouseenter", (event) => {
      event.stopPropagation();
      renderCardPreview(rider);
    });
    token.appendChild(riderOverlay);

    const mountBadge = document.createElement("button");
    mountBadge.type = "button";
    mountBadge.className = "mounted-mount-badge";
    mountBadge.textContent = `Mount: ${unit.name}`;
    mountBadge.title = `Select Mount: ${unit.name}`;
    mountBadge.setAttribute("aria-label", `Select Mount ${unit.name}`);
    mountBadge.addEventListener("pointerdown", (event) => event.stopPropagation());
    mountBadge.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectUnit(unit.id);
    });
    mountBadge.addEventListener("mouseenter", (event) => {
      event.stopPropagation();
      renderCardPreview(unit);
    });
    token.appendChild(mountBadge);
  }

  token.addEventListener("mouseenter", () => {
    renderCardPreview(visibleToViewer ? unit : {
      name: "Concealed Unit", cardImage: null, printedCost: unit.concealedCost ?? unit.currentCost ?? 0,
      printedAttack: "?", printedHP: "?", printedRange: 0, printedSpeed: 1, effectText: "Identity hidden from the opponent."
    });
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

  let clickedUnit = getUnitAt(x, y);
  const selectedUnit = getSelectedUnit();
  const selectedCard = getSelectedCard();

  // A mounted Character is visually and interactively on top of its Mount.
  // Clicking a friendly mounted pair selects the rider by default so the
  // Character can attack and use abilities while the Mount provides Speed.
  if (clickedUnit && clickedUnit.owner === GameState.activePlayer && typeof getRider === "function") {
    const mountedRider = getRider(clickedUnit);
    if (mountedRider) clickedUnit = mountedRider;
  }

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

  if (isItem(selectedCard)) {
    if (clickedUnit && canAttachItemToHost(selectedCard, clickedUnit, { playerId: getInteractionPlayerId() })) {
      equipSelectedItem(clickedUnit);
    } else {
      cancelInteraction("Item cancelled.");
    }
    return;
  }

  if (isAction(selectedCard)) {
    if (!GameState.pendingActionUserId) {
      if (clickedUnit && isEligibleActionUser(clickedUnit)) {
        chooseActionUser(clickedUnit);
      } else {
        cancelInteraction("Action cancelled.");
      }
      return;
    }

    if (getActionTargetMode(selectedCard) === "unit") {
      if (clickedUnit && isEligibleActionTarget(clickedUnit)) {
        commitSelectedAction(clickedUnit.id);
      } else {
        cancelInteraction("Action cancelled.");
      }
      return;
    }
  }

  if (
    GameState.selectedUnitAction === "choose-construct-operator" &&
    clickedUnit &&
    GameState.constructOperatorIds.has(clickedUnit.id)
  ) {
    chooseConstructOperator(clickedUnit);
    return;
  }

  if (selectedCard) {
    recruitSelectedCard(x, y);
    return;
  }

  if (
    GameState.selectedUnitAction === "mount" &&
    clickedUnit &&
    GameState.mountTargetIds?.has(clickedUnit.id) &&
    selectedUnit
  ) {
    if (mountCharacter(selectedUnit, clickedUnit)) {
      GameState.mountTargetIds = new Set();
      GameState.selectedUnitAction = "selected";
      addLog(`${selectedUnit.name} mounted ${clickedUnit.name}.`);
      renderGame();
    }
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
  GameState.constructOperatorIds = new Set();
  GameState.pendingConstructOperatorId = null;
  GameState.mountTargetIds = new Set();
  GameState.dismountSpaces = new Map();

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
      attackUnit(selectedUnit, clickedUnit, getPendingConstructOperator());
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

if (
  GameState.selectedUnitAction === "dismount" &&
  GameState.dismountSpaces?.has(destinationKey) &&
  typeof dismountCharacter === "function"
) {
  const mount = typeof getMount === "function" ? getMount(selectedUnit) : null;
  if (dismountCharacter(selectedUnit, { x, y })) {
    GameState.dismountSpaces = new Map();
    GameState.selectedUnitAction = "selected";
    addLog(`${selectedUnit.name} dismounted${mount ? ` from ${mount.name}` : ""}.`);
    renderGame();
  }
  return;
}

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


function getPendingConstructOperator() {
  return GameState.pendingConstructOperatorId
    ? getUnitById(GameState.pendingConstructOperatorId)
    : null;
}

function chooseConstructOperator(operator) {
  const construct = getSelectedUnit();
  if (!canOperateConstruct(operator, construct)) {
    addLog(`${operator?.name ?? "That Unit"} cannot operate ${construct?.name ?? "that Construct"}.`);
    renderGame();
    return;
  }

  GameState.pendingConstructOperatorId = operator.id;
  GameState.constructOperatorIds = new Set();
  GameState.selectedUnitAction = "attack";
  GameState.attackableUnitIds = findConstructAttackableUnits(construct);
  GameState.attackableStrongholdPlayerId = findConstructAttackableStronghold(construct);
  addLog(`${operator.name} is operating ${construct.name}. Choose an attack target.`);
  renderGame();
}


function cancelInteraction(reason = "") {
  if (reason) {
    addLog(reason);
  }

  GameState.selectedCardId = null;
  GameState.pendingActionUserId = null;
  GameState.pendingActionTargetId = null;
  GameState.constructOperatorIds = new Set();
  GameState.pendingConstructOperatorId = null;
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;
  GameState.reachableSpaces = new Map();

  clearAttackHoverState();
  renderGame();
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
  GameState.constructOperatorIds = new Set();
  GameState.pendingConstructOperatorId = null;

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

cancelInteraction();
GameState.selectedUnitId = unit.id;
GameState.inspectedUnitId = unit.id;
GameState.selectedUnitAction = "selected";

GameState.reachableSpaces = new Map();
GameState.attackableUnitIds = new Set();
GameState.attackableStrongholdPlayerId = null;
GameState.constructOperatorIds = new Set();
GameState.pendingConstructOperatorId = null;
GameState.mountTargetIds = new Set();
GameState.dismountSpaces = new Map();

addLog(
  isConstruct(unit)
    ? `${unit.name} selected. Choose ATK, then select an adjacent Character to operate it.`
    : unit.hasAttacked
      ? `${unit.name} selected. Its attack has already been used this turn.`
      : `${unit.name} selected. Choose RNG, SPD, or ATK.`
);

  renderGame();
}



async function equipSelectedItem(host) {
  if (GameState.isAnimating) return false;
  const item = getSelectedCard();
  const playerId = getInteractionPlayerId();
  const player = GameState.players[playerId];
  if (!item || !isItem(item) || !player || !canAttachItemToHost(item, host, { playerId })) return false;
  if (player.energy < item.cost) {
    addLog(`${item.name} costs ${item.cost} Energy.`);
    renderGame();
    return false;
  }
  const cardIndex = player.hand.findIndex((card) => card.id === item.id);
  if (cardIndex < 0) return false;

  player.energy -= item.cost;
  player.hand.splice(cardIndex, 1);
  item.id = item.id || `player-${playerId}-item-${GameState.nextItemId}`;
  item.owner = playerId;
  GameState.nextItemId += 1;

  if (!attachItem(item, host, { playerId })) {
    player.energy += item.cost;
    player.hand.splice(cardIndex, 0, item);
    addLog(`${item.name} could not be attached to ${host.name}.`);
    renderGame();
    return false;
  }

  cancelInteraction();
  emitGameEvent("cardPlayed", { card: item, playerId, target: host }, { source: item });
  addLog(`🛡 ${player.name} equipped ${item.name} to ${host.name}.`);
  addLog(`🔋 −${item.cost} Energy.`);
  renderGame();
  return true;
}

async function recruitSelectedCard(x, y) {
  if (GameState.isAnimating) {
    return;
  }

  const card = getSelectedCard();

  if (!card) {
    return false;
  }

  const player = getActivePlayer();
  const destinationKey = getCoordinateKey(x, y);
  const recruitingSpaces = getRecruitingSpacesForPlayer(
    GameState.activePlayer
  );

  if (!isBattlefieldCard(card)) {
    addLog(`${card.name} cannot be deployed to the battlefield.`);
    clearSelectedCardInteraction();
    renderGame();
    return false;
  }

  if (player.energy < card.cost) {
    addLog(
      `${card.name} costs ${card.cost} Energy, but ${player.name} only has ${player.energy}.`
    );
    clearSelectedCardInteraction();
    renderGame();
    return false;
  }

  if (typeof canEnterPermanent === "function") {
    const entryLegality = canEnterPermanent(card, {
      controller: GameState.activePlayer,
      owner: GameState.activePlayer,
      battlefieldPermanents: GameState.units,
    });

    if (!entryLegality.allowed) {
      addLog(entryLegality.message);
      clearSelectedCardInteraction();
    renderGame();
      return false;
    }
  }

  if (!recruitingSpaces.has(destinationKey)) {
    addLog(
      `Choose one of ${player.name}'s highlighted recruiting spaces.`
    );
    clearSelectedCardInteraction();
    renderGame();
    return false;
  }

  if (getUnitAt(x, y)) {
    addLog("That recruiting space is occupied.");
    clearSelectedCardInteraction();
    renderGame();
    return;
  }

  let deployConcealed = false;
  if (typeof canPlayConcealed === "function" && canPlayConcealed(card)) {
    const deploymentChoice = await requestDeploymentVisibilityChoice(card);
    if (deploymentChoice === "cancel") {
      addLog(`${card.name} deployment cancelled.`);
      renderGame();
      return false;
    }
    deployConcealed = deploymentChoice === "concealed";
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

    /*
     * Recruitment animations are presentation only. A cancelled Web Animation
     * or a detached DOM node must never leave the game trapped in recruit mode.
     * Each animation is given a generous timeout, and deployment continues even
     * if the visual promise rejects or never settles.
     */
    const runRecruitAnimation = async (animationPromise, label) => {
      try {
        await Promise.race([
          Promise.resolve(animationPromise),
          wait(4000).then(() => {
            throw new Error(`${label} timed out`);
          }),
        ]);
      } catch (error) {
        console.warn(`Recruitment ${label} skipped:`, error);
      }
    };

    await runRecruitAnimation(
      animateEnergyToCard(GameState.activePlayer, sourceCard, card.cost),
      "energy animation"
    );

    playOneShot(gameplayAudio.placement);
    await runRecruitAnimation(
      animateCardToCell(sourceCard, destinationCell),
      "placement animation"
    );

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
      type: card.type,
      types: [...getCardTypes(card)],
      traits: [...getTraits(card)],
      capabilities: { ...card.capabilities },
      capabilityOverrides: { ...card.capabilityOverrides },
      cardImage: card.cardImage,
      tileImage: card.tileImage,
      effectText: card.effectText,
      gameplayId: card.gameplayId,
      databaseId: card.databaseId,
      isUnique: card.isUnique,
      keywords: Array.isArray(card.keywords) ? [...card.keywords] : [],
      characteristics: Array.isArray(card.characteristics)
        ? [...card.characteristics]
        : [],
    });

    normalizeCard(unit);
    if (typeof initializeConcealState === "function") initializeConcealState(unit);
    if (deployConcealed && typeof concealUnit === "function") {
      concealUnit(unit, "played", { costPaid: card.cost, silent: true });
    }

    GameState.nextUnitId += 1;

    card.zone = ZoneTypes.BATTLEFIELD;
    unit.zone = ZoneTypes.BATTLEFIELD;
    unit.sourceCard = card;

    if (typeof normalizeUnitBaseStats === "function") {
      normalizeUnitBaseStats(unit);
    }

    /*
     * enterPermanent() is the authoritative entry gate. It repeats the
     * uniqueness check so effects that put cards directly into play cannot
     * bypass the Character/Animal uniqueness rule.
     */
    const entered = typeof enterPermanent === "function"
      ? enterPermanent(unit, {
          controller: GameState.activePlayer,
          owner: GameState.activePlayer,
          battlefieldPermanents: GameState.units,
          cause: "recruited",
        })
      : unit;

    if (!entered) {
      player.energy += card.cost;
      if (cardIndex >= 0) {
        player.hand.splice(cardIndex, 0, card);
      }
      card.zone = ZoneTypes.HAND;
      addLog(`${card.name} could not enter the battlefield.`);
      renderGame();
      return false;
    }

    GameState.units.push(unit);

    if (typeof enterPermanent !== "function") {
      registerTriggersForSource(unit);
    }

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
    if (!unit.isConcealed) {
      emitGameEvent("unitRevealed", { unit, card, playerId: GameState.activePlayer, reason: "played-face-up" }, { source: unit });
    }
    if (typeof checkConcealedDetection === "function") {
      checkConcealedDetection({ reason: "deployment", render: false });
    }
    cancelInteraction();
    GameState.attackableUnitIds = new Set();
    GameState.lastSpawnedUnitId = unit.id;

    addLog(deployConcealed
      ? `◈ ${player.name} deployed a concealed Unit for ${card.cost} Energy.`
      : `⚔ ${player.name} deployed ${card.name}.`);
    addLog(`🔋 −${card.cost} Energy.`);
    addLog(`📍 Deployed to ${formatCoordinate(x, y)}.`);

    renderGame();
    flashRecruitingCell(x, y, GameState.activePlayer);

    window.setTimeout(() => {
      if (GameState.lastSpawnedUnitId === unit.id) {
        GameState.lastSpawnedUnitId = null;
      }
    }, 650);
    return true;
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
  const selectedUnit = getSelectedUnit();
  const unit = typeof getMovementUnit === "function" ? getMovementUnit(selectedUnit) : selectedUnit;

  if (!unit) {
    return;
  }

  const destinationKey = getCoordinateKey(destinationX, destinationY);
  const movementCost = GameState.reachableSpaces.get(destinationKey);

  if (movementCost === undefined || movementCost <= 0) {
    addLog("That space cannot be reached.");
    return false;
  }

  const destinationOccupant = getUnitAt(destinationX, destinationY);
  if (destinationOccupant && destinationOccupant.id !== unit.id && destinationOccupant.id !== unit.riderId) {
    addLog("That space is occupied.");
    return;
  }

  const previousX = unit.x;
  const previousY = unit.y;

  playRepeatedSound(gameplayAudio.move, movementCost);

  unit.x = destinationX;
  unit.y = destinationY;
  unit.movementSpent = Number(unit.movementSpent ?? 0) + movementCost;
  unit.remainingSpeed = typeof getRemainingEffectiveSpeed === "function"
    ? getRemainingEffectiveSpeed(unit)
    : Math.max(0, unit.remainingSpeed - movementCost);
  if (typeof syncMountedPairPosition === "function") syncMountedPairPosition(unit);
  emitGameEvent("unitMoved", { unit, from: { x: previousX, y: previousY }, to: { x: destinationX, y: destinationY }, movementCost }, { source: unit });
  if (typeof checkConcealedDetection === "function") checkConcealedDetection({ reason: "movement" });

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

  const movementPayload = {
    unitId: unit.id,
    playerId: unit.owner,
    from: { x: previousX, y: previousY },
    to: { x: destinationX, y: destinationY },
    movementCost,
    remainingSpeed: unit.remainingSpeed,
    movedAt: Date.now(),
  };

  emitGameEvent(
    "unitMoved",
    { ...movementPayload, unit },
    { source: unit }
  );

  emitGameEvent(
    "movementResolved",
    { ...movementPayload, unit },
    { source: unit }
  );

  renderGame();
}

function getDeclaredAttackUnit(unitId) {
  return unitId ? getUnitById(unitId) : null;
}

function isDeclaredConstructOperatorStillValid(operator, construct) {
  if (!operator || !construct || !isConstruct(construct)) return false;

  const operatorStillExists = GameState.units.some(
    (unit) => unit.id === operator.id
  );

  if (!operatorStillExists) return false;
  if (operator.owner !== construct.owner) return false;
  if (!canBeConstructOperator(operator)) return false;

  return (
    Math.abs(operator.x - construct.x) +
      Math.abs(operator.y - construct.y) ===
    1
  );
}

function isDeclaredAttackSourceStillValid(attacker, constructOperator = null) {
  if (!attacker || GameState.gameOver) return false;

  const attackerStillExists = GameState.units.some(
    (unit) => unit.id === attacker.id
  );

  if (!attackerStillExists) return false;

  if (isConstruct(attacker)) {
    return isDeclaredConstructOperatorStillValid(
      constructOperator,
      attacker
    );
  }

  return true;
}

function findAttackableStrongholdForResolution(attacker) {
  return isConstruct(attacker)
    ? findConstructAttackableStronghold(attacker)
    : findAttackableStronghold(attacker, { ignoreAttackSpent: true });
}

function commitDeclaredAttack(attacker, constructOperator = null) {
  if (isConstruct(attacker)) {
    if (!consumeConstructOperatorAttack(constructOperator, attacker)) {
      return false;
    }
  } else {
    attacker.hasAttacked = true;
  }

  return true;
}

function clearDeclaredAttackSelection() {
  GameState.selectedUnitAction = "selected";
  GameState.reachableSpaces = new Map();
  GameState.attackableUnitIds = new Set();
  GameState.attackableStrongholdPlayerId = null;
  GameState.constructOperatorIds = new Set();
  GameState.pendingConstructOperatorId = null;
  clearAttackHoverState();
}

async function declareAttack({
  attacker,
  defender = null,
  targetPlayerId = null,
  constructOperator = null,
} = {}) {
  if (
    GameState.gameOver ||
    GameState.isAnimating ||
    GameState.priority.active ||
    !attacker
  ) {
    return false;
  }

  const isStrongholdAttack = Number.isInteger(targetPlayerId);

  if (!isStrongholdAttack && !defender) {
    return false;
  }

  if (!isConstruct(attacker) && attacker.hasAttacked) {
    addLog(`${attacker.name} has already attacked this turn.`);
    renderGame();
    return false;
  }

  if (typeof canMountedUnitDeclareAttack === "function" && !canMountedUnitDeclareAttack(attacker)) {
    addLog(`${attacker.name} cannot attack while carrying a rider.`);
    renderGame();
    return false;
  }

  if (
    isConstruct(attacker) &&
    !canOperateConstruct(constructOperator, attacker)
  ) {
    addLog(`${attacker.name} requires an adjacent Character with an unused attack.`);
    renderGame();
    return false;
  }

  if (isStrongholdAttack) {
    if (findAttackableStrongholdForResolution(attacker) !== targetPlayerId) {
      addLog(`The enemy Stronghold is outside ${attacker.name}'s attack range.`);
      renderGame();
      return false;
    }
  } else {
    const legalTargets = isConstruct(attacker)
      ? findConstructAttackableUnits(attacker)
      : findAttackableUnits(attacker);

    if (!legalTargets.has(defender.id)) {
      addLog(`${defender.name} is outside ${attacker.name}'s attack range.`);
      renderGame();
      return false;
    }
  }

  const payload = {
    attackerId: attacker.id,
    defenderId: defender?.id ?? null,
    targetPlayerId: isStrongholdAttack ? targetPlayerId : null,
    constructOperatorId: constructOperator?.id ?? null,
    attackerPlayerId: attacker.owner,
    declaredAt: Date.now(),
  };

  if (!commitDeclaredAttack(attacker, constructOperator)) {
    addLog(`${attacker.name} could not commit its declared attack.`);
    renderGame();
    return false;
  }

  const attackValidation = validateDeclaredAttack(payload);
  if (!attackValidation.valid) {
    addLog(`${attacker.name}'s declared attack no longer has a legal target.`);
    renderGame();
    return false;
  }

  await resolveDeclaredAttack(payload);

  clearDeclaredAttackSelection();

  emitGameEvent(
    "attackDeclared",
    {
      ...payload,
      attacker,
      defender,
      constructOperator,
      targetType: isStrongholdAttack ? "stronghold" : "unit",
    },
    { source: attacker }
  );

  addLog(
    isStrongholdAttack
      ? `⚔ ${attacker.name} declared an attack against Player ${targetPlayerId}'s Stronghold.`
      : `⚔ ${attacker.name} declared an attack against ${defender.name}.`
  );

  renderGame();
  return true;
}

function validateDeclaredAttack(payload = {}) {
  const attacker = getDeclaredAttackUnit(payload.attackerId);
  const defender = getDeclaredAttackUnit(payload.defenderId);
  const constructOperator = getDeclaredAttackUnit(
    payload.constructOperatorId
  );

  if (!isDeclaredAttackSourceStillValid(attacker, constructOperator)) {
    return {
      valid: false,
      reason: "attacker-or-operator-invalid",
    };
  }

  if (Number.isInteger(payload.targetPlayerId)) {
    return {
      valid:
        findAttackableStrongholdForResolution(attacker) ===
        payload.targetPlayerId,
      reason: "stronghold-out-of-range",
    };
  }

  if (!defender) {
    return {
      valid: false,
      reason: "defender-left-battlefield",
    };
  }

  const legalTargets = isConstruct(attacker)
    ? findConstructAttackableUnits(attacker)
    : findAttackableUnits(attacker, { ignoreAttackSpent: true });

  return {
    valid: legalTargets.has(defender.id),
    reason: "defender-out-of-range",
  };
}

async function resolveDeclaredAttack(payload = {}) {
  const attacker = getDeclaredAttackUnit(payload.attackerId);
  const defender = getDeclaredAttackUnit(payload.defenderId);
  const constructOperator = getDeclaredAttackUnit(
    payload.constructOperatorId
  );

  if (!attacker) {
    addLog("The attacking Unit left the battlefield. The attack does not resolve.");
    renderGame();
    return {
      resolved: false,
      reason: "attacker-left-battlefield",
    };
  }

  emitGameEvent(
    "attackResolving",
    {
      ...payload,
      attacker,
      defender,
      constructOperator,
    },
    { source: attacker }
  );

  if (Number.isInteger(payload.targetPlayerId)) {
    await resolveStrongholdAttack(
      attacker,
      payload.targetPlayerId,
      constructOperator
    );
    return {
      resolved: true,
      reason: null,
    };
  }

  if (!defender) {
    addLog("The defending Unit left the battlefield. The attack does not resolve.");
    renderGame();
    return {
      resolved: false,
      reason: "defender-left-battlefield",
    };
  }

  await resolveUnitAttack(attacker, defender, constructOperator);
  return {
    resolved: true,
    reason: null,
  };
}

function attackStronghold(attacker, targetPlayerId, constructOperator = null) {
  return declareAttack({
    attacker,
    targetPlayerId,
    constructOperator,
  });
}

function attackUnit(attacker, defender, constructOperator = null) {
  return declareAttack({
    attacker,
    defender,
    constructOperator,
  });
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

  if (!isConstruct(attacker) && attacker.hasAttacked) {
    addLog(`${attacker.name} has already attacked this turn.`);
    renderGame();
    return;
  }

  const constructOperator = getPendingConstructOperator();
  if (isConstruct(attacker) && !canOperateConstruct(constructOperator, attacker)) {
    addLog(`${attacker.name} requires an adjacent Character with an unused attack.`);
    renderGame();
    return;
  }

  if (GameState.attackableStrongholdPlayerId !== targetPlayerId) {
    addLog(`The enemy Stronghold is outside ${attacker.name}'s attack range.`);
    renderGame();
    return;
  }

  attackStronghold(attacker, targetPlayerId, constructOperator);
}

async function resolveStrongholdAttack(attacker, targetPlayerId, constructOperator = null) {
  if (!isDeclaredAttackSourceStillValid(attacker, constructOperator)) {
    addLog("The declared Stronghold attack no longer has a legal source and does not resolve.");
    renderGame();
    return false;
  }

  if (findAttackableStrongholdForResolution(attacker) !== targetPlayerId) {
    addLog(`The declared attack from ${attacker.name} no longer has a legal Stronghold target.`);
    renderGame();
    return false;
  }

  const targetStronghold = targetPlayerId === 1
    ? elements.playerStronghold
    : elements.enemyStronghold;
  const attackerToken = getBattlefieldAnimationToken(attacker);

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

    addLog(
      `🏰 Player ${attacker.owner}'s ${attacker.name}${constructOperator ? `, operated by ${constructOperator.name},` : ""} struck Player ${targetPlayerId}'s Stronghold for ${attacker.currentAttack} damage.`
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
GameState.constructOperatorIds = new Set();
GameState.pendingConstructOperatorId = null;

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
  GameState.constructOperatorIds = new Set();
  GameState.pendingConstructOperatorId = null;

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


async function resolveUnitAttack(attacker, defender, constructOperator = null) {
  if (GameState.isAnimating || !attacker || !defender) {
    return false;
  }

  if (!isDeclaredAttackSourceStillValid(attacker, constructOperator)) {
    addLog("The declared attack no longer has a legal source and does not resolve.");
    renderGame();
    return false;
  }

  const legalTargets = isConstruct(attacker)
    ? findConstructAttackableUnits(attacker)
    : findAttackableUnits(attacker, { ignoreAttackSpent: true });

  if (!legalTargets.has(defender.id)) {
    addLog(`${defender.name} is no longer a legal target for ${attacker.name}.`);
    renderGame();
    return false;
  }

  const attackerToken = getBattlefieldAnimationToken(attacker);
  const defenderToken = getBattlefieldAnimationToken(defender);

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

const defenderDamageTarget = combatResult.defenderDamageTarget ?? defender;
const attackerDamageTarget = combatResult.attackerDamageTarget ?? attacker;

if (typeof animateCombatDamageTarget === "function") {
  animateCombatDamageTarget(defenderDamageTarget);
  if (canRetaliate && attackerDamageTarget) animateCombatDamageTarget(attackerDamageTarget);
}

addLog(
  `⚔ Player ${attacker.owner}'s ${attacker.name} dealt ${combatResult.attackerDamage ?? attacker.currentAttack} damage to ${defenderDamageTarget.name}.`
);

if (canRetaliate) {
  addLog(
    `↩ Player ${defender.owner}'s ${defender.name} dealt ${combatResult.defenderDamage ?? defender.currentAttack} damage to ${attackerDamageTarget.name}.`
  );
}

const { defenderDestroyed, attackerDestroyed } = combatResult;

// Resolve the chosen target of the attacker's damage.
if (defenderDestroyed) {
  playOneShot(gameplayAudio.death);
  const destroyedToken = getBattlefieldAnimationToken(defenderDamageTarget) ?? defenderToken;
  await animateUnitToDiscard(destroyedToken, defenderDamageTarget.owner);
  destroyUnit(defenderDamageTarget);
  addLog(`💀 Player ${defenderDamageTarget.owner}'s ${defenderDamageTarget.name} was destroyed.`);
} else {
  addLog(`❤ ${defenderDamageTarget.name} has ${defenderDamageTarget.currentHP} HP remaining.`);
}

// Resolve the chosen target of retaliation separately, allowing both targets to die.
if (attackerDestroyed) {
  playOneShot(gameplayAudio.death);
  const destroyedToken = getBattlefieldAnimationToken(attackerDamageTarget) ?? attackerToken;
  await animateUnitToDiscard(destroyedToken, attackerDamageTarget.owner);
  destroyUnit(attackerDamageTarget);
  addLog(`💀 Player ${attackerDamageTarget.owner}'s ${attackerDamageTarget.name} was destroyed by the counterattack.`);
} else if (canRetaliate) {
  addLog(`❤ ${attackerDamageTarget.name} has ${attackerDamageTarget.currentHP} HP remaining.`);
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
  renderConcealedRevealControl(unit);

  elements.selectedUnitPanel.replaceChildren();

  if (!unit) {
    elements.selectedUnitPanel.className = "empty-panel";
    elements.selectedUnitPanel.textContent =
      "Select one of the active player's Units.";
    return;
  }

  elements.selectedUnitPanel.className = "";
  const viewerId = GameState.activePlayer;
  const visibleToViewer = typeof isVisibleToPlayer !== "function" || isVisibleToPlayer(unit, viewerId);

  const name = document.createElement("h3");
  name.textContent = visibleToViewer ? unit.name : "Concealed Unit";

  const owner = document.createElement("p");
  owner.textContent = `Controller: Player ${unit.owner}`;

  const position = document.createElement("p");
  position.textContent =
    `Position: ${formatCoordinate(unit.x, unit.y)}`;

  const attack = document.createElement("p");
  attack.textContent = `Attack: ${visibleToViewer ? unit.currentAttack : "?"}`;

  const hp = document.createElement("p");
  hp.textContent =
    `HP: ${visibleToViewer ? `${unit.currentHP} / ${unit.printedHP}` : "?"}`;

  const range = document.createElement("p");
  range.textContent = `Range: ${visibleToViewer ? (typeof getEffectiveRange === "function" ? getEffectiveRange(unit) : unit.currentRange) : 0}`;

  const speed = document.createElement("p");
  speed.textContent =
    `Remaining Speed: ${visibleToViewer ? (typeof getRemainingEffectiveSpeed === "function" ? getRemainingEffectiveSpeed(unit) : unit.remainingSpeed) : 1} / ${visibleToViewer ? (typeof getEffectiveSpeed === "function" ? getEffectiveSpeed(unit) : unit.currentSpeed) : 1}`;

  const attackStatus = document.createElement("p");
  attackStatus.className = unit.hasAttacked ? "unit-action-used" : "unit-action-ready";
  attackStatus.textContent = unit.hasAttacked ? "Attack: Used" : "Attack: Ready";

  const cost = document.createElement("p");
  cost.textContent = `Cost: ${unit.isConcealed ? unit.concealedCost : unit.currentCost}`;

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
  const playerStrongholdCard = getPlayerStrongholdCard(1);
  const enemyStrongholdCard = getPlayerStrongholdCard(2);

  const playerImage = elements.playerStronghold.querySelector(".stronghold__card-image");
  const playerName = elements.playerStronghold.querySelector(".stronghold__card-name");
  if (playerImage) {
    playerImage.src = playerStrongholdCard.cardImage || "../cards/BOA-211Camelot.jpg";
    playerImage.alt = `${playerStrongholdCard.name} Stronghold card`;
  }
  if (playerName) playerName.textContent = playerStrongholdCard.name;
  elements.playerStronghold.setAttribute("aria-label", `${playerStrongholdCard.name} Stronghold, ${GameState.players[1].strongholdHP} HP`);

  const enemyOwner = elements.enemyStronghold.querySelector(".stronghold__owner");
  const enemyName = elements.enemyStronghold.querySelector("div > strong");
  if (enemyOwner) enemyOwner.textContent = GameState.players[2].name;
  if (enemyName) enemyName.textContent = enemyStrongholdCard.name;
  elements.enemyStronghold.setAttribute("aria-label", `${enemyStrongholdCard.name} Stronghold, ${GameState.players[2].strongholdHP} HP`);

  elements.playerStrongholdEffect.textContent = playerStrongholdCard.effectText;
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


function requestDeploymentVisibilityChoice(card) {
  const modal = document.querySelector("#deploymentChoiceModal");
  const name = document.querySelector("#deploymentChoiceCardName");
  const revealed = document.querySelector("#deployRevealedButton");
  const concealed = document.querySelector("#deployConcealedButton");
  const cancel = document.querySelector("#deployCancelButton");

  if (!modal || !revealed || !concealed || !cancel) {
    return Promise.resolve("revealed");
  }

  if (name) name.textContent = card?.name ?? "Selected Unit";
  modal.hidden = false;
  document.body.classList.add("deployment-choice-open");

  return new Promise((resolve) => {
    let done = false;
    const finish = (choice) => {
      if (done) return;
      done = true;
      modal.hidden = true;
      document.body.classList.remove("deployment-choice-open");
      revealed.removeEventListener("click", chooseRevealed);
      concealed.removeEventListener("click", chooseConcealed);
      cancel.removeEventListener("click", chooseCancel);
      document.removeEventListener("keydown", onKeyDown);
      resolve(choice);
    };
    const chooseRevealed = () => finish("revealed");
    const chooseConcealed = () => finish("concealed");
    const chooseCancel = () => finish("cancel");
    const onKeyDown = (event) => { if (event.key === "Escape") chooseCancel(); };
    revealed.addEventListener("click", chooseRevealed, { once: true });
    concealed.addEventListener("click", chooseConcealed, { once: true });
    cancel.addEventListener("click", chooseCancel, { once: true });
    document.addEventListener("keydown", onKeyDown);
    revealed.focus();
  });
}

function renderConcealedRevealControl(unit) {
  const button = document.querySelector("#concealedRevealControl");
  if (!button) return;
  const canReveal = Boolean(unit?.isConcealed && Number(unit.owner) === Number(GameState.activePlayer));
  button.hidden = !canReveal;
  button.onclick = null;
  if (!canReveal) return;
  const cell = getBattlefieldCell(unit.x, unit.y);
  const stage = document.querySelector(".battlefield-stage");
  if (!cell || !stage) { button.hidden = true; return; }
  const cellRect = cell.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  button.style.left = `${Math.max(6, cellRect.left - stageRect.left - button.offsetWidth - 10)}px`;
  button.style.top = `${cellRect.top - stageRect.top + (cellRect.height / 2)}px`;
  button.onclick = () => revealUnit(unit, "manual");
}
