(() => {
  "use strict";

  const BOX_PACK_COUNT = 24;
  const ECONOMY = Object.freeze({ enabled: false, packCost: null, boxCost: null });

  const siteCardsById = new Map(
    (typeof cards !== "undefined" ? cards : [])
      .filter(card => card && card.id)
      .map(card => [card.id, card])
  );

  const packCards = BOA_PACK_CARDS.map(card => {
    const siteCard = siteCardsById.get(card.id);
    return { ...card, name: siteCard?.name || card.name, image: siteCard?.image || card.image };
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

  const boxTotalCards = document.getElementById("boxTotalCards");
  const boxRarityStats = document.getElementById("boxRarityStats");
  const boxPremiumGrid = document.getElementById("boxPremiumGrid");
  const boxAllPulls = document.getElementById("boxAllPulls");
  const boxRevealDetailsButton = document.getElementById("boxRevealDetailsButton");
  const openAnotherBoxButton = document.getElementById("openAnotherBoxButton");
  const backToSelectionButton = document.getElementById("backToSelectionButton");
  const bestPullSection = document.getElementById("bestPullSection");
  const bestPullCard = document.getElementById("bestPullCard");

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

  function createEmptyBoxSession() {
    return { openedPacks: 0, pulls: [], packs: [] };
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
    if (roll < secret) return "Secret";
    if (roll < secret + ultraRare) return "Ultra Rare";
    if (roll < secret + ultraRare + superRare) return "Super Rare";
    return "Rare";
  }

  function buildPack() {
    const commons = sampleUnique(groups.Common, BOA_PACK_CONFIG.commonsPerPack);
    const uncommons = sampleUnique(groups.Uncommon, BOA_PACK_CONFIG.uncommonsPerPack);
    const premiums = [];
    for (let slot = 0; slot < BOA_PACK_CONFIG.premiumSlotsPerPack; slot++) {
      const rarity = rollPremiumRarity();
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
    previewImage.src = "logo.png";
    previewName.textContent = "Reveal or hover over a card.";
    previewRarity.textContent = "";

    const isBox = openingMode === "box";
    revealEyebrow.textContent = isBox ? "Your Booster Box" : "Your Pack";
    boxProgressReveal.hidden = !isBox;
    if (isBox) boxProgressReveal.textContent = `Booster Box · Pack ${boxSession.openedPacks} of ${BOX_PACK_COUNT}`;
  }

  function revealCard(button, card) {
    if (button.classList.contains("revealed")) { preview(card); return; }
    button.classList.add("revealed");
    if (["Ultra Rare", "Secret"].includes(card.rarity)) button.classList.add("big-hit");
    button.setAttribute("aria-label", `${card.id} ${card.name}, ${card.rarity}`);
    preview(card);
    updateStatus();
  }

  function updateStatus() {
    const total = grid.children.length;
    const revealed = grid.querySelectorAll(".revealed").length;
    if (revealed === total) {
      status.textContent = openingMode === "box" ? `Pack ${boxSession.openedPacks} complete!` : "Pack complete!";
      instruction.textContent = openingMode === "box" ? "Hover over any card to inspect it, then return to the remaining packs." : "Hover over any card to inspect it, or continue opening.";
      revealAllButton.hidden = true;
      anotherButton.hidden = false;
      if (openingMode === "box") {
        anotherButton.textContent = boxSession.openedPacks >= BOX_PACK_COUNT
          ? "View Booster Box Summary"
          : `Return to Packs (${BOX_PACK_COUNT - boxSession.openedPacks} Remaining)`;
      } else {
        anotherButton.textContent = "Open Another Pack";
      }
    } else {
      status.textContent = `${revealed} of ${total} cards revealed`;
    }
  }

  function recordPackForBox(pack) {
    boxSession.openedPacks += 1;
    boxSession.packs.push(pack);
    boxSession.pulls.push(...pack);
  }

  function rarityRank(rarity) {
    return { Secret: 5, "Ultra Rare": 4, "Super Rare": 3, Rare: 2, Uncommon: 1, Common: 0 }[rarity] ?? 0;
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
    const order = ["Common", "Uncommon", "Rare", "Super Rare", "Ultra Rare", "Secret"];
    const counts = Object.fromEntries(order.map(rarity => [rarity, 0]));
    boxSession.pulls.forEach(card => { counts[card.rarity] = (counts[card.rarity] || 0) + 1; });
    boxRarityStats.replaceChildren(...order.map(rarity => {
      const item = document.createElement("div");
      item.className = "box-rarity-stat";
      item.dataset.rarity = rarity;
      item.innerHTML = `<strong>${counts[rarity] || 0}</strong><span>${rarity}</span>`;
      return item;
    }));

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

  beginButton.addEventListener("click", () => startOpening("single"));
  beginBoxButton.addEventListener("click", () => startOpening("box"));
  downloadAssetsButton.addEventListener("click", () => installAssets(false));
  assetGateDownload.addEventListener("click", installFromGate);
  repairAssetsButton.addEventListener("click", () => installAssets(true));

  boosterButton.addEventListener("click", () => {
    if (boosterButton.classList.contains("opening")) return;
    currentPack = buildPack();
    if (openingMode === "box") {
      recordPackForBox(currentPack);
      selectedBoxPack = null;
    }
    renderPack(currentPack);
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
      if (boxSession.openedPacks >= BOX_PACK_COUNT) {
        renderBoxSummary();
      } else {
        renderBoxPacks();
        showStage(stages.boxPacks);
      }
      return;
    }
    prepareBoosterStage();
    showStage(stages.booster);
  });

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

  openAnotherBoxButton.addEventListener("click", () => startOpening("box"));
  backToSelectionButton.addEventListener("click", () => {
    openingMode = "single";
    boxSession = createEmptyBoxSession();
    showStage(stages.intro);
  });

  // Economy is intentionally disabled for now. The mode and cost hooks are centralized here
  // so a future account/gold service can charge before startOpening() runs.
  void ECONOMY;

  refreshAssetStatus();
  initializeAssetGate();
})();
