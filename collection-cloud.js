import { supabase } from "./supabase-config.js";

const state = {
  ready: false,
  available: false,
  quantities: {}
};

async function loadCollection() {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) throw sessionError;

    const session = sessionData.session;

    if (!session) {
      state.ready = true;
      state.available = false;
      return;
    }

    const { data, error } = await supabase
      .from("player_cards")
      .select("card_id, quantity")
      .eq("user_id", session.user.id)
      .gt("quantity", 0);

    if (error) throw error;

    state.quantities = Object.fromEntries(
      (data || []).map(row => [
        row.card_id,
        Math.max(0, Number(row.quantity) || 0)
      ])
    );

    state.available = true;
    state.ready = true;

    // Keep the existing local collection mirror current so older pages
    // and Deck Builder code continue to see the same quantities.
    const localSnapshot = window.WUSCollection?.load?.() || {};
    window.WUSCollection?.replaceFromCloud?.({
      gold: Number(localSnapshot.gold || 0),
      cards: state.quantities
    });
  } catch (error) {
    console.warn(
      "Cloud collection unavailable. Using the local collection mirror.",
      error
    );
    state.available = false;
    state.ready = true;

    state.quantities =
      window.WUSCollection?.load?.().cards || {};
  } finally {
    window.dispatchEvent(
      new CustomEvent("wus-cloud-collection-ready", {
        detail: {
          available: state.available,
          quantities: { ...state.quantities }
        }
      })
    );
  }
}

window.WUSCloudCollection = Object.freeze({
  isReady: () => state.ready,
  isAvailable: () => state.available,
  getQuantity: cardId =>
    Math.max(0, Number(state.quantities[cardId]) || 0),
  getQuantities: () => ({ ...state.quantities }),
  refresh: loadCollection
});

loadCollection();
