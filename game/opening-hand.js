"use strict";

/* Worlds Under Siege — V19.9.6.3 opening hands and one free mulligan. */
(function initOpeningHandPhase(global) {
  const OPENING_HAND_SIZE = 6;

  function resetOpeningHandState(playerId) {
    const player = GameState.players[playerId];
    player.hand = [];
    player.usedMulligan = false;
    player.mulliganDecisionMade = false;
    player.mulliganAvailable = true;
    if (typeof syncZoneCounts === "function") syncZoneCounts(playerId);
  }

  function drawOpeningHand(playerId) {
    const cards = typeof drawCards === "function"
      ? drawCards(playerId, OPENING_HAND_SIZE, { reason: "opening-hand" })
      : [];
    if (cards.length !== OPENING_HAND_SIZE && !GameState.gameOver) {
      console.warn(`Player ${playerId} drew ${cards.length}/${OPENING_HAND_SIZE} opening cards.`);
    }
    return cards;
  }

  function returnHandAndRedraw(playerId) {
    const player = GameState.players[playerId];
    const returned = [...player.hand];
    player.hand.length = 0;
    for (const card of returned) {
      card.zone = typeof ZoneTypes !== "undefined" ? ZoneTypes.DECK : "deck";
      player.deck.push(card);
    }
    if (typeof shuffleDeck === "function") shuffleDeck(playerId);
    if (typeof syncZoneCounts === "function") syncZoneCounts(playerId);
    return drawOpeningHand(playerId);
  }

  function cardMarkup(card) {
    const name = String(card?.name || "Unknown Card")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
    const art = card?.cardImage
      ? `<img src="${String(card.cardImage).replaceAll('"', '&quot;')}" alt="">`
      : '<span class="mulligan-card__back">WUS</span>';
    return `<article class="mulligan-card">${art}<strong>${name}</strong></article>`;
  }

  function askMulligan(playerId) {
    const modal = document.getElementById("mulliganModal");
    const title = document.getElementById("mulliganTitle");
    const prompt = document.getElementById("mulliganPrompt");
    const cards = document.getElementById("mulliganCards");
    const keepButton = document.getElementById("keepOpeningHandButton");
    const mulliganButton = document.getElementById("freeMulliganButton");
    const player = GameState.players[playerId];

    title.textContent = `${player.name}'s Opening Hand`;
    prompt.textContent = "Keep these 6 cards, or use your one free mulligan to shuffle them back and draw 6 new cards.";
    cards.innerHTML = player.hand.map(cardMarkup).join("");
    modal.hidden = false;
    document.body.classList.add("prematch-locked");

    return new Promise(resolve => {
      const finish = usedMulligan => {
        keepButton.removeEventListener("click", keep);
        mulliganButton.removeEventListener("click", mulligan);
        player.usedMulligan = usedMulligan;
        player.mulliganDecisionMade = true;
        player.mulliganAvailable = false;
        modal.hidden = true;
        document.body.classList.remove("prematch-locked");
        resolve(usedMulligan);
      };
      const keep = () => finish(false);
      const mulligan = () => {
        mulliganButton.disabled = true;
        keepButton.disabled = true;
        prompt.textContent = "Shuffling and drawing a new opening hand…";
        returnHandAndRedraw(playerId);
        cards.innerHTML = player.hand.map(cardMarkup).join("");
        setTimeout(() => {
          mulliganButton.disabled = false;
          keepButton.disabled = false;
          finish(true);
        }, 650);
      };
      keepButton.addEventListener("click", keep);
      mulliganButton.addEventListener("click", mulligan);
      keepButton.focus();
    });
  }

  async function runOpeningHandPhase() {
    GameState.openingHandPhase = { active: true, completed: false, handSize: OPENING_HAND_SIZE };

    for (const playerId of [1, 2]) resetOpeningHandState(playerId);
    for (const playerId of [1, 2]) drawOpeningHand(playerId);
    if (GameState.gameOver) return false;

    for (const playerId of [1, 2]) {
      await askMulligan(playerId);
      if (GameState.gameOver) return false;
    }

    GameState.openingHandPhase.active = false;
    GameState.openingHandPhase.completed = true;
    if (typeof addLog === "function") {
      for (const playerId of [1, 2]) {
        const player = GameState.players[playerId];
        addLog(`${player.name} ${player.usedMulligan ? "used their free mulligan" : "kept their opening hand"}.`);
      }
    }
    return true;
  }

  global.runOpeningHandPhase = runOpeningHandPhase;
})(window);
