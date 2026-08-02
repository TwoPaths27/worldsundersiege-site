"use strict";

/*
 * Module 9: Animation Engine
 *
 * Owns transient visual effects and interaction locking used while those
 * effects are playing. Gameplay decisions and state mutation remain in the
 * battlefield and rules modules.
 */

function setInteractionLock(isLocked) {
  document.body.classList.toggle("is-game-animating", isLocked);
  elements.endTurnButton.disabled = isLocked;
  elements.toggleHandButton.disabled = isLocked;
}

async function animateEnergyToCard(playerId, targetCard, energyCost) {
  const energyElement =
    playerId === 1
      ? elements.playerCurrentEnergy
      : elements.enemyCurrentEnergy;
  const energyFrame = energyElement.closest(".battlefield-energy");

  if (!energyFrame || !targetCard || energyCost <= 0) {
    await wait(120);
    return;
  }

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    targetCard.classList.add("energy-absorbed");
    await wait(80);
    targetCard.classList.remove("energy-absorbed");
    return;
  }

  const sourceRect = energyFrame.getBoundingClientRect();
  const targetRect = targetCard.getBoundingClientRect();
  const sourceX = sourceRect.left + sourceRect.width / 2;
  const sourceY = sourceRect.top + sourceRect.height / 2;
  const targetX = targetRect.left + targetRect.width / 2;
  const targetY = targetRect.top + targetRect.height / 2;
  const orbCount = Math.max(1, Math.min(energyCost, 8));
  const travelPromises = [];

  targetCard.classList.add("is-receiving-energy");

  for (let index = 0; index < orbCount; index += 1) {
    const orb = document.createElement("span");
    const angle = (index / Math.max(orbCount, 1)) * Math.PI * 2;
    const spreadX = Math.cos(angle) * 11;
    const spreadY = Math.sin(angle) * 8;
    const deltaX = targetX - sourceX;
    const deltaY = targetY - sourceY;
    const arcDirection = playerId === 1 ? -1 : 1;
    const arcHeight = Math.min(150, Math.max(65, Math.abs(deltaY) * 0.24));
    const delay = index * 95;

    orb.className = `energy-transfer-orb energy-transfer-orb--player-${playerId}`;
    orb.setAttribute("aria-hidden", "true");
    orb.style.left = `${sourceX - 7 + spreadX}px`;
    orb.style.top = `${sourceY - 7 + spreadY}px`;
    document.body.appendChild(orb);

    const animation = orb.animate(
      [
        {
          transform: "translate3d(0, 0, 0) scale(.45)",
          opacity: 0,
          offset: 0,
        },
        {
          transform: `translate3d(${spreadX * 0.8}px, ${spreadY * 0.8}px, 0) scale(1.15)`,
          opacity: 1,
          offset: 0.12,
        },
        {
          transform: `translate3d(${deltaX * 0.48}px, ${deltaY * 0.42 + arcDirection * arcHeight}px, 0) scale(.9)`,
          opacity: 1,
          offset: 0.56,
        },
        {
          transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(.2)`,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration: 580,
        delay,
        easing: "cubic-bezier(.18,.75,.2,1)",
        fill: "forwards",
      }
    );

    travelPromises.push(
      animation.finished
        .catch(() => wait(580 + delay))
        .finally(() => orb.remove())
    );
  }

  await Promise.all(travelPromises);

  targetCard.classList.remove("is-receiving-energy");
  targetCard.classList.add("energy-absorbed");
  await wait(230);
  targetCard.classList.remove("energy-absorbed");
}

async function animateCardToCell(sourceCard, destinationCell) {
  if (!sourceCard || !destinationCell) {
    await wait(180);
    return;
  }

  const sourceRect = sourceCard.getBoundingClientRect();
  const destinationRect = destinationCell.getBoundingClientRect();
  const flyingCard = sourceCard.cloneNode(true);

  flyingCard.classList.remove("is-selected", "is-playable", "is-unplayable");
  flyingCard.classList.add("recruit-flying-card");
  flyingCard.setAttribute("aria-hidden", "true");
  flyingCard.style.left = `${sourceRect.left}px`;
  flyingCard.style.top = `${sourceRect.top}px`;
  flyingCard.style.width = `${sourceRect.width}px`;
  flyingCard.style.height = `${sourceRect.height}px`;

  document.body.appendChild(flyingCard);
  sourceCard.classList.add("is-being-recruited");

  const destinationX =
    destinationRect.left + destinationRect.width / 2 - sourceRect.width / 2;
  const destinationY =
    destinationRect.top + destinationRect.height / 2 - sourceRect.height / 2;
  const deltaX = destinationX - sourceRect.left;
  const deltaY = destinationY - sourceRect.top;
  const destinationScale = Math.min(
    0.72,
    destinationRect.width / sourceRect.width,
    destinationRect.height / sourceRect.height
  );

  try {
    const animation = flyingCard.animate(
      [
        { transform: "translate3d(0, 0, 0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate3d(${deltaX * 0.55}px, ${deltaY * 0.35 - 45}px, 0) scale(1.08) rotate(-2deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${destinationScale}) rotate(1deg)`, opacity: 0.12 },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(.2,.8,.2,1)",
        fill: "forwards",
      }
    );

    await animation.finished;
  } catch (error) {
    await wait(520);
  } finally {
    flyingCard.remove();
    sourceCard.classList.remove("is-being-recruited");
  }
}

function flashRecruitingCell(x, y, playerId) {
  const cell = getBattlefieldCell(x, y);

  if (!cell) {
    return;
  }

  cell.classList.add(
    "recruit-flash",
    playerId === 1 ? "recruit-flash--player-one" : "recruit-flash--player-two"
  );

  window.setTimeout(() => {
    cell.classList.remove(
      "recruit-flash",
      "recruit-flash--player-one",
      "recruit-flash--player-two"
    );
  }, 650);
}

function pulseActiveEnergy(playerId) {
  const energyElement =
    playerId === 1
      ? elements.playerCurrentEnergy
      : elements.enemyCurrentEnergy;
  const energyFrame = energyElement.closest(".battlefield-energy");

  energyElement.classList.remove("energy-spent-pulse");
  energyFrame?.classList.remove(
    "energy-frame-pulse",
    "energy-frame-pulse--player-one",
    "energy-frame-pulse--player-two"
  );

  void energyElement.offsetWidth;

  energyElement.classList.add("energy-spent-pulse");
  energyFrame?.classList.add(
    "energy-frame-pulse",
    playerId === 1
      ? "energy-frame-pulse--player-one"
      : "energy-frame-pulse--player-two"
  );

  window.setTimeout(() => {
    energyElement.classList.remove("energy-spent-pulse");
    energyFrame?.classList.remove(
      "energy-frame-pulse",
      "energy-frame-pulse--player-one",
      "energy-frame-pulse--player-two"
    );
  }, 700);
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function animateStrongholdAttack(attackerToken, stronghold, attacker) {
  if (!stronghold) {
    await wait(260);
    return;
  }

  const strongholdRect = stronghold.getBoundingClientRect();
  const damageNumber = document.createElement("span");
  damageNumber.className = "floating-damage-number floating-damage-number--stronghold";
  damageNumber.textContent = `−${attacker.currentAttack}`;
  damageNumber.style.left = `${strongholdRect.left + strongholdRect.width / 2}px`;
  damageNumber.style.top = `${strongholdRect.top + strongholdRect.height / 2}px`;
  document.body.appendChild(damageNumber);

  const animations = [];

  if (attackerToken) {
    const attackerRect = attackerToken.getBoundingClientRect();
    const deltaX = (strongholdRect.left + strongholdRect.width / 2) -
      (attackerRect.left + attackerRect.width / 2);
    const deltaY = (strongholdRect.top + strongholdRect.height / 2) -
      (attackerRect.top + attackerRect.height / 2);
    const length = Math.max(1, Math.hypot(deltaX, deltaY));
    animations.push(attackerToken.animate(
      [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: `translate3d(${deltaX / length * 34}px,${deltaY / length * 34}px,0) scale(1.1)`, offset: .48 },
        { transform: "translate3d(0,0,0) scale(1)" },
      ],
      { duration: 400, easing: "cubic-bezier(.2,.8,.25,1)" }
    ).finished);
  }

  animations.push(stronghold.animate(
    [
      { transform: "translateX(0) scale(1)", filter: "brightness(1)" },
      { transform: "translateX(-7px) scale(1.025)", filter: "brightness(2.2)", offset: .35 },
      { transform: "translateX(7px) scale(.99)", filter: "brightness(1.5)", offset: .58 },
      { transform: "translateX(0) scale(1)", filter: "brightness(1)" },
    ],
    { duration: 520, easing: "ease-out" }
  ).finished);

  animations.push(damageNumber.animate(
    [
      { opacity: 0, transform: "translate(-50%, -10%) scale(.65)" },
      { opacity: 1, transform: "translate(-50%, -80%) scale(1.35)", offset: .28 },
      { opacity: 0, transform: "translate(-50%, -165%) scale(1)" },
    ],
    { duration: 720, easing: "ease-out", fill: "forwards" }
  ).finished);

  document.body.classList.add("stronghold-impact");
  try {
    await Promise.allSettled(animations);
  } finally {
    document.body.classList.remove("stronghold-impact");
    damageNumber.remove();
  }
}

function animateDestroyedStronghold(stronghold, playerId) {
  if (!stronghold) return;

  stronghold.setAttribute("aria-label", `Player ${playerId} Stronghold destroyed`);

  // Restart the CSS animation reliably for either Stronghold.
  stronghold.classList.remove("stronghold--collapsing");
  void stronghold.offsetWidth;
  stronghold.classList.add("stronghold--collapsing");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  // The Web Animations fallback guarantees the player Stronghold visibly
  // collapses even if another transform rule overrides the CSS animation.
  stronghold.animate(
    [
      { transform: "translate(0,0) rotate(0) scale(1)", filter: "brightness(1)", opacity: 1 },
      { transform: "translate(-8px,1px) rotate(-1deg) scale(1.02)", filter: "brightness(1.8)", offset: 0.07 },
      { transform: "translate(9px,-2px) rotate(1.2deg) scale(.99)", offset: 0.14 },
      { transform: "translate(-10px,3px) rotate(-1.5deg) scale(1.01)", offset: 0.22 },
      { transform: "translate(8px,1px) rotate(1deg) scale(.99)", filter: "brightness(.92)", offset: 0.31 },
      { transform: "translate(-6px,5px) rotate(-1deg) scale(.98)", offset: 0.43 },
      { transform: "translate(5px,12px) rotate(1.8deg) scale(.96,.91)", filter: "brightness(.7) saturate(.65)", opacity: 0.92, offset: 0.58 },
      { transform: "translate(-3px,34px) rotate(-3deg) scale(.92,.7)", filter: "brightness(.5) saturate(.35)", opacity: 0.72, offset: 0.74 },
      { transform: "translate(2px,92px) rotate(5deg) scale(.82,.24)", filter: "brightness(.25) grayscale(.72)", opacity: 0 },
    ],
    {
      duration: 2050,
      easing: "cubic-bezier(.32,.02,.22,1)",
      fill: "forwards",
    }
  );
}

function createStrongholdDebris(stronghold) {
  if (!stronghold || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const rect = stronghold.getBoundingClientRect();
  const debrisLayer = document.createElement("div");
  debrisLayer.className = "stronghold-debris-layer";
  debrisLayer.setAttribute("aria-hidden", "true");

  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement("span");
    const startX = rect.left + rect.width * (0.14 + Math.random() * 0.72);
    const startY = rect.top + rect.height * (0.3 + Math.random() * 0.52);
    const driftX = (Math.random() - 0.5) * 170;
    const fallY = 80 + Math.random() * 150;
    const rotation = (Math.random() - 0.5) * 520;
    const size = 4 + Math.random() * 10;

    piece.style.left = `${startX}px`;
    piece.style.top = `${startY}px`;
    piece.style.width = `${size}px`;
    piece.style.height = `${Math.max(3, size * 0.58)}px`;
    piece.style.setProperty("--debris-x", `${driftX}px`);
    piece.style.setProperty("--debris-y", `${fallY}px`);
    piece.style.setProperty("--debris-rotation", `${rotation}deg`);
    piece.style.animationDelay = `${120 + Math.random() * 460}ms`;
    debrisLayer.appendChild(piece);
  }

  document.body.appendChild(debrisLayer);
  window.setTimeout(() => debrisLayer.remove(), 2600);
}

async function animateUnitToDiscard(unitToken, ownerPlayerId) {
  const discardZone = document.querySelector(
    ownerPlayerId === 1 ? "#playerDiscardZone" : "#enemyDiscardZone"
  );

  if (!unitToken || !discardZone) {
    await wait(180);
    return;
  }

  const sourceRect = unitToken.getBoundingClientRect();
  const targetRect = discardZone.getBoundingClientRect();
  const flyingUnit = unitToken.cloneNode(true);
  flyingUnit.classList.add("unit-to-discard");
  flyingUnit.setAttribute("aria-hidden", "true");
  flyingUnit.style.left = `${sourceRect.left}px`;
  flyingUnit.style.top = `${sourceRect.top}px`;
  flyingUnit.style.width = `${sourceRect.width}px`;
  flyingUnit.style.height = `${sourceRect.height}px`;
  document.body.appendChild(flyingUnit);
  unitToken.style.visibility = "hidden";

  const deltaX = targetRect.left + targetRect.width / 2 -
    (sourceRect.left + sourceRect.width / 2);
  const deltaY = targetRect.top + targetRect.height / 2 -
    (sourceRect.top + sourceRect.height / 2);

  try {
    const animation = flyingUnit.animate(
      [
        { transform: "translate3d(0,0,0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate3d(${deltaX * .48}px,${deltaY * .38 - 38}px,0) scale(.82) rotate(-7deg)`, opacity: .92, offset: .52 },
        { transform: `translate3d(${deltaX}px,${deltaY}px,0) scale(.18) rotate(18deg)`, opacity: 0 },
      ],
      { duration: 620, easing: "cubic-bezier(.2,.78,.2,1)", fill: "forwards" }
    );
    await animation.finished;
  } catch {
    await wait(620);
  } finally {
    flyingUnit.remove();
  }
}

async function animateAttack(attackerToken, defenderToken, attacker, defender) {
  if (!attackerToken || !defenderToken) {
    await wait(260);
    return;
  }

  const attackerRect = attackerToken.getBoundingClientRect();
  const defenderRect = defenderToken.getBoundingClientRect();
  const deltaX = (defenderRect.left + defenderRect.width / 2) -
    (attackerRect.left + attackerRect.width / 2);
  const deltaY = (defenderRect.top + defenderRect.height / 2) -
    (attackerRect.top + attackerRect.height / 2);
  const length = Math.max(1, Math.hypot(deltaX, deltaY));
  const lungeDistance = Math.min(30, length * 0.32);
  const lungeX = deltaX / length * lungeDistance;
  const lungeY = deltaY / length * lungeDistance;

  const damageNumber = document.createElement("span");
  damageNumber.className = "floating-damage-number";
  damageNumber.textContent = `−${attacker.currentAttack}`;
  damageNumber.style.left = `${defenderRect.left + defenderRect.width / 2}px`;
  damageNumber.style.top = `${defenderRect.top + defenderRect.height / 2}px`;
  document.body.appendChild(damageNumber);

  const animations = [
    attackerToken.animate(
      [
        { transform: "translate3d(0,0,0) scale(1)" },
        { transform: `translate3d(${lungeX}px,${lungeY}px,0) scale(1.08)`, offset: 0.46 },
        { transform: "translate3d(0,0,0) scale(1)" },
      ],
      { duration: 360, easing: "cubic-bezier(.2,.8,.25,1)" }
    ).finished,
    defenderToken.animate(
      [
        { transform: "translateX(0)", filter: "brightness(1)" },
        { transform: "translateX(-5px)", filter: "brightness(2.3) saturate(1.6)", offset: 0.45 },
        { transform: "translateX(5px)", filter: "brightness(1.6)", offset: 0.65 },
        { transform: "translateX(0)", filter: "brightness(1)" },
      ],
      { duration: 430, easing: "ease-out" }
    ).finished,
    damageNumber.animate(
      [
        { opacity: 0, transform: "translate(-50%, -20%) scale(.65)" },
        { opacity: 1, transform: "translate(-50%, -70%) scale(1.25)", offset: 0.25 },
        { opacity: 0, transform: "translate(-50%, -145%) scale(1)" },
      ],
      { duration: 620, easing: "ease-out", fill: "forwards" }
    ).finished,
  ];

  try {
    await Promise.allSettled(animations);
  } finally {
    damageNumber.remove();
  }
}

/* =============================================================
 * V19.7 — Conceal, Mount, Construct, and Damage visual polish
 * =========================================================== */


async function animateActionCardToDiscard(entry) {
  const ownerPlayerId = Number(entry?.owner);
  const discardZone = document.querySelector(
    ownerPlayerId === 1 ? "#playerDiscardZone" : "#enemyDiscardZone"
  );
  const stackId = entry?.stackId;
  const sourceCard = stackId
    ? document.querySelector(`[data-action-stack-id="${CSS.escape(String(stackId))}"]`)
    : null;

  if (!sourceCard || !discardZone) {
    await wait(220);
    return;
  }

  const sourceRect = sourceCard.getBoundingClientRect();
  const targetRect = discardZone.getBoundingClientRect();
  const flyingCard = sourceCard.cloneNode(true);

  flyingCard.classList.add("action-to-discard-card");
  flyingCard.removeAttribute("id");
  flyingCard.setAttribute("aria-hidden", "true");
  flyingCard.style.position = "fixed";
  flyingCard.style.left = `${sourceRect.left}px`;
  flyingCard.style.top = `${sourceRect.top}px`;
  flyingCard.style.width = `${sourceRect.width}px`;
  flyingCard.style.height = `${sourceRect.height}px`;
  flyingCard.style.margin = "0";
  flyingCard.style.pointerEvents = "none";
  flyingCard.style.zIndex = "12050";
  document.body.appendChild(flyingCard);

  const destinationX =
    targetRect.left + targetRect.width / 2 - sourceRect.width / 2;
  const destinationY =
    targetRect.top + targetRect.height / 2 - sourceRect.height / 2;
  const deltaX = destinationX - sourceRect.left;
  const deltaY = destinationY - sourceRect.top;
  const destinationScale = Math.max(0.28, Math.min(0.55,
    targetRect.width / Math.max(sourceRect.width, 1),
    targetRect.height / Math.max(sourceRect.height, 1)
  ));

  sourceCard.style.visibility = "hidden";

  try {
    const animation = flyingCard.animate(
      [
        { transform: "translate3d(0,0,0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate3d(${deltaX * 0.45}px, ${deltaY * 0.35 - 36}px, 0) scale(.94) rotate(-3deg)`, opacity: 1, offset: .55 },
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${destinationScale}) rotate(2deg)`, opacity: .15 },
      ],
      { duration: 620, easing: "cubic-bezier(.2,.75,.2,1)", fill: "forwards" }
    );
    await animation.finished;
  } catch (error) {
    await wait(620);
  } finally {
    flyingCard.remove();
    sourceCard.style.visibility = "";
  }

  discardZone.classList.add("discard-receive-flash");
  await wait(180);
  discardZone.classList.remove("discard-receive-flash");
}

window.animateActionCardToDiscard = animateActionCardToDiscard;

function getUnitAnimationElement(unit) {
  const id = unit?.id ?? unit?.instanceId;
  if (!id || !elements?.battlefield) return null;
  return elements.battlefield.querySelector(
    `[data-unit-id="${CSS.escape(String(id))}"]`
  );
}

function runTransientClass(element, className, duration = 600) {
  if (!element) return false;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
  return true;
}

function animateUnitReveal(unit) {
  const play = () => runTransientClass(getUnitAnimationElement(unit), "unit-reveal-burst", 720);
  window.requestAnimationFrame(() => window.requestAnimationFrame(play));
}

function animateUnitConceal(unit) {
  runTransientClass(getUnitAnimationElement(unit), "unit-conceal-fold", 520);
}


function prepareMountEquipAnimation(character, mount) {
  const riderElement = getUnitAnimationElement(character);
  const mountElement = getUnitAnimationElement(mount);
  if (!riderElement || !mountElement) return null;
  const riderRect = riderElement.getBoundingClientRect();
  const mountRect = mountElement.getBoundingClientRect();
  const clone = riderElement.cloneNode(true);
  clone.classList.add("mount-equip-flying-unit");
  clone.setAttribute("aria-hidden", "true");
  Object.assign(clone.style, {
    left: `${riderRect.left}px`, top: `${riderRect.top}px`,
    width: `${riderRect.width}px`, height: `${riderRect.height}px`,
  });
  document.body.appendChild(clone);
  riderElement.style.visibility = "hidden";
  return () => {
    const targetElement = getUnitAnimationElement(mount) ?? mountElement;
    const targetRect = targetElement.getBoundingClientRect();
    const dx = targetRect.left + targetRect.width * .18 - riderRect.left;
    const dy = targetRect.top + targetRect.height * .08 - riderRect.top;
    const animation = clone.animate([
      { transform: "translate3d(0,0,0) scale(1)", opacity: 1, filter: "drop-shadow(0 8px 12px rgba(0,0,0,.65))" },
      { transform: `translate3d(${dx * .55}px,${dy - 34}px,0) scale(.92) rotate(-4deg)`, opacity: 1, offset: .55 },
      { transform: `translate3d(${dx}px,${dy}px,0) scale(.56) rotate(0deg)`, opacity: .15, filter: "drop-shadow(0 0 18px rgba(88,180,255,.95))" },
    ], { duration: 720, easing: "cubic-bezier(.18,.8,.2,1)", fill: "forwards" });
    animation.finished.catch(() => {}).finally(() => {
      clone.remove();
      riderElement.style.visibility = "";
      runTransientClass(targetElement, "unit-mount-arrive", 720);
    });
  };
}
function animateUnitMounted(character, mount) {
  const riderElement = getUnitAnimationElement(character);
  const mountElement = getUnitAnimationElement(mount);
  runTransientClass(riderElement, "unit-mount-depart", 420);
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      runTransientClass(getUnitAnimationElement(mount) ?? mountElement, "unit-mount-arrive", 620);
    });
  }, 120);
}

function animateUnitDismounted(character, mount) {
  runTransientClass(getUnitAnimationElement(mount), "unit-dismount-release", 480);
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      runTransientClass(getUnitAnimationElement(character), "unit-dismount-arrive", 620);
    });
  });
}

function animateConstructRangeChange(construct, active) {
  runTransientClass(
    getUnitAnimationElement(construct),
    active ? "construct-range-awaken" : "construct-range-sleep",
    active ? 760 : 620
  );
}

function animateCombatDamageTarget(unit) {
  runTransientClass(getUnitAnimationElement(unit), "combat-damage-chosen", 620);
}


async function animateItemEquip(sourceCard, host) {
  const hostElement = getUnitAnimationElement(host);
  if (!sourceCard || !hostElement) {
    await wait(180);
    return;
  }
  const sourceRect = sourceCard.getBoundingClientRect();
  const hostRect = hostElement.getBoundingClientRect();
  const flying = sourceCard.cloneNode(true);
  flying.classList.remove("is-selected", "is-playable", "is-unplayable");
  flying.classList.add("item-equip-flying-card");
  flying.setAttribute("aria-hidden", "true");
  Object.assign(flying.style, {
    left: `${sourceRect.left}px`, top: `${sourceRect.top}px`,
    width: `${sourceRect.width}px`, height: `${sourceRect.height}px`,
  });
  document.body.appendChild(flying);
  sourceCard.style.visibility = "hidden";
  const tx = hostRect.left + hostRect.width / 2 - sourceRect.left - sourceRect.width / 2;
  const ty = hostRect.top + hostRect.height / 2 - sourceRect.top - sourceRect.height / 2;
  try {
    const flight = flying.animate([
      { transform: "translate3d(0,0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate3d(${tx * .72}px,${ty * .58 - 36}px,0) scale(.82) rotate(-5deg)`, opacity: 1, offset: .62 },
      { transform: `translate3d(${tx}px,${ty}px,0) scale(.28) rotate(8deg)`, opacity: .2 },
    ], { duration: 620, easing: "cubic-bezier(.18,.82,.18,1)", fill: "forwards" });
    await flight.finished;
  } catch (_) { await wait(620); }
  hostElement.classList.remove("is-item-equipping");
  void hostElement.offsetWidth;
  hostElement.classList.add("is-item-equipping");
  await wait(360);
  hostElement.classList.remove("is-item-equipping");
  flying.remove();
  sourceCard.style.visibility = "";
}
window.animateItemEquip = animateItemEquip;

window.getUnitAnimationElement = getUnitAnimationElement;
window.animateUnitReveal = animateUnitReveal;
window.animateUnitConceal = animateUnitConceal;
window.prepareMountEquipAnimation = prepareMountEquipAnimation;
window.animateUnitMounted = animateUnitMounted;
window.animateUnitDismounted = animateUnitDismounted;
window.animateConstructRangeChange = animateConstructRangeChange;
window.animateCombatDamageTarget = animateCombatDamageTarget;
