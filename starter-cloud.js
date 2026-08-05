import { supabase } from "./supabase-config.js";

const state = {
  available: false,
  loaded: false,
  userId: null,
  gold: 0,
  cards: {},
  ownedDeckIds: new Set(),
  portraitCardIds: new Set()
};

async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function loadCloudState() {
  const session = await getSession();

  if (!session) {
    state.available = false;
    state.loaded = true;
    return;
  }

  state.userId = session.user.id;

  try {
    const [
      walletResponse,
      cardsResponse,
      decksResponse,
      portraitsResponse
    ] = await Promise.all([
      supabase
        .from("player_wallets")
        .select("gold")
        .eq("user_id", state.userId)
        .single(),
      supabase
        .from("player_cards")
        .select("card_id, quantity")
        .eq("user_id", state.userId),
      supabase
        .from("player_starter_decks")
        .select("starter_deck_id")
        .eq("user_id", state.userId),
      supabase
        .from("portrait_unlocks")
        .select("card_id")
        .eq("user_id", state.userId)
    ]);

    const errors = [
      walletResponse.error,
      cardsResponse.error,
      decksResponse.error,
      portraitsResponse.error
    ].filter(Boolean);

    if (errors.length) throw errors[0];

    state.gold = Number(walletResponse.data?.gold || 0);
    state.cards = Object.fromEntries(
      (cardsResponse.data || []).map(row => [row.card_id, Number(row.quantity || 0)])
    );
    state.ownedDeckIds = new Set(
      (decksResponse.data || []).map(row => row.starter_deck_id)
    );
    state.portraitCardIds = new Set(
      (portraitsResponse.data || []).map(row => row.card_id)
    );
    state.available = true;
    state.loaded = true;

    mirrorIntoLocalStore();
  } catch (error) {
    console.warn(
      "Cloud starter storage is unavailable. Local testing mode will be used.",
      error
    );
    state.available = false;
    state.loaded = true;
  }
}

function mirrorIntoLocalStore() {
  window.WUSCollection?.replaceFromCloud?.({
    gold: state.gold,
    cards: state.cards
  });

  localStorage.setItem(
    "wus-owned-starter-decks-v1",
    JSON.stringify([...state.ownedDeckIds])
  );
  localStorage.setItem(
    "wus-unlocked-profile-portraits-v1",
    JSON.stringify([...state.portraitCardIds])
  );
}

async function syncLocalMirror() {
  await loadCloudState();
  window.dispatchEvent(new CustomEvent("wus-cloud-starter-changed", {
    detail: {
      gold: state.gold,
      ownedDeckIds: [...state.ownedDeckIds]
    }
  }));
}

async function purchase(starterDeckId) {
  if (!state.available) {
    return {
      ok: false,
      reason: "cloud-unavailable",
      message: "Cloud purchases are not available yet."
    };
  }

  const { data, error } = await supabase.rpc("purchase_starter_deck", {
    requested_starter_deck_id: starterDeckId
  });

  if (error) {
    console.error("Starter purchase RPC failed:", error);
    return {
      ok: false,
      reason: "server-error",
      message: error.message || "The server rejected the purchase."
    };
  }

  const result = Array.isArray(data) ? data[0] : data;
  return result || {
    ok: false,
    reason: "empty-response",
    message: "The server returned no purchase result."
  };
}

window.WUSCloudStarters = Object.freeze({
  isAvailable: () => state.available,
  isLoaded: () => state.loaded,
  getOwnedDeckIds: () => [...state.ownedDeckIds],
  getPortraitCardIds: () => [...state.portraitCardIds],
  getGold: () => state.gold,
  purchase,
  syncLocalMirror
});

loadCloudState().finally(() => {
  window.dispatchEvent(new CustomEvent("wus-cloud-starter-ready", {
    detail: {
      available: state.available,
      gold: state.gold,
      ownedDeckIds: [...state.ownedDeckIds]
    }
  }));
});
