(() => {
  "use strict";

  const STORAGE_KEY = "wus-player-data-v1";
  const LIMITED_TYPES = new Set(["Event", "Stronghold", "Army"]);
  const GOLD_BY_RARITY = Object.freeze({
    Common: 2, Uncommon: 5, Rare: 10, "Super Rare": 15,
    "Ultra Rare": 25, Secret: 50, "Secret Rare": 50
  });

  function defaultData() {
    return { version: 2, gold: 0, cards: {}, activeOpening: null };
  }

  function loadRaw() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== "object") return defaultData();
      return {
        ...parsed,
        version: 2,
        gold: Number.isFinite(parsed.gold) ? Math.max(0, Math.floor(parsed.gold)) : 0,
        cards: parsed.cards && typeof parsed.cards === "object" ? parsed.cards : {},
        activeOpening: parsed.activeOpening && typeof parsed.activeOpening === "object" ? parsed.activeOpening : null
      };
    } catch { return defaultData(); }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("wus-player-data-changed", { detail: getSnapshot(data) }));
  }

  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function normalizeTypes(card) {
    const raw = card?.type ?? card?.types ?? [];
    if (Array.isArray(raw)) return raw.map(String);
    return String(raw).split(/[\/,&+]/).map(v => v.trim()).filter(Boolean);
  }
  function getLimit(card) { return normalizeTypes(card).some(type => LIMITED_TYPES.has(type)) ? 1 : 3; }
  function getGoldValue(card) { return GOLD_BY_RARITY[card?.rarity] ?? 0; }
  function getSnapshot(existing) {
    const data = existing || loadRaw();
    return { version: data.version, gold: data.gold, cards: { ...data.cards }, activeOpening: clone(data.activeOpening) };
  }

  function applyCards(data, pulledCards) {
    const results = []; let added = 0; let converted = 0; let goldEarned = 0;
    for (const card of pulledCards || []) {
      if (!card?.id) continue;
      const limit = getLimit(card);
      const owned = Math.max(0, Math.floor(Number(data.cards[card.id]) || 0));
      if (owned < limit) {
        data.cards[card.id] = owned + 1; added += 1;
        results.push({ card, result: "added", owned: owned + 1, limit, goldEarned: 0 });
      } else {
        const value = getGoldValue(card); data.gold += value; converted += 1; goldEarned += value;
        results.push({ card, result: "converted", owned, limit, goldEarned: value });
      }
    }
    return { added, converted, goldEarned, gold: data.gold, results };
  }

  function addCards(cards) { const data = loadRaw(); const result = applyCards(data, cards); save(data); return result; }
  function getOwned(id) { return Math.max(0, Math.floor(Number(loadRaw().cards[id]) || 0)); }
  function addGold(amount) { const value = Math.max(0, Math.floor(Number(amount)||0)); const data=loadRaw(); data.gold+=value; save(data); return {ok:true,amount:value,gold:data.gold}; }
  function spendGold(amount) { const value=Math.max(0,Math.floor(Number(amount)||0)); const data=loadRaw(); if(data.gold<value)return{ok:false,reason:"insufficient-gold",cost:value,gold:data.gold}; data.gold-=value; save(data); return{ok:true,cost:value,gold:data.gold}; }
  function purchaseCard(card, price) {
    if (!card?.id) return {ok:false,reason:"invalid-card"};
    const cost=Math.max(0,Math.floor(Number(price)||0)); const data=loadRaw(); const limit=getLimit(card);
    const owned=Math.max(0,Math.floor(Number(data.cards[card.id])||0));
    if(owned>=limit)return{ok:false,reason:"ownership-cap",owned,limit,gold:data.gold};
    if(data.gold<cost)return{ok:false,reason:"insufficient-gold",cost,owned,limit,gold:data.gold};
    data.gold-=cost; data.cards[card.id]=owned+1; save(data); return{ok:true,card,cost,owned:owned+1,limit,gold:data.gold};
  }

  function newId() { return (crypto?.randomUUID?.() || `opening-${Date.now()}-${Math.random().toString(16).slice(2)}`); }
  function purchaseOpening(mode, cost, totalPacks) {
    const data = loadRaw();
    if (data.activeOpening) return { ok:false, reason:"opening-already-active", opening:clone(data.activeOpening), gold:data.gold };
    const value=Math.max(0,Math.floor(Number(cost)||0));
    if(data.gold<value)return{ok:false,reason:"insufficient-gold",cost:value,gold:data.gold};
    data.gold-=value;
    data.activeOpening={ id:newId(), mode, totalPacks, openedPacks:0, currentPack:null, packs:[], pulls:[], collectionAdded:0, duplicatesConverted:0, goldEarned:0, purchasedAt:Date.now() };
    save(data); return {ok:true,gold:data.gold,opening:clone(data.activeOpening)};
  }
  function getActiveOpening() { return clone(loadRaw().activeOpening); }
  function savePendingPack(openingId, packIndex, cardIds) {
    const data=loadRaw(); const opening=data.activeOpening;
    if(!opening || opening.id!==openingId)return{ok:false,reason:"opening-not-found"};
    if(opening.currentPack)return{ok:true,opening:clone(opening),currentPack:clone(opening.currentPack)};
    opening.currentPack={ packIndex, cardIds:[...cardIds], createdAt:Date.now() };
    save(data); return{ok:true,opening:clone(opening),currentPack:clone(opening.currentPack)};
  }
  function settlePendingPack(openingId, cards) {
    const data=loadRaw(); const opening=data.activeOpening;
    if(!opening || opening.id!==openingId)return{ok:false,reason:"opening-not-found"};
    if(!opening.currentPack)return{ok:false,reason:"no-pending-pack"};
    const index=opening.currentPack.packIndex;
    if(opening.packs.some(p=>p.packIndex===index)) return {ok:true,alreadySettled:true,opening:clone(opening),result:null};
    const result=applyCards(data,cards);
    opening.packs.push({packIndex:index,cardIds:cards.map(c=>c.id)});
    opening.pulls.push(...cards.map(c=>c.id));
    opening.openedPacks+=1;
    opening.collectionAdded+=result.added;
    opening.duplicatesConverted+=result.converted;
    opening.goldEarned+=result.goldEarned;
    opening.currentPack=null;
    if(opening.mode==="single") data.activeOpening=null;
    save(data);
    return{ok:true,result,opening:clone(data.activeOpening),completedOpening:opening.mode==="single"?clone(opening):null};
  }
  function clearActiveOpening(openingId) { const data=loadRaw(); if(!data.activeOpening || (openingId&&data.activeOpening.id!==openingId))return false; data.activeOpening=null; save(data); return true; }
  function reset() { const data=defaultData(); save(data); return getSnapshot(data); }

  window.WUSCollection=Object.freeze({
    STORAGE_KEY,GOLD_BY_RARITY,load:()=>getSnapshot(),addCards,getOwned,getLimit,getGoldValue,addGold,spendGold,purchaseCard,
    purchaseOpening,getActiveOpening,savePendingPack,settlePendingPack,clearActiveOpening,reset
  });
})();
