(() => {
  "use strict";

  const BOX_PACK_COUNT = 24;
  const ECONOMY = Object.freeze({ enabled: true, packCost: 0, boxCost: 0 });

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
    intro: document.getElementById("introStage"),
    booster: document.getElementById("boosterStage"),
    boxPacks: document.getElementById("boxPacksStage"),
    reveal: document.getElementById("revealStage"),
    summary: document.getElementById("boxSummaryStage")
  };

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

  const boxTotalCards = document.getElementById("boxTotalCards");
  const boxRarityStats = document.getElementById("boxRarityStats");
  const boxPremiumGrid = document.getElementById("boxPremiumGrid");
  const boxAllPulls = document.getElementById("boxAllPulls");
  const boxRevealDetailsButton = document.getElementById("boxRevealDetailsButton");
  const openAnotherBoxButton = document.getElementById("openAnotherBoxButton");
  const backToSelectionButton = document.getElementById("backToSelectionButton");
  const bestPullSection = document.getElementById("bestPullSection");
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

  const allImagePaths = packCards.map(card => card.image);
  let currentPack = [];
  let openingMode = "single";
  let boxSession = createEmptyBoxSession();
  let selectedBoxPack = null;
  let currentPackCollectionResult = null;
  let currentPackSaved = false;
  let openingAllPacks = false;

  const soundPaths = Object.freeze({
    packRip: "sounds/pack-rip.mp3",
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
  const SECRET_LAYER_VOLUME = 0.29;

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
      soundPaths.packRip,
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
    refreshGold();
    restoreOpening(result.opening);
  }

  function cardIdsToCards(ids) {
    return (ids || []).map(id => packCards.find(card => card.id === id)).filter(Boolean);
  }

  function syncBoxSession(opening) {
    if (!opening) return;
    boxSession = {
      openedPacks: opening.openedPacks || 0,
      pulls: cardIdsToCards(opening.pulls),
      packs: (opening.packs || []).map(pack => cardIdsToCards(pack.cardIds)),
      collectionAdded: opening.collectionAdded || 0,
      duplicatesConverted: opening.duplicatesConverted || 0,
      goldEarned: opening.goldEarned || 0
    };
  }

  function restoreOpening(opening) {
    if (!opening) return;
    openingMode = opening.mode;
    if (opening.mode === "box") syncBoxSession(opening);
    if (opening.currentPack?.cardIds?.length) {
      currentPack = cardIdsToCards(opening.currentPack.cardIds);
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

  function buildPack() {
    const commons = sampleUnique(groups.Common, BOA_PACK_CONFIG.commonsPerPack);
    const uncommons = sampleUnique(groups.Uncommon, BOA_PACK_CONFIG.uncommonsPerPack);
    const premiums = [];
    const premiumRarities = ["Rare", "Rare"];
    const upgradeRoll = rollPremiumRarity();
    if (upgradeRoll !== "Rare") premiumRarities[1] = upgradeRoll;

    for (const rarity of premiumRarities) {
      let card = randomItem(groups[rarity]);
      while (premiums.some(existing => existing.id === card.id) && groups[rarity].length > 1) {
        card = randomItem(groups[rarity]);
      }
      premiums.push(card);
    }
    return [...commons, ...uncommons, ...premiums];
  }

  function showStage(stage) {
    Object.values(stages).forEach(item => { item.hidden = item !== stage; });
    window.scrollTo({ top: 0, behavior: "smooth" });
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

        const pack = buildPack();
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
    button.className = `pack-card${index >= 10 ? " premium-card" : ""}`;
    button.dataset.rarity = card.rarity;
    button.setAttribute("aria-label", `Reveal card ${index + 1}`);
    button.innerHTML = `<span class="card-inner"><span class="card-face card-back"></span><span class="card-face card-front"><img alt="${card.id} ${card.name}"></span></span>`;

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
    status.textContent = "The cards are face down";
    instruction.textContent = "Click any card to flip it. The final two cards are your Rare-or-higher slots.";
    revealAllButton.hidden = false;
    revealAllButton.disabled = false;
    anotherButton.hidden = true;
    if (returnToPacksButton) returnToPacksButton.hidden = true;
    if (openNextPackButton) openNextPackButton.hidden = true;
    currentPackSaved = false;
    currentPackCollectionResult = null;
    if (collectionResult) { collectionResult.hidden = true; collectionResult.replaceChildren(); }
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
      instruction.textContent = openingMode === "box" ? "Hover over any card to inspect it, then return to the remaining packs." : "Hover over any card to inspect it, or continue opening.";
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
    item.innerHTML = `<span class="summary-image-wrap"><img alt="${card.id} ${card.name}"></span><span class="summary-card-name">${card.id}<br>${card.name}</span><span class="summary-card-rarity">${card.rarity}</span>`;
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

    const bestPull = premiums[0] || boxSession.pulls.slice().sort((a, b) => rarityRank(b.rarity) - rarityRank(a.rarity))[0];
    if (bestPull) {
      const bestCard = await createSummaryCard(bestPull);
      bestPullCard.replaceChildren(bestCard);
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
      currentPack = cardIdsToCards(opening.currentPack.cardIds);
    } else {
      currentPack = buildPack();
      const packIndex = opening.mode === "box" ? opening.openedPacks : 0;
      WUSCollection.savePendingPack(opening.id, packIndex, currentPack.map(card => card.id));
    }
    selectedBoxPack = null;
    renderPack(currentPack);
    playSound(soundPaths.packRip, SOUND_VOLUME);
    boosterButton.classList.add("opening");
    clickHint.textContent = "Opening…";
    setTimeout(() => {
      boosterButton.classList.remove("opening");
      clickHint.textContent = "Click to open";
      showStage(stages.reveal);
    }, 900);
  });

  revealAllButton.addEventListener("click", () => {
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
    showStage(stages.intro);
    refreshGold();
  });


  refreshGold();
  window.addEventListener("wus-player-data-changed", refreshGold);
  refreshAssetStatus();
  initializeAssetGate();
  const savedOpening = window.WUSCollection?.getActiveOpening?.();
  if (savedOpening) {
    setTimeout(() => restoreOpening(savedOpening), 0);
  }
})();
