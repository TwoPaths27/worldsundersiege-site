"use strict";

/* Worlds Under Siege — V19.9.4 Army Zone UI */
(function initArmyZoneUI(global) {
  const MAX_SLOTS = 3;
  let lastAnimated = new Map();

  function getSlots(playerId) {
    return Array.from(document.querySelectorAll(`.game-zone--army[data-owner="${playerId}"]`))
      .sort((a, b) => Number(a.dataset.armyIndex) - Number(b.dataset.armyIndex));
  }

  function inspectArmy(playerId, army) {
    if (!army || !typeof elements !== "undefined" && elements.cardPreview) return false;
    const previewCard = {
      ...army,
      name: army.armyType ?? army.name,
      type: "Army",
      effectText: `${army.amount} total ${army.armyType ?? army.name}. ${army.effectText ?? ""}`.trim(),
    };
    if (typeof renderHandCardPreview === "function") {
      renderHandCardPreview(previewCard);
      return true;
    }
    return false;
  }

  function renderArmySlot(slot, playerId, army, index) {
    slot.replaceChildren();
    slot.classList.toggle("is-occupied", Boolean(army));
    slot.classList.toggle("is-empty", !army);
    slot.disabled = !army;
    slot.dataset.armyType = army?.armyType ?? "";

    if (!army) {
      const emptyLabel = document.createElement("span");
      emptyLabel.className = "army-zone__empty-label";
      emptyLabel.textContent = `Army ${index + 1}`;
      const emptyStatus = document.createElement("small");
      emptyStatus.textContent = "Empty";
      slot.append(emptyLabel, emptyStatus);
      slot.style.backgroundImage = "";
      slot.setAttribute("aria-label", `${GameState.players[playerId].name} Army slot ${index + 1}, empty`);
      return;
    }

    const name = document.createElement("strong");
    name.className = "army-zone__name";
    name.textContent = army.armyType ?? army.name ?? `Army ${index + 1}`;
    const amount = document.createElement("span");
    amount.className = "army-zone__amount";
    amount.textContent = String(army.amount ?? 0);
    amount.setAttribute("aria-label", `${army.amount ?? 0} amassed`);
    slot.append(name, amount);
    slot.style.backgroundImage = army.cardImage
      ? `linear-gradient(to top, rgba(0,0,0,.9), rgba(0,0,0,.2)), url("${army.cardImage}")`
      : "";
    slot.setAttribute("aria-label", `${GameState.players[playerId].name}: ${name.textContent}, ${army.amount ?? 0} amassed`);

    const animationKey = `${playerId}:${army.id}`;
    const previous = lastAnimated.get(animationKey);
    if (previous != null && previous !== army.amount) {
      slot.classList.remove("army-zone--amassed");
      void slot.offsetWidth;
      slot.classList.add("army-zone--amassed");
      setTimeout(() => slot.classList.remove("army-zone--amassed"), 650);
    }
    lastAnimated.set(animationKey, army.amount);
  }

  function renderArmyZones() {
    if (!GameState?.players) return;
    for (const playerId of [1, 2]) {
      const player = GameState.players[playerId];
      if (typeof ensurePlayerZones === "function") ensurePlayerZones(playerId);
      const armies = Array.isArray(player.armyZone) ? player.armyZone.slice(0, MAX_SLOTS) : [];
      getSlots(playerId).forEach((slot, index) => renderArmySlot(slot, playerId, armies[index] ?? null, index));
    }
  }

  function bindArmyZoneEvents() {
    document.querySelectorAll(".game-zone--army").forEach((slot) => {
      slot.addEventListener("click", () => {
        const playerId = Number(slot.dataset.owner);
        const index = Number(slot.dataset.armyIndex) - 1;
        const army = GameState.players[playerId]?.armyZone?.[index];
        if (army) inspectArmy(playerId, army);
      });
    });
  }

  bindArmyZoneEvents();
  global.renderArmyZones = renderArmyZones;
  global.inspectArmy = inspectArmy;
})(window);
