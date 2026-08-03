"use strict";

/* BOA-004 through BOA-010 — shared Knight dialogs and Sir Yvain. */
(function knightEffects004010(global) {
  const state = () => global.GameState;
  const controllerOf = value => Number(value?.controller ?? value?.owner) || null;
  const idsOf = value => [value?.databaseId, value?.gameplayId, value?.variantOf, value?.sourceCard?.databaseId].filter(Boolean).map(v => String(v).toUpperCase());
  const isSirYvain = value => Boolean(value && (idsOf(value).includes("BOA-004") || String(value.name || "").toLowerCase() === "sir yvain"));
  const isLion = card => String(card?.name || "").trim().toLowerCase() === "lion" || idsOf(card).includes("BOA-106");

  function buildModal(title, message) {
    const overlay = document.createElement("div");
    overlay.className = "exit-modal knight-effect-modal";
    const backdrop = document.createElement("div"); backdrop.className = "exit-modal__backdrop";
    const dialog = document.createElement("section"); dialog.className = "exit-modal__dialog"; dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true");
    const heading = document.createElement("h2"); heading.textContent = title;
    const text = document.createElement("p"); text.textContent = message;
    const actions = document.createElement("div"); actions.className = "exit-modal__actions";
    dialog.append(heading, text, actions); overlay.append(backdrop, dialog); document.body.appendChild(overlay);
    return { overlay, dialog, actions, backdrop };
  }

  function showKnightChoiceModal(title, message, options = {}) {
    return new Promise(resolve => {
      const ui = buildModal(title, message);
      const no = document.createElement("button"); no.type = "button"; no.className = "modal-button modal-button--cancel"; no.textContent = options.noLabel || "No";
      const yes = document.createElement("button"); yes.type = "button"; yes.className = "modal-button modal-button--confirm"; yes.textContent = options.yesLabel || "Yes";
      ui.actions.append(no, yes);
      const finish = value => { ui.overlay.remove(); resolve(value); };
      no.addEventListener("click", () => finish(false)); yes.addEventListener("click", () => finish(true)); ui.backdrop.addEventListener("click", () => finish(false));
      requestAnimationFrame(() => yes.focus());
    });
  }

  function showKnightMessageModal(title, message) {
    return new Promise(resolve => {
      const ui = buildModal(title, message);
      const ok = document.createElement("button"); ok.type = "button"; ok.className = "modal-button modal-button--confirm"; ok.textContent = "OK"; ui.actions.append(ok);
      const finish = () => { ui.overlay.remove(); resolve(true); };
      ok.addEventListener("click", finish); ui.backdrop.addEventListener("click", finish); requestAnimationFrame(() => ok.focus());
    });
  }

  function showDeckSearchModal(playerId, options = {}) {
    const player = global.ensurePlayerZones?.(playerId) || state()?.players?.[playerId];
    const cards = (player?.deck || []).filter(card => !options.filter || options.filter(card)).sort((a,b) => String(a.name||"").localeCompare(String(b.name||"")));
    if (!cards.length) return Promise.resolve(null);
    return new Promise(resolve => {
      const ui = buildModal(options.title || "Search Deck", options.message || "Choose a card.");
      ui.dialog.style.width = "min(1050px, calc(100vw - 30px))";
      const grid = document.createElement("div"); grid.className = "public-zone-modal__cards hand-fan"; grid.style.maxHeight = "58vh";
      let selected = null;
      for (const card of cards) {
        const button = document.createElement("button"); button.type = "button"; button.className = "hand-card public-zone-card"; button.title = card.name || "Card";
        const image = card.cardImage || card.image || card.tileImage;
        if (image) { button.style.backgroundImage = `url("${String(image).replace(/["\\]/g,"\\$&")}")`; button.style.backgroundSize = "cover"; button.style.backgroundPosition = "center"; }
        else button.textContent = card.name || "Card";
        button.addEventListener("mouseenter", () => global.renderHandCardPreview?.(card));
        button.addEventListener("click", () => { grid.querySelectorAll(".is-selected").forEach(n => n.classList.remove("is-selected")); button.classList.add("is-selected"); selected = card; confirm.disabled = false; });
        grid.appendChild(button);
      }
      ui.dialog.insertBefore(grid, ui.actions);
      const cancel = document.createElement("button"); cancel.type="button"; cancel.className="modal-button modal-button--cancel"; cancel.textContent="Cancel";
      const confirm = document.createElement("button"); confirm.type="button"; confirm.className="modal-button modal-button--confirm"; confirm.textContent=options.confirmLabel || "Choose"; confirm.disabled=true;
      ui.actions.append(cancel, confirm);
      const finish = value => { ui.overlay.remove(); resolve(value); };
      cancel.addEventListener("click", () => finish(null)); confirm.addEventListener("click", () => finish(selected)); ui.backdrop.addEventListener("click", () => finish(null));
    });
  }

  function adjacentOpenSpaces(unit) {
    const out = [];
    for (let dx=-1; dx<=1; dx++) for (let dy=-1; dy<=1; dy++) {
      if (!dx && !dy) continue; const x=Number(unit.x)+dx, y=Number(unit.y)+dy;
      if (x < 0 || y < 0 || x >= Number(state()?.board?.width ?? 8) || y >= Number(state()?.board?.height ?? 8)) continue;
      if (!global.getUnitAt?.(x,y)) out.push({x,y});
    }
    return out;
  }

  async function resolveYvainReveal(unit) {
    if (!isSirYvain(unit) || unit.isConcealed || !(state()?.units || []).some(u => u.id === unit.id)) return false;
    const playerId = controllerOf(unit); const player = global.ensurePlayerZones?.(playerId) || state()?.players?.[playerId];
    if (!(await showKnightChoiceModal("Sir Yvain — Reveal", "Search your Deck for Lion, put it into play adjacent to Sir Yvain, then mount Sir Yvain?", { yesLabel:"Search Deck", noLabel:"No" }))) return false;
    const lions = (player?.deck || []).filter(isLion);
    if (!lions.length) { global.shuffleDeck?.(playerId); await showKnightMessageModal("No Lion Found", "No card named Lion was found in your Deck."); return false; }
    const chosen = await showDeckSearchModal(playerId, { title:"Sir Yvain — Search Deck", message:"Choose a Lion.", confirmLabel:"Choose Lion", filter:isLion });
    if (!chosen) return false;
    const spaces = adjacentOpenSpaces(unit); if (!spaces.length) { await showKnightMessageModal("No Open Space", "There is no open adjacent space for Lion."); return false; }
    const spot = spaces[0];
    const index = player.deck.indexOf(chosen); if (index >= 0) player.deck.splice(index,1);
    const lion = global.createUnit({ id:`player-${playerId}-yvain-lion-${state().nextUnitId++}`, name:chosen.name, owner:playerId, x:spot.x, y:spot.y, attack:chosen.attack ?? chosen.atk, hp:chosen.hp, range:chosen.range, speed:chosen.speed ?? chosen.spd, cost:chosen.cost, cardType:chosen.type, type:chosen.type, types:chosen.types, traits:chosen.traits, cardImage:chosen.cardImage || chosen.image, tileImage:chosen.tileImage, effectText:chosen.effectText, gameplayId:chosen.gameplayId, databaseId:chosen.databaseId || chosen.id, characteristics:chosen.characteristics });
    lion.sourceCard = chosen; lion.zone = global.ZoneTypes?.BATTLEFIELD || "battlefield"; chosen.zone = lion.zone;
    global.normalizeCard?.(lion); global.enterPermanent?.(lion,{controller:playerId,owner:playerId,battlefieldPermanents:state().units,cause:"sir-yvain-reveal"}); state().units.push(lion);
    global.mountCharacter?.(unit,lion,{ignoreAdjacency:true,render:false}); global.shuffleDeck?.(playerId);
    global.presentEffectActivation?.(unit,{targets:[lion],impactText:"MOUNT",fireworks:true,force:true}); global.addLog?.(`${unit.name} found Lion and mounted it.`); global.renderGame?.(); return true;
  }

  if (typeof global.onGameEvent === "function") global.onGameEvent("unitRevealed", event => { const unit=event?.payload?.unit; if (isSirYvain(unit)) resolveYvainReveal(unit); }, {priority:23});
  Object.assign(global,{showKnightChoiceModal,showKnightMessageModal,showDeckSearchModal,isSirYvain,resolveYvainReveal});
})(window);
