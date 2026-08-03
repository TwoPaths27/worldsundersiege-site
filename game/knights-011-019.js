"use strict";

/* Worlds Under Siege — BOA-011 through BOA-019 */
(function knightEffects011019(global) {
  const IDS = Object.freeze({
    LADY: "BOA-011", GUINEVERE: "BOA-012", MORDRED: "BOA-013",
    PERCIVAL: "BOA-014", BORS: "BOA-015", TRISTAN: "BOA-016",
    GARETH: "BOA-017", ARGAVAIN: "BOA-018", GAHERIS: "BOA-019",
  });

  const state = () => (global.GameState || (typeof GameState !== "undefined" ? GameState : null));
  const controllerOf = (value) => Number(value?.controller ?? value?.owner) || null;
  const identities = (value) => [value?.databaseId, value?.gameplayId, value?.variantOf, value?.sourceCard?.databaseId, value?.sourceCard?.gameplayId].filter(Boolean).map(v => String(v).toUpperCase());
  const matches = (value, id, names = []) => Boolean(value && (identities(value).includes(id) || names.some(name => String(value.name || "").toLowerCase() === name.toLowerCase())));
  const isLadyOfTheLake = value => matches(value, IDS.LADY, ["Lady of the Lake"]);
  const isQueenGuinevere = value => matches(value, IDS.GUINEVERE, ["Queen Guinevere"]);
  const isSirMordred = value => matches(value, IDS.MORDRED, ["Sir Mordred", "Mordred"]);
  const isSirPercival = value => matches(value, IDS.PERCIVAL, ["Sir Percival"]);
  const isSirBors = value => matches(value, IDS.BORS, ["Sir Bors"]);
  const isSirTristan = value => matches(value, IDS.TRISTAN, ["Sir Tristan"]);
  const isSirGareth = value => matches(value, IDS.GARETH, ["Sir Gareth"]);
  const isSirArgavain = value => matches(value, IDS.ARGAVAIN, ["Sir Argavain"]);
  const isSirGaheris = value => matches(value, IDS.GAHERIS, ["Sir Gaheris"]);

  const faceUp = unit => Boolean(unit && !unit.isConcealed && (state()?.units || []).some(candidate => candidate?.id === unit.id));
  const characteristic = (card, value) => {
    const needle = String(value).toLowerCase();
    const values = [card?.type, card?.cardType, ...(card?.types || []), ...(card?.characteristics || []), ...(card?.traits || [])];
    return values.some(entry => String(entry).toLowerCase() === needle);
  };
  const isCharacter = card => typeof global.isCharacter === "function" ? global.isCharacter(card) : characteristic(card, "Character");
  const isKnight = card => characteristic(card, "Knight") || /\bSir\b/i.test(String(card?.name || ""));
  const positionOf = unit => {
    if (unit?.mountedOn && typeof global.getMount === "function") {
      const mount = global.getMount(unit); if (mount) return { x: Number(mount.x), y: Number(mount.y) };
    }
    return { x: Number(unit?.x), y: Number(unit?.y) };
  };
  const distance = (a, b) => { const p = positionOf(a), q = positionOf(b); return Math.abs(p.x-q.x)+Math.abs(p.y-q.y); };

  function promptChoice(title, message, yesLabel = "Yes", noLabel = "No") {
    if (typeof global.showKnightChoiceModal === "function") return global.showKnightChoiceModal(title, message, { yesLabel, noLabel });
    return Promise.resolve(global.confirm?.(`${title}\n\n${message}`) ?? false);
  }
  function message(title, text) {
    if (typeof global.showKnightMessageModal === "function") return global.showKnightMessageModal(title, text);
    global.alert?.(`${title}\n\n${text}`); return Promise.resolve(true);
  }

  async function selectBattlefieldUnit({ title, message: text, candidates, source, impactText = "SELECT" } = {}) {
    const list = (candidates || []).filter(Boolean);
    if (!list.length) return null;
    const ids = new Set(list.map(unit => unit.id));
    const banner = document.createElement("div");
    banner.className = "battlefield-selection-banner";
    banner.innerHTML = `<strong></strong><span></span><button type="button">Cancel</button>`;
    banner.querySelector("strong").textContent = title || "Choose a Unit";
    banner.querySelector("span").textContent = text || "Select a highlighted Unit.";
    document.body.appendChild(banner);
    list.forEach(unit => document.querySelector(`.unit-token[data-unit-id="${CSS.escape(String(unit.id))}"]`)?.closest(".battlefield-cell")?.classList.add("cell-effect-placement-target"));
    return new Promise(resolve => {
      const finish = value => {
        document.removeEventListener("click", onClick, true);
        banner.remove();
        document.querySelectorAll(".cell-effect-placement-target").forEach(node => node.classList.remove("cell-effect-placement-target"));
        resolve(value);
      };
      const onClick = event => {
        const token = event.target.closest?.(".unit-token");
        const id = token?.dataset?.unitId;
        if (!id || !ids.has(id)) return;
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.();
        const unit = list.find(candidate => String(candidate.id) === String(id));
        if (source && unit) global.presentEffectActivation?.(source, { targets: [unit], impactText, fireworks: true, force: true });
        finish(unit || null);
      };
      document.addEventListener("click", onClick, true);
      banner.querySelector("button").addEventListener("click", () => finish(null));
    });
  }

  async function resolveLadyReveal(unit) {
    if (!isLadyOfTheLake(unit) || !faceUp(unit)) return false;
    const playerId = controllerOf(unit);
    const player = global.ensurePlayerZones?.(playerId) || state()?.players?.[playerId];
    const items = (player?.deck || []).filter(card => typeof global.isItem === "function" ? global.isItem(card) : characteristic(card, "Item"));
    if (!(await promptChoice("Lady of the Lake — Reveal", "Search your Deck for one Item card and add it to your hand?", "Search Deck", "No"))) return false;
    if (!items.length) {
      document.querySelector(playerId === 1 ? "#playerDeckZone" : "#enemyDeckZone")?.classList.add("is-search-shuffling");
      global.shuffleDeck?.(playerId);
      await message("No Item Found", "No Item card was found in your Deck.");
      return false;
    }
    const chosen = await global.showDeckSearchModal?.(playerId, {
      title: "Lady of the Lake — Search Deck", message: "Choose one Item card.", confirmLabel: "Choose Item",
      filter: card => typeof global.isItem === "function" ? global.isItem(card) : characteristic(card, "Item"),
    });
    if (!chosen) return false;
    const moved = global.moveCard?.(chosen, { playerId, from: global.ZoneTypes.DECK, to: global.ZoneTypes.HAND, reason: "lady-of-the-lake-reveal" });
    global.shuffleDeck?.(playerId);
    global.presentEffectActivation?.(unit, { targets: [chosen], impactText: "TO HAND", fireworks: true, force: true });
    global.addLog?.(`${unit.name} found ${chosen.name} and added it to hand.`);
    global.renderGame?.();
    return Boolean(moved);
  }

  async function resolveMordredReveal(unit) {
    const game = state();
    if (!isSirMordred(unit) || !faceUp(unit) || Number(game?.activePlayer) !== controllerOf(unit)) return false;
    const range = global.getCurrentRange?.(unit) ?? unit.currentRange ?? unit.range ?? 0;
    const candidates = (game.units || []).filter(target => target && controllerOf(target) !== controllerOf(unit) && isCharacter(target) && !target.isConcealed && distance(unit, target) <= range && distance(unit, target) > 0);
    if (!candidates.length) return false;
    if (!(await promptChoice("Sir Mordred — Reveal", "Take control of a Character in Mordred's Range until end of turn?", "Choose Character", "No"))) return false;
    const target = await selectBattlefieldUnit({ title: "Choose a Character", message: "Select an opposing Character in Mordred's Range.", candidates, source: unit, impactText: "CONTROL" });
    if (!target) return false;
    target.mordredTemporaryControl = { originalController: controllerOf(target), sourceId: unit.id, turn: game.turn, controller: controllerOf(unit) };
    global.handleControlChange?.(target, controllerOf(unit), { source: unit, render: false });
    global.addLog?.(`${unit.name} takes control of ${target.name} until end of turn.`);
    global.renderGame?.();
    return true;
  }

  async function resolvePercivalReveal(unit) {
    if (!isSirPercival(unit) || !faceUp(unit)) return false;
    const candidates = (state()?.units || []).filter(target => target && controllerOf(target) === controllerOf(unit) && (typeof global.isUnit !== "function" || global.isUnit(target)));
    if (!candidates.length) return false;
    const target = await selectBattlefieldUnit({ title: "Sir Percival — Reveal", message: "Select a Unit you control to remove all Damage Counters from.", candidates, source: unit, impactText: "HEAL" });
    if (!target) return false;
    const max = global.getCurrentMaxHP?.(target) ?? target.maxHP ?? target.baseHP ?? target.hp;
    target.currentHP = Number(max) || target.currentHP;
    global.addLog?.(`${unit.name} removes all Damage Counters from ${target.name}.`);
    global.renderGame?.();
    return true;
  }

  async function resolveGaherisReveal(unit) {
    if (!isSirGaheris(unit) || !faceUp(unit)) return false;
    const others = (state()?.units || []).filter(other => other && other.id !== unit.id && controllerOf(other) === controllerOf(unit) && isKnight(other) && /\bSir\b/i.test(String(other.name || "")));
    if (others.length) return false;
    global.presentEffectActivation?.(unit, { targets: [unit], impactText: "RETURN", fireworks: true, force: true });
    await new Promise(resolve => setTimeout(resolve, 650));
    if (unit.mountedOn) global.forceSeparateMountedPair?.(unit, { reason: "sir-gaheris-return" });
    const card = unit.sourceCard || unit;
    global.destroyUnit?.(unit, { cause: "return-to-hand", skipDiscard: true, source: unit });
    global.addToZone?.(card, global.ZoneTypes.HAND, controllerOf(unit));
    global.addLog?.(`${unit.name} returned to its owner's hand because no other Sir Knight was controlled.`);
    global.renderGame?.();
    return true;
  }

  async function restoreMordredControl(playerId) {
    const controlled = (state()?.units || []).filter(unit => unit?.mordredTemporaryControl && Number(unit.mordredTemporaryControl.controller) === Number(playerId));
    for (const unit of controlled) {
      const info = unit.mordredTemporaryControl;
      if (unit.mountedOn && typeof global.dismountCharacter === "function") {
        const mount = global.getMount?.(unit);
        const spaces = global.getAdjacentOpenSpaces?.(mount || unit) || [];
        const chosen = spaces[0] || null;
        if (chosen) global.dismountCharacter(unit, chosen, { render: false, force: true });
      }
      delete unit.mordredTemporaryControl;
      global.handleControlChange?.(unit, info.originalController, { source: unit, render: false });
      // Items remain attached; their controller follows the returned Character's controller.
      for (const item of unit.attachedItems || unit.equippedItems || []) item.controller = info.originalController;
    }
    if (controlled.length) global.renderGame?.();
  }

  function countItemsControlled(playerId) {
    let count = 0;
    for (const unit of state()?.units || []) if (controllerOf(unit) === Number(playerId)) count += (unit.attachedItems || unit.equippedItems || []).length;
    return count;
  }
  function countItemsEquipped(unit) { return (unit?.attachedItems || unit?.equippedItems || []).length; }
  function getBorsAttackLimit(unit) { return isSirBors(unit) ? 1 + countItemsEquipped(unit) : 1; }

  function isProtectedBySirGareth(source, target) {
    if (!source || !target || controllerOf(source) === controllerOf(target)) return false;
    if (!isCharacter(target)) return false;
    return (state()?.units || []).some(gareth => faceUp(gareth) && isSirGareth(gareth) && controllerOf(gareth) === controllerOf(target) && Math.max(Math.abs(positionOf(gareth).x-positionOf(target).x), Math.abs(positionOf(gareth).y-positionOf(target).y)) === 1);
  }

  function shouldRevealHands() { return (state()?.units || []).some(unit => faceUp(unit) && isSirArgavain(unit)); }


  function refreshRevealedHandsPanel() {
    let panel = document.querySelector("#argavainRevealedHand");
    if (!shouldRevealHands()) { panel?.remove(); return; }
    const game = state();
    const viewer = Number(game?.activePlayer || 1);
    const opponent = viewer === 1 ? 2 : 1;
    const player = game?.players?.[opponent];
    if (!player) return;
    if (!panel) {
      panel = document.createElement("aside");
      panel.id = "argavainRevealedHand";
      panel.className = "argavain-revealed-hand";
      document.body.appendChild(panel);
    }
    panel.replaceChildren();
    const heading = document.createElement("strong");
    heading.textContent = `${player.name || `Player ${opponent}`} — Revealed Hand`;
    panel.appendChild(heading);
    const row = document.createElement("div"); row.className = "argavain-revealed-hand__cards"; panel.appendChild(row);
    for (const card of player.hand || []) {
      const button = document.createElement("button"); button.type = "button"; button.className = "argavain-revealed-hand__card";
      button.title = card.name || "Card";
      if (card.cardImage || card.image) button.style.backgroundImage = `url("${card.cardImage || card.image}")`;
      button.addEventListener("mouseenter", () => global.renderHandCardPreview?.(card));
      button.addEventListener("focus", () => global.renderHandCardPreview?.(card));
      row.appendChild(button);
    }
  }

  if (typeof global.onGameEvent === "function") {
    global.onGameEvent("unitRevealed", event => {
      const unit = event?.payload?.unit;
      queueMicrotask(refreshRevealedHandsPanel);
      if (isLadyOfTheLake(unit)) resolveLadyReveal(unit);
      if (isSirMordred(unit)) resolveMordredReveal(unit);
      if (isSirPercival(unit)) resolvePercivalReveal(unit);
      if (isSirGaheris(unit)) resolveGaherisReveal(unit);
    }, { priority: 22 });
    ["unitLeavingPlay", "cardMoved", "turnStarted", "turnEnded"].forEach(type => global.onGameEvent(type, () => queueMicrotask(refreshRevealedHandsPanel), { priority: -90 }));
  }

  const previousEndTurn = global.resolveKnightEndTurnEffects;
  global.resolveKnightEndTurnEffects = async function extendedKnightEndTurnEffects(playerId) {
    if (typeof previousEndTurn === "function") await previousEndTurn(playerId);
    await restoreMordredControl(playerId);
    return true;
  };

  Object.assign(global, {
    isLadyOfTheLake, isQueenGuinevere, isSirMordred, isSirPercival, isSirBors, isSirTristan, isSirGareth, isSirArgavain, isSirGaheris,
    resolveLadyReveal, resolveMordredReveal, resolvePercivalReveal, resolveGaherisReveal,
    restoreMordredControl, countItemsControlled, countItemsEquipped, getBorsAttackLimit,
    isProtectedBySirGareth, shouldRevealHands, refreshRevealedHandsPanel,
  });
  queueMicrotask(refreshRevealedHandsPanel);
})(window);
