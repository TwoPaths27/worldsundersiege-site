(() => {
  "use strict";
  const byRarity = BOA_PACK_CARDS.reduce((groups, card) => {
    (groups[card.rarity] ??= []).push(card);
    return groups;
  }, {});
  const openButton = document.getElementById("openPackButton");
  const anotherButton = document.getElementById("anotherPackButton");
  const revealAllButton = document.getElementById("revealAllButton");
  const grid = document.getElementById("cardGrid");
  const status = document.getElementById("packStatus");
  const previewImage = document.getElementById("previewImage");
  const previewName = document.getElementById("previewName");
  const previewRarity = document.getElementById("previewRarity");

  function randomItem(items) { return items[Math.floor(Math.random() * items.length)]; }
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
    if (roll < BOA_PACK_CONFIG.premiumOdds.secret) return "Secret";
    if (roll < BOA_PACK_CONFIG.premiumOdds.secret + BOA_PACK_CONFIG.premiumOdds.ultraRare) return "Ultra Rare";
    if (roll < BOA_PACK_CONFIG.premiumOdds.secret + BOA_PACK_CONFIG.premiumOdds.ultraRare + BOA_PACK_CONFIG.premiumOdds.superRare) return "Super Rare";
    return "Rare";
  }
  function buildPack() {
    const commons = sampleUnique(byRarity.Common, BOA_PACK_CONFIG.commonsPerPack);
    const uncommons = sampleUnique(byRarity.Uncommon, BOA_PACK_CONFIG.uncommonsPerPack);
    const premiums = [];
    for (let i = 0; i < BOA_PACK_CONFIG.premiumSlotsPerPack; i++) {
      const rarity = rollPremiumRarity();
      let card = randomItem(byRarity[rarity]);
      while (premiums.some(existing => existing.id === card.id) && byRarity[rarity].length > 1) card = randomItem(byRarity[rarity]);
      premiums.push(card);
    }
    return [...commons, ...uncommons, ...premiums];
  }
  function preview(card) {
    previewImage.src = card.image;
    previewImage.alt = `${card.id} ${card.name}`;
    previewName.textContent = `${card.id} — ${card.name}`;
    previewRarity.textContent = card.rarity;
  }
  function renderPack() {
    const pack = buildPack();
    grid.replaceChildren();
    pack.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pack-card";
      button.dataset.rarity = card.rarity;
      button.setAttribute("aria-label", `Reveal card ${index + 1}`);
      button.innerHTML = `<span class="card-inner"><span class="card-face card-back"></span><span class="card-face card-front"><img src="${card.image}" alt="${card.id} ${card.name}"></span></span>`;
      button.addEventListener("click", () => {
        button.classList.add("revealed");
        button.setAttribute("aria-label", `${card.id} ${card.name}, ${card.rarity}`);
        preview(card);
        updateStatus();
      });
      button.addEventListener("mouseenter", () => { if (button.classList.contains("revealed")) preview(card); });
      button.addEventListener("focus", () => { if (button.classList.contains("revealed")) preview(card); });
      grid.append(button);
    });
    status.textContent = "Click each card to reveal it";
    revealAllButton.hidden = false;
    anotherButton.hidden = true;
    openButton.disabled = true;
  }
  function updateStatus() {
    const total = grid.children.length;
    const revealed = grid.querySelectorAll(".revealed").length;
    status.textContent = revealed === total ? "Pack complete!" : `${revealed} of ${total} cards revealed`;
    if (revealed === total) { anotherButton.hidden = false; revealAllButton.hidden = true; }
  }
  revealAllButton.addEventListener("click", () => {
    [...grid.children].forEach((card, index) => setTimeout(() => { card.click(); }, index * 110));
  });
  openButton.addEventListener("click", renderPack);
  anotherButton.addEventListener("click", () => { openButton.disabled = false; renderPack(); });
})();
