"use strict";

/*
 * Worlds Under Siege — BOA-004 through BOA-010
 * Individual Knight card implementations.
 */
(function knightCardEffects(global) {
  const IDS = Object.freeze({
    YVAIN: "BOA-004",
    GALAHAD: "BOA-005",
    KAY: "BOA-006",
    LUCAN: "BOA-007",
    GAWAIN: "BOA-008",
    BEDIVERE: "BOA-009",
    SAGREMORE: "BOA-010",
  });


  function getGameState() {
    if (global && global.GameState) return global.GameState;
    if (typeof GameState !== "undefined") return GameState;
    return null;
  }

  function identitiesOf(value) {
    return [
      value?.databaseId,
      value?.gameplayId,
      value?.variantOf,
      value?.sharedCardId,
      value?.sourceCard?.databaseId,
      value?.sourceCard?.gameplayId,
    ].filter(Boolean).map((entry) => String(entry).toUpperCase());
  }

  function matches(value, id, names = []) {
    if (!value) return false;
    const normalizedName = String(value.name ?? "").trim().toLowerCase();
    return identitiesOf(value).includes(id) || names.some((name) => normalizedName === name.toLowerCase());
  }

  const isSirYvain = (value) => matches(value, IDS.YVAIN, ["Sir Yvain"]);
  const isSirGalahad = (value) => matches(value, IDS.GALAHAD, ["Sir Galahad", "Galahad"]);
  const isSirKay = (value) => matches(value, IDS.KAY, ["Sir Kay"]);
  const isSirLucan = (value) => matches(value, IDS.LUCAN, ["Sir Lucan"]);
  const isSirGawain = (value) => matches(value, IDS.GAWAIN, ["Sir Gawain"]);
  const isSirBedivere = (value) => matches(value, IDS.BEDIVERE, ["Sir Bedivere"]);
  const isSirSagremore = (value) => matches(value, IDS.SAGREMORE, ["Sir Sagremore"]);

  function controllerOf(value) {
    return Number(value?.controller ?? value?.owner) || null;
  }

  function isFaceUpInPlay(value) {
    return Boolean(value && !value.isConcealed && (!value.zone || String(value.zone).toLowerCase() === "battlefield"));
  }

  function isBattlefieldUnitOrConstruct(value) {
    return Boolean(value && (
      (typeof global.isUnit === "function" && global.isUnit(value)) ||
      (typeof global.isConstruct === "function" && global.isConstruct(value))
    ));
  }

  function distanceBetween(first, second) {
    return Math.abs(Number(first?.x) - Number(second?.x)) + Math.abs(Number(first?.y) - Number(second?.y));
  }

  function getAdjacentOpenSpaces(unit) {
    if (!unit) return [];
    const candidates = [
      { x: Number(unit.x) + 1, y: Number(unit.y) },
      { x: Number(unit.x) - 1, y: Number(unit.y) },
      { x: Number(unit.x), y: Number(unit.y) + 1 },
      { x: Number(unit.x), y: Number(unit.y) - 1 },
    ];
    return candidates.filter(({ x, y }) => {
      const columns = typeof BOARD_COLUMNS === "number" ? BOARD_COLUMNS : 7;
      const rows = typeof BOARD_ROWS === "number" ? BOARD_ROWS : 6;
      if (x < 0 || x >= columns || y < 0 || y >= rows) return false;
      if (typeof global.getUnitAt === "function" && global.getUnitAt(x, y)) return false;
      return x >= 0 && y >= 0;
    });
  }

  function createKnightModalBase({ title, message = "", wide = false } = {}) {
    const modal = document.createElement("div");
    modal.className = "knight-effect-modal";
    modal.innerHTML = `
      <div class="knight-effect-modal__backdrop"></div>
      <section class="knight-effect-modal__dialog${wide ? " knight-effect-modal__dialog--wide" : ""}" role="dialog" aria-modal="true">
        <p class="knight-effect-modal__eyebrow">Card Effect</p>
        <h2></h2>
        <p class="knight-effect-modal__message"></p>
        <div class="knight-effect-modal__body"></div>
        <div class="knight-effect-modal__actions"></div>
      </section>`;
    modal.querySelector("h2").textContent = title;
    modal.querySelector(".knight-effect-modal__message").textContent = message;
    document.body.appendChild(modal);
    document.body.classList.add("modal-open");
    return modal;
  }

  function closeKnightModal(modal) {
    modal?.remove();
    if (!document.querySelector(".knight-effect-modal")) document.body.classList.remove("modal-open");
  }

  function createKnightButton(label, kind = "confirm") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `knight-effect-modal__button knight-effect-modal__button--${kind}`;
    button.textContent = label;
    return button;
  }

  function showKnightChoiceModal(title, message, { yesLabel = "Yes", noLabel = "No" } = {}) {
    return new Promise((resolve) => {
      const modal = createKnightModalBase({ title, message });
      const actions = modal.querySelector(".knight-effect-modal__actions");
      const no = createKnightButton(noLabel, "cancel");
      const yes = createKnightButton(yesLabel, "confirm");
      const finish = (value) => { closeKnightModal(modal); resolve(value); };
      no.addEventListener("click", () => finish(false));
      yes.addEventListener("click", () => finish(true));
      actions.append(no, yes);
      yes.focus();
    });
  }

  function showKnightMessageModal(title, message) {
    return new Promise((resolve) => {
      const modal = createKnightModalBase({ title, message });
      const ok = createKnightButton("OK", "confirm");
      ok.addEventListener("click", () => { closeKnightModal(modal); resolve(true); });
      modal.querySelector(".knight-effect-modal__actions").appendChild(ok);
      ok.focus();
    });
  }

  function animateDeckSearch(playerId) {
    const element = document.querySelector(Number(playerId) === 1 ? "#playerDeckZone" : "#enemyDeckZone");
    if (!element) return;
    element.classList.remove("is-search-shuffling");
    void element.offsetWidth;
    element.classList.add("is-search-shuffling");
    window.setTimeout(() => element.classList.remove("is-search-shuffling"), 1100);
  }

  function chooseLionFromDeck(player, unit) {
    return new Promise((resolve) => {
      const cards = [...(player.deck ?? [])].sort((a, b) => String(a?.name ?? "").localeCompare(String(b?.name ?? "")));
      const modal = createKnightModalBase({
        title: "Search Your Deck",
        message: `Choose an Animal named Lion for ${unit.name}.`,
        wide: true,
      });
      const body = modal.querySelector(".knight-effect-modal__body");
      body.classList.add("knight-deck-search");
      const list = document.createElement("div");
      list.className = "knight-deck-search__cards";
      let selected = null;

      cards.forEach((card) => {
        const isLion = String(card?.name ?? "").trim().toLowerCase() === "lion" &&
          (typeof global.isAnimal !== "function" || global.isAnimal(card));
        const button = document.createElement("button");
        button.type = "button";
        button.className = "knight-deck-search__card";
        button.disabled = !isLion;
        button.dataset.cardId = card.id ?? card.databaseId ?? "";
        if (card.cardImage) {
          const image = document.createElement("img");
          image.src = card.cardImage;
          image.alt = card.name;
          button.appendChild(image);
        }
        const name = document.createElement("span");
        name.textContent = card.name;
        button.appendChild(name);
        button.addEventListener("mouseenter", () => global.renderCardPreview?.(card));
        button.addEventListener("focus", () => global.renderCardPreview?.(card));
        button.addEventListener("click", () => {
          selected = card;
          list.querySelectorAll(".is-selected").forEach((node) => node.classList.remove("is-selected"));
          button.classList.add("is-selected");
          confirm.disabled = false;
        });
        list.appendChild(button);
      });

      body.appendChild(list);
      const actions = modal.querySelector(".knight-effect-modal__actions");
      const cancel = createKnightButton("Cancel", "cancel");
      const confirm = createKnightButton("Select Lion", "confirm");
      confirm.disabled = true;
      cancel.addEventListener("click", () => { closeKnightModal(modal); resolve(null); });
      confirm.addEventListener("click", async () => {
        if (!selected) return;
        const sure = await showKnightChoiceModal("Confirm Lion", `Put ${selected.name} into play adjacent to ${unit.name}, then Mount ${unit.name} to it?`, { yesLabel: "Yes", noLabel: "No" });
        if (!sure) return;
        closeKnightModal(modal);
        resolve(selected);
      });
      actions.append(cancel, confirm);
    });
  }

  function chooseOneByPrompt(cards, title) {
    if (!cards.length) return null;
    if (cards.length === 1) return cards[0];
    const lines = cards.map((card, index) => `${index + 1}. ${card.name}`).join("\n");
    const response = global.prompt?.(`${title}\n\n${lines}\n\nEnter a number, or Cancel.`);
    if (response == null || response === "") return null;
    const selected = Number(response) - 1;
    return Number.isInteger(selected) && cards[selected] ? cards[selected] : null;
  }

  function createEffectUnitFromCard(card, playerId, x, y, idPrefix) {
    const unit = global.createUnit({
      id: `${idPrefix}-${getGameState().nextUnitId}`,
      name: card.name,
      owner: playerId,
      x,
      y,
      attack: card.attack ?? card.atk ?? 0,
      hp: card.hp ?? card.health ?? 0,
      range: card.range ?? 0,
      speed: card.speed ?? card.spd ?? 0,
      cost: card.cost ?? 0,
      cardType: card.type,
      type: card.type,
      types: typeof global.getCardTypes === "function" ? [...global.getCardTypes(card)] : [...(card.types ?? [card.type])],
      traits: typeof global.getTraits === "function" ? [...global.getTraits(card)] : [...(card.traits ?? [])],
      capabilities: { ...(card.capabilities ?? {}) },
      capabilityOverrides: { ...(card.capabilityOverrides ?? {}) },
      cardImage: card.cardImage,
      tileImage: card.tileImage,
      effectText: card.effectText,
      gameplayId: card.gameplayId,
      databaseId: card.databaseId,
      isUnique: card.isUnique,
      keywords: [...(card.keywords ?? [])],
      characteristics: [...(card.characteristics ?? [])],
    });

    global.normalizeCard?.(unit);
    global.initializeConcealState?.(unit);
    unit.zone = global.ZoneTypes?.BATTLEFIELD ?? "battlefield";
    unit.sourceCard = card;
    card.zone = unit.zone;
    global.normalizeUnitBaseStats?.(unit);

    const entered = typeof global.enterPermanent === "function"
      ? global.enterPermanent(unit, {
          controller: playerId,
          owner: playerId,
          battlefieldPermanents: getGameState().units,
          cause: "card-effect",
        })
      : unit;
    if (!entered) return null;

    getGameState().nextUnitId += 1;
    getGameState().units.push(unit);
    if (typeof global.enterPermanent !== "function") global.registerTriggersForSource?.(unit);
    global.emitGameEvent?.("unitEnteredPlay", { unit, card, playerId, x, y, reason: "card-effect" }, { source: unit });
    global.emitGameEvent?.("unitSummoned", { unit, card, playerId, x, y, reason: "card-effect" }, { source: unit });
    global.emitGameEvent?.("unitRevealed", { unit, card, playerId, reason: "put-into-play-face-up" }, { source: unit });
    return unit;
  }

  async function resolveYvainReveal(unit) {
    if (!isSirYvain(unit) || !isFaceUpInPlay(unit)) return false;
    const playerId = controllerOf(unit);
    const player = global.ensurePlayerZones?.(playerId) ?? getGameState().players?.[playerId];
    if (!player) return false;

    const spaces = getAdjacentOpenSpaces(unit);
    if (!spaces.length) {
      await showKnightMessageModal("No Open Space", `${unit.name} has no open adjacent space for Lion.`);
      return false;
    }

    const useEffect = await showKnightChoiceModal(
      "Sir Yvain — Reveal",
      "Search your Deck for one Animal named ‘Lion’, put it into play adjacent to Sir Yvain, then Mount Sir Yvain to it?",
      { yesLabel: "Search Deck", noLabel: "No" }
    );
    if (!useEffect) return false;

    const lions = (player.deck ?? []).filter((card) =>
      String(card?.name ?? "").trim().toLowerCase() === "lion" &&
      (typeof global.isAnimal !== "function" || global.isAnimal(card))
    );
    if (!lions.length) {
      animateDeckSearch(playerId);
      global.shuffleDeck?.(playerId);
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      await showKnightMessageModal("No Lion Found", "No Lion was found in your Deck.");
      global.addLog?.(`${unit.name} found no Animal named Lion in the Deck.`);
      return false;
    }

    const lionCard = await chooseLionFromDeck(player, unit);
    if (!lionCard) return false;

    const destination = spaces[0];
    const removed = global.removeFromZone?.(lionCard, global.ZoneTypes.DECK, playerId);
    if (!removed) return false;
    global.shuffleDeck?.(playerId);
    animateDeckSearch(playerId);

    const lion = createEffectUnitFromCard(removed, playerId, destination.x, destination.y, `player-${playerId}-yvain-lion`);
    if (!lion) {
      global.addToZone?.(removed, global.ZoneTypes.DECK, playerId, { position: "top" });
      return false;
    }

    const mounted = global.mountCharacter?.(unit, lion, { animate: true, render: false });
    global.addLog?.(mounted
      ? `${unit.name} found Lion and mounted it.`
      : `${unit.name} put Lion into play, but could not mount it.`);
    global.recalculateAllUnitStats?.();
    global.renderGame?.();
    return true;
  }

  function healOtherFriendlyUnitsWhenLucanDies(lucan) {
    const controller = controllerOf(lucan);
    let healed = 0;
    for (const unit of getGameState().units ?? []) {
      if (!unit || unit.id === lucan.id || controllerOf(unit) !== controller) continue;
      if (typeof global.isUnit === "function" && !global.isUnit(unit)) continue;
      const maximum = typeof global.getCurrentMaxHP === "function"
        ? global.getCurrentMaxHP(unit)
        : Number(unit.maxHP ?? unit.printedHP ?? unit.hp ?? 0);
      if (Number(unit.currentHP) < maximum) {
        unit.currentHP = maximum;
        healed += 1;
      }
    }
    global.addLog?.(`${lucan.name} removes all Damage Counters from ${healed} other Unit${healed === 1 ? "" : "s"} you control.`);
    global.renderGame?.();
    return healed;
  }

  function resolveBedivereReveal(unit) {
    if (!isSirBedivere(unit) || !isFaceUpInPlay(unit)) return false;
    const playerId = controllerOf(unit);
    const player = global.ensurePlayerZones?.(playerId) ?? getGameState().players?.[playerId];
    const items = (player?.discard ?? []).filter((card) => typeof global.isItem === "function" && global.isItem(card));
    if (!items.length) {
      global.addLog?.(`${unit.name} found no Item in the Discard Pile.`);
      return false;
    }
    if (global.confirm?.(`${unit.name}: Return an Item from your Discard Pile to your hand?`) === false) return false;
    const chosen = chooseOneByPrompt([...items].reverse(), `${unit.name}: Choose an Item`);
    if (!chosen) return false;
    const moved = global.moveCard?.(chosen, {
      playerId,
      from: global.ZoneTypes.DISCARD,
      to: global.ZoneTypes.HAND,
      reason: "sir-bedivere-reveal",
    });
    if (!moved) return false;
    global.addLog?.(`${unit.name} returned ${chosen.name} from the Discard Pile to hand.`);
    global.renderGame?.();
    return true;
  }

  function resolveKayEndTurn(kay, playerId) {
    if (!isFaceUpInPlay(kay) || controllerOf(kay) !== Number(playerId)) return 0;
    const range = typeof global.getCurrentRange === "function" ? global.getCurrentRange(kay) : Number(kay.currentRange ?? kay.range ?? 0);
    const targets = (getGameState().units ?? []).filter((target) =>
      target && target.id !== kay.id && isBattlefieldUnitOrConstruct(target) &&
      distanceBetween(kay, target) > 0 && distanceBetween(kay, target) <= range
    );
    for (const target of targets) target.currentHP = Number(target.currentHP ?? target.hp ?? 0) - 2;
    if (targets.length) {
      global.addLog?.(`${kay.name} deals 2 damage to ${targets.length} Unit${targets.length === 1 ? "" : "s"}/Construct${targets.length === 1 ? "" : "s"} in range.`);
      global.runStateBasedActions?.({ source: kay, reason: "sir-kay-end-turn", render: false });
      global.renderGame?.();
    }
    return targets.length;
  }

  function getSagremoreRequiredTargets(sagremore) {
    if (!isSirSagremore(sagremore) || !isFaceUpInPlay(sagremore) || sagremore.hasAttacked) return [];
    const range = typeof global.getCurrentRange === "function" ? global.getCurrentRange(sagremore) : Number(sagremore.currentRange ?? sagremore.range ?? 0);
    const controller = controllerOf(sagremore);
    return (getGameState().units ?? []).filter((target) =>
      target && controllerOf(target) !== controller && isBattlefieldUnitOrConstruct(target) &&
      !target.isConcealed && distanceBetween(sagremore, target) > 0 && distanceBetween(sagremore, target) <= range &&
      (typeof global.isUnitProtected !== "function" || !global.isUnitProtected(sagremore, target))
    );
  }

  function enforceSagremoreAttackRequirement(playerId) {
    const state = getGameState();
    if (!state) return true;
    if (playerId == null) playerId = state.activePlayer;
    const offenders = (state.units ?? []).filter((unit) =>
      controllerOf(unit) === Number(playerId) && getSagremoreRequiredTargets(unit).length > 0
    );
    if (!offenders.length) return true;
    const names = offenders.map((unit) => unit.name).join(", ");
    const warning = `${names} must attack an opposing Unit or Construct in range before the turn can end.`;
    global.addLog?.(warning);
    showKnightMessageModal("Sir Sagremore Must Attack", warning);
    state.selectedUnitId = offenders[0].id;
    state.selectedUnitAction = "attack";
    state.attackableUnitIds = new Set(getSagremoreRequiredTargets(offenders[0]).map((target) => target.id));
    global.renderGame?.();
    return false;
  }

  function applySagremoreRevealSpeed(unit) {
    if (!isSirSagremore(unit)) return false;
    const identity = typeof global.getCurrentTurnIdentity === "function"
      ? global.getCurrentTurnIdentity()
      : `${Number(getGameState().turn) || 0}:${Number(getGameState().activePlayer) || 0}`;
    if (unit.sagremoreRevealTurnIdentity === identity) return false;
    unit.sagremoreRevealTurnIdentity = identity;
    global.addContinuousEffect?.({
      id: `sagremore-reveal-speed:${unit.id}:${identity}`,
      active: true,
      source: unit,
      controller: controllerOf(unit),
      target: unit.id,
      layer: global.ModifierLayers?.BUFF ?? 40,
      duration: "untilEndOfTurn",
      expiresForPlayer: getGameState().activePlayer,
      modifier(stats) { stats.speed += 1; },
      metadata: { kind: "sagremore-reveal-speed", amount: 1, identity },
    });
    global.recalculateAllUnitStats?.();
    const spent = Math.max(0, Number(unit.movementSpent ?? 0) || 0);
    unit.remainingSpeed = Math.max(0, Number(unit.currentSpeed ?? unit.baseSpeed ?? 0) - spent);
    global.addLog?.(`${unit.name} gains +1 SPD until the end of the turn.`);
    return true;
  }

  if (typeof global.onGameEvent === "function") {
    global.onGameEvent("unitRevealed", (event) => {
      const unit = event?.payload?.unit;
      if (isSirYvain(unit)) resolveYvainReveal(unit);
      if (isSirBedivere(unit)) resolveBedivereReveal(unit);
      if (isSirSagremore(unit)) applySagremoreRevealSpeed(unit);
    }, { priority: 20 });

    global.onGameEvent("unitDestroyed", (event) => {
      const unit = event?.payload?.unit;
      if (isSirLucan(unit)) healOtherFriendlyUnitsWhenLucanDies(unit);
    }, { priority: 20 });

    global.onGameEvent("turnEnding", (event) => {
      const playerId = Number(event?.payload?.playerId);
      const kays = (getGameState().units ?? []).filter((unit) => isSirKay(unit) && controllerOf(unit) === playerId);
      for (const kay of kays) resolveKayEndTurn(kay, playerId);
    }, { priority: 30 });

    global.onGameEvent("turnEnded", (event) => {
      const endedPlayer = Number(event?.payload?.playerId);
      for (const unit of getGameState().units ?? []) {
        if (isSirSagremore(unit) && String(unit.sagremoreRevealTurnIdentity ?? "").endsWith(`:${endedPlayer}`)) {
          unit.sagremoreRevealTurnIdentity = null;
        }
      }
    }, { priority: -60 });
  }

  Object.assign(global, {
    isSirYvain,
    isSirGalahad,
    isSirKay,
    isSirLucan,
    isSirGawain,
    isSirBedivere,
    isSirSagremore,
    resolveYvainReveal,
    resolveBedivereReveal,
    resolveKayEndTurn,
    getSagremoreRequiredTargets,
    enforceSagremoreAttackRequirement,
    applySagremoreRevealSpeed,
    showKnightMessageModal,
    showKnightChoiceModal,
  });
})(window);
