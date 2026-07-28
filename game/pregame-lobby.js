"use strict";

/* Worlds Under Siege — V19.9.6.2 pre-game deck lobby. */
(function initPregameLobby(global) {
  const PROTOTYPE_VALUE = "__prototype__";

  function cloneRuntimeCards(cards = []) {
    return cards.map(card => ({
      ...card,
      types: Array.isArray(card.types) ? [...card.types] : card.types,
      keywords: Array.isArray(card.keywords) ? [...card.keywords] : card.keywords,
      characteristics: Array.isArray(card.characteristics) ? [...card.characteristics] : card.characteristics,
    }));
  }

  const prototypePlayers = Object.fromEntries([1, 2].map(playerId => {
    const player = GameState.players[playerId];
    return [playerId, {
      deck: cloneRuntimeCards(player.deck),
      hand: cloneRuntimeCards(player.hand),
      armyZone: cloneRuntimeCards(player.armyZone),
      selectedStrongholdId: player.selectedStrongholdId || null,
      selectedStrongholdCard: player.selectedStrongholdCard ? { ...player.selectedStrongholdCard } : null,
      loadedDeckName: "Prototype Deck",
      loadedDeckSource: PROTOTYPE_VALUE,
    }];
  }));

  function databaseEntry(cardId) {
    if (!cardId) return null;
    return typeof getCardDatabaseEntry === "function"
      ? getCardDatabaseEntry(cardId)
      : (global.WUS_CARD_DATABASE || []).find(card => card.id === cardId || card.gameplayId === cardId) || null;
  }

  function cardName(cardId, fallback = "None") {
    return databaseEntry(cardId)?.name || cardId || fallback;
  }

  function savedDeckRecords() {
    const decks = global.WUSDeckLoader?.getSavedDecks?.() || {};
    return Object.entries(decks).map(([id, deck]) => ({
      id,
      deck,
      validation: global.WUSDeckLoader.validateSavedDeck(deck),
    }));
  }

  function restorePrototype(playerId) {
    const source = prototypePlayers[playerId];
    const player = GameState.players[playerId];
    player.deck = cloneRuntimeCards(source.deck);
    player.deckCount = player.deck.length;
    player.hand = cloneRuntimeCards(source.hand);
    player.armyZone = cloneRuntimeCards(source.armyZone);
    player.selectedStrongholdId = source.selectedStrongholdId;
    player.selectedStrongholdCard = source.selectedStrongholdCard ? { ...source.selectedStrongholdCard } : null;
    player.loadedDeckName = source.loadedDeckName;
    player.loadedDeckSource = source.loadedDeckSource;
    return { valid: true, deck: { name: source.loadedDeckName } };
  }

  function buildSelect(select, records, allowPrototype) {
    select.replaceChildren();
    if (allowPrototype) {
      select.add(new Option("Prototype Deck", PROTOTYPE_VALUE));
    }
    for (const record of records) {
      const suffix = record.validation.valid
        ? ` (${record.validation.total}/60)`
        : " — Invalid";
      const option = new Option(`${record.deck.name}${suffix}`, record.id);
      option.disabled = !record.validation.valid;
      select.add(option);
    }
  }

  function getRecord(records, id) {
    return records.find(record => record.id === id) || null;
  }

  function renderDeckDetails(container, selection, records, playerId) {
    if (selection === PROTOTYPE_VALUE) {
      const prototype = prototypePlayers[playerId];
      container.innerHTML = `
        <div class="pregame-deck-details__status pregame-deck-details__status--valid">Ready</div>
        <dl>
          <div><dt>Deck</dt><dd>Prototype Deck</dd></div>
          <div><dt>Main Deck</dt><dd>${prototype.deck.length} cards</dd></div>
          <div><dt>Stronghold</dt><dd>${prototype.selectedStrongholdCard?.name || "Prototype Stronghold"}</dd></div>
          <div><dt>Armies</dt><dd>${prototype.armyZone.length ? prototype.armyZone.map(card => card.name || card.armyType).join(", ") : "None"}</dd></div>
        </dl>`;
      return true;
    }

    const record = getRecord(records, selection);
    if (!record) {
      container.innerHTML = '<div class="pregame-deck-details__status pregame-deck-details__status--invalid">Select a deck</div>';
      return false;
    }

    const { deck, validation } = record;
    const errors = validation.errors.map(error => `<li>${escapeHtml(error)}</li>`).join("");
    container.innerHTML = `
      <div class="pregame-deck-details__status ${validation.valid ? "pregame-deck-details__status--valid" : "pregame-deck-details__status--invalid"}">
        ${validation.valid ? "Valid deck" : "Invalid deck"}
      </div>
      <dl>
        <div><dt>Deck</dt><dd>${escapeHtml(deck.name)}</dd></div>
        <div><dt>Main Deck</dt><dd>${validation.total}/60 cards</dd></div>
        <div><dt>Stronghold</dt><dd>${escapeHtml(cardName(deck.stronghold))}</dd></div>
        <div><dt>Armies</dt><dd>${deck.armies.length ? deck.armies.map(id => escapeHtml(cardName(id))).join(", ") : "None"}</dd></div>
      </dl>
      ${errors ? `<ul class="pregame-deck-details__errors">${errors}</ul>` : ""}`;
    return validation.valid;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function applySelection(selection, playerId, records) {
    if (selection === PROTOTYPE_VALUE) return restorePrototype(playerId);
    const record = getRecord(records, selection);
    if (!record) return { valid: false, errors: ["No deck was selected."] };
    return global.WUSDeckLoader.applySavedDeckToPlayer(record.deck, playerId, {
      shuffle: true,
      source: record.id,
    });
  }

  function runPregameLobby() {
    const modal = document.getElementById("pregameLobbyModal");
    const playerOneSelect = document.getElementById("playerOneDeckSelect");
    const playerTwoSelect = document.getElementById("playerTwoDeckSelect");
    const playerOneDetails = document.getElementById("playerOneDeckDetails");
    const playerTwoDetails = document.getElementById("playerTwoDeckDetails");
    const startButton = document.getElementById("startMatchButton");
    const cancelButton = document.getElementById("cancelMatchSetupButton");
    const message = document.getElementById("pregameLobbyMessage");
    const records = savedDeckRecords();
    const validRecords = records.filter(record => record.validation.valid);

    buildSelect(playerOneSelect, records, validRecords.length === 0);
    buildSelect(playerTwoSelect, records, true);

    if (validRecords.length) playerOneSelect.value = validRecords[0].id;
    else playerOneSelect.value = PROTOTYPE_VALUE;
    playerTwoSelect.value = PROTOTYPE_VALUE;

    modal.hidden = false;
    document.body.classList.add("prematch-locked");

    return new Promise(resolve => {
      function update() {
        const playerOneValid = renderDeckDetails(playerOneDetails, playerOneSelect.value, records, 1);
        const playerTwoValid = renderDeckDetails(playerTwoDetails, playerTwoSelect.value, records, 2);
        startButton.disabled = !(playerOneValid && playerTwoValid);
        message.textContent = records.length
          ? "Choose both players’ decks, then start the match."
          : "No saved decks were found. Prototype decks are available.";
      }

      function cleanup() {
        playerOneSelect.removeEventListener("change", update);
        playerTwoSelect.removeEventListener("change", update);
        startButton.removeEventListener("click", start);
        cancelButton.removeEventListener("click", cancel);
      }

      function start(event) {
        event?.preventDefault?.();
        console.log("[Startup] Start Match clicked", {
          playerOne: playerOneSelect.value,
          playerTwo: playerTwoSelect.value,
          disabled: startButton.disabled,
        });
        if (startButton.disabled) return;
        startButton.disabled = true;
        startButton.setAttribute("aria-busy", "true");

        const first = applySelection(playerOneSelect.value, 1, records);
        const second = applySelection(playerTwoSelect.value, 2, records);
        if (!first.valid || !second.valid) {
          message.textContent = [...(first.errors || []), ...(second.errors || [])].join(" ");
          startButton.disabled = false;
          startButton.removeAttribute("aria-busy");
          return;
        }

        GameState.log.push(`${GameState.players[1].name} selected ${GameState.players[1].loadedDeckName}.`);
        GameState.log.push(`${GameState.players[2].name} selected ${GameState.players[2].loadedDeckName}.`);
        modal.hidden = true;
        document.body.classList.remove("prematch-locked");
        cleanup();
        console.log("[Startup] Lobby resolving");
        resolve({
          playerOne: playerOneSelect.value,
          playerTwo: playerTwoSelect.value,
        });
      }

      function cancel() {
        cleanup();
        global.location.href = "../index.html";
      }

      playerOneSelect.addEventListener("change", update);
      playerTwoSelect.addEventListener("change", update);
      startButton.addEventListener("click", start);
      cancelButton.addEventListener("click", cancel);
      update();
      playerOneSelect.focus();
    });
  }

  global.runPregameLobby = runPregameLobby;
})(window);
