(() => {
  "use strict";

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

  const introStage = document.getElementById("introStage");
  const boosterStage = document.getElementById("boosterStage");
  const revealStage = document.getElementById("revealStage");
  const beginButton = document.getElementById("beginButton");
  const boosterButton = document.getElementById("boosterButton");
  const anotherButton = document.getElementById("anotherPackButton");
  const revealAllButton = document.getElementById("revealAllButton");
  const grid = document.getElementById("cardGrid");
  const status = document.getElementById("packStatus");
  const instruction = document.getElementById("revealInstruction");
  const previewImage = document.getElementById("previewImage");
  const previewName = document.getElementById("previewName");
  const previewRarity = document.getElementById("previewRarity");
  const clickHint = boosterButton.querySelector(".click-hint");

  const assetStatus = document.getElementById("assetStatus");
  const downloadAssetsButton = document.getElementById("downloadAssetsButton");
  const repairAssetsButton = document.getElementById("repairAssetsButton");
  const assetProgress = document.getElementById("assetProgress");
  const assetProgressFill = document.getElementById("assetProgressFill");
  const assetProgressText = document.getElementById("assetProgressText");
  const assetErrors = document.getElementById("assetErrors");
  const assetErrorList = document.getElementById("assetErrorList");

  const allImagePaths = packCards.map(card => card.image);
  let currentPack = [];

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
      while (premiums.some(existing => existing.id === card.id) && groups[rarity].length > 1) card = randomItem(groups[rarity]);
      premiums.push(card);
    }
    return [...commons, ...uncommons, ...premiums];
  }

  function showStage(stage) {
    [introStage, boosterStage, revealStage].forEach(item => { item.hidden = item !== stage; });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      // Both the grid and preview use the exact same cached blob URL.
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
    anotherButton.hidden = true;
    previewImage.src = "logo.png";
    previewName.textContent = "Reveal or hover over a card.";
    previewRarity.textContent = "";
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
      status.textContent = "Pack complete!";
      instruction.textContent = "Hover over any card to inspect it, or open another pack.";
      revealAllButton.hidden = true;
      anotherButton.hidden = false;
    } else status.textContent = `${revealed} of ${total} cards revealed`;
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
      assetErrorList.textContent = result.failed.map(item => `${item.path}\n  ${item.error}`).join("\n\n");
    }
    downloadAssetsButton.disabled = false;
    repairAssetsButton.disabled = false;
    await refreshAssetStatus();
  }

  beginButton.addEventListener("click", () => showStage(boosterStage));
  downloadAssetsButton.addEventListener("click", () => installAssets(false));
  repairAssetsButton.addEventListener("click", () => installAssets(true));

  boosterButton.addEventListener("click", () => {
    if (boosterButton.classList.contains("opening")) return;
    currentPack = buildPack();
    renderPack(currentPack); // Face-down cards appear immediately; fronts resolve in parallel.
    boosterButton.classList.add("opening");
    clickHint.textContent = "Opening…";
    setTimeout(() => {
      boosterButton.classList.remove("opening");
      clickHint.textContent = "Click to open";
      showStage(revealStage);
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

  anotherButton.addEventListener("click", () => showStage(boosterStage));
  refreshAssetStatus();
})();
