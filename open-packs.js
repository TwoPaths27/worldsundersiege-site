(() => {
  "use strict";

  const groups = BOA_PACK_CARDS.reduce((result, card) => {
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
    [introStage, boosterStage, revealStage].forEach(item => { item.hidden = item !== stage; });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function preview(card) {
    previewImage.src = card.image;
    previewImage.alt = `${card.id} ${card.name}`;
    previewName.textContent = `${card.id} — ${card.name}`;
    previewRarity.textContent = card.rarity;
  }

  function createCard(card, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `pack-card${index >= 10 ? " premium-card" : ""}`;
    button.dataset.rarity = card.rarity;
    button.setAttribute("aria-label", `Reveal card ${index + 1}`);
    button.innerHTML = `
      <span class="card-inner">
        <span class="card-face card-back"></span>
        <span class="card-face card-front"><img src="${card.image}" alt="${card.id} ${card.name}"></span>
      </span>`;

    const image = button.querySelector("img");
    image.addEventListener("error", () => {
      if (card.rarity === "Secret" && !image.dataset.fallback) {
        image.dataset.fallback = "true";
        image.src = `cards/${card.id}.png`;
      }
    });

    button.addEventListener("click", () => revealCard(button, card));
    button.addEventListener("mouseenter", () => { if (button.classList.contains("revealed")) preview(card); });
    button.addEventListener("focus", () => { if (button.classList.contains("revealed")) preview(card); });
    return button;
  }

  function renderPack() {
    const pack = buildPack();
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
    if (button.classList.contains("revealed")) {
      preview(card);
      return;
    }
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
    } else {
      status.textContent = `${revealed} of ${total} cards revealed`;
    }
  }

  beginButton.addEventListener("click", () => showStage(boosterStage));

  boosterButton.addEventListener("click", () => {
    if (boosterButton.classList.contains("opening")) return;
    boosterButton.classList.add("opening");
    renderPack();
    setTimeout(() => {
      boosterButton.classList.remove("opening");
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
})();
