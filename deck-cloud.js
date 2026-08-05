import { supabase } from "./supabase-config.js";

const LOCAL_DECKS_KEY = "wus-saved-decks-v2";
const MAX_DECKS = 10;

const state = {
  ready: false,
  available: false,
  userId: null,
  decks: {}
};

function normalizeDeckRow(row) {
  const data = row.deck_data || {};
  return {
    id: row.id,
    name: row.name || "Untitled Deck",
    mainDeck: data.mainDeck || {},
    stronghold: data.stronghold || null,
    armies: Array.isArray(data.armies) ? data.armies.slice(0, 3) : [],
    isFavorite: Boolean(row.is_favorite),
    created: Date.parse(row.created_at || "") || Date.now(),
    updated: Date.parse(row.updated_at || "") || Date.now()
  };
}

function mirrorToLocalStorage() {
  const mirrored = Object.fromEntries(
    Object.values(state.decks).map(deck => [
      deck.id,
      {
        name: deck.name,
        mainDeck: deck.mainDeck,
        stronghold: deck.stronghold,
        armies: deck.armies,
        isFavorite: deck.isFavorite,
        created: deck.created,
        updated: deck.updated
      }
    ])
  );

  localStorage.setItem(LOCAL_DECKS_KEY, JSON.stringify(mirrored));
}

function readLocalDecks() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_DECKS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function fetchDecks() {
  const { data, error } = await supabase
    .from("player_decks")
    .select("id,name,deck_data,is_favorite,created_at,updated_at")
    .eq("user_id", state.userId)
    .order("is_favorite", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;

  state.decks = Object.fromEntries(
    (data || []).map(row => {
      const deck = normalizeDeckRow(row);
      return [deck.id, deck];
    })
  );

  mirrorToLocalStorage();
}

async function migrateLocalDecksIfNeeded() {
  if (Object.keys(state.decks).length) return;

  const localDecks = Object.values(readLocalDecks()).slice(0, MAX_DECKS);
  if (!localDecks.length) return;

  const rows = localDecks.map(deck => ({
    user_id: state.userId,
    name: String(deck.name || "Untitled Deck").slice(0, 48),
    deck_data: {
      mainDeck: deck.mainDeck || {},
      stronghold: deck.stronghold || null,
      armies: Array.isArray(deck.armies) ? deck.armies.slice(0, 3) : []
    },
    is_favorite: Boolean(deck.isFavorite)
  }));

  const { error } = await supabase.from("player_decks").insert(rows);
  if (error) throw error;

  await fetchDecks();
}

async function refresh() {
  if (!state.available) return false;

  await fetchDecks();
  window.dispatchEvent(new CustomEvent("wus-cloud-decks-changed", {
    detail: { count: Object.keys(state.decks).length }
  }));
  return true;
}

async function save({ id, name, state: deckState, isFavorite = false }) {
  if (!state.available) {
    return { ok: false, message: "Cloud decks are unavailable." };
  }

  const payload = {
    user_id: state.userId,
    name: String(name || "Untitled Deck").trim().slice(0, 48) || "Untitled Deck",
    deck_data: {
      mainDeck: deckState?.mainDeck || {},
      stronghold: deckState?.stronghold || null,
      armies: Array.isArray(deckState?.armies)
        ? deckState.armies.slice(0, 3)
        : []
    },
    is_favorite: Boolean(isFavorite)
  };

  let response;

  if (id && state.decks[id]) {
    response = await supabase
      .from("player_decks")
      .update(payload)
      .eq("id", id)
      .eq("user_id", state.userId)
      .select("id,name,deck_data,is_favorite,created_at,updated_at")
      .single();
  } else {
    if (Object.keys(state.decks).length >= MAX_DECKS) {
      return {
        ok: false,
        message: "You can save a maximum of 10 decks."
      };
    }

    response = await supabase
      .from("player_decks")
      .insert(payload)
      .select("id,name,deck_data,is_favorite,created_at,updated_at")
      .single();
  }

  if (response.error) {
    return { ok: false, message: response.error.message };
  }

  const deck = normalizeDeckRow(response.data);
  state.decks[deck.id] = deck;
  mirrorToLocalStorage();

  return { ok: true, deck };
}

async function rename(id, name) {
  if (!state.available || !state.decks[id]) {
    return { ok: false, message: "Deck not found." };
  }

  const { error } = await supabase
    .from("player_decks")
    .update({ name: String(name).trim().slice(0, 48) })
    .eq("id", id)
    .eq("user_id", state.userId);

  return error
    ? { ok: false, message: error.message }
    : { ok: true };
}

async function setFavorite(id, isFavorite) {
  if (!state.available || !state.decks[id]) {
    return { ok: false, message: "Deck not found." };
  }

  const { error } = await supabase
    .from("player_decks")
    .update({ is_favorite: Boolean(isFavorite) })
    .eq("id", id)
    .eq("user_id", state.userId);

  return error
    ? { ok: false, message: error.message }
    : { ok: true };
}

async function remove(id) {
  if (!state.available || !state.decks[id]) {
    return { ok: false, message: "Deck not found." };
  }

  const { error } = await supabase
    .from("player_decks")
    .delete()
    .eq("id", id)
    .eq("user_id", state.userId);

  if (error) return { ok: false, message: error.message };

  delete state.decks[id];
  mirrorToLocalStorage();
  return { ok: true };
}

window.WUSCloudDecks = Object.freeze({
  isReady: () => state.ready && state.available,
  isAvailable: () => state.available,
  getDecks: () => ({ ...state.decks }),
  refresh,
  save,
  rename,
  setFavorite,
  remove
});

(async () => {
  try {
    const session = await getSession();

    if (!session) {
      state.ready = true;
      state.available = false;
      return;
    }

    state.userId = session.user.id;
    state.available = true;

    await fetchDecks();
    await migrateLocalDecksIfNeeded();
  } catch (error) {
    console.warn("Cloud deck storage unavailable; local mode remains active.", error);
    state.available = false;
  } finally {
    state.ready = true;
    window.dispatchEvent(new CustomEvent("wus-cloud-decks-ready", {
      detail: {
        available: state.available,
        count: Object.keys(state.decks).length
      }
    }));
  }
})();
