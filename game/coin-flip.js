"use strict";

/* Worlds Under Siege — cinematic pre-match coin flip and play-order choice. */
(function initCoinFlip(global) {
  const FLIP_DURATION_MS = 2600;
  const SETTLE_DELAY_MS = 450;

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

  const COIN_SOUND_URL = new URL("../sound/coin-flip.mp3", document.baseURI).href;

  const COIN_LOGO_PATHS = [
    "../logo.png",
    "/logo.png",
    "./logo.png"
  ];

  function configureCoinLogos() {
    document.querySelectorAll(".coin-flip-modal__coin-face img").forEach(image => {
      let pathIndex = 0;
      const tryNextPath = () => {
        if (pathIndex >= COIN_LOGO_PATHS.length) {
          console.warn("[Coin Flip] No logo image path could be loaded.");
          image.removeEventListener("error", tryNextPath);
          return;
        }
        image.src = COIN_LOGO_PATHS[pathIndex++];
      };
      image.addEventListener("error", tryNextPath);
      tryNextPath();
    });
  }

  function playCoinFlipSound() {
    try {
      const audio = new Audio();
      audio.preload = "auto";
      audio.volume = 1;
      audio.src = COIN_SOUND_URL;
      audio.addEventListener("error", () => {
        console.error(`[Coin Flip] Could not load ${COIN_SOUND_URL}. The file must exist in the main-branch sound folder at ../sound/coin-flip.mp3 relative to the game page.`);
      }, { once: true });
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(error => {
          if (error?.name !== "NotAllowedError") {
            console.warn("[Coin Flip] Sound could not play:", error);
          }
        });
      }
      return audio;
    } catch (error) {
      console.warn("[Coin Flip] Sound setup failed:", error);
      return null;
    }
  }

  async function animateCoin(landed) {
    const stage = document.querySelector(".coin-flip-modal__coin-stage");
    const coin = document.getElementById("coinFlipCoin");
    const shadow = document.querySelector(".coin-flip-modal__coin-shadow");
    if (!stage || !coin) {
      await delay(FLIP_DURATION_MS);
      return;
    }

    coin.classList.remove("is-heads", "is-tails", "is-settled");
    stage.classList.remove("is-flipping", "is-landed");
    void coin.offsetWidth;

    const reducedMotion = global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const finalRotation = landed === "heads" ? 2160 : 2340;
    playCoinFlipSound();

    if (reducedMotion || typeof coin.animate !== "function") {
      stage.classList.add("is-flipping");
      await delay(reducedMotion ? 250 : FLIP_DURATION_MS);
      stage.classList.remove("is-flipping");
      coin.style.transform = `rotateY(${finalRotation}deg)`;
    } else {
      stage.classList.add("is-flipping");

      const coinAnimation = coin.animate([
        { transform: "rotateY(0deg) rotateX(0deg)", offset: 0 },
        { transform: "rotateY(900deg) rotateX(18deg)", offset: 0.42 },
        { transform: "rotateY(1740deg) rotateX(-9deg)", offset: 0.78 },
        { transform: `rotateY(${finalRotation}deg) rotateX(0deg)`, offset: 1 }
      ], {
        duration: FLIP_DURATION_MS,
        easing: "cubic-bezier(.16,.72,.2,1)",
        fill: "forwards"
      });

      const stageAnimation = stage.animate([
        { transform: "translateY(0) scale(1)", offset: 0 },
        { transform: "translateY(-82px) scale(1.08)", offset: 0.32 },
        { transform: "translateY(-48px) scale(1.04)", offset: 0.68 },
        { transform: "translateY(7px) scale(.98)", offset: 0.92 },
        { transform: "translateY(-4px) scale(1.01)", offset: 0.97 },
        { transform: "translateY(0) scale(1)", offset: 1 }
      ], {
        duration: FLIP_DURATION_MS,
        easing: "cubic-bezier(.2,.75,.22,1)",
        fill: "forwards"
      });

      shadow?.animate([
        { transform: "translateX(-50%) scale(1)", opacity: .46, offset: 0 },
        { transform: "translateX(-50%) scale(.5)", opacity: .16, offset: .34 },
        { transform: "translateX(-50%) scale(.72)", opacity: .24, offset: .7 },
        { transform: "translateX(-50%) scale(1.12)", opacity: .58, offset: .92 },
        { transform: "translateX(-50%) scale(1)", opacity: .46, offset: 1 }
      ], { duration: FLIP_DURATION_MS, easing: "ease-in-out", fill: "forwards" });

      await Promise.allSettled([coinAnimation.finished, stageAnimation.finished]);
      coin.style.transform = `rotateY(${finalRotation}deg)`;
    }

    stage.classList.remove("is-flipping");
    stage.classList.add("is-landed");
    coin.classList.add(landed === "heads" ? "is-heads" : "is-tails", "is-settled");
    await delay(SETTLE_DELAY_MS);
  }

  async function runCoinFlip() {
    const modal = document.getElementById("coinFlipModal");
    const prompt = document.getElementById("coinFlipPrompt");
    const result = document.getElementById("coinFlipResult");
    const actions = modal?.querySelector(".coin-flip-modal__actions");
    if (!modal || !prompt || !result || !actions) {
      throw new Error("Coin flip UI is missing required elements.");
    }

    const callerId = Math.random() < 0.5 ? 1 : 2;
    const caller = GameState.players[callerId];
    const opponentId = callerId === 1 ? 2 : 1;

    configureCoinLogos();
    modal.hidden = false;
    document.body.classList.add("prematch-locked");
    prompt.textContent = `${caller.name} was randomly chosen to call the coin. Choose Heads or Tails.`;
    result.textContent = "";
    result.classList.remove("is-visible");
    actions.hidden = false;
    actions.innerHTML = `
      <button type="button" data-coin-call="heads">Heads</button>
      <button type="button" data-coin-call="tails">Tails</button>`;

    const callButtons = [...actions.querySelectorAll("[data-coin-call]")];
    const call = await waitForChoice(callButtons, "coinCall");
    callButtons.forEach(button => { button.disabled = true; });

    const landed = Math.random() < 0.5 ? "heads" : "tails";
    const winnerId = call === landed ? callerId : opponentId;
    const winner = GameState.players[winnerId];

    prompt.textContent = "Flipping for first player…";
    actions.hidden = true;
    await animateCoin(landed);

    result.textContent = `${landed.toUpperCase()}! ${winner.name} won the flip.`;
    result.classList.add("is-visible");
    await delay(900);

    prompt.textContent = `${winner.name}, choose whether to play first or second.`;
    result.textContent = "";
    result.classList.remove("is-visible");
    actions.hidden = false;
    actions.innerHTML = `
      <button type="button" data-play-order="first">Play First</button>
      <button type="button" data-play-order="second">Play Second</button>`;

    const orderButtons = [...actions.querySelectorAll("[data-play-order]")];
    const choice = await waitForChoice(orderButtons, "playOrder");
    const firstPlayerId = choice === "first" ? winnerId : (winnerId === 1 ? 2 : 1);
    setFirstPlayer(firstPlayerId);
    result.textContent = `${GameState.players[firstPlayerId].name} will play first.`;
    result.classList.add("is-visible");

    await delay(900);
    modal.hidden = true;
    document.body.classList.remove("prematch-locked");
    return { callerId, call, landed, winnerId, choice, firstPlayerId };
  }

  global.runCoinFlip = runCoinFlip;
})(window);
