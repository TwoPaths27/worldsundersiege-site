(() => {
  "use strict";

  const STORAGE_KEY = "wus-player-data-v1";
  const LIMITED_TYPES = new Set(["Event", "Stronghold", "Army"]);
  const GOLD_BY_RARITY = Object.freeze({
    Common: 10,
    Uncommon: 20,
    Rare: 40,
    "Super Rare": 80,
    "Ultra Rare": 150,
    Secret: 300,
    "Secret Rare": 300
  });

  function defaultData() {
    return { version: 1, gold: 0, cards: {} };
  }

  function load() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || typeof parsed !== "object") return defaultData();
      return {
        version: 1,
        gold: Number.isFinite(parsed.gold) ? Math.max(0, Math.floor(parsed.gold)) : 0,
        cards: parsed.cards && typeof parsed.cards === "object" ? parsed.cards : {}
      };
    } catch {
      return defaultData();
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("wus-player-data-changed", { detail: getSnapshot(data) }));
  }

  function normalizeTypes(card) {
    const raw = card?.type ?? card?.types ?? [];
    if (Array.isArray(raw)) return raw.map(String);
    return String(raw).split(/[\/,&+]/).map(value => value.trim()).filter(Boolean);
  }

  function getLimit(card) {
    return normalizeTypes(card).some(type => LIMITED_TYPES.has(type)) ? 1 : 3;
  }

  function getGoldValue(card) {
    return GOLD_BY_RARITY[card?.rarity] ?? 0;
  }

  function getSnapshot(existing) {
    const data = existing || load();
    return { version: data.version, gold: data.gold, cards: { ...data.cards } };
  }

  function addCards(pulledCards) {
    const data = load();
    const results = [];
    let added = 0;
    let converted = 0;
    let goldEarned = 0;

    for (const card of pulledCards || []) {
      if (!card?.id) continue;
      const limit = getLimit(card);
      const owned = Math.max(0, Math.floor(Number(data.cards[card.id]) || 0));
      if (owned < limit) {
        data.cards[card.id] = owned + 1;
        added += 1;
        results.push({ card, result: "added", owned: owned + 1, limit, goldEarned: 0 });
      } else {
        const value = getGoldValue(card);
        data.gold += value;
        converted += 1;
        goldEarned += value;
        results.push({ card, result: "converted", owned, limit, goldEarned: value });
      }
    }

    save(data);
    return { added, converted, goldEarned, gold: data.gold, results };
  }

  function getOwned(cardId) {
    return Math.max(0, Math.floor(Number(load().cards[cardId]) || 0));
  }

  function reset() {
    const data = defaultData();
    save(data);
    return getSnapshot(data);
  }

  window.WUSCollection = Object.freeze({
    STORAGE_KEY,
    GOLD_BY_RARITY,
    load: () => getSnapshot(),
    addCards,
    getOwned,
    getLimit,
    getGoldValue,
    reset
  });
})();
