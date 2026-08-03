"use strict";

/* Public Discard / Banish browser. */
(function publicZoneBrowserModule(global) {
  const browser = global.PublicZoneBrowser || {
    isOpen: false,
    playerId: null,
    zoneType: null,
    lastFocused: null,
  };
  global.PublicZoneBrowser = browser;

  function el(id) { return document.getElementById(id); }
  function zoneKey(zoneType) {
    const value = String(zoneType || "").toLowerCase();
    if (value.includes("banish")) return "banish";
    return "discard";
  }
  function getPlayer(playerId) {
    return global.ensurePlayerZones?.(playerId) || global.GameState?.players?.[playerId] || null;
  }
  function getCards() {
    const player = getPlayer(browser.playerId);
    return player ? (Array.isArray(player[zoneKey(browser.zoneType)]) ? player[zoneKey(browser.zoneType)] : []) : [];
  }
  function cardImage(card) { return card?.cardImage || card?.image || card?.tileImage || ""; }

  function makeCardButton(card, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hand-card public-zone-card";
    button.dataset.cardId = String(card?.id ?? card?.instanceId ?? index);
    button.setAttribute("aria-label", card?.name || `Card ${index + 1}`);
    const image = cardImage(card);
    if (image) {
      button.style.backgroundImage = `url("${String(image).replace(/["\\]/g, "\\$&")}")`;
      button.style.backgroundSize = "cover";
      button.style.backgroundPosition = "center";
    } else {
      button.textContent = card?.name || "Unknown card";
    }
    const preview = () => global.renderHandCardPreview?.(card);
    button.addEventListener("mouseenter", preview);
    button.addEventListener("focus", preview);
    button.addEventListener("click", preview);
    return button;
  }

  function refreshPublicZoneBrowser() {
    if (!browser.isOpen) return false;
    const modal = el("publicZoneModal");
    const cardsRoot = el("publicZoneCards");
    if (!modal || !cardsRoot) return false;
    const player = getPlayer(browser.playerId);
    const key = zoneKey(browser.zoneType);
    const cards = getCards();
    el("publicZoneTitle").textContent = key === "banish" ? "Banish" : "Discard";
    el("publicZoneOwner").textContent = player?.name || `Player ${browser.playerId}`;
    el("publicZoneCount").textContent = `${cards.length} ${cards.length === 1 ? "card" : "cards"}`;
    cardsRoot.replaceChildren();
    if (!cards.length) {
      const empty = document.createElement("p");
      empty.className = "public-zone-modal__empty";
      empty.textContent = `No cards in this ${key} pile.`;
      cardsRoot.appendChild(empty);
    } else {
      cards.forEach((card, index) => cardsRoot.appendChild(makeCardButton(card, index)));
    }
    return true;
  }

  function openPublicZoneBrowser(playerId, zoneType) {
    const modal = el("publicZoneModal");
    if (!modal || !getPlayer(playerId)) return false;
    browser.playerId = Number(playerId);
    browser.zoneType = zoneKey(zoneType);
    browser.isOpen = true;
    browser.lastFocused = document.activeElement;
    refreshPublicZoneBrowser();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("public-zone-browser-open");
    requestAnimationFrame(() => el("closePublicZoneButton")?.focus());
    return true;
  }

  function closePublicZoneBrowser() {
    const modal = el("publicZoneModal");
    if (!modal) return false;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("public-zone-browser-open");
    browser.isOpen = false;
    browser.playerId = null;
    browser.zoneType = null;
    const previous = browser.lastFocused;
    browser.lastFocused = null;
    if (previous?.isConnected) previous.focus();
    return true;
  }

  Object.assign(global, { openPublicZoneBrowser, closePublicZoneBrowser, refreshPublicZoneBrowser });
})(window);
