(() => {
  "use strict";
  const rarityById = new Map((typeof BOA_PACK_CARDS !== "undefined" ? BOA_PACK_CARDS : []).map(card => [card.id, card.rarity]));
  const allCards = (typeof cards !== "undefined" ? cards : []).filter(card => /^BOA-\d{3}$/.test(card.id)).map(card => ({ ...card, rarity: rarityById.get(card.id) || "Unknown" }));
  const elements = {
    gold: document.getElementById("goldTotal"), unique: document.getElementById("uniqueOwned"), progress: document.getElementById("progressFill"), rarityProgress: document.getElementById("rarityProgress"),
    search: document.getElementById("searchInput"), rarity: document.getElementById("rarityFilter"), type: document.getElementById("typeFilter"), ownership: document.getElementById("ownershipFilter"), count: document.getElementById("visibleCount"), grid: document.getElementById("collectionGrid"),
    previewImage: document.getElementById("previewImage"), previewName: document.getElementById("previewName"), previewMeta: document.getElementById("previewMeta"), previewOwned: document.getElementById("previewOwned")
  };
  const rarityOrder = ["Common","Uncommon","Rare","Super Rare","Ultra Rare","Secret"];
  const types = [...new Set(allCards.flatMap(card => Array.isArray(card.type) ? card.type : [card.type]))].sort();
  rarityOrder.forEach(value => elements.rarity.add(new Option(value === "Secret" ? "Secret Rare" : value, value)));
  types.forEach(value => elements.type.add(new Option(value, value)));

  function ownedCount(card, data) { return Math.max(0, Number(data.cards[card.id]) || 0); }
  function cardTypes(card) { return Array.isArray(card.type) ? card.type : [card.type]; }
  async function imageUrl(card) { try { return await WUSAssets.getObjectUrl(card.image); } catch { return card.image; } }
  async function showPreview(card, data) {
    elements.previewName.textContent = `${card.id} — ${card.name}`;
    elements.previewMeta.textContent = `${cardTypes(card).join(" / ")} · ${card.rarity === "Secret" ? "Secret Rare" : card.rarity}`;
    const owned = ownedCount(card, data), limit = WUSCollection.getLimit(card);
    elements.previewOwned.textContent = owned ? `Owned: ${owned} / ${limit}` : `Not owned · Limit ${limit}`;
    elements.previewImage.alt = `${card.id} ${card.name}`;
    elements.previewImage.src = await imageUrl(card);
  }
  async function createCard(card, data) {
    const owned = ownedCount(card, data), limit = WUSCollection.getLimit(card);
    const button = document.createElement("button"); button.type="button"; button.className=`collection-card${owned ? "" : " missing"}`;
    button.innerHTML=`<img alt="${card.id} ${card.name}"><span class="limit-badge">Limit ${limit}</span><span class="owned-badge">${owned ? `x${owned}` : "0"}</span><div class="name">${card.id}<br>${card.name}</div>${owned ? "" : '<div class="missing-label">Not owned</div>'}`;
    button.querySelector("img").src=await imageUrl(card);
    ["mouseenter","focus","click"].forEach(event => button.addEventListener(event,()=>showPreview(card,data)));
    return button;
  }
  function matches(card, data) {
    const q=elements.search.value.trim().toLowerCase(), owned=ownedCount(card,data), limit=WUSCollection.getLimit(card);
    if(q && !`${card.id} ${card.name}`.toLowerCase().includes(q)) return false;
    if(elements.rarity.value && card.rarity!==elements.rarity.value) return false;
    if(elements.type.value && !cardTypes(card).includes(elements.type.value)) return false;
    if(elements.ownership.value==="owned" && !owned) return false;
    if(elements.ownership.value==="missing" && owned) return false;
    if(elements.ownership.value==="complete" && owned<limit) return false;
    return true;
  }
  async function render() {
    const data=WUSCollection.load(); elements.gold.textContent=data.gold.toLocaleString();
    const unique=allCards.filter(card=>ownedCount(card,data)>0).length; elements.unique.textContent=`${unique} / ${allCards.length}`; elements.progress.style.width=`${allCards.length ? unique/allCards.length*100 : 0}%`;
    elements.rarityProgress.replaceChildren(...rarityOrder.map(rarity=>{const total=allCards.filter(c=>c.rarity===rarity).length, got=allCards.filter(c=>c.rarity===rarity&&ownedCount(c,data)>0).length; const div=document.createElement("div"); div.className="rarity-stat"; div.innerHTML=`<strong>${got} / ${total}</strong><span>${rarity==="Secret"?"Secret Rare":rarity}</span>`; return div;}));
    const visible=allCards.filter(card=>matches(card,data)); elements.count.textContent=`Showing ${visible.length} cards`;
    elements.grid.replaceChildren(...await Promise.all(visible.map(card=>createCard(card,data))));
  }
  [elements.search,elements.rarity,elements.type,elements.ownership].forEach(el=>el.addEventListener("input",render));
  window.addEventListener("wus-player-data-changed",render); render();
})();
