"use strict";

/*
 * Worlds Under Siege — V19.9.6 Search & Zone Effects
 *
 * Reusable, UI-agnostic helpers for card effects that inspect and move cards
 * among Deck, Hand, Discard, and Banish. All movement is delegated to the
 * V19.9.1 Zone Engine so logs, events, ownership, and deck-out rules remain
 * consistent.
 */

const ZoneEffectLocations = Object.freeze({
  TOP: "top",
  BOTTOM: "bottom",
  RANDOM: "random",
});

function zoneEffectPlayerId(playerOrId) {
  if (typeof getPlayerId === "function") return getPlayerId(playerOrId);
  if (Number.isInteger(playerOrId)) return playerOrId;
  return Number(playerOrId?.id ?? playerOrId?.playerId ?? playerOrId?.owner) || null;
}

function zoneEffectPlayer(playerOrId) {
  const id = zoneEffectPlayerId(playerOrId);
  return id ? GameState.players?.[id] ?? null : null;
}

function normalizeCardFilter(filter) {
  if (typeof filter === "function") return filter;
  if (!filter || typeof filter !== "object") return () => true;

  return (card) => {
    if (filter.id != null && card?.id !== filter.id) return false;
    if (filter.name != null && card?.name !== filter.name) return false;
    if (filter.type != null) {
      const requested = String(filter.type).toLowerCase();
      const types = [card?.type, card?.cardType, ...(card?.types ?? [])]
        .filter(Boolean)
        .map((type) => String(type).toLowerCase());
      if (!types.includes(requested)) return false;
    }
    if (filter.keyword != null) {
      const requested = String(filter.keyword).toLowerCase();
      const keywords = (card?.keywords ?? []).map((word) => String(word).toLowerCase());
      if (!keywords.includes(requested)) return false;
    }
    if (filter.maxCost != null && Number(card?.cost ?? card?.currentCost ?? Infinity) > Number(filter.maxCost)) return false;
    if (filter.minCost != null && Number(card?.cost ?? card?.currentCost ?? -Infinity) < Number(filter.minCost)) return false;
    return true;
  };
}

function getCardsInZone(playerOrId, zoneName, filter = null) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const zone = typeof getZone === "function" ? getZone(zoneName, playerId) : null;
  if (!Array.isArray(zone)) return [];
  const predicate = normalizeCardFilter(filter);
  return zone.filter((card, index) => predicate(card, index, zone));
}

function chooseCards(candidates, amount = 1, chooser = null, context = {}) {
  const limit = Math.max(0, Math.floor(Number(amount) || 0));
  if (!limit || !candidates.length) return [];

  let chosen = null;
  if (typeof chooser === "function") {
    chosen = chooser([...candidates], limit, context);
  }

  const requested = Array.isArray(chosen) ? chosen : chosen ? [chosen] : candidates.slice(0, limit);
  const valid = [];
  for (const card of requested) {
    const match = candidates.find((candidate) => candidate === card || (
      card?.id != null && candidate?.id === card.id
    ));
    if (match && !valid.includes(match)) valid.push(match);
    if (valid.length >= limit) break;
  }
  return valid;
}

function searchDeck(playerOrId, options = {}) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const player = typeof ensurePlayerZones === "function" ? ensurePlayerZones(playerId) : zoneEffectPlayer(playerId);
  if (!player) return [];

  const amount = Math.max(0, Math.floor(Number(options.amount ?? 1) || 0));
  const candidates = getCardsInZone(playerId, ZoneTypes.DECK, options.filter);
  const chosen = chooseCards(candidates, amount, options.choose, {
    ...options,
    playerId,
    zone: ZoneTypes.DECK,
  });
  const destination = options.to ?? ZoneTypes.HAND;
  const moved = [];

  for (const card of chosen) {
    const result = moveCard(card, {
      playerId,
      from: ZoneTypes.DECK,
      to: destination,
      position: options.position,
      reason: options.reason ?? "search-deck",
    });
    if (result) moved.push(result);
  }

  if (options.shuffle !== false) shuffleDeck(playerId, options.random ?? Math.random);
  if (typeof emitGameEvent === "function") {
    emitGameEvent("deckSearched", {
      playerId,
      found: moved,
      candidateCount: candidates.length,
      destination,
    }, { source: options.source ?? player });
  }
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return moved;
}



/* V19.9.7.9 — shared themed Deck search browser.
 * Card-specific effects should call searchDeckInteractive() rather than
 * inventing their own prompts. The existing synchronous searchDeck() remains
 * available for AI and legacy effects.
 */
function createDeckSearchModalBase({ title = "Search Deck", message = "Choose a card.", confirmLabel = "Choose", cancelLabel = "Cancel" } = {}) {
  const modal = document.createElement("div");
  modal.className = "deck-search-modal";
  modal.innerHTML = `
    <div class="deck-search-modal__backdrop"></div>
    <section class="deck-search-modal__dialog" role="dialog" aria-modal="true">
      <p class="deck-search-modal__eyebrow">Deck Search</p>
      <h2 class="deck-search-modal__title"></h2>
      <p class="deck-search-modal__message"></p>
      <div class="deck-search-modal__list" role="listbox"></div>
      <div class="deck-search-modal__actions">
        <button type="button" class="deck-search-modal__button deck-search-modal__button--cancel"></button>
        <button type="button" class="deck-search-modal__button deck-search-modal__button--confirm" disabled></button>
      </div>
    </section>`;
  modal.querySelector(".deck-search-modal__title").textContent = title;
  modal.querySelector(".deck-search-modal__message").textContent = message;
  modal.querySelector(".deck-search-modal__button--cancel").textContent = cancelLabel;
  modal.querySelector(".deck-search-modal__button--confirm").textContent = confirmLabel;
  document.body.appendChild(modal);
  document.body.classList.add("modal-open");
  return modal;
}

function closeDeckSearchModal(modal) {
  modal?.remove();
  if (!document.querySelector(".deck-search-modal, .knight-effect-modal")) {
    document.body.classList.remove("modal-open");
  }
}

function showDeckSearchModal(playerOrId, options = {}) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const player = typeof ensurePlayerZones === "function" ? ensurePlayerZones(playerId) : zoneEffectPlayer(playerId);
  if (!player) return Promise.resolve(null);

  const predicate = normalizeCardFilter(options.filter);
  const cards = [...(player.deck ?? [])].sort((a, b) =>
    String(a?.name ?? "").localeCompare(String(b?.name ?? ""), undefined, { sensitivity: "base" })
  );

  return new Promise((resolve) => {
    const modal = createDeckSearchModalBase({
      title: options.title ?? "Search Your Deck",
      message: options.message ?? "Choose a card from your Deck.",
      confirmLabel: options.confirmLabel ?? "Choose Card",
      cancelLabel: options.cancelLabel ?? "Cancel",
    });
    const list = modal.querySelector(".deck-search-modal__list");
    const confirm = modal.querySelector(".deck-search-modal__button--confirm");
    const cancel = modal.querySelector(".deck-search-modal__button--cancel");
    let selected = null;

    const finish = (value) => {
      closeDeckSearchModal(modal);
      resolve(value);
    };

    if (!cards.length) {
      const empty = document.createElement("p");
      empty.className = "deck-search-modal__empty";
      empty.textContent = "Your Deck is empty.";
      list.appendChild(empty);
    }

    cards.forEach((card) => {
      const legal = predicate(card);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "deck-search-modal__card";
      button.disabled = !legal;
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");
      button.title = legal ? `Select ${card.name}` : `${card.name} is not a legal choice`;

      const image = document.createElement("div");
      image.className = "deck-search-modal__card-image";
      const art = card.cardImage || card.image || card.artwork || "";
      if (art) image.style.backgroundImage = `url("${art}")`;

      const name = document.createElement("span");
      name.className = "deck-search-modal__card-name";
      name.textContent = card.name ?? "Unknown Card";
      button.append(image, name);

      const choose = () => {
        if (!legal) return;
        selected = card;
        list.querySelectorAll(".deck-search-modal__card").forEach((node) => {
          const active = node === button;
          node.classList.toggle("is-selected", active);
          node.setAttribute("aria-selected", String(active));
        });
        confirm.disabled = false;
        if (typeof renderCardPreview === "function") renderCardPreview(card);
      };
      button.addEventListener("click", choose);
      button.addEventListener("mouseenter", () => { if (typeof renderCardPreview === "function") renderCardPreview(card); });
      button.addEventListener("focus", () => { if (typeof renderCardPreview === "function") renderCardPreview(card); });
      button.addEventListener("dblclick", () => { choose(); finish(selected); });
      list.appendChild(button);
    });

    cancel.addEventListener("click", () => finish(null));
    confirm.addEventListener("click", () => finish(selected));
    modal.querySelector(".deck-search-modal__backdrop").addEventListener("click", () => finish(null));
    modal.addEventListener("keydown", (event) => {
      if (event.key === "Escape") finish(null);
    });
    cancel.focus();
  });
}

async function searchDeckInteractive(playerOrId, options = {}) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const card = await showDeckSearchModal(playerId, options);
  if (!card) return [];
  if (options.confirmSelection) {
    const accepted = await options.confirmSelection(card);
    if (!accepted) return [];
  }
  const moved = searchDeck(playerId, {
    ...options,
    amount: 1,
    choose: () => [card],
    render: options.render,
  });
  return moved;
}

function revealCardsFromDeck(playerOrId, amount = 1, options = {}) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const player = typeof ensurePlayerZones === "function" ? ensurePlayerZones(playerId) : zoneEffectPlayer(playerId);
  if (!player) return [];

  const count = Math.max(0, Math.floor(Number(amount) || 0));
  const revealed = player.deck.slice(0, count);
  GameState.revealedCards ??= [];

  for (const card of revealed) {
    GameState.revealedCards.push({
      card,
      playerId,
      from: ZoneTypes.DECK,
      revealedAt: Date.now(),
      source: options.source ?? null,
    });
  }

  if (typeof addLog === "function" && options.silent !== true) {
    addLog(`${player.name} reveals ${revealed.length} card${revealed.length === 1 ? "" : "s"} from the top of their Deck.`);
  }
  if (typeof emitGameEvent === "function") {
    emitGameEvent("cardsRevealed", { playerId, cards: revealed, zone: ZoneTypes.DECK }, { source: options.source ?? player });
  }
  return revealed;
}

function clearRevealedCards(playerOrId = null) {
  GameState.revealedCards ??= [];
  if (playerOrId == null) {
    const removed = [...GameState.revealedCards];
    GameState.revealedCards.length = 0;
    return removed;
  }
  const playerId = zoneEffectPlayerId(playerOrId);
  const removed = GameState.revealedCards.filter((entry) => entry.playerId === playerId);
  GameState.revealedCards = GameState.revealedCards.filter((entry) => entry.playerId !== playerId);
  return removed;
}

function moveRevealedCards(cards, playerOrId, destination, options = {}) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const moved = [];
  for (const card of cards ?? []) {
    const result = moveCard(card, {
      playerId,
      from: ZoneTypes.DECK,
      to: destination,
      position: options.position,
      reason: options.reason ?? "move-revealed",
    });
    if (result) moved.push(result);
  }
  clearRevealedCards(playerId);
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return moved;
}

function millCards(playerOrId, amount = 1, options = {}) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const player = typeof ensurePlayerZones === "function" ? ensurePlayerZones(playerId) : zoneEffectPlayer(playerId);
  if (!player) return [];

  const count = Math.min(player.deck.length, Math.max(0, Math.floor(Number(amount) || 0)));
  const cards = player.deck.slice(0, count);
  const moved = [];
  for (const card of cards) {
    const result = moveCard(card, {
      playerId,
      from: ZoneTypes.DECK,
      to: options.to ?? ZoneTypes.DISCARD,
      reason: options.reason ?? "mill",
    });
    if (result) moved.push(result);
  }
  if (typeof emitGameEvent === "function") {
    emitGameEvent("cardsMilled", { playerId, cards: moved, destination: options.to ?? ZoneTypes.DISCARD }, { source: options.source ?? player });
  }
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return moved;
}

function moveCardsFromZone(playerOrId, from, to, options = {}) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const candidates = getCardsInZone(playerId, from, options.filter);
  const selected = chooseCards(candidates, options.amount ?? 1, options.choose, {
    ...options,
    playerId,
    zone: from,
  });
  const moved = [];
  for (const card of selected) {
    const result = moveCard(card, {
      playerId,
      from,
      to,
      position: options.position,
      reason: options.reason ?? `${from}-to-${to}`,
    });
    if (result) moved.push(result);
  }
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return moved;
}

function recoverFromDiscard(playerOrId, options = {}) {
  return moveCardsFromZone(playerOrId, ZoneTypes.DISCARD, options.to ?? ZoneTypes.HAND, {
    ...options,
    reason: options.reason ?? "recover-from-discard",
  });
}

function recoverFromBanish(playerOrId, options = {}) {
  return moveCardsFromZone(playerOrId, ZoneTypes.BANISH, options.to ?? ZoneTypes.HAND, {
    ...options,
    reason: options.reason ?? "recover-from-banish",
  });
}

function discardFromHand(playerOrId, options = {}) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const player = typeof ensurePlayerZones === "function" ? ensurePlayerZones(playerId) : zoneEffectPlayer(playerId);
  if (!player) return [];

  const amount = Math.max(0, Math.floor(Number(options.amount ?? 1) || 0));
  let candidates = getCardsInZone(playerId, ZoneTypes.HAND, options.filter);
  if (options.random === true) {
    const random = options.randomFunction ?? Math.random;
    candidates = [...candidates];
    for (let i = candidates.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
  }
  const selected = chooseCards(candidates, amount, options.random ? null : options.choose, {
    ...options,
    playerId,
    zone: ZoneTypes.HAND,
  });
  const moved = [];
  for (const card of selected) {
    const result = discardCard(card, ZoneTypes.HAND, {
      playerId,
      reason: options.reason ?? (options.random ? "random-discard" : "discard-effect"),
    });
    if (result) moved.push(result);
  }
  if (typeof emitGameEvent === "function") {
    emitGameEvent("cardsDiscarded", { playerId, cards: moved, random: options.random === true }, { source: options.source ?? player });
  }
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return moved;
}

function banishFromZone(playerOrId, from, options = {}) {
  return moveCardsFromZone(playerOrId, from, ZoneTypes.BANISH, {
    ...options,
    reason: options.reason ?? "banish-effect",
  });
}

function reorderDeckCards(playerOrId, cards, location = ZoneEffectLocations.TOP, options = {}) {
  const playerId = zoneEffectPlayerId(playerOrId);
  const player = typeof ensurePlayerZones === "function" ? ensurePlayerZones(playerId) : zoneEffectPlayer(playerId);
  if (!player || !Array.isArray(cards)) return false;

  const selected = cards
    .map((card) => player.deck.find((candidate) => candidate === card || (card?.id != null && candidate?.id === card.id)))
    .filter(Boolean);
  if (!selected.length) return false;

  player.deck = player.deck.filter((card) => !selected.includes(card));
  if (location === ZoneEffectLocations.BOTTOM) player.deck.push(...selected);
  else player.deck.unshift(...selected);
  if (typeof syncZoneCounts === "function") syncZoneCounts(playerId);

  if (typeof emitGameEvent === "function") {
    emitGameEvent("deckReordered", { playerId, cards: selected, location }, { source: options.source ?? player });
  }
  if (typeof renderGame === "function" && options.render !== false) renderGame();
  return true;
}

window.ZoneEffectLocations = ZoneEffectLocations;
window.WUSZoneEffects = Object.freeze({
  normalizeCardFilter,
  getCardsInZone,
  chooseCards,
  searchDeck,
  showDeckSearchModal,
  searchDeckInteractive,
  revealCardsFromDeck,
  clearRevealedCards,
  moveRevealedCards,
  millCards,
  moveCardsFromZone,
  recoverFromDiscard,
  recoverFromBanish,
  discardFromHand,
  banishFromZone,
  reorderDeckCards,
});

window.searchDeck = searchDeck;
window.showDeckSearchModal = showDeckSearchModal;
window.searchDeckInteractive = searchDeckInteractive;
window.revealCardsFromDeck = revealCardsFromDeck;
window.clearRevealedCards = clearRevealedCards;
window.moveRevealedCards = moveRevealedCards;
window.millCards = millCards;
window.moveCardsFromZone = moveCardsFromZone;
window.recoverFromDiscard = recoverFromDiscard;
window.recoverFromBanish = recoverFromBanish;
window.discardFromHand = discardFromHand;
window.banishFromZone = banishFromZone;
window.reorderDeckCards = reorderDeckCards;
