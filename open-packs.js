(() => {
  "use strict";

  const BOX_PACK_COUNT = 24;
  const ECONOMY = Object.freeze({ enabled: true, packCost: 200, boxCost: 4400 });
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const normalViewportContent = viewportMeta?.getAttribute("content") || "width=device-width, initial-scale=1";

  const siteCardsById = new Map(
    (typeof cards !== "undefined" ? cards : [])
      .filter(card => card && card.id)
      .map(card => [card.id, card])
  );

  const packCards = BOA_PACK_CARDS.map(card => {
    const siteCard = siteCardsById.get(card.id);
    return { ...card, name: siteCard?.name || card.name, image: siteCard?.image || card.image, type: siteCard?.type || card.type };
  });

  const groups = packCards.reduce((result, card) => {
    (result[card.rarity] ??= []).push(card);
    return result;
  }, {});

  const stages = {
    store: document.getElementById("storeStage"),
    starterDecks: document.getElementById("starterDeckStage"),
    starterReveal: document.getElementById("starterRevealStage"),
    intro: document.getElementById("introStage"),
    booster: document.getElementById("boosterStage"),
    boxPacks: document.getElementById("boxPacksStage"),
    reveal: document.getElementById("revealStage"),
    summary: document.getElementById("boxSummaryStage")
  };

  const chooseStarterDecks = document.getElementById("chooseStarterDecks");
  const chooseBattleOfAges = document.getElementById("chooseBattleOfAges");
  const starterBackButton = document.getElementById("starterBackButton");
  const setBackButton = document.getElementById("setBackButton");
  const starterArmory = document.getElementById("starterArmory");
  const starterPurchaseMessage = document.getElementById("starterPurchaseMessage");
  const starterRevealTitle = document.getElementById("starterRevealTitle");
  const starterRevealSubtitle = document.getElementById("starterRevealSubtitle");
  const starterCommanderName = document.getElementById("starterCommanderName");
  const starterCommanderId = document.getElementById("starterCommanderId");
  const starterCommanderImage = document.getElementById("starterCommanderImage");
  const starterRevealGrid = document.getElementById("starterRevealGrid");
  const starterRevealAllButton = document.getElementById("starterRevealAllButton");
  const starterRevealContinueButton = document.getElementById("starterRevealContinueButton");
  const starterRevealResult = document.getElementById("starterRevealResult");
  const beginButton = document.getElementById("beginButton");
  const beginBoxButton = document.getElementById("beginBoxButton");
  const boosterButton = document.getElementById("boosterButton");
  const anotherButton = document.getElementById("anotherPackButton");
  const returnToPacksButton = document.getElementById("returnToPacksButton");
  const openNextPackButton = document.getElementById("openNextPackButton");
  const revealAllButton = document.getElementById("revealAllButton");
  const grid = document.getElementById("cardGrid");
  const status = document.getElementById("packStatus");
  const instruction = document.getElementById("revealInstruction");
  const revealEyebrow = document.getElementById("revealEyebrow");
  const previewImage = document.getElementById("previewImage");
  const previewName = document.getElementById("previewName");
  const previewRarity = document.getElementById("previewRarity");
  const cardZoomHint = document.getElementById("cardZoomHint");
  const clickHint = boosterButton.querySelector(".click-hint");
  const boosterHeading = document.getElementById("boosterHeading");
  const boosterInstruction = document.getElementById("boosterInstruction");
  const boxProgressBooster = document.getElementById("boxProgressBooster");
  const boxProgressBoosterText = document.getElementById("boxProgressBoosterText");
  const boxProgressBoosterFill = document.getElementById("boxProgressBoosterFill");
  const boxProgressReveal = document.getElementById("boxProgressReveal");
  const boxPackGrid = document.getElementById("boxPackGrid");
  const boxPacksRemaining = document.getElementById("boxPacksRemaining");
  const boxPacksTrackFill = document.getElementById("boxPacksTrackFill");
  const openAllPacksButton = document.getElementById("openAllPacksButton");
  const openAllOverlay = document.getElementById("openAllOverlay");
  const openAllAnimation = document.getElementById("openAllAnimation");
  const openAllStatus = document.getElementById("openAllStatus");
  const openAllProgressFill = document.getElementById("openAllProgressFill");
  const openAllProgressText = document.getElementById("openAllProgressText");
  const godPackOverlay = document.getElementById("godPackOverlay");
  const godPackFlash = document.getElementById("godPackFlash");

  const boxTotalCards = document.getElementById("boxTotalCards");
  const boxRarityStats = document.getElementById("boxRarityStats");
  const boxPremiumGrid = document.getElementById("boxPremiumGrid");
  const boxAllPulls = document.getElementById("boxAllPulls");
  const boxRevealDetailsButton = document.getElementById("boxRevealDetailsButton");
  const openAnotherBoxButton = document.getElementById("openAnotherBoxButton");
  const backToSelectionButton = document.getElementById("backToSelectionButton");
  const bestPullSection = document.getElementById("bestPullSection");
  const bestPullHeading = document.getElementById("bestPullHeading");
  const bestPullCard = document.getElementById("bestPullCard");
  const goldBalances = [...document.querySelectorAll("[data-gold-balance]")];
  const collectionResult = document.getElementById("collectionResult");
  const economyMessage = document.getElementById("economyMessage");

  const assetStatus = document.getElementById("assetStatus");
  const downloadAssetsButton = document.getElementById("downloadAssetsButton");
  const repairAssetsButton = document.getElementById("repairAssetsButton");
  const assetProgress = document.getElementById("assetProgress");
  const assetProgressFill = document.getElementById("assetProgressFill");
  const assetProgressText = document.getElementById("assetProgressText");
  const assetErrors = document.getElementById("assetErrors");
  const assetErrorList = document.getElementById("assetErrorList");

  const assetGate = document.getElementById("assetGate");
  const assetGateStatus = document.getElementById("assetGateStatus");
  const assetGateDownload = document.getElementById("assetGateDownload");
  const assetGateProgress = document.getElementById("assetGateProgress");
  const assetGateProgressFill = document.getElementById("assetGateProgressFill");
  const assetGateProgressText = document.getElementById("assetGateProgressText");
  const assetGateErrors = document.getElementById("assetGateErrors");
  const assetGateErrorList = document.getElementById("assetGateErrorList");

  const allImagePaths = window.WUSAssetManifest?.getRequiredCardImages()
    || [...new Set(packCards.map(card => card.image).filter(Boolean))];
  let currentPack = [];
  let openingMode = "single";
  let boxSession = createEmptyBoxSession();
  let selectedBoxPack = null;
  let currentPackCollectionResult = null;
  let currentPackSaved = false;
  let openingAllPacks = false;
  let currentPackIsGodPack = false;
  let activeStarterRevealDeck = null;
  let starterRevealCards = [];
  let starterRevealCount = 0;

  const GOD_PACK_CHANCE = .002; // 0.2% = 1 in 500 packs

  const soundPaths = Object.freeze({
    click: "sounds/mouse-click.mp3",
    purchase: "sounds/drop-coin.mp3",
    boxSummary: "sounds/box-summary.mp3",
    packRip: "sounds/pack-rip.mp3",
    godPack: "sounds/god-pack.mp3",
    packPop: "sounds/card-flip.mp3",
    cardFlip: "sounds/card-flip.mp3",
    superRare: "sounds/super-rare.mp3",
    ultraRare: "sounds/ultra-rare.mp3",
    secretRare: Object.freeze({
      dark: "sounds/secret-rare-dark.mp3",
      braam: "sounds/secret-rare-braam.mp3",
      sparkle: "sounds/secret-rare-sparkle.mp3"
    })
  });

  // All exported files are loudness-normalized. Single sounds therefore share
  // one playback level. Each Secret Rare layer is reduced so the combined
  // three-sound reveal stays close to the same perceived level without clipping.
  const SOUND_VOLUME = 0.5;
  const PURCHASE_SOUND_VOLUME = 0.8;
  const SECRET_LAYER_VOLUME = 0.29;
  const STARTER_DECK_PRICE = 1000;
  const STARTER_OWNERSHIP_KEY = "wus-owned-starter-decks-v1";
  const PORTRAIT_UNLOCKS_KEY = "wus-unlocked-profile-portraits-v1";
  const STARTER_DECKS = Object.freeze([
    {
      id: "eternal-night", name: "Eternal Night", image: "Eternal Night.png", commanderId: "SD1-002",
      commanderName: "Dracula", commanderImage: "cards/SD1-002 Dracula.jpg",
      description: "Eternal Night is a sinister Starter Deck that embraces the Darkness of classic monsters and the supernatural. Fill your discard pile to fuel powerful effects, conceal your cards face-down to keep your opponents guessing, and raise fallen allies back to the battlefield.",
      cardIds: ["BOA-212", "BOA-194", "BOA-196", "BOA-195", "BOA-023", "BOA-025", "BOA-029", "BOA-029", "BOA-113", "BOA-113", "BOA-091", "BOA-091", "BOA-034", "BOA-034", "BOA-033", "BOA-033", "BOA-128", "BOA-128", "BOA-148", "BOA-148", "BOA-024", "BOA-024", "BOA-130", "BOA-130", "BOA-131", "BOA-131", "BOA-031", "BOA-031", "BOA-159", "BOA-173", "BOA-173", "BOA-136", "BOA-146", "BOA-115", "BOA-115", "BOA-127", "BOA-127", "BOA-171", "BOA-125", "BOA-110", "BOA-110", "BOA-150", "BOA-081", "BOA-026", "BOA-026", "BOA-123", "BOA-123", "BOA-157", "BOA-157", "BOA-032", "BOA-032", "BOA-132", "BOA-105", "BOA-135", "BOA-030", "BOA-138", "BOA-035", "BOA-022", "BOA-134", "BOA-021", "BOA-092", "BOA-152", "BOA-013", "SD1-002"]
    },
    {
      id: "legends-of-camelot", name: "Legends of Camelot", image: "Legends of Camelot.png", commanderId: "SD1-001",
      commanderName: "King Arthur", commanderImage: "cards/SD1-001 King Arthur.jpg",
      description: "Legends of Camelot is a boost-focused Starter Deck built around King Arthur, the legendary Knights of the Round Table, and their sacred relics. Strengthen your champions by empowering one another with powerful boosts while equipping iconic items to unlock their full potential.",
      cardIds: ["BOA-211", "BOA-191", "BOA-192", "BOA-193", "BOA-155", "BOA-151", "BOA-101", "BOA-101", "BOA-119", "BOA-119", "BOA-177", "BOA-122", "BOA-122", "BOA-103", "BOA-103", "BOA-012", "BOA-012", "BOA-201", "BOA-009", "BOA-009", "BOA-019", "BOA-019", "BOA-017", "BOA-017", "BOA-006", "BOA-006", "BOA-007", "BOA-007", "BOA-010", "BOA-010", "BOA-016", "BOA-016", "BOA-129", "BOA-118", "BOA-118", "BOA-116", "BOA-116", "BOA-011", "BOA-011", "BOA-170", "BOA-121", "BOA-121", "BOA-018", "BOA-015", "BOA-005", "BOA-005", "BOA-014", "BOA-014", "BOA-123", "BOA-123", "BOA-167", "BOA-102", "BOA-102", "BOA-104", "BOA-166", "BOA-120", "BOA-168", "BOA-008", "BOA-004", "BOA-124", "BOA-158", "BOA-003", "BOA-169", "SD1-001"]
    },
    {
      id: "wild-dominion", name: "Wild Dominion", image: "Wild Dominion.png", commanderId: "SD1-003",
      commanderName: "Tarzan", commanderImage: "cards/SD1-003 Tarzan.jpg",
      description: "Wild Dominion is a fast-paced Starter Deck where the untamed strength of the jungle overwhelms your opponents. Command fierce animals that strike with incredible speed and power, while Tarzan leads the charge by calling loyal beasts on the battlefield for free.",
      cardIds: ["BOA-218", "BOA-198", "BOA-196", "BOA-199", "BOA-155", "BOA-155", "BOA-206", "BOA-037", "BOA-101", "BOA-101", "BOA-205", "BOA-095", "BOA-095", "BOA-099", "BOA-099", "BOA-103", "BOA-103", "BOA-055", "BOA-055", "BOA-060", "BOA-060", "BOA-117", "BOA-180", "BOA-147", "BOA-147", "BOA-146", "BOA-146", "BOA-096", "BOA-096", "BOA-047", "BOA-145", "BOA-145", "BOA-145", "BOA-156", "BOA-069", "BOA-097", "BOA-097", "BOA-041", "BOA-041", "BOA-094", "BOA-094", "BOA-106", "BOA-106", "BOA-140", "BOA-140", "BOA-044", "BOA-044", "BOA-098", "BOA-098", "BOA-123", "BOA-123", "BOA-161", "BOA-142", "BOA-139", "BOA-093", "BOA-093", "BOA-100", "BOA-100", "BOA-164", "BOA-063", "BOA-088", "BOA-162", "BOA-092", "SD1-003"]
    }
  ]);

  // Keep one persistent summary sound and unlock it during the first user gesture.
  // This avoids browsers blocking playback after the long async box-opening sequence.
  const boxSummaryAudio = new Audio(soundPaths.boxSummary);
  boxSummaryAudio.preload = "auto";
  boxSummaryAudio.volume = SOUND_VOLUME;

  function unlockBoxSummaryAudio() {
    boxSummaryAudio.volume = 0;
    const attempt = boxSummaryAudio.play();
    if (attempt && typeof attempt.then === "function") {
      attempt
        .then(() => {
          boxSummaryAudio.pause();
          boxSummaryAudio.currentTime = 0;
          boxSummaryAudio.volume = SOUND_VOLUME;
        })
        .catch(() => {
          boxSummaryAudio.volume = SOUND_VOLUME;
        });
    }
  }

  document.addEventListener("pointerdown", unlockBoxSummaryAudio, { once: true });

  function playSound(path, volume = 0.5, playbackRate = 1) {
    if (!path) return;
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.playbackRate = Math.max(0.5, Math.min(2, playbackRate));
    audio.play().catch(() => {});
  }

  function playPackPop() {
    // A tiny pitch change keeps repeated booster-box bursts from sounding copied.
    const variedRate = 0.98 + Math.random() * 0.04;
    playSound(soundPaths.packPop, SOUND_VOLUME, variedRate);
  }

  function playSecretRareSound() {
    // Ominous opening, then the impact, then the magical rise.
    playSound(soundPaths.secretRare.dark, SECRET_LAYER_VOLUME);
    window.setTimeout(() => {
      playSound(soundPaths.secretRare.braam, SECRET_LAYER_VOLUME);
    }, 250);
    window.setTimeout(() => {
      playSound(soundPaths.secretRare.sparkle, SECRET_LAYER_VOLUME);
    }, 800);
  }

  function playRaritySound(rarity) {
    if (rarity === "Super Rare") {
      playSound(soundPaths.superRare, SOUND_VOLUME);
      return;
    }

    if (rarity === "Ultra Rare") {
      playSound(soundPaths.ultraRare, SOUND_VOLUME);
      return;
    }

    if (rarity === "Secret Rare") {
      playSecretRareSound();
      return;
    }

    playSound(soundPaths.cardFlip, SOUND_VOLUME, 0.98 + Math.random() * 0.04);
  }

  function preloadSounds() {
    const paths = [
      soundPaths.click,
      soundPaths.purchase,
      soundPaths.boxSummary,
      soundPaths.packRip,
      soundPaths.godPack,
      soundPaths.packPop,
      soundPaths.cardFlip,
      soundPaths.superRare,
      soundPaths.ultraRare,
      ...Object.values(soundPaths.secretRare)
    ];
    paths.forEach(path => {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = path;
      audio.load();
    });
  }

  preloadSounds();

  function loadOwnedStarterDecks() {
    const cloudOwned = window.WUSCloudStarters?.getOwnedDeckIds?.();
    if (cloudOwned) return new Set(cloudOwned);

    try {
      return new Set(JSON.parse(localStorage.getItem(STARTER_OWNERSHIP_KEY) || "[]"));
    } catch {
      return new Set();
    }
  }

  function saveOwnedStarterDecks(owned) {
    localStorage.setItem(STARTER_OWNERSHIP_KEY, JSON.stringify([...owned]));
  }

  function starterCardObjects(deck) {
    return deck.cardIds.map(id => siteCardsById.get(id) || packCards.find(card => card.id === id) || {
      id, name: id, rarity: "Common", type: "Character", image: `cards/${id}.jpg`
    });
  }

  function showStarterMessage(message, isError = false) {
    starterPurchaseMessage.textContent = message;
    starterPurchaseMessage.classList.toggle("economy-error", isError);
  }

  async function purchaseStarterDeck(deck) {
    if (!window.WUSCollection) return;

    const owned = loadOwnedStarterDecks();
    if (owned.has(deck.id)) return;

    const button = starterArmory?.querySelector(
      `.starter-deck-product[data-deck-id="${deck.id}"] .starter-buy-button`
    );
    const originalLabel = button?.textContent || "";

    if (button) {
      button.disabled = true;
      button.textContent = "Purchasing…";
    }

    try {
      if (window.WUSCloudStarters?.isAvailable?.()) {
        const cloudResult = await window.WUSCloudStarters.purchase(deck.id);

        if (!cloudResult.ok) {
          const message = cloudResult.reason === "insufficient-gold"
            ? `Not enough Gold. ${deck.name} costs 1,000 Gold and you currently have ${Number(cloudResult.gold || 0).toLocaleString()}.`
            : cloudResult.reason === "already-owned"
              ? `${deck.name} is already owned by this account.`
              : cloudResult.message || "The starter deck purchase could not be completed.";

          showStarterMessage(message, true);
          await window.WUSCloudStarters.syncLocalMirror();
          refreshGold();
          renderStarterArmory();
          return;
        }

        const cardsToReveal = starterCardObjects(deck);
        const revealResult = {
          added: Number(cloudResult.added || 0),
          converted: Number(cloudResult.converted || 0),
          goldEarned: Number(cloudResult.gold_earned || 0)
        };

        playSound(soundPaths.purchase, PURCHASE_SOUND_VOLUME);
        showGoldSpendAnimation(STARTER_DECK_PRICE);
        await window.WUSCloudStarters.syncLocalMirror();
        refreshGold();
        renderStarterArmory();
        beginStarterDeckReveal(deck, cardsToReveal, revealResult);
        return;
      }

      // Local fallback for offline testing or before the Supabase SQL is installed.
      const spend = WUSCollection.spendGold(STARTER_DECK_PRICE);
      if (!spend.ok) {
        showStarterMessage(
          `Not enough Gold. ${deck.name} costs 1,000 Gold and you currently have ${spend.gold.toLocaleString()}.`,
          true
        );
        refreshGold();
        return;
      }

      const cardsToGrant = starterCardObjects(deck);
      const result = WUSCollection.addCards(cardsToGrant);

      owned.add(deck.id);
      saveOwnedStarterDecks(owned);
      unlockStarterPortrait(deck);

      playSound(soundPaths.purchase, PURCHASE_SOUND_VOLUME);
      showGoldSpendAnimation(STARTER_DECK_PRICE);
      refreshGold();
      renderStarterArmory();
      beginStarterDeckReveal(deck, cardsToGrant, result);
    } catch (error) {
      console.error("Starter purchase failed:", error);
      showStarterMessage(
        "The purchase could not be completed. Check your connection and try again.",
        true
      );
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
  }

  function unlockStarterPortrait(deck) {
    let unlocked = [];

    try {
      unlocked = JSON.parse(localStorage.getItem(PORTRAIT_UNLOCKS_KEY) || "[]");
      if (!Array.isArray(unlocked)) unlocked = [];
    } catch {
      unlocked = [];
    }

    if (!unlocked.includes(deck.commanderId)) {
      unlocked.push(deck.commanderId);
      localStorage.setItem(PORTRAIT_UNLOCKS_KEY, JSON.stringify(unlocked));
      window.dispatchEvent(new CustomEvent("wus-portrait-unlocked", {
        detail: {
          cardId: deck.commanderId,
          name: deck.commanderName,
          image: deck.commanderImage
        }
      }));
    }
  }

  function beginStarterDeckReveal(deck, cards, result) {
    activeStarterRevealDeck = deck;
    starterRevealCards = cards;
    starterRevealCount = 0;

    starterRevealTitle.textContent = deck.name;
    starterRevealSubtitle.textContent =
      `${cards.length} cards were added to your collection. Reveal them to inspect your new army.`;
    starterCommanderName.textContent = deck.commanderName;
    starterCommanderId.textContent = deck.commanderId;
    starterCommanderImage.src = deck.commanderImage;
    starterCommanderImage.alt = deck.commanderName;

    starterRevealAllButton.hidden = false;
    starterRevealAllButton.disabled = false;
    starterRevealContinueButton.hidden = true;
    starterRevealResult.hidden = true;
    starterRevealResult.textContent = "";

    starterRevealGrid.replaceChildren(
      ...cards.map((card, index) => createStarterRevealCard(card, index, deck))
    );

    starterRevealResult.dataset.added = String(result.added || 0);
    starterRevealResult.dataset.converted = String(result.converted || 0);
    starterRevealResult.dataset.goldEarned = String(result.goldEarned || 0);

    showStage(stages.starterReveal);
  }

  function createStarterRevealCard(card, index, deck) {
    const button = document.createElement("button");
    const isCommander = card.id === deck.commanderId;

    button.type = "button";
    button.className = `starter-reveal-card${isCommander ? " is-commander" : ""}`;
    button.dataset.index = String(index);
    button.dataset.revealed = "false";
    button.setAttribute("aria-label", `Reveal card ${index + 1}`);
    button.innerHTML = `
      <span class="starter-card-inner">
        <span class="starter-card-back">
          <img src="card-back.png" alt="">
          ${isCommander ? '<span class="commander-seal">Commander</span>' : ""}
        </span>
        <span class="starter-card-front">
          <img src="${card.image}" alt="${card.name || card.id}">
          ${isCommander ? '<span class="commander-glow" aria-hidden="true"></span>' : ""}
        </span>
      </span>
    `;

    button.addEventListener("click", () => revealStarterCard(button, card, isCommander));
    return button;
  }

  function revealStarterCard(button, card, isCommander) {
    if (button.dataset.revealed === "true") {
      openCardZoomFromStarter(card);
      return;
    }

    button.dataset.revealed = "true";
    button.classList.add("revealed");
    starterRevealCount += 1;

    if (isCommander) {
      playRaritySound(card.rarity || "Ultra Rare");
      button.classList.add("commander-revealed");
    } else {
      playSound(soundPaths.cardFlip, SOUND_VOLUME, .98 + Math.random() * .04);
    }

    if (starterRevealCount >= starterRevealCards.length) {
      finishStarterReveal();
    }
  }

  function revealAllStarterCards() {
    starterRevealAllButton.disabled = true;

    const unrevealed = [...starterRevealGrid.querySelectorAll(".starter-reveal-card")]
      .filter(card => card.dataset.revealed !== "true");

    unrevealed.forEach((button, index) => {
      window.setTimeout(() => {
        const card = starterRevealCards[Number(button.dataset.index)];
        revealStarterCard(
          button,
          card,
          card.id === activeStarterRevealDeck?.commanderId
        );
      }, Math.min(index * 45, 2200));
    });
  }

  function finishStarterReveal() {
    starterRevealAllButton.hidden = true;
    starterRevealContinueButton.hidden = false;

    const added = Number(starterRevealResult.dataset.added || 0);
    const converted = Number(starterRevealResult.dataset.converted || 0);
    const goldEarned = Number(starterRevealResult.dataset.goldEarned || 0);

    starterRevealResult.innerHTML = `
      <strong>${activeStarterRevealDeck.name} is ready!</strong>
      <span>${added} cards added to your collection.</span>
      ${converted
        ? `<span>${converted} extra cards became ${goldEarned.toLocaleString()} Gold.</span>`
        : ""}
      <span>${activeStarterRevealDeck.commanderName} is now unlocked as a profile portrait.</span>
    `;
    starterRevealResult.hidden = false;
  }

  function openCardZoomFromStarter(card) {
    if (!cardZoomModal || !cardZoomImage) return;

    zoomCards = starterRevealCards.filter(Boolean);
    zoomIndex = Math.max(0, zoomCards.findIndex(item => item.id === card.id));
    updateCardZoom();
    cardZoomModal.hidden = false;
    document.body.classList.add("card-zoom-open");
  }

  function renderStarterArmory() {
    if (!starterArmory) return;
    const owned = loadOwnedStarterDecks();
    const gold = window.WUSCollection?.load?.().gold || 0;
    starterArmory.replaceChildren(...STARTER_DECKS.map(deck => {
      const isOwned = owned.has(deck.id);
      const article = document.createElement("article");
      article.className = `starter-deck-product${isOwned ? " is-owned" : ""}`;
      article.dataset.deckId = deck.id;
      article.innerHTML = `
        <div class="starter-package-wrap"><img class="starter-package" src="${deck.image}" alt="${deck.name} Starter Deck"><span class="starter-owned-ribbon">OWNED</span></div>
        <div class="starter-product-copy">
          <p class="eyebrow">Starter Deck</p><h2>${deck.name}</h2><p>${deck.description}</p>
          <div class="commander-showcase"><img src="${deck.commanderImage}" alt="${deck.commanderName}"><div><small>Showcase Card</small><strong>${deck.commanderName}</strong><span>${deck.commanderId}</span></div></div>
          <button class="primary-button starter-buy-button purchase-shimmer" type="button" ${isOwned || gold < STARTER_DECK_PRICE ? "disabled" : ""}>${isOwned ? "Owned" : "Buy Starter Deck · 1,000 Gold"}</button>
        </div>`;
      article.querySelector('.starter-buy-button').addEventListener('click', () => purchaseStarterDeck(deck));
      return article;
    }));
  }

  function installGlobalClickSound() {
    document.addEventListener("click", event => {
      if (!event.target.closest("button, a, [role='button'], .pack-card, .summary-card, .starter-reveal-card")) return;
      playSound(soundPaths.click, .28, .98 + Math.random() * .04);
    }, true);
  }

  function createEmptyBoxSession() {
    return { openedPacks: 0, pulls: [], packs: [], collectionAdded: 0, duplicatesConverted: 0, goldEarned: 0 };
  }

  function refreshGold() {
    if (!window.WUSCollection) return;
    const gold = WUSCollection.load().gold;
    goldBalances.forEach(element => { element.textContent = gold.toLocaleString(); });
    if (beginButton) beginButton.disabled = gold < ECONOMY.packCost;
    if (beginBoxButton) beginBoxButton.disabled = gold < ECONOMY.boxCost;
    if (anotherButton && openingMode === "single") anotherButton.disabled = gold < ECONOMY.packCost;
    if (openAnotherBoxButton) openAnotherBoxButton.disabled = gold < ECONOMY.boxCost;
  }

  function showEconomyMessage(message, isError = false) {
    if (!economyMessage) return;
    economyMessage.textContent = message;
    economyMessage.classList.toggle("economy-error", isError);
  }

  function showGoldSpendAnimation(amount) {
    if (!amount) return;

    const purchaseButton =
      openingMode === "box"
        ? (openAnotherBoxButton && !openAnotherBoxButton.hidden ? openAnotherBoxButton : beginBoxButton)
        : (anotherButton && !anotherButton.hidden ? anotherButton : beginButton);

    const purchaseStage = purchaseButton?.closest(".stage");
    const stageBalance = purchaseStage
      ? [...purchaseStage.querySelectorAll("[data-gold-balance]")].find(element => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0"
          );
        })
      : null;

    const visibleBalance = stageBalance || goldBalances.find(element => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        style.opacity !== "0"
      );
    });

    const anchor = visibleBalance || purchaseButton;
    const rect = anchor?.getBoundingClientRect();

    const effect = document.createElement("div");
    effect.setAttribute("aria-hidden", "true");
    effect.innerHTML = `<span>-${amount.toLocaleString()}</span><span style="color:#f5c542">🪙</span>`;

    Object.assign(effect.style, {
      position: "fixed",
      zIndex: "2147483647",
      pointerEvents: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.3rem",
      left: `${Math.min(window.innerWidth - 70, Math.max(70, rect ? rect.left + rect.width / 2 : window.innerWidth / 2))}px`,
      top: `${Math.min(window.innerHeight - 90, Math.max(70, rect ? rect.bottom + 4 : window.innerHeight * 0.25))}px`,
      color: "#ff3030",
      fontWeight: "900",
      fontSize: "clamp(1.2rem, 4vw, 1.7rem)",
      lineHeight: "1",
      whiteSpace: "nowrap",
      textShadow: "0 2px 3px rgba(0,0,0,.95), 0 0 10px rgba(255,0,0,.7)",
      transform: "translate(-50%, 0) scale(.9)",
      opacity: "0"
    });

    document.body.appendChild(effect);

    const animation = effect.animate(
      [
        { opacity: 0, transform: "translate(-50%, -6px) scale(.9)" },
        { opacity: 1, transform: "translate(-50%, 4px) scale(1.15)", offset: 0.18 },
        { opacity: 1, transform: "translate(-50%, 44px) scale(1)", offset: 0.78 },
        { opacity: 0, transform: "translate(-50%, 62px) scale(.96)" }
      ],
      {
        duration: 1200,
        easing: "ease-out",
        fill: "forwards"
      }
    );

    animation.finished
      .catch(() => {})
      .finally(() => effect.remove());

    window.setTimeout(() => effect.remove(), 1600);
  }

  function purchaseOpening(mode) {
    if (!window.WUSCollection) return;
    const cost = mode === "box" ? ECONOMY.boxCost : ECONOMY.packCost;
    const totalPacks = mode === "box" ? BOX_PACK_COUNT : 1;
    const result = WUSCollection.purchaseOpening(mode, cost, totalPacks);
    if (!result.ok) {
      if (result.reason === "opening-already-active") {
        showEconomyMessage("You already have an unopened purchase. Resuming it now.");
        restoreOpening(result.opening);
      } else {
        showEconomyMessage(`Not enough Gold. You need ${cost.toLocaleString()} Gold and currently have ${result.gold.toLocaleString()}.`, true);
      }
      refreshGold();
      return;
    }
    showEconomyMessage(`${cost.toLocaleString()} Gold spent. Your purchase is saved until it is fully opened.`);
    playSound(soundPaths.purchase, PURCHASE_SOUND_VOLUME);
    showGoldSpendAnimation(cost > 0 ? cost : (mode === "box" ? 4400 : 200));
    refreshGold();
    window.setTimeout(() => restoreOpening(result.opening), 1000);
  }

  const NEW_PULL_STORAGE_PREFIX = "wus-new-pulls-v1:";

  function getNewPullStorageKey(openingId) {
    return openingId ? `${NEW_PULL_STORAGE_PREFIX}${openingId}` : "";
  }

  function loadNewPullIndexes(openingId) {
    if (!openingId) return new Set();
    try {
      const raw = JSON.parse(localStorage.getItem(getNewPullStorageKey(openingId)) || "[]");
      return new Set(Array.isArray(raw) ? raw.filter(Number.isInteger) : []);
    } catch {
      return new Set();
    }
  }

  function saveNewPullIndexes(openingId, indexes) {
    if (!openingId) return;
    try {
      localStorage.setItem(getNewPullStorageKey(openingId), JSON.stringify([...indexes].sort((a, b) => a - b)));
    } catch {}
  }

  function flagNewCardsForPendingPack(pack, opening) {
    const ownedCards = window.WUSCollection?.load?.().cards || {};
    const pullOffset = opening?.pulls?.length || 0;
    const newIndexes = loadNewPullIndexes(opening?.id);
    const firstNewCopyInPack = new Set();

    return (pack || []).map((card, index) => {
      const ownedBeforePack = Math.max(0, Number(ownedCards[card.id]) || 0);
      const isNewPull = ownedBeforePack === 0 && !firstNewCopyInPack.has(card.id);
      if (isNewPull) {
        firstNewCopyInPack.add(card.id);
        newIndexes.add(pullOffset + index);
      }
      return { ...card, _isNewPull: isNewPull };
    }).map((card, index, flaggedPack) => {
      if (index === flaggedPack.length - 1) saveNewPullIndexes(opening?.id, newIndexes);
      return card;
    });
  }

  function cardIdsToCards(ids) {
    return (ids || []).map(id => packCards.find(card => card.id === id)).filter(Boolean);
  }

  function openingPullsToCards(opening) {
    const newIndexes = loadNewPullIndexes(opening?.id);
    return cardIdsToCards(opening?.pulls).map((card, index) => ({ ...card, _isNewPull: newIndexes.has(index) }));
  }

  function syncBoxSession(opening) {
    if (!opening) return;
    boxSession = {
      openedPacks: opening.openedPacks || 0,
      pulls: openingPullsToCards(opening),
      packs: (opening.packs || []).map(pack => cardIdsToCards(pack.cardIds)),
      collectionAdded: opening.collectionAdded || 0,
      duplicatesConverted: opening.duplicatesConverted || 0,
      goldEarned: opening.goldEarned || 0
    };
  }

  function restoreOpening(opening) {
    if (!opening) return;

    const singlePackComplete =
      opening.mode === "single" &&
      !opening.currentPack?.cardIds?.length &&
      (opening.openedPacks || 0) >= 1;

    if (singlePackComplete) {
      WUSCollection.clearActiveOpening(opening.id);
      openingMode = "single";
      currentPack = [];
      currentPackSaved = false;
      currentPackCollectionResult = null;
      showStage(stages.store);
      refreshGold();
      return;
    }

    openingMode = opening.mode;
    if (opening.mode === "box") syncBoxSession(opening);
    if (opening.currentPack?.cardIds?.length) {
      currentPack = flagNewCardsForPendingPack(cardIdsToCards(opening.currentPack.cardIds), opening);
      currentPackIsGodPack = isGodPack(currentPack);
      currentPackSaved = false;
      currentPackCollectionResult = null;
      if (opening.mode === "box") selectedBoxPack = opening.currentPack.packIndex;
      renderPack(currentPack);
      showStage(stages.reveal);
      showEconomyMessage("Resumed your saved pack. No additional Gold was charged.");
      return;
    }
    if (opening.mode === "box") {
      if (opening.openedPacks >= BOX_PACK_COUNT) renderBoxSummary();
      else { renderBoxPacks(); showStage(stages.boxPacks); }
    } else {
      prepareBoosterStage(); showStage(stages.booster);
    }
  }

  function saveCurrentPackToCollection() {
    if (currentPackSaved || !window.WUSCollection) return currentPackCollectionResult;
    const opening = WUSCollection.getActiveOpening();
    if (!opening?.currentPack) return currentPackCollectionResult;
    const settled = WUSCollection.settlePendingPack(opening.id, currentPack);
    if (!settled.ok) return currentPackCollectionResult;
    currentPackCollectionResult = settled.result || { added: 0, converted: 0, goldEarned: 0 };
    currentPackSaved = true;
    if (openingMode === "box" && settled.opening) syncBoxSession(settled.opening);
    refreshGold();
    return currentPackCollectionResult;
  }

  function renderCollectionResult(result) {
    if (!collectionResult || !result) return;
    collectionResult.hidden = false;
    const goldText = result.goldEarned ? `<strong>+${result.goldEarned.toLocaleString()} Gold</strong> from ${result.converted} extra ${result.converted === 1 ? "copy" : "copies"}` : "No extra copies were converted.";
    collectionResult.innerHTML = `<span><strong>${result.added}</strong> added to your collection</span><span>${goldText}</span>`;
  }

  const randomItem = items => items[Math.floor(Math.random() * items.length)];

  function sampleUnique(items, count) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }

  function rollPremiumRarity() {
    const roll = Math.random();
    const { secret, ultraRare, superRare } = BOA_PACK_CONFIG.premiumOdds;
    if (roll < secret) return "Secret Rare";
    if (roll < secret + ultraRare) return "Ultra Rare";
    if (roll < secret + ultraRare + superRare) return "Super Rare";
    return "Rare";
  }

  function shuffleCards(items) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function buildGodPack() {
    const superRares = sampleUnique(groups["Super Rare"] || [], 6);
    const ultraRares = sampleUnique(groups["Ultra Rare"] || [], 4);
    const secretRares = sampleUnique(groups["Secret Rare"] || [], 2);

    if (superRares.length < 6 || ultraRares.length < 4 || secretRares.length < 2) {
      console.warn("God Pack could not be built because one or more rarity pools are too small.");
      return null;
    }

    return shuffleCards([...superRares, ...ultraRares, ...secretRares]);
  }

  function isGodPack(pack) {
    if (!Array.isArray(pack) || pack.length !== 12) return false;
    const counts = pack.reduce((result, card) => {
      result[card.rarity] = (result[card.rarity] || 0) + 1;
      return result;
    }, {});
    return counts["Super Rare"] === 6
      && counts["Ultra Rare"] === 4
      && counts["Secret Rare"] === 2;
  }

  function buildPack() {
    if (Math.random() < GOD_PACK_CHANCE) {
      const godPack = buildGodPack();
      if (godPack) return godPack;
    }

    const commons = sampleUnique(groups.Common, BOA_PACK_CONFIG.commonsPerPack);
    const uncommons = sampleUnique(groups.Uncommon, BOA_PACK_CONFIG.uncommonsPerPack);
    const premiums = [];
    // Both final slots independently roll Rare or higher.
    const premiumRarities = [
      rollPremiumRarity(),
      rollPremiumRarity()
    ];

    for (const rarity of premiumRarities) {
      let card = randomItem(groups[rarity]);
      while (premiums.some(existing => existing.id === card.id) && groups[rarity].length > 1) {
        card = randomItem(groups[rarity]);
      }
      premiums.push(card);
    }
    return [...commons, ...uncommons, ...premiums];
  }

  function runGodPackOpeningSequence() {
    playSound(soundPaths.godPack, SOUND_VOLUME);
    document.body.classList.add("god-pack-sequence");
    boosterButton.classList.add("god-pack-shaking");
    clickHint.textContent = "Something is happening…";

    if (godPackOverlay) {
      godPackOverlay.hidden = false;
      godPackOverlay.classList.remove("is-active", "is-exploding");
      void godPackOverlay.offsetWidth;
      godPackOverlay.classList.add("is-active");
    }

    window.setTimeout(() => {
      boosterButton.classList.remove("god-pack-shaking");
      boosterButton.classList.add("god-pack-exploding");
      godPackOverlay?.classList.add("is-exploding");
      godPackFlash?.classList.add("is-active");

      window.setTimeout(() => {
        boosterButton.classList.remove("opening", "god-pack-exploding");
        document.body.classList.remove("god-pack-sequence");
        if (godPackOverlay) {
          godPackOverlay.hidden = true;
          godPackOverlay.classList.remove("is-active", "is-exploding");
        }
        godPackFlash?.classList.remove("is-active");
        clickHint.textContent = "Click to open";
        showStage(stages.reveal);
      }, 900);
    }, 5000);
  }

  function resetMobilePageZoom() {
    if (!viewportMeta || !window.matchMedia("(max-width: 900px)").matches) return;

    viewportMeta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1"
    );

    window.setTimeout(() => {
      viewportMeta.setAttribute("content", normalViewportContent);
    }, 350);
  }

  function showStage(stage) {
    Object.values(stages).forEach(item => { item.hidden = item !== stage; });

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  function startOpening(mode) {
    openingMode = mode;
    if (mode === "box") {
      boxSession = createEmptyBoxSession();
      selectedBoxPack = null;
      renderBoxPacks();
      showStage(stages.boxPacks);
      return;
    }
    prepareBoosterStage();
    showStage(stages.booster);
  }

  function renderBoxPacks() {
    const remaining = BOX_PACK_COUNT - boxSession.openedPacks;
    boxPacksRemaining.textContent = String(remaining);
    boxPacksTrackFill.style.width = `${(remaining / BOX_PACK_COUNT) * 100}%`;
    const packs = [];
    for (let index = boxSession.openedPacks; index < BOX_PACK_COUNT; index += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "box-pack-choice";
      button.setAttribute("aria-label", `Open booster pack ${index + 1} of ${BOX_PACK_COUNT}`);
      button.innerHTML = `<img src="battle-of-ages-booster.png" alt="Battle of Ages booster pack"><span>${index + 1}</span>`;
      button.addEventListener("click", () => selectBoxPack(index));
      packs.push(button);
    }
    boxPackGrid.replaceChildren(...packs);
    if (openAllPacksButton) {
      openAllPacksButton.disabled = remaining <= 0 || openingAllPacks;
      openAllPacksButton.textContent = remaining === BOX_PACK_COUNT
        ? "Open All 24 Packs"
        : `Open All ${remaining} Remaining Packs`;
    }
    if (openAllOverlay && !openingAllPacks) openAllOverlay.hidden = true;
  }

  function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  function createOpeningPackVisual(index) {
    const visual = document.createElement("div");
    visual.className = "open-all-pack";
    visual.style.setProperty("--pack-delay", `${(index % 8) * 35}ms`);
    visual.innerHTML = `<img src="battle-of-ages-booster.png" alt=""><span class="open-all-burst"></span>`;
    return visual;
  }

  async function openAllRemainingPacks() {
    if (openingAllPacks || openingMode !== "box" || !window.WUSCollection) return;

    const active = WUSCollection.getActiveOpening();
    if (!active || active.mode !== "box") {
      showEconomyMessage("No active booster box was found.", true);
      return;
    }

    openingAllPacks = true;
    openAllPacksButton.disabled = true;
    boxPackGrid.querySelectorAll("button").forEach(button => { button.disabled = true; });
    openAllOverlay.hidden = false;
    openAllAnimation.replaceChildren();

    const startingOpened = active.openedPacks || 0;
    const totalToOpen = BOX_PACK_COUNT - startingOpened;
    openAllStatus.textContent = `Opening ${totalToOpen} remaining ${totalToOpen === 1 ? "pack" : "packs"}…`;
    openAllProgressFill.style.width = "0%";
    openAllProgressText.textContent = `0 / ${totalToOpen} packs opened`;

    const visualCount = Math.min(totalToOpen, 12);
    for (let index = 0; index < visualCount; index += 1) {
      openAllAnimation.appendChild(createOpeningPackVisual(index));
    }
    await wait(450);
    openAllAnimation.classList.add("is-opening");

    try {
      for (let offset = 0; offset < totalToOpen; offset += 1) {
        const opening = WUSCollection.getActiveOpening();
        if (!opening || opening.mode !== "box") throw new Error("The booster box session could not be found.");

        const pack = flagNewCardsForPendingPack(buildPack(), opening);
        const packIndex = opening.openedPacks;
        const saved = WUSCollection.savePendingPack(opening.id, packIndex, pack.map(card => card.id));
        if (!saved.ok) throw new Error("A booster pack could not be saved.");

        const settled = WUSCollection.settlePendingPack(opening.id, pack);
        if (!settled.ok) throw new Error("A booster pack could not be added to the collection.");
        if (settled.opening) syncBoxSession(settled.opening);

        const completed = offset + 1;
        openAllProgressFill.style.width = `${(completed / totalToOpen) * 100}%`;
        openAllProgressText.textContent = `${completed} / ${totalToOpen} packs opened`;
        openAllStatus.textContent = completed === totalToOpen
          ? "Booster box complete!"
          : `Opening pack ${completed + 1} of ${totalToOpen}…`;

        const visual = openAllAnimation.children[offset % Math.max(1, visualCount)];
        if (visual) {
          visual.classList.remove("bursting");
          void visual.offsetWidth;
          visual.classList.add("bursting");
        }
        playPackPop();
        await wait(85);
      }

      const completedOpening = WUSCollection.getActiveOpening();
      if (completedOpening) syncBoxSession(completedOpening);
      refreshGold();
      await wait(750);
      await renderBoxSummary();
    } catch (error) {
      console.error(error);
      openAllStatus.textContent = "Opening paused";
      openAllProgressText.textContent = error.message || "Please try again.";
      renderBoxPacks();
    } finally {
      openingAllPacks = false;
      openAllAnimation.classList.remove("is-opening");
      if (openAllPacksButton) openAllPacksButton.disabled = false;
    }
  }

  function selectBoxPack(index) {
    selectedBoxPack = index;
    prepareBoosterStage();
    boosterHeading.textContent = `Booster Pack ${boxSession.openedPacks + 1} of ${BOX_PACK_COUNT}`;
    boosterInstruction.textContent = "Click the selected pack to break the seal.";
    showStage(stages.booster);
  }

  function prepareBoosterStage() {
    const isBox = openingMode === "box";
    boosterHeading.textContent = isBox ? "Break Open the Booster Box" : "Your Booster Awaits";
    boosterInstruction.textContent = isBox
      ? `Open pack ${Math.min(boxSession.openedPacks + 1, BOX_PACK_COUNT)} of ${BOX_PACK_COUNT}.`
      : "Click the pack to break the seal.";
    boxProgressBooster.hidden = !isBox;
    if (isBox) {
      const nextPack = Math.min(boxSession.openedPacks + 1, BOX_PACK_COUNT);
      boxProgressBoosterText.textContent = `Pack ${nextPack} of ${BOX_PACK_COUNT}`;
      boxProgressBoosterFill.style.width = `${(boxSession.openedPacks / BOX_PACK_COUNT) * 100}%`;
    }
  }

  async function resolvedImage(card) {
    return WUSAssets.getObjectUrl(card.image);
  }

  async function preview(card) {
    previewName.textContent = `${card.id} — ${card.name}`;
    previewRarity.textContent = card.rarity;
    previewImage.alt = `${card.id} ${card.name}`;
    try {
      previewImage.src = await resolvedImage(card);
    } catch {
      previewImage.src = card.image;
    }
  }

  async function attachFrontImage(image, front, card) {
    front.classList.add("loading");
    try {
      image.src = await resolvedImage(card);
      image.hidden = false;
      front.classList.remove("image-error");
    } catch (error) {
      front.classList.add("image-error");
      image.hidden = true;
      front.title = `${card.id}: ${card.image} (${error.message})`;
    } finally {
      front.classList.remove("loading");
    }
  }

  function createCard(card, index) {
    const button = document.createElement("button");
    button.type = "button";
    const rarityClass = card.rarity.toLowerCase().replace(/\s+/g, "-");
    button.className = `pack-card${index >= 10 || currentPackIsGodPack ? " premium-card" : ""}${currentPackIsGodPack ? ` god-pack-card god-pack-${rarityClass}` : ""}`;
    button.dataset.rarity = card.rarity;
    button.setAttribute("aria-label", `Reveal card ${index + 1}`);
    const godPackGlow = currentPackIsGodPack
      ? '<span class="god-pack-card-glow" aria-hidden="true"></span>'
      : "";

    button.innerHTML = `${godPackGlow}<span class="card-inner"><span class="card-face card-back"></span><span class="card-face card-front"><img alt="${card.id} ${card.name}">${card._isNewPull ? '<span class="new-card-badge" aria-label="New card">NEW!</span>' : ''}</span></span>`;

    const image = button.querySelector("img");
    const front = button.querySelector(".card-front");
    attachFrontImage(image, front, card);

    button.addEventListener("click", () => revealCard(button, card));
    button.addEventListener("mouseenter", () => { if (button.classList.contains("revealed")) preview(card); });
    button.addEventListener("focus", () => { if (button.classList.contains("revealed")) preview(card); });
    return button;
  }

  function renderPack(pack) {
    grid.replaceChildren(...pack.map(createCard));
    status.textContent = currentPackIsGodPack ? "GOD PACK — reveal every card" : "The cards are face down";
    instruction.textContent = currentPackIsGodPack
      ? "Every card is a premium hit. Select each glowing card individually to reveal it."
      : "Click any card to flip it. The final two cards are your Rare-or-higher slots.";
    revealAllButton.hidden = currentPackIsGodPack;
    revealAllButton.disabled = currentPackIsGodPack;
    anotherButton.hidden = true;
    if (returnToPacksButton) returnToPacksButton.hidden = true;
    if (openNextPackButton) openNextPackButton.hidden = true;
    currentPackSaved = false;
    currentPackCollectionResult = null;
    if (collectionResult) { collectionResult.hidden = true; collectionResult.replaceChildren(); }
    if (cardZoomHint) cardZoomHint.hidden = true;
    previewImage.src = "logo.png";
    previewName.textContent = "Reveal or hover over a card.";
    previewRarity.textContent = "";

    const isBox = openingMode === "box";
    revealEyebrow.textContent = isBox ? "Your Booster Box" : "Your Pack";
    boxProgressReveal.hidden = !isBox;
    if (isBox) boxProgressReveal.textContent = `Booster Box · Pack ${Math.min(boxSession.openedPacks + 1, BOX_PACK_COUNT)} of ${BOX_PACK_COUNT}`;
  }

  function revealCard(button, card) {
    if (button.classList.contains("revealed")) { preview(card); return; }
    button.classList.add("revealed");
    if (["Ultra Rare", "Secret Rare"].includes(card.rarity)) button.classList.add("big-hit");
    button.setAttribute("aria-label", `${card.id} ${card.name}, ${card.rarity}`);
    playRaritySound(card.rarity);
    preview(card);
    updateStatus();
  }

  function updateStatus() {
    const total = grid.children.length;
    const revealed = grid.querySelectorAll(".revealed").length;
    if (revealed === total) {
      status.textContent = openingMode === "box" ? `Pack ${Math.min(boxSession.openedPacks + 1, BOX_PACK_COUNT)} complete!` : "Pack complete!";
      instruction.textContent = openingMode === "box" ? "Return to the remaining packs or open the next pack." : "Continue opening when you are ready.";
      if (cardZoomHint) cardZoomHint.hidden = false;
      revealAllButton.hidden = true;
      const collectionUpdate = saveCurrentPackToCollection();
      renderCollectionResult(collectionUpdate);
      if (openingMode === "box") {
        const boxComplete = boxSession.openedPacks >= BOX_PACK_COUNT;
        anotherButton.hidden = !boxComplete;
        if (boxComplete) anotherButton.textContent = "View Booster Box Summary";
        if (returnToPacksButton) returnToPacksButton.hidden = boxComplete;
        if (openNextPackButton) {
          openNextPackButton.hidden = boxComplete;
          openNextPackButton.textContent = `Open Next Pack (${BOX_PACK_COUNT - boxSession.openedPacks} Remaining)`;
        }
      } else {
        anotherButton.hidden = false;
        anotherButton.textContent = "Open Another Pack · 200 Gold";
        if (returnToPacksButton) returnToPacksButton.hidden = true;
        if (openNextPackButton) openNextPackButton.hidden = true;
      }
    } else {
      status.textContent = `${revealed} of ${total} cards revealed`;
      if (cardZoomHint) cardZoomHint.hidden = true;
    }
  }

  function rarityRank(rarity) {
    return { "Secret Rare": 5, "Ultra Rare": 4, "Super Rare": 3, Rare: 2, Uncommon: 1, Common: 0 }[rarity] ?? 0;
  }

  async function createSummaryCard(card, compact = false) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = compact ? "summary-card compact" : "summary-card";
    item.dataset.rarity = card.rarity;
    item.innerHTML = `<span class="summary-image-wrap"><img alt="${card.id} ${card.name}">${card._isNewPull ? '<span class="new-card-badge summary-new-card-badge" aria-label="New card">NEW!</span>' : ''}</span><span class="summary-card-name">${card.id}<br>${card.name}</span><span class="summary-card-rarity">${card.rarity}</span>`;
    const image = item.querySelector("img");
    try { image.src = await resolvedImage(card); } catch { image.src = card.image; }
    item.addEventListener("mouseenter", () => preview(card));
    item.addEventListener("focus", () => preview(card));
    item.addEventListener("click", () => preview(card));
    return item;
  }

  async function renderBoxSummary() {
    boxTotalCards.textContent = String(boxSession.pulls.length);
    const order = ["Common", "Uncommon", "Rare", "Super Rare", "Ultra Rare", "Secret Rare"];
    const counts = Object.fromEntries(order.map(rarity => [rarity, 0]));
    boxSession.pulls.forEach(card => { counts[card.rarity] = (counts[card.rarity] || 0) + 1; });
    const economyStat = document.createElement("div");
    economyStat.className = "box-rarity-stat economy-stat";
    economyStat.innerHTML = `<strong>+${boxSession.goldEarned.toLocaleString()}</strong><span>Gold from ${boxSession.duplicatesConverted} extras</span>`;
    boxRarityStats.replaceChildren(...order.map(rarity => {
      const item = document.createElement("div");
      item.className = "box-rarity-stat";
      item.dataset.rarity = rarity;
      item.innerHTML = `<strong>${counts[rarity] || 0}</strong><span>${rarity}</span>`;
      return item;
    }), economyStat);

    const premiums = boxSession.pulls
      .filter(card => rarityRank(card.rarity) >= rarityRank("Rare"))
      .sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity));

    const premiumCards = await Promise.all(premiums.map(card => createSummaryCard(card)));
    boxPremiumGrid.replaceChildren(...premiumCards);

    const highlightRarity = ["Secret Rare", "Ultra Rare", "Super Rare", "Rare"]
      .find(rarity => boxSession.pulls.some(card => card.rarity === rarity));

    if (highlightRarity) {
      const highlightedPulls = boxSession.pulls.filter(card => card.rarity === highlightRarity);
      const highlightedCards = await Promise.all(highlightedPulls.map(card => createSummaryCard(card)));
      bestPullHeading.textContent = `${highlightRarity} Pulls`;
      bestPullCard.replaceChildren(...highlightedCards);
      bestPullSection.hidden = false;
    } else {
      bestPullCard.replaceChildren();
      bestPullSection.hidden = true;
    }

    boxAllPulls.replaceChildren();
    boxAllPulls.dataset.loaded = "false";
    boxAllPulls.hidden = true;
    boxRevealDetailsButton.disabled = false;
    boxRevealDetailsButton.textContent = "Show All Pulls";
    showStage(stages.summary);
    boxSummaryAudio.pause();
    boxSummaryAudio.currentTime = 0;
    boxSummaryAudio.volume = SOUND_VOLUME;
    boxSummaryAudio.play().catch(error => {
      console.error("Booster Box Summary sound could not play:", error);
    });
  }

  function showAssetGate(show) {
    assetGate.hidden = !show;
    document.body.classList.toggle("asset-locked", show);
  }

  function formatAssetFailures(failed) {
    return failed.map(item => {
      const hint = item.error.startsWith("404")
        ? "File not found. Check that the GitHub filename and capitalization exactly match this path."
        : item.error.startsWith("5")
          ? "Temporary server error. Use Continue Download to retry."
          : "Download failed. Use Continue Download to retry.";
      return `${item.path}\n  ${item.error}\n  ${hint}`;
    }).join("\n\n");
  }

  async function initializeAssetGate() {
    try {
      const result = await WUSAssets.getStatus(allImagePaths);
      if (result.complete) {
        showAssetGate(false);
        return;
      }
      assetGateStatus.textContent = `${result.installed} / ${result.total} images installed`;
      assetGateDownload.textContent = result.installed ? "Continue Download" : "Download Images";
      showAssetGate(true);
    } catch (error) {
      assetGateStatus.textContent = error.message;
      showAssetGate(true);
    }
  }

  async function installFromGate() {
    assetGateDownload.disabled = true;
    assetGateProgress.hidden = false;
    assetGateErrors.hidden = true;
    assetGateErrorList.textContent = "";
    const result = await WUSAssets.install(allImagePaths, {
      force: false,
      onProgress: ({ completed, total, failed }) => {
        assetGateProgressFill.style.width = `${Math.round((completed / total) * 100)}%`;
        assetGateProgressText.textContent = `${completed} / ${total}${failed ? ` · ${failed} failed` : ""}`;
        assetGateStatus.textContent = "Downloading Battle of Ages images…";
      }
    });
    assetGateDownload.disabled = false;
    if (result.failed.length) {
      assetGateStatus.textContent = `${result.total - result.failed.length} / ${result.total} installed. Fix or retry the failed files.`;
      assetGateDownload.textContent = "Continue Download";
      assetGateErrors.hidden = false;
      assetGateErrorList.textContent = formatAssetFailures(result.failed);
    } else {
      assetGateStatus.textContent = "Battle of Ages is ready!";
      await refreshAssetStatus();
      setTimeout(() => showAssetGate(false), 450);
    }
  }

  async function refreshAssetStatus() {
    try {
      const result = await WUSAssets.getStatus(allImagePaths);
      if (result.complete) {
        assetStatus.textContent = `${result.installed} / ${result.total} images downloaded — ready`;
        assetStatus.className = "asset-ready";
        downloadAssetsButton.textContent = "Images Installed";
      } else {
        assetStatus.textContent = `${result.installed} / ${result.total} images downloaded`;
        assetStatus.className = "asset-warning";
        downloadAssetsButton.textContent = result.installed ? "Continue Download" : "Download Images";
      }
    } catch (error) {
      assetStatus.textContent = error.message;
      assetStatus.className = "asset-warning";
    }
  }

  async function installAssets(force = false) {
    downloadAssetsButton.disabled = true;
    repairAssetsButton.disabled = true;
    assetProgress.hidden = false;
    assetErrors.hidden = true;
    assetErrorList.textContent = "";

    const result = await WUSAssets.install(allImagePaths, {
      force,
      onProgress: ({ completed, total, failed }) => {
        assetProgressFill.style.width = `${Math.round((completed / total) * 100)}%`;
        assetProgressText.textContent = `${completed} / ${total}${failed ? ` · ${failed} failed` : ""}`;
      }
    });

    if (result.failed.length) {
      assetErrors.hidden = false;
      assetErrorList.textContent = formatAssetFailures(result.failed);
    }
    downloadAssetsButton.disabled = false;
    repairAssetsButton.disabled = false;
    await refreshAssetStatus();
  }

  window.addEventListener("wus-cloud-starter-ready", () => {
    refreshGold();
    renderStarterArmory();
  });

  window.addEventListener("wus-cloud-starter-changed", () => {
    refreshGold();
    renderStarterArmory();
  });

  chooseStarterDecks.addEventListener("click", () => { renderStarterArmory(); showStage(stages.starterDecks); });
  chooseBattleOfAges.addEventListener("click", () => showStage(stages.intro));
  starterBackButton.addEventListener("click", () => showStage(stages.store));
  starterRevealAllButton.addEventListener("click", revealAllStarterCards);
  starterRevealContinueButton.addEventListener("click", () => {
    activeStarterRevealDeck = null;
    starterRevealCards = [];
    starterRevealCount = 0;
    renderStarterArmory();
    showStage(stages.starterDecks);
  });
  setBackButton.addEventListener("click", () => showStage(stages.store));
  beginButton.addEventListener("click", () => purchaseOpening("single"));
  beginBoxButton.addEventListener("click", () => purchaseOpening("box"));
  if (openAllPacksButton) openAllPacksButton.addEventListener("click", openAllRemainingPacks);
  downloadAssetsButton.addEventListener("click", () => installAssets(false));
  assetGateDownload.addEventListener("click", installFromGate);
  repairAssetsButton.addEventListener("click", () => installAssets(true));

  boosterButton.addEventListener("click", () => {
    if (boosterButton.classList.contains("opening")) return;
    const opening = WUSCollection.getActiveOpening();
    if (!opening) { showEconomyMessage("No saved purchase was found. Return to the selection screen and purchase a pack.", true); return; }
    if (opening.currentPack?.cardIds?.length) {
      currentPack = flagNewCardsForPendingPack(cardIdsToCards(opening.currentPack.cardIds), opening);
    } else {
      currentPack = flagNewCardsForPendingPack(buildPack(), opening);
      const packIndex = opening.mode === "box" ? opening.openedPacks : 0;
      WUSCollection.savePendingPack(opening.id, packIndex, currentPack.map(card => card.id));
    }
    selectedBoxPack = null;
    currentPackIsGodPack = isGodPack(currentPack);
    renderPack(currentPack);
    boosterButton.classList.add("opening");

    if (currentPackIsGodPack) {
      runGodPackOpeningSequence();
      return;
    }

    playSound(soundPaths.packRip, SOUND_VOLUME);
    clickHint.textContent = "Opening…";
    setTimeout(() => {
      boosterButton.classList.remove("opening");
      clickHint.textContent = "Click to open";
      showStage(stages.reveal);
    }, 900);
  });

  revealAllButton.addEventListener("click", () => {
    if (currentPackIsGodPack) return;
    revealAllButton.disabled = true;
    [...grid.children].forEach((button, index) => {
      setTimeout(() => {
        button.click();
        if (index === grid.children.length - 1) revealAllButton.disabled = false;
      }, index * 170);
    });
  });

  anotherButton.addEventListener("click", () => {
    if (openingMode === "box") {
      if (boxSession.openedPacks >= BOX_PACK_COUNT) renderBoxSummary();
      return;
    }
    const gold = WUSCollection.load().gold;
    if (gold < ECONOMY.packCost) {
      showEconomyMessage(`Not enough Gold. Another booster costs ${ECONOMY.packCost.toLocaleString()} Gold and you currently have ${gold.toLocaleString()}.`, true);
      refreshGold();
      return;
    }
    purchaseOpening("single");
  });

  if (returnToPacksButton) {
    returnToPacksButton.addEventListener("click", () => {
      if (openingMode !== "box" || boxSession.openedPacks >= BOX_PACK_COUNT) return;
      renderBoxPacks();
      showStage(stages.boxPacks);
    });
  }

  if (openNextPackButton) {
    openNextPackButton.addEventListener("click", () => {
      if (openingMode !== "box" || boxSession.openedPacks >= BOX_PACK_COUNT) return;
      selectedBoxPack = boxSession.openedPacks;
      prepareBoosterStage();
      boosterHeading.textContent = `Booster Pack ${boxSession.openedPacks + 1} of ${BOX_PACK_COUNT}`;
      boosterInstruction.textContent = "Click the next pack to break the seal.";
      showStage(stages.booster);
    });
  }

  boxRevealDetailsButton.addEventListener("click", async () => {
    if (boxAllPulls.dataset.loaded !== "true") {
      boxRevealDetailsButton.disabled = true;
      boxRevealDetailsButton.textContent = "Loading All Pulls…";
      const allCards = await Promise.all(boxSession.pulls.map(card => createSummaryCard(card, true)));
      boxAllPulls.replaceChildren(...allCards);
      boxAllPulls.dataset.loaded = "true";
      boxRevealDetailsButton.disabled = false;
    }
    boxAllPulls.hidden = !boxAllPulls.hidden;
    boxRevealDetailsButton.textContent = boxAllPulls.hidden ? "Show All Pulls" : "Hide All Pulls";
  });

  openAnotherBoxButton.addEventListener("click", () => {
    const opening = WUSCollection.getActiveOpening();
    if (opening?.mode === "box" && opening.openedPacks >= BOX_PACK_COUNT) WUSCollection.clearActiveOpening(opening.id);
    purchaseOpening("box");
  });
  backToSelectionButton.addEventListener("click", () => {
    const opening = WUSCollection.getActiveOpening();
    if (opening?.mode === "box" && opening.openedPacks >= BOX_PACK_COUNT) WUSCollection.clearActiveOpening(opening.id);
    openingMode = "single";
    boxSession = createEmptyBoxSession();
    showStage(stages.store);
    refreshGold();
  });


  installGlobalClickSound();
  renderStarterArmory();
  refreshGold();
  window.addEventListener("wus-player-data-changed", () => { refreshGold(); renderStarterArmory(); });
  refreshAssetStatus();
  initializeAssetGate();
  const savedOpening = window.WUSCollection?.getActiveOpening?.();
  if (savedOpening) {
    setTimeout(() => restoreOpening(savedOpening), 0);
  }
})();


const __zoomModal = document.getElementById("cardZoomModal");
const __zoomImg = document.getElementById("cardZoomImage");
const __zoomClose = document.getElementById("cardZoomClose");
const __zoomPrevious = document.getElementById("cardZoomPrevious");
const __zoomNext = document.getElementById("cardZoomNext");
const __zoomCounter = document.getElementById("cardZoomCounter");

if (__zoomModal) {
  let __zoomCards = [];
  let __zoomIndex = 0;
  let __zoomTouchStartX = null;
  let __zoomTouchStartY = null;

  function __collectZoomCards(image) {
    const summaryGroup = image?.closest("#bestPullCard, #boxPremiumGrid, #boxAllPulls");
    if (summaryGroup) return [...summaryGroup.querySelectorAll(".summary-card img")];

    const revealed = [...document.querySelectorAll(".card-grid .pack-card.revealed img")];
    return revealed.length ? revealed : [...document.querySelectorAll(".card-grid img")];
  }

  function __showZoomCard(index) {
    if (!__zoomCards.length) return;
    __zoomIndex = (index + __zoomCards.length) % __zoomCards.length;
    const image = __zoomCards[__zoomIndex];
    __zoomImg.src = image.currentSrc || image.src;
    __zoomImg.alt = image.alt || "Card";
    __zoomCounter.textContent = `${__zoomIndex + 1} / ${__zoomCards.length}`;
    const showNavigation = __zoomCards.length > 1;
    __zoomPrevious.hidden = !showNavigation;
    __zoomNext.hidden = !showNavigation;
  }

  function __openZoom(image) {
    __zoomCards = __collectZoomCards(image);
    __zoomIndex = Math.max(0, __zoomCards.indexOf(image));
    __showZoomCard(__zoomIndex);
    __zoomModal.hidden = false;
    document.body.classList.add("card-zoom-open");
  }

  function __closeZoom() {
    __zoomModal.hidden = true;
    document.body.classList.remove("card-zoom-open");
  }

  document.addEventListener("click", event => {
    const image = event.target.closest(
      ".card-grid .pack-card.revealed img, #bestPullCard .summary-card img, #boxPremiumGrid .summary-card img, #boxAllPulls .summary-card img"
    );
    if (!image) return;
    __openZoom(image);
  });

  __zoomPrevious?.addEventListener("click", () => __showZoomCard(__zoomIndex - 1));
  __zoomNext?.addEventListener("click", () => __showZoomCard(__zoomIndex + 1));
  __zoomClose?.addEventListener("click", __closeZoom);
  __zoomModal.querySelector(".card-zoom-backdrop")?.addEventListener("click", __closeZoom);

  __zoomModal.addEventListener("touchstart", event => {
    const touch = event.changedTouches[0];
    __zoomTouchStartX = touch.clientX;
    __zoomTouchStartY = touch.clientY;
  }, { passive: true });

  __zoomModal.addEventListener("touchend", event => {
    if (__zoomTouchStartX === null || __zoomTouchStartY === null) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - __zoomTouchStartX;
    const deltaY = touch.clientY - __zoomTouchStartY;
    __zoomTouchStartX = null;
    __zoomTouchStartY = null;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    __showZoomCard(__zoomIndex + (deltaX < 0 ? 1 : -1));
  }, { passive: true });

  document.addEventListener("keydown", event => {
    if (__zoomModal.hidden) return;
    if (event.key === "ArrowLeft") __showZoomCard(__zoomIndex - 1);
    if (event.key === "ArrowRight") __showZoomCard(__zoomIndex + 1);
    if (event.key === "Escape") __closeZoom();
  });
}



// Batch2 hooks
window.WUS_BATCH2=true;
document.addEventListener('click',e=>{
 try{
  const a=new Audio('sounds/mouse-click.mp3');
  a.volume=.3;
  a.play().catch(()=>{});
 }catch(e){}
});


// Batch4 starter purchase groundwork
window.WUSStarterDecks = window.WUSStarterDecks || {};
window.WUSStarterDecks.DECK_PRICE = 1000;
window.WUSStarterDecks.purchaseStarterDeck = function(deckId, deckCards){
  const store = window.WUSCollection?.load?.() || {gold:0,cards:{}};
  if((store.gold||0) < 1000){
    alert("You need 1,000 Gold to purchase this Starter Deck.");
    return false;
  }
  store.gold -= 1000;
  store.ownedStarters = store.ownedStarters || {};
  if(store.ownedStarters[deckId]){
    alert("You already own this Starter Deck.");
    return false;
  }
  store.ownedStarters[deckId]=true;
  store.cards = store.cards || {};
  (deckCards||[]).forEach(c=>{
    store.cards[c]=(store.cards[c]||0)+1;
  });
  if(window.WUSCollection?.save){
    window.WUSCollection.save(store);
  }else{
    localStorage.setItem("wus-collection",JSON.stringify(store));
  }
  window.dispatchEvent(new Event("wus-player-data-changed"));
  alert("Starter Deck added to your collection!");
  return true;
};
