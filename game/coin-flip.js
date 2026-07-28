"use strict";

/* Worlds Under Siege — V19.9.6.3 pre-match coin flip and play-order choice. */
(function initCoinFlip(global) {
  function setFirstPlayer(playerId) {
    GameState.activePlayer = playerId;
    GameState.firstPlayerId = playerId;
    GameState.turn = 1;
    for (const id of [1, 2]) {
      const player = GameState.players[id];
      player.maxEnergy = id === playerId ? 1 : 0;
      player.energy = player.maxEnergy;
    }
  }

  function waitForChoice(buttons, attribute) {
    return new Promise(resolve => {
      const choose = event => {
        buttons.forEach(button => button.removeEventListener("click", choose));
        resolve(event.currentTarget.dataset[attribute]);
      };
      buttons.forEach(button => button.addEventListener("click", choose));
      buttons[0]?.focus();
    });
  }

  async function runCoinFlip() {
    const modal = document.getElementById("coinFlipModal");
    const prompt = document.getElementById("coinFlipPrompt");
    const result = document.getElementById("coinFlipResult");
    const actions = modal.querySelector(".coin-flip-modal__actions");
    const callerId = Math.random() < 0.5 ? 1 : 2;
    const caller = GameState.players[callerId];
    const opponentId = callerId === 1 ? 2 : 1;

    modal.hidden = false;
    document.body.classList.add("prematch-locked");
    prompt.textContent = `${caller.name} was randomly chosen to call the coin. Choose Heads or Tails.`;
    result.textContent = "";
    actions.innerHTML = `
      <button type="button" data-coin-call="heads">Heads</button>
      <button type="button" data-coin-call="tails">Tails</button>`;

    const callButtons = [...actions.querySelectorAll("[data-coin-call]")];
    const call = await waitForChoice(callButtons, "coinCall");
    callButtons.forEach(button => { button.disabled = true; });

    const landed = Math.random() < 0.5 ? "heads" : "tails";
    const winnerId = call === landed ? callerId : opponentId;
    const winner = GameState.players[winnerId];
    result.textContent = `The coin landed ${landed.toUpperCase()}. ${winner.name} won the flip.`;

    await new Promise(resolve => setTimeout(resolve, 700));
    prompt.textContent = `${winner.name}, choose whether to play first or second.`;
    result.textContent = "";
    actions.innerHTML = `
      <button type="button" data-play-order="first">Play First</button>
      <button type="button" data-play-order="second">Play Second</button>`;

    const orderButtons = [...actions.querySelectorAll("[data-play-order]")];
    const choice = await waitForChoice(orderButtons, "playOrder");
    const firstPlayerId = choice === "first" ? winnerId : (winnerId === 1 ? 2 : 1);
    setFirstPlayer(firstPlayerId);
    result.textContent = `${GameState.players[firstPlayerId].name} will play first.`;

    await new Promise(resolve => setTimeout(resolve, 900));
    modal.hidden = true;
    document.body.classList.remove("prematch-locked");
    return { callerId, call, landed, winnerId, choice, firstPlayerId };
  }

  global.runCoinFlip = runCoinFlip;
})(window);
